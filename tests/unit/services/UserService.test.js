const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserService = require('../../../src/services/UserService');
const UserRepository = require('../../../src/repositories/UserRepository');

describe('UserService', () => {
  let userService;
  let userRepositoryStub;

  beforeEach(() => {
    userService = new UserService();
    userRepositoryStub = sinon.createStubInstance(UserRepository);
    userService.userRepository = userRepositoryStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      const hashedPassword = 'hashed-password';
      const newUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        toSafeObject: () => ({ id: 1, username: 'testuser', email: 'test@example.com' })
      };

      // Stubs
      userRepositoryStub.emailExists.resolves(false);
      userRepositoryStub.usernameExists.resolves(false);
      userRepositoryStub.create.resolves(newUser);
      
      const bcryptStub = sinon.stub(bcrypt, 'hash').resolves(hashedPassword);
      const jwtStub = sinon.stub(jwt, 'sign').returns('fake-jwt-token');

      // Act
      const result = await userService.register(userData);

      // Assert
      expect(userRepositoryStub.emailExists.calledWith('test@example.com')).to.be.true;
      expect(userRepositoryStub.usernameExists.calledWith('testuser')).to.be.true;
      expect(bcryptStub.calledWith('Password123', 10)).to.be.true;
      expect(userRepositoryStub.create.calledOnce).to.be.true;
      expect(jwtStub.calledOnce).to.be.true;
      
      expect(result).to.have.property('user');
      expect(result).to.have.property('token');
      expect(result.token).to.equal('fake-jwt-token');
    });

    it('should reject when email already exists', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'Password123'
      };

      userRepositoryStub.emailExists.resolves(true);

      // Act & Assert
      try {
        await userService.register(userData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Email is already in use');
      }
    });

    it('should reject when username already exists', async () => {
      // Arrange
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'Password123'
      };

      userRepositoryStub.emailExists.resolves(false);
      userRepositoryStub.usernameExists.resolves(true);

      // Act & Assert
      try {
        await userService.register(userData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Username is already in use');
      }
    });

    it('should reject when data is invalid', async () => {
      // Arrange
      const userData = {
        username: 'ab', // too short
        email: 'invalid-email',
        password: '123' // too short
      };

      // Act & Assert
      try {
        await userService.register(userData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid data');
      }
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'Password123'
      };

      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        toSafeObject: () => ({ id: 1, username: 'testuser', email: 'test@example.com' })
      };

      userRepositoryStub.findByEmail.resolves(user);
      const bcryptStub = sinon.stub(bcrypt, 'compare').resolves(true);
      const jwtStub = sinon.stub(jwt, 'sign').returns('fake-jwt-token');

      // Act
      const result = await userService.login(credentials);

      // Assert
      expect(userRepositoryStub.findByEmail.calledWith('test@example.com')).to.be.true;
      expect(bcryptStub.calledWith('Password123', 'hashed-password')).to.be.true;
      expect(jwtStub.calledOnce).to.be.true;
      
      expect(result).to.have.property('user');
      expect(result).to.have.property('token');
      expect(result.token).to.equal('fake-jwt-token');
    });

    it('should reject when user does not exist', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      };

      userRepositoryStub.findByEmail.resolves(null);

      // Act & Assert
      try {
        await userService.login(credentials);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid credentials');
      }
    });

    it('should reject when password is incorrect', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password'
      };

      userRepositoryStub.findByEmail.resolves(user);
      const bcryptStub = sinon.stub(bcrypt, 'compare').resolves(false);

      // Act & Assert
      try {
        await userService.login(credentials);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid credentials');
      }
    });

    it('should reject when required fields are missing', async () => {
      // Arrange
      const credentials = {
        email: '',
        password: ''
      };

      // Act & Assert
      try {
        await userService.login(credentials);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Email and password are required');
      }
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      // Arrange
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      const jwtStub = sinon.stub(jwt, 'sign').returns('fake-jwt-token');

      // Act
      const token = userService.generateToken(user);

      // Assert
      expect(jwtStub.calledOnce).to.be.true;
      expect(token).to.equal('fake-jwt-token');
      
      const payload = jwtStub.getCall(0).args[0];
      expect(payload).to.deep.equal({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      // Arrange
      const token = 'valid-token';
      const payload = { id: 1, username: 'testuser' };
      
      const jwtStub = sinon.stub(jwt, 'verify').returns(payload);

      // Act
      const result = userService.verifyToken(token);

      // Assert
      expect(jwtStub.calledWith(token, userService.jwtSecret)).to.be.true;
      expect(result).to.deep.equal(payload);
    });

    it('should reject invalid token', () => {
      // Arrange
      const token = 'invalid-token';
      
      const jwtStub = sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));

      // Act & Assert
      try {
        userService.verifyToken(token);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid or expired token');
      }
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        toSafeObject: () => ({ id: 1, username: 'testuser', email: 'test@example.com' })
      };

      userRepositoryStub.findById.resolves(user);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(userRepositoryStub.findById.calledWith(userId)).to.be.true;
      expect(result).to.deep.equal({ id: 1, username: 'testuser', email: 'test@example.com' });
    });

    it('should reject when user does not exist', async () => {
      // Arrange
      const userId = 999;
      userRepositoryStub.findById.resolves(null);

      // Act & Assert
      try {
        await userService.getUserById(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('User not found');
      }
    });
  });

  describe('getAllUsers', () => {
    it('should return list of users', async () => {
      // Arrange
      const users = [
        {
          id: 1,
          username: 'user1',
          toSafeObject: () => ({ id: 1, username: 'user1' })
        },
        {
          id: 2,
          username: 'user2',
          toSafeObject: () => ({ id: 2, username: 'user2' })
        }
      ];

      userRepositoryStub.findAll.resolves(users);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(userRepositoryStub.findAll.calledOnce).to.be.true;
      expect(result).to.have.length(2);
      expect(result[0]).to.deep.equal({ id: 1, username: 'user1' });
      expect(result[1]).to.deep.equal({ id: 2, username: 'user2' });
    });
  });

  describe('getStats', () => {
    it('should return basic statistics', async () => {
      // Arrange
      userRepositoryStub.count.resolves(5);

      // Act
      const result = await userService.getStats();

      // Assert
      expect(userRepositoryStub.count.calledOnce).to.be.true;
      expect(result).to.have.property('totalUsers', 5);
      expect(result).to.have.property('timestamp');
      expect(result.timestamp).to.be.instanceOf(Date);
    });
  });
});