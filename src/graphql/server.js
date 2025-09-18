const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const typeDefs = require('./schemas');
const resolvers = require('./resolvers');
const graphqlContext = require('./context');

class GraphQLServerManager {
  constructor() {
    this.server = null;
  }

  async createServer() {
    // Create executable schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    // Create Apollo Server
    this.server = new ApolloServer({
      schema,
      // Context function for authentication
      context: async ({ req, res }) => {
        return await graphqlContext.createContext({ req, res });
      },
      // Enable GraphQL Playground in development
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      // Custom formatting for errors
      formatError: (error) => {
        // Log error details in development
        if (process.env.NODE_ENV !== 'production') {
          console.error('GraphQL Error:', error);
        }

        // Return formatted error
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_ERROR',
          path: error.path,
          locations: error.locations
        };
      }
    });

    await this.server.start();
    return this.server;
  }

  applyMiddleware(expressApp, path = '/graphql') {
    if (!this.server) {
      throw new Error('GraphQL server not initialized. Call createServer() first.');
    }

    this.server.applyMiddleware({ 
      app: expressApp, 
      path,
      cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
        credentials: true
      }
    });
  }

  async stop() {
    if (this.server) {
      await this.server.stop();
    }
  }
}

module.exports = new GraphQLServerManager();