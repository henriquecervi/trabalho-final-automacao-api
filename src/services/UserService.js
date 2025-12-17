const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const User = require('../models/User');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-here';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30m';
  }

  // Register new user
  async register(userData) {
    try {
      // Validate input data
      const validation = User.validate(userData);
      if (!validation.isValid) {
        throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
      }

      // Check if email already exists
      const emailExists = await this.userRepository.emailExists(userData.email);
      if (emailExists) {
        throw new Error('Email is already in use');
      }

      // Check if username already exists
      const usernameExists = await this.userRepository.usernameExists(userData.username);
      if (usernameExists) {
        throw new Error('Username is already in use');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const newUser = await this.userRepository.create({
        username: userData.username.trim(),
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword
      });

      // Generate JWT token
      const token = this.generateToken(newUser);

      return {
        user: newUser.toSafeObject(),
        token
      };
    } catch (error) {
      throw new Error(`Error registering user: ${error.message}`);
    }
  }

  // User login
  async login(credentials) {
    try {
      // Validate required fields
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email.toLowerCase().trim());
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: user.toSafeObject(),
        token
      };
    } catch (error) {
      throw new Error(`Error during login: ${error.message}`);
    }
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiresIn,
      issuer: 'api-login-rest'
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toSafeObject();
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const users = await this.userRepository.findAll();
      return users.map(user => user.toSafeObject());
    } catch (error) {
      throw new Error(`Error listing users: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(id, updateData) {
    try {
      // Validate if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // If updating email, check if it doesn't already exist
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.userRepository.emailExists(updateData.email);
        if (emailExists) {
          throw new Error('Email is already in use');
        }
      }

      // If updating username, check if it doesn't already exist
      if (updateData.username && updateData.username !== existingUser.username) {
        const usernameExists = await this.userRepository.usernameExists(updateData.username);
        if (usernameExists) {
          throw new Error('Username is already in use');
        }
      }

      // If updating password, hash it
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      const updatedUser = await this.userRepository.update(id, updateData);
      return updatedUser.toSafeObject();
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      const deletedUser = await this.userRepository.delete(id);
      if (!deletedUser) {
        throw new Error('User not found');
      }
      return deletedUser.toSafeObject();
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Get basic statistics
  async getStats() {
    try {
      const userCount = await this.userRepository.count();
      return {
        totalUsers: userCount,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error retrieving statistics: ${error.message}`);
    }
  }
}

module.exports = UserService;