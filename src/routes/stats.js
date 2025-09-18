const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const userController = new UserController();

/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [System]
 *     summary: Get application statistics
 *     description: Retrieve statistics about the application (total users, etc.)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Statistics retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Stats'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, (req, res) => {
  userController.getStats(req, res);
});

module.exports = router;
