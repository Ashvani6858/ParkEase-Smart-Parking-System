
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, adminAuth } = require('../middleware/auth');

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await prisma.parkingLocation.findMany({
      where: { isActive: true },
      include: {
        floors: {
          include: {
            slots: true
          }
        }
      }
    });

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific location with slots and availability
router.get('/:id/slots', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    const location = await prisma.parkingLocation.findUnique({
      where: { id: req.params.id },
      include: {
        floors: {
          include: {
            slots: {
              include: {
                bookings: {
                  where: {
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                    ...(startTime && endTime ? {
                      AND: [
                        { startTime: { lt: new Date(endTime) } },
                        { endTime: { gt: new Date(startTime) } }
                      ]
                    } : {})
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }

    const response = {
      ...location,
      floors: location.floors.map(floor => ({
        ...floor,
        slots: floor.slots.map(slot => ({
          id: slot.id,
          slotNumber: slot.slotNumber,
          type: slot.type,
          status: slot.status,
          isAvailable:
            slot.status === 'AVAILABLE' &&
            slot.bookings.length === 0
        }))
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// NEW: Get a single parking location
router.get('/:id', async (req, res) => {
  try {
    const location = await prisma.parkingLocation.findUnique({
      where: { id: req.params.id },
      include: {
        floors: {
          include: {
            slots: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }

    res.json(location);
  } catch (error) {
    console.error('Location details error:', error);
    res.status(500).json({
      error: 'Server error'
    });
  }
});

module.exports = router;
