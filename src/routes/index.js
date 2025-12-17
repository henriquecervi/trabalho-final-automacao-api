const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const statsRoutes = require('./stats');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Health'
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Statistics routes
router.use('/stats', statsRoutes);

// 404 route for unknown endpoints
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'NOT_FOUND'
  });
});

module.exports = router;
