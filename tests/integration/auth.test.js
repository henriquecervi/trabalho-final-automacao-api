const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/models/Database');

describe('Auth Integration Tests', () => {
  
  beforeEach(() => {
    // Clear database before each test
    database.clear();
  });

  after(() => {
    // Clear database after all tests
    database.clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('User registered successfully');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data).to.have.property('token');
      
      const { user, token } = response.body.data;
      expect(user.username).to.equal('testuser');
      expect(user.email).to.equal('test@example.com');
      expect(user).to.not.have.property('password');
      expect(token).to.be.a('string');
    });

    it('should reject registration with invalid data', async () => {
      // Arrange
      const userData = {
        username: 'ab', // too short
        email: 'invalid-email',
        password: '123' // too short
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid input data');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors.length).to.be.greaterThan(0);
    });

    it('should reject registration with duplicate email', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const duplicateData = {
        username: 'testuser2',
        email: 'test@example.com', // same email
        password: 'Password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Email is already in use');
      expect(response.body.error).to.equal('REGISTRATION_FAILED');
    });

    it('should reject registration with duplicate username', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same username
      const duplicateData = {
        username: 'testuser', // same username
        email: 'test2@example.com',
        password: 'Password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Username is already in use');
      expect(response.body.error).to.equal('REGISTRATION_FAILED');
    });
  });

  describe('POST /api/auth/login', () => {
    let registeredUser;

    beforeEach(async () => {
      // Register a user for login tests
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      registeredUser = response.body.data;
    });

    it('should login successfully', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'Password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Login successful');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data).to.have.property('token');
      
      const { user, token } = response.body.data;
      expect(user.email).to.equal('test@example.com');
      expect(user).to.not.have.property('password');
      expect(token).to.be.a('string');
    });

    it('should reject login with incorrect email', async () => {
      // Arrange
      const credentials = {
        email: 'wrong@example.com',
        password: 'Password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Invalid credentials');
      expect(response.body.error).to.equal('LOGIN_FAILED');
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Invalid credentials');
      expect(response.body.error).to.equal('LOGIN_FAILED');
    });

    it('should reject login with invalid data', async () => {
      // Arrange
      const credentials = {
        email: 'invalid-email',
        password: ''
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid input data');
      expect(response.body.errors).to.be.an('array');
    });
  });

  describe('POST /api/auth/verify-token', () => {
    let authToken;

    beforeEach(async () => {
      // Register user and get token
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.data.token;
    });

    it('should verify valid token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Token is valid');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user.email).to.equal('test@example.com');
    });

    it('should reject request without token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-token')
        .expect(401);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Access token required');
      expect(response.body.error).to.equal('UNAUTHORIZED');
    });

    it('should reject invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid or expired token');
      expect(response.body.error).to.equal('FORBIDDEN');
    });

    it('should reject invalid Authorization format', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', 'InvalidFormat token')
        .expect(403);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid or expired token');
      expect(response.body.error).to.equal('FORBIDDEN');
    });
  });
});