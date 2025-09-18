const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const graphqlServer = require('./graphql/server');

// Configuration loaded from config/config.js

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS - configure as needed
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Login REST API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// GraphQL Setup - Initialize IMMEDIATELY and SYNCHRONOUSLY
console.log('🔄 Starting GraphQL server initialization...');

// Create a promise that we'll await to ensure GraphQL is ready before starting server
const graphqlPromise = (async () => {
  try {
    await graphqlServer.createServer();
    console.log('✅ GraphQL server created successfully');
    
    // Apply GraphQL middleware RIGHT NOW
    console.log('🔄 Applying GraphQL middleware...');
    graphqlServer.applyMiddleware(app, '/graphql');
    console.log('✅ GraphQL middleware applied successfully');
    console.log('📈 GraphQL Server initialized at /graphql');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize GraphQL server:', error);
    throw error;
  }
})();

// Export function to wait for GraphQL
app.waitForGraphQL = () => graphqlPromise;

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login REST & GraphQL API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
    graphql: '/graphql',
    endpoints: {
      rest: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          verifyToken: 'POST /api/auth/verify-token'
        },
        users: {
          profile: 'GET /api/users/profile',
          updateProfile: 'PUT /api/users/profile',
          listUsers: 'GET /api/users',
          getUserById: 'GET /api/users/:id',
          deleteUser: 'DELETE /api/users/:id'
        },
        stats: {
          getStats: 'GET /api/stats'
        }
      },
      graphql: {
        endpoint: 'POST /graphql',
        playground: process.env.NODE_ENV !== 'production' ? 'GET /graphql' : 'disabled',
        queries: ['me', 'users', 'user(id)', 'stats', 'health'],
        mutations: ['register', 'login', 'updateProfile', 'deleteUser']
      }
    }
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(`Unhandled error: ${error.message}`, error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'INTERNAL_SERVER_ERROR' : error.message
  });
});

// Wait for GraphQL, then apply 404 middleware AFTER GraphQL is ready
graphqlPromise.then(() => {
  console.log('📋 Applying 404 middleware after GraphQL...');
  
  // 404 middleware for unknown routes (AFTER GraphQL)
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      error: 'NOT_FOUND'
    });
  });
  
  console.log('✅ 404 middleware applied after GraphQL');
}).catch(console.error);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏠 API Root: http://localhost:${PORT}/`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📈 GraphQL Endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🎮 GraphQL Playground: http://localhost:${PORT}/graphql`);
  });
}

module.exports = app;
