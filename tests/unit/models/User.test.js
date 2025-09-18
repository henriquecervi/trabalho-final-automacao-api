const { expect } = require('chai');
const User = require('../../../src/models/User');

describe('User Model', () => {
  describe('constructor', () => {
    it('should create a user with all fields', () => {
      // Arrange
      const id = 1;
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'hashedpassword';
      const createdAt = new Date();

      // Act
      const user = new User(id, username, email, password, createdAt);

      // Assert
      expect(user.id).to.equal(id);
      expect(user.username).to.equal(username);
      expect(user.email).to.equal(email);
      expect(user.password).to.equal(password);
      expect(user.createdAt).to.equal(createdAt);
    });

    it('should create a user with default date when not provided', () => {
      // Arrange
      const id = 1;
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'hashedpassword';

      // Act
      const user = new User(id, username, email, password);

      // Assert
      expect(user.id).to.equal(id);
      expect(user.username).to.equal(username);
      expect(user.email).to.equal(email);
      expect(user.password).to.equal(password);
      expect(user.createdAt).to.be.instanceOf(Date);
    });
  });

  describe('toSafeObject', () => {
    it('should return object without password', () => {
      // Arrange
      const user = new User(1, 'testuser', 'test@example.com', 'secret-password');

      // Act
      const safeObject = user.toSafeObject();

      // Assert
      expect(safeObject).to.have.property('id', 1);
      expect(safeObject).to.have.property('username', 'testuser');
      expect(safeObject).to.have.property('email', 'test@example.com');
      expect(safeObject).to.have.property('createdAt');
      expect(safeObject).to.not.have.property('password');
    });
  });

  describe('validate', () => {
    it('should validate correct data', () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: 'ValidPassword123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should reject username too short', () => {
      // Arrange
      const userData = {
        username: 'ab',
        email: 'valid@example.com',
        password: 'ValidPassword123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Username must be at least 3 characters long');
    });

    it('should reject empty username', () => {
      // Arrange
      const userData = {
        username: '',
        email: 'valid@example.com',
        password: 'ValidPassword123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Username must be at least 3 characters long');
    });

    it('should reject username with only spaces', () => {
      // Arrange
      const userData = {
        username: '   ',
        email: 'valid@example.com',
        password: 'ValidPassword123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Username must be at least 3 characters long');
    });

    it('should reject invalid email', () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: 'invalid-email',
        password: 'ValidPassword123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Email must have a valid format');
    });

    it('should reject empty email', () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: '',
        password: 'ValidPassword123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Email must have a valid format');
    });

    it('should reject password too short', () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: '123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Password must be at least 6 characters long');
    });

    it('should reject empty password', () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: ''
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Password must be at least 6 characters long');
    });

    it('should return multiple errors', () => {
      // Arrange
      const userData = {
        username: 'ab',
        email: 'invalid-email',
        password: '123'
      };

      // Act
      const result = User.validate(userData);

      // Assert
      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length(3);
      expect(result.errors).to.include('Username must be at least 3 characters long');
      expect(result.errors).to.include('Email must have a valid format');
      expect(result.errors).to.include('Password must be at least 6 characters long');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      // Arrange & Act & Assert
      expect(User.isValidEmail('test@example.com')).to.be.true;
      expect(User.isValidEmail('user.name@domain.co.uk')).to.be.true;
      expect(User.isValidEmail('user+tag@example.org')).to.be.true;
    });

    it('should reject incorrect emails', () => {
      // Arrange & Act & Assert
      expect(User.isValidEmail('invalid-email')).to.be.false;
      expect(User.isValidEmail('user@')).to.be.false;
      expect(User.isValidEmail('@domain.com')).to.be.false;
      expect(User.isValidEmail('user@domain')).to.be.false;
      expect(User.isValidEmail('')).to.be.false;
      expect(User.isValidEmail('user name@domain.com')).to.be.false;
    });
  });
});