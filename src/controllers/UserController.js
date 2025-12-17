const { validationResult } = require('express-validator');
const UserService = require('../services/UserService');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  // POST /api/auth/register
  async register(req, res) {
    try {
      // Check validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { username, email, password } = req.body;

      const result = await this.userService.register({
        username,
        email,
        password
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'REGISTRATION_FAILED'
      });
    }
  }

  // POST /api/auth/login
  async login(req, res) {
    try {
      // Check validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      const result = await this.userService.login({
        email,
        password
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
        error: 'LOGIN_FAILED'
      });
    }
  }

  // GET /api/users/profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await this.userService.getUserById(userId);

      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
      });

    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'USER_NOT_FOUND'
      });
    }
  }

  // PUT /api/users/profile
  async updateProfile(req, res) {
    try {
      // Check validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const updateData = req.body;

      const updatedUser = await this.userService.updateUserProfile(userId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'UPDATE_FAILED'
      });
    }
  }

  // GET /api/users
  async getAllUsers(req, res) {
    try {
      const users = await this.userService.getAllUsers();

      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: { 
          users,
          count: users.length
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        error: 'FETCH_FAILED'
      });
    }
  }

  // GET /api/users/:id
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User ID must be a valid number',
          error: 'INVALID_USER_ID'
        });
      }

      const user = await this.userService.getUserById(userId);

      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });

    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'USER_NOT_FOUND'
      });
    }
  }

  // DELETE /api/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User ID must be a valid number',
          error: 'INVALID_USER_ID'
        });
      }

      // Don't allow user to delete themselves
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own user account',
          error: 'SELF_DELETE_NOT_ALLOWED'
        });
      }

      const deletedUser = await this.userService.deleteUser(userId);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: { user: deletedUser }
      });

    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'DELETE_FAILED'
      });
    }
  }

  // GET /api/stats
  async getStats(req, res) {
    try {
      const stats = await this.userService.getStats();

      return res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        error: 'STATS_FAILED'
      });
    }
  }

  // POST /api/auth/verify-token
  async verifyToken(req, res) {
    try {
      // If we got here, the token is valid (middleware already validated it)
      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: { user: req.user }
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
  }
}

module.exports = UserController;