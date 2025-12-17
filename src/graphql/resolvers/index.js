const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const UserService = require('../../services/UserService');
const User = require('../../models/User');

class GraphQLResolvers {
  constructor() {
    this.userService = new UserService();
  }

  // Helper function to get user from context
  requireAuth(context) {
    if (!context.user) {
      throw new AuthenticationError('Authentication required');
    }
    return context.user;
  }

  getResolvers() {
    return {
      Query: {
        // Get current user profile
        me: async (parent, args, context) => {
          const user = this.requireAuth(context);
          try {
            return await this.userService.getUserById(user.id);
          } catch (error) {
            throw new Error(`Error fetching profile: ${error.message}`);
          }
        },

        // Get all users
        users: async (parent, args, context) => {
          this.requireAuth(context);
          try {
            return await this.userService.getAllUsers();
          } catch (error) {
            throw new Error(`Error fetching users: ${error.message}`);
          }
        },

        // Get user by ID
        user: async (parent, { id }, context) => {
          this.requireAuth(context);
          try {
            const userId = parseInt(id);
            if (isNaN(userId)) {
              throw new UserInputError('Invalid user ID');
            }
            return await this.userService.getUserById(userId);
          } catch (error) {
            if (error.message.includes('User not found')) {
              throw new Error('User not found');
            }
            throw new Error(error.message.includes('Invalid user ID') ? 'Invalid user ID' : `Error fetching user: ${error.message}`);
          }
        },

        // Get application statistics
        stats: async (parent, args, context) => {
          this.requireAuth(context);
          try {
            return await this.userService.getStats();
          } catch (error) {
            throw new Error(`Error fetching stats: ${error.message}`);
          }
        },

        // Health check
        health: () => {
          return 'GraphQL API is running';
        }
      },

      Mutation: {
        // Register new user
        register: async (parent, { input }) => {
          try {
            // Validate input
            const validation = User.validate(input);
            if (!validation.isValid) {
              throw new UserInputError(`Invalid input: ${validation.errors.join(', ')}`);
            }

            const result = await this.userService.register(input);
            return result;
          } catch (error) {
            if (error.message.includes('Email is already in use')) {
              throw new UserInputError('Email is already in use');
            }
            if (error.message.includes('Username is already in use')) {
              throw new UserInputError('Username is already in use');
            }
            throw new Error(`Registration failed: ${error.message}`);
          }
        },

        // Login user
        login: async (parent, { input }) => {
          try {
            const result = await this.userService.login(input);
            return result;
          } catch (error) {
            if (error.message.includes('Invalid credentials') || 
                error.message.includes('Email and password are required')) {
              throw new AuthenticationError('Invalid credentials');
            }
            throw new Error(`Login failed: ${error.message}`);
          }
        },

        // Update user profile
        updateProfile: async (parent, { input }, context) => {
          const user = this.requireAuth(context);
          try {
            // Only allow updating non-empty fields
            const updateData = {};
            if (input.username && input.username.trim()) {
              updateData.username = input.username.trim();
            }
            if (input.email && input.email.trim()) {
              updateData.email = input.email.trim();
            }

            if (Object.keys(updateData).length === 0) {
              throw new UserInputError('No valid fields to update');
            }

            // Validate only the fields being updated
            if (updateData.username) {
              const usernameValidation = User.validate({ username: updateData.username, email: 'dummy@test.com', password: 'dummy123' });
              if (!usernameValidation.isValid) {
                const usernameErrors = usernameValidation.errors.filter(error => 
                  error.includes('Username')
                );
                if (usernameErrors.length > 0) {
                  throw new UserInputError(`Invalid input: ${usernameErrors.join(', ')}`);
                }
              }
            }
            
            if (updateData.email) {
              const emailValidation = User.validate({ username: 'dummy', email: updateData.email, password: 'dummy123' });
              if (!emailValidation.isValid) {
                const emailErrors = emailValidation.errors.filter(error => 
                  error.includes('Email')
                );
                if (emailErrors.length > 0) {
                  throw new UserInputError(`Invalid input: ${emailErrors.join(', ')}`);
                }
              }
            }

            const updatedUser = await this.userService.updateUserProfile(user.id, updateData);
            return updatedUser;
          } catch (error) {
            if (error.message.includes('Email is already in use')) {
              throw new UserInputError('Email is already in use');
            }
            if (error.message.includes('Username is already in use')) {
              throw new UserInputError('Username is already in use');
            }
            throw new Error(`Error updating profile: ${error.message}`);
          }
        },

        // Delete user
        deleteUser: async (parent, { id }, context) => {
          const currentUser = this.requireAuth(context);
          try {
            const userIdToDelete = parseInt(id);
            if (isNaN(userIdToDelete)) {
              throw new UserInputError('Invalid user ID');
            }

            // Prevent self-deletion
            if (currentUser.id === userIdToDelete) {
              throw new ForbiddenError('Cannot delete your own account');
            }

            const deletedUser = await this.userService.deleteUser(userIdToDelete);
            return deletedUser;
          } catch (error) {
            if (error.message.includes('User not found')) {
              throw new Error('User not found');
            }
            if (error instanceof ForbiddenError) {
              throw error;
            }
            throw new Error(error.message.includes('Invalid user ID') ? 'Invalid user ID' : `Error deleting user: ${error.message}`);
          }
        }
      }
    };
  }
}

module.exports = new GraphQLResolvers().getResolvers();
