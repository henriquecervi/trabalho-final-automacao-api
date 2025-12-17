const { expect } = require('chai');
const sinon = require('sinon');
const UserController = require('../../../src/controllers/UserController');

describe('UserController', () => {
  let userController;
  let userServiceStub;
  let req, res, next;

  beforeEach(() => {
    userController = new UserController();
    userServiceStub = sinon.stub(userController, 'userService');
    
    req = {
      body: {},
      params: {},
      user: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();
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
      
      const registeredUser = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'fake-jwt-token'
      };

      req.body = userData;
      
      // Mock the userService properly
      userController.userService = {
        register: sinon.stub().resolves(registeredUser)
      };

      // Mock validationResult by overriding the require call
      const originalValidationResult = require('express-validator').validationResult;
      require('express-validator').validationResult = () => ({ isEmpty: () => true });

      // Act
      await userController.register(req, res);

      // Restore
      require('express-validator').validationResult = originalValidationResult;

      // Assert
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.equal('User registered successfully');
      expect(responseData.data).to.have.property('user');
      expect(responseData.data).to.have.property('token');
      expect(responseData.data.user.username).to.equal('testuser');
      expect(responseData.data.user.email).to.equal('test@example.com');
    });

    it('should return error when service throws exception', async () => {
      // Arrange
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // Mock the userService properly
      userController.userService = {
        register: sinon.stub().rejects(new Error('Email is already in use'))
      };

      // Mock validationResult
      const originalValidationResult = require('express-validator').validationResult;
      require('express-validator').validationResult = () => ({ isEmpty: () => true });

      // Act
      await userController.register(req, res);

      // Restore
      require('express-validator').validationResult = originalValidationResult;

      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.error).to.equal('REGISTRATION_FAILED');
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const loginResult = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'fake-jwt-token'
      };

      req.body = credentials;
      
      // Mock the userService properly
      userController.userService = {
        login: sinon.stub().resolves(loginResult)
      };

      // Mock validationResult
      const originalValidationResult = require('express-validator').validationResult;
      require('express-validator').validationResult = () => ({ isEmpty: () => true });

      // Act
      await userController.login(req, res);

      // Restore
      require('express-validator').validationResult = originalValidationResult;

      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.equal('Login successful');
      expect(responseData.data).to.have.property('user');
      expect(responseData.data).to.have.property('token');
      expect(responseData.data.user.username).to.equal('testuser');
    });

    it('should return error when credentials are invalid', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock the userService properly
      userController.userService = {
        login: sinon.stub().rejects(new Error('Invalid credentials'))
      };

      // Mock validationResult
      const originalValidationResult = require('express-validator').validationResult;
      require('express-validator').validationResult = () => ({ isEmpty: () => true });

      // Act
      await userController.login(req, res);

      // Restore
      require('express-validator').validationResult = originalValidationResult;

      // Assert
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.error).to.equal('LOGIN_FAILED');
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange
      const userId = 1;
      const userProfile = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      req.user = { id: userId };
      
      // Mock the userService properly
      userController.userService = {
        getUserById: sinon.stub().resolves(userProfile)
      };

      // Act
      await userController.getProfile(req, res);

      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.equal('Profile retrieved successfully');
      expect(responseData.data.user).to.have.property('id', 1);
      expect(responseData.data.user).to.have.property('username', 'testuser');
      expect(responseData.data.user).to.have.property('email', 'test@example.com');
    });

    it('should return error when user is not found', async () => {
      // Arrange
      req.user = { id: 999 };
      
      // Mock the userService properly
      userController.userService = {
        getUserById: sinon.stub().rejects(new Error('User not found'))
      };

      // Act
      await userController.getProfile(req, res);

      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.error).to.equal('USER_NOT_FOUND');
    });
  });

  describe('getAllUsers', () => {
    it('should return list of users successfully', async () => {
      // Arrange
      const users = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ];

      // Mock the userService properly
      userController.userService = {
        getAllUsers: sinon.stub().resolves(users)
      };

      // Act
      await userController.getAllUsers(req, res);

      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.equal('Users retrieved successfully');
      expect(responseData.data.users).to.have.length(2);
      expect(responseData.data.count).to.equal(2);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
      // Arrange
      const userId = 1;
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };

      req.params = { id: '1' };
      
      // Mock the userService properly
      userController.userService = {
        getUserById: sinon.stub().resolves(user)
      };

      // Act
      await userController.getUserById(req, res);

      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.equal('User retrieved successfully');
      expect(responseData.data.user).to.have.property('id', 1);
      expect(responseData.data.user).to.have.property('username', 'testuser');
    });

    it('should return error when ID is invalid', async () => {
      // Arrange
      req.params = { id: 'invalid' };

      // Act
      await userController.getUserById(req, res);

      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.error).to.equal('INVALID_USER_ID');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 2;
      const deletedUser = { id: 2, username: 'user2', email: 'user2@example.com' };

      req.params = { id: '2' };
      req.user = { id: 1 }; // logged user different from the one being deleted
      
      // Mock the userService properly
      userController.userService = {
        deleteUser: sinon.stub().resolves(deletedUser)
      };

      // Act
      await userController.deleteUser(req, res);

      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.message).to.equal('User deleted successfully');
      expect(responseData.data.user).to.have.property('id', 2);
    });

    it('should return error when user tries to delete themselves', async () => {
      // Arrange
      req.params = { id: '1' };
      req.user = { id: 1 }; // same user

      // Act
      await userController.deleteUser(req, res);

      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseData = res.json.getCall(0).args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.error).to.equal('SELF_DELETE_NOT_ALLOWED');
    });
  });
});