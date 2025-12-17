const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Login REST API',
    version: '1.0.0',
    description: 'A complete REST API for user authentication with JWT tokens',
    contact: {
      name: 'API Support',
      email: 'support@loginapi.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api-login.example.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User unique identifier',
            example: 1
          },
          username: {
            type: 'string',
            description: 'User username',
            example: 'johndoe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
            example: '2025-09-18T10:00:00.000Z'
          }
        }
      },
      UserRegistration: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            pattern: '^[a-zA-Z0-9_]+$',
            description: 'Username (min 3 chars, alphanumeric + underscore)',
            example: 'johndoe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Valid email address',
            example: 'john@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
            description: 'Password (min 6 chars, must contain lowercase, uppercase and number)',
            example: 'SecurePass123'
          }
        }
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'SecurePass123'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'User registered successfully'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              token: {
                type: 'string',
                description: 'JWT authentication token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        }
      },
      UserUpdateProfile: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            pattern: '^[a-zA-Z0-9_]+$',
            description: 'New username (optional)',
            example: 'newusername'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'New email address (optional)',
            example: 'newemail@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
            description: 'New password (optional)',
            example: 'NewSecurePass123'
          }
        }
      },
      Stats: {
        type: 'object',
        properties: {
          totalUsers: {
            type: 'integer',
            description: 'Total number of registered users',
            example: 42
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Statistics generation timestamp',
            example: '2025-09-18T10:00:00.000Z'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error description'
          },
          error: {
            type: 'string',
            example: 'ERROR_CODE'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                  example: 'Field validation error'
                },
                param: {
                  type: 'string',
                  example: 'fieldName'
                }
              }
            }
          }
        }
      },
      Health: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'API is working'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-09-18T10:00:00.000Z'
          },
          version: {
            type: 'string',
            example: '1.0.0'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication operations'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'System',
      description: 'System information and health checks'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
