
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { adminAuth } = require('../middleware/auth');

const bookingInclude = {
  vehicle: true,
  slot: {
    include: {
      floor: {
        include: {
          location: true
        }
      }
    }
  }
};

function getBookingDetails(booking) {
  return {
    id: booking.id,
    referenceToken: booking.referenceToken,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    parkingName: booking.slot.floor.location.name,
    slotNumber: booking.slot.slotNumber,
    vehicleNumber: booking.vehicle.regNumber,
    startTime: booking.startTime,
    endTime: booking.endTime
  };
}

// Admin statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalLocations,
      activeBookings,
      revenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.parkingLocation.count(),
      prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'CHECKED_IN']
          }
        }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'PAID'
        }
      })
    ]);

    res.json({
      totalUsers,
      totalLocations,
      activeBookings,
      revenue: revenue._sum.totalAmount || 0
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify QR ticket
router.get('/verify/:token', adminAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: {
        referenceToken: req.params.token
      },
      include: bookingInclude
    });

    if (!booking) {
      return res.status(404).json({
        valid: false,
        message: 'Booking not found'
      });
    }

    const paymentVerified =
      booking.paymentStatus === 'PAID';

    const now = Date.now();
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();

    const entryAllowed =
      now >= start - 15 * 60 * 1000 &&
      now <= end;

    const canCheckIn =
      paymentVerified &&
      booking.status === 'CONFIRMED' &&
      entryAllowed;

    const canCheckOut =
      paymentVerified &&
      booking.status === 'CHECKED_IN';

    const valid = canCheckIn || canCheckOut;

    let message = 'Valid parking ticket';

    if (!paymentVerified) {
      message = 'Payment not verified';
    } else if (booking.status === 'COMPLETED') {
      message = 'Parking already completed';
    } else if (booking.status === 'CHECKED_IN') {
      message = 'Vehicle is checked in. Ready for check-out.';
    } else if (booking.status === 'CONFIRMED' && !entryAllowed) {
      message = 'Booking is outside the allowed entry time';
    } else if (!valid) {
      message = `Booking status: ${booking.status}`;
    }

    res.json({
      valid,
      message,
      canCheckIn,
      canCheckOut,
      booking: getBookingDetails(booking)
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({
      valid: false,
      error: 'Server error'
    });
  }
});

// Vehicle check-in
router.put('/checkin/:token', adminAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: {
        referenceToken: req.params.token
      },
      include: bookingInclude
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    if (booking.paymentStatus !== 'PAID') {
      return res.status(400).json({
        error: 'Payment not verified'
      });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        error: 'Only confirmed bookings can check in'
      });
    }

    const now = Date.now();
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();

    if (now < start - 15 * 60 * 1000 || now > end) {
      return res.status(400).json({
        error: 'Booking is outside the allowed entry time'
      });
    }

    const result = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      },
      data: {
        status: 'CHECKED_IN'
      }
    });

    if (result.count !== 1) {
      return res.status(409).json({
        error: 'Booking already processed'
      });
    }

    const updated = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    const io = req.app.get('io');

    if (io) {
      io.to(booking.slot.floor.locationId).emit(
        'slot_update',
        {
          slotId: booking.slotId,
          status: 'OCCUPIED'
        }
      );
    }

    res.json({
      message: 'Vehicle checked in successfully!',
      booking: updated
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Vehicle check-out
router.put('/checkout/:token', adminAuth, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: {
        referenceToken: req.params.token
      },
      include: bookingInclude
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    if (booking.status !== 'CHECKED_IN') {
      return res.status(400).json({
        error: 'Only checked-in vehicles can check out'
      });
    }

    const result = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        status: 'CHECKED_IN'
      },
      data: {
        status: 'COMPLETED'
      }
    });

    if (result.count !== 1) {
      return res.status(409).json({
        error: 'Booking already processed'
      });
    }

    const updated = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

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

    res.json({
      message: 'Vehicle checked out successfully!',
      booking: updated
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
