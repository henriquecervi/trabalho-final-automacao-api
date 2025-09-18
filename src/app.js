const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');

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

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login REST API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
    endpoints: {
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

// 404 middleware for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND'
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏠 API Root: http://localhost:${PORT}/`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
