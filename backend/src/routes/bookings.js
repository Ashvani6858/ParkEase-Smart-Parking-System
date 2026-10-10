
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

const PAYMENT_TIMEOUT = 10 * 60 * 1000;

// Create booking - Pending Payment
router.post('/', auth, async (req, res) => {
  try {
    const { slotId, vehicleId, startTime, endTime } = req.body;

    if (!slotId || !vehicleId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'All booking details are required'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime())
    ) {
      return res.status(400).json({
        error: 'Invalid booking time'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        error: 'End time must be after start time'
      });
    }

    if (start.getTime() < Date.now() - 10000) {
      return res.status(400).json({
        error: 'Cannot book in the past'
      });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.parkingSlot.findUnique({
        where: { id: slotId },
        include: {
          floor: {
            include: { location: true }
          }
        }
      });

      if (!slot || slot.status !== 'AVAILABLE') {
        throw new Error('Slot not available');
      }

      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: req.user.id
        }
      });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      if (vehicle.type !== slot.type) {
        throw new Error('Vehicle type does not match slot type');
      }

      const pendingCutoff = new Date(
        Date.now() - PAYMENT_TIMEOUT
      );

      const overlapping = await tx.booking.findFirst({
        where: {
          slotId,
          startTime: { lt: end },
          endTime: { gt: start },
          OR: [
            {
              status: {
                in: ['CONFIRMED', 'CHECKED_IN']
              }
            },
            {
              status: 'PENDING_PAYMENT',
              createdAt: { gt: pendingCutoff }
            }
          ]
        }
      });

      if (overlapping) {
        throw new Error(
          'Slot already booked or awaiting payment'
        );
      }

      const durationHours =
        (end.getTime() - start.getTime()) / 3600000;

      const totalAmount =
        Math.ceil(durationHours) *
        slot.floor.location.hourlyRate;

      return tx.booking.create({
        data: {
          userId: req.user.id,
          vehicleId,
          slotId,
          startTime: start,
          endTime: end,
          totalAmount,
          referenceToken: crypto.randomUUID(),
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING'
        }
      });
    }, {
      isolationLevel: 'Serializable'
    });

    res.status(201).json({
      message: 'Booking created. Payment required.',
      ...booking,
      paymentExpiresAt: new Date(
        booking.createdAt.getTime() + PAYMENT_TIMEOUT
      ).toISOString()
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get my bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        slot: {
          include: {
            floor: {
              include: { location: true }
            }
          }
        },
        vehicle: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get booking payment details
router.get('/:id/payment', auth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        slot: {
          include: {
            floor: {
              include: { location: true }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized'
      });
    }

    const expiresAt = new Date(
      booking.createdAt.getTime() + PAYMENT_TIMEOUT
    );

    res.json({
      bookingId: booking.id,
      amount: booking.totalAmount,
      currency: 'INR',
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      expiresAt: expiresAt.toISOString(),
      parkingName: booking.slot.floor.location.name,
      paymentMode: 'DEMO'
    });

  } catch (error) {
    console.error('Payment details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simulate payment - DEMO ONLY
// Do not use this endpoint for real payments.
router.post('/:id/demo-pay', auth, async (req, res) => {
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        throw new Error('Booking not found');
      }

      if (existing.userId !== req.user.id) {
        throw new Error('Unauthorized');
      }

      if (existing.status !== 'PENDING_PAYMENT') {
        throw new Error('Booking is not awaiting payment');
      }

      const expiresAt =
        existing.createdAt.getTime() + PAYMENT_TIMEOUT;

      if (Date.now() > expiresAt) {
        await tx.booking.update({
          where: { id: existing.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'EXPIRED'
          }
        });

        throw new Error('Payment time expired');
      }

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          id: { not: existing.id },
          slotId: existing.slotId,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN']
          },
          startTime: { lt: existing.endTime },
          endTime: { gt: existing.startTime }
        }
      });

      if (conflictingBooking) {
        throw new Error('Slot is no longer available');
      }

      const result = await tx.booking.updateMany({
        where: {
          id: existing.id,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING'
        },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentId: `DEMO_${crypto.randomUUID()}`,
          paidAt: new Date()
        }
      });

      if (result.count !== 1) {
        throw new Error('Payment already processed');
      }

      return tx.booking.findUnique({
        where: { id: existing.id },
        include: {
          slot: {
            include: { floor: true }
          }
        }
      });
    }, {
      isolationLevel: 'Serializable'
    });

    const io = req.app.get('io');

    if (io) {
      io.to(booking.slot.floor.locationId).emit(
        'slot_update',
        {
          slotId: booking.slotId,
          status: 'RESERVED'
        }
      );
    }

    res.json({
      message: 'Demo payment successful',
      booking
    });

  } catch (error) {
    console.error('Demo payment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        slot: { include: { floor: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    if (
      booking.userId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        error: 'Unauthorized'
      });
    }

    if (
      !['CONFIRMED', 'PENDING_PAYMENT'].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        error: 'Cannot cancel this booking'
      });
    }

    const updated = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        status: booking.status
      },
      data: {
        status: 'CANCELLED',
        ...(booking.status === 'PENDING_PAYMENT'
          ? { paymentStatus: 'CANCELLED' }
          : {})
      }
    });

    if (updated.count !== 1) {
      return res.status(409).json({
        error: 'Booking status changed. Please refresh.'
      });
    }

    const io = req.app.get('io');

    if (io) {
      io.to(booking.slot.floor.locationId).emit(
        'slot_update',
        {
          slotId: booking.slotId,
          status: 'AVAILABLE'
        }
      );
    }

    const cancelled = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    res.json(cancelled);

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
