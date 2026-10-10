const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.id }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { regNumber, type, model, color } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { regNumber, type, model, color, userId: req.user.id }
    });
    res.status(201).json(vehicle);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Registration number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
