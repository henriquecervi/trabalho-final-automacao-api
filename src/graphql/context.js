const UserService = require('../services/UserService');

class GraphQLContext {
  constructor() {
    this.userService = new UserService();
  }

  async createContext({ req }) {
    const context = {
      user: null,
      userService: this.userService
    };

    // Extract authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      try {
        // Extract token from "Bearer TOKEN" format
        const token = authHeader.replace('Bearer ', '');
        
        if (token && token !== 'null' && token !== 'undefined') {
          // Verify token and get user data
          const decoded = this.userService.verifyToken(token);
          context.user = decoded;
        }
      } catch (error) {
        // Token is invalid, but we don't throw an error here
        // Let individual resolvers handle authentication requirements
        console.warn('Invalid token provided:', error.message);
      }
    }

    return context;
  }
}

module.exports = new GraphQLContext();
