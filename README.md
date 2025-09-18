# Login REST API

A complete REST API for user authentication developed in JavaScript/Node.js with service/controller/repository architecture patterns.

## 🚀 Features

- **Clean Architecture**: Implementation with Service, Controller and Repository patterns
- **JWT Authentication**: Complete login system with secure tokens
- **In-Memory Database**: Database simulation for development
- **Robust Validations**: Input validation with express-validator
- **Complete Testing**: Coverage with unit, integration and E2E tests
- **CI/CD Pipeline**: Continuous integration with GitHub Actions
- **Security**: Security middleware with helmet and bcrypt for passwords
- **API Documentation**: Interactive Swagger UI documentation

## 📋 Functionalities

### Authentication
- ✅ User registration
- ✅ Login with email/password
- ✅ JWT token verification
- ✅ Authentication middleware

### User Management
- ✅ View profile
- ✅ Update profile
- ✅ List users
- ✅ Search user by ID
- ✅ Delete users

### System
- ✅ Health check
- ✅ Application statistics
- ✅ Error handling
- ✅ Interactive API documentation

## 🛠️ Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors
- **Documentation**: Swagger UI, swagger-jsdoc
- **Testing**: Mocha, Chai, Supertest, Sinon
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
src/
├── controllers/        # REST Controllers
├── services/          # Business logic
├── repositories/      # Data access
├── models/           # Models and in-memory database
├── routes/           # Route definitions
├── middleware/       # Authentication and validation middleware
└── config/           # Application configuration

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── external/         # E2E tests
```

## 🚦 Installation and Execution

### Prerequisites
- Node.js 16+ 
- npm

### Installation
```bash
git clone <repository-url>
cd trabalho-final-automacao-api
npm install
```

### Execution
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

**Interactive Swagger Documentation**: `http://localhost:3000/api-docs`

The Swagger UI provides:
- ✅ Interactive endpoint testing
- ✅ Complete request/response schemas
- ✅ Authentication flow examples
- ✅ Real-time API exploration

## 🧪 Testing

Complete test suite with **centralized configuration in package.json** for simplicity and maintainability.

### Test Configuration
- All Mocha configuration centralized in `package.json` scripts
- Environment variables and options defined inline
- No additional `.mocharc.json` file needed
- All test messages and descriptions in English

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:external

# Tests with coverage
npm run test:coverage

# Tests in watch mode
npm run test:watch
```

### Test Configuration Details
Each test script includes:
- `NODE_ENV=test` - Sets test environment
- `--recursive` - Searches subdirectories for tests  
- `--timeout 5000` - 5-second timeout per test
- `--exit` - Forces exit after tests complete
- `--reporter spec` - Uses spec reporter for detailed output

## 📊 Test Coverage

The project includes:
- **Unit Tests**: Controllers, Services and Models with Sinon
- **Integration Tests**: REST routes with Supertest
- **E2E Tests**: Complete authentication flows
- **Performance Tests**: Response time verification

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register     # Register user
POST /api/auth/login        # Login
POST /api/auth/verify-token # Verify token
```

### Users (Protected)
```
GET    /api/users/profile   # Get profile
PUT    /api/users/profile   # Update profile
GET    /api/users           # List users
GET    /api/users/:id       # Search by ID
DELETE /api/users/:id       # Delete user
```

### System
```
GET /api/health             # Health check
GET /api/stats              # Statistics (protected)
```

## 📝 Usage Examples

### Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Access Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security

- Passwords are hashed with bcrypt
- JWT tokens with configurable expiration
- Strict input validation
- Security headers with helmet
- Common attack prevention

## 🚀 CI/CD Pipeline

The project includes a complete GitHub Actions pipeline:

- ✅ Tests on multiple Node.js versions
- ✅ Security checks
- ✅ Performance tests
- ✅ Automatic deployment to staging/production
- ✅ Status notifications

## 📈 Monitoring

- Health checks at `/api/health`
- User statistics at `/api/stats`
- Request logs in development

## 🎯 Quick Start

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd trabalho-final-automacao-api
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access documentation**:
   - API Root: `http://localhost:3000/`
   - Swagger UI: `http://localhost:3000/api-docs`
   - Health Check: `http://localhost:3000/api/health`

4. **Test the API**:
   - Register a user via Swagger UI
   - Login and get JWT token
   - Use token to access protected endpoints

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is under the MIT license. See the `LICENSE` file for more details.

## 👨‍💻 Developed by

[Your Name] - [your.email@example.com]

---

**Note**: This is a project for educational purposes. In production, consider using a real database, more robust environment configurations and additional security implementations.