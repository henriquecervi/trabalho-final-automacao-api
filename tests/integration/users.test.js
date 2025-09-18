const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/models/Database');

describe('Users Integration Tests', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Clear database before each test
    database.clear();

    // Register user and get token for authentication
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  after(() => {
    // Clear database after all tests
    database.clear();
  });

  describe('GET /api/users/profile', () => {
    it('should return authenticated user profile', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Profile retrieved successfully');
      expect(response.body.data).to.have.property('user');
      
      const { user } = response.body.data;
      expect(user.id).to.equal(userId);
      expect(user.username).to.equal('testuser');
      expect(user.email).to.equal('test@example.com');
      expect(user).to.not.have.property('password');
    });

    it('should reject access without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Access token required');
      expect(response.body.error).to.equal('UNAUTHORIZED');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const updateData = {
        username: 'updateduser'
      };

      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Profile updated successfully');
      expect(response.body.data).to.have.property('user');
      
      const { user } = response.body.data;
      expect(user.username).to.equal('updateduser');
      expect(user.email).to.equal('test@example.com'); // unchanged
    });

    it('should update user email', async () => {
      // Arrange
      const updateData = {
        email: 'newemail@example.com'
      };

      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      const { user } = response.body.data;
      expect(user.email).to.equal('newemail@example.com');
      expect(user.username).to.equal('testuser'); // unchanged
    });

    it('should reject update with invalid data', async () => {
      // Arrange
      const updateData = {
        username: 'ab', // too short
        email: 'invalid-email'
      };

      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid input data');
      expect(response.body.errors).to.be.an('array');
    });

    it('should reject update to existing email', async () => {
      // Arrange - create second user
      const secondUserData = {
        username: 'seconduser',
        email: 'second@example.com',
        password: 'Password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(secondUserData);

      // Try to update to second user's email
      const updateData = {
        email: 'second@example.com'
      };

      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Email is already in use');
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create additional users for testing
      const users = [
        { username: 'user2', email: 'user2@example.com', password: 'Password123' },
        { username: 'user3', email: 'user3@example.com', password: 'Password123' }
      ];

      for (const userData of users) {
        await request(app)
          .post('/api/auth/register')
          .send(userData);
      }
    });

    it('should list all users', async () => {
      // Act
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Users retrieved successfully');
      expect(response.body.data).to.have.property('users');
      expect(response.body.data).to.have.property('count');
      
      const { users, count } = response.body.data;
      expect(users).to.be.an('array');
      expect(count).to.equal(3); // testuser + user2 + user3
      expect(users[0]).to.not.have.property('password');
    });

    it('should reject access without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.equal('UNAUTHORIZED');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by valid ID', async () => {
      // Act
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('User retrieved successfully');
      expect(response.body.data).to.have.property('user');
      
      const { user } = response.body.data;
      expect(user.id).to.equal(userId);
      expect(user.username).to.equal('testuser');
      expect(user).to.not.have.property('password');
    });

    it('should return error for invalid ID', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('User ID must be a valid number');
      expect(response.body.error).to.equal('INVALID_USER_ID');
    });

    it('should return error for user not found', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.equal('USER_NOT_FOUND');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let secondUserId;

    beforeEach(async () => {
      // Create second user for deletion testing
      const secondUserData = {
        username: 'seconduser',
        email: 'second@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(secondUserData);

      secondUserId = response.body.data.user.id;
    });

    it('should delete user successfully', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/users/${secondUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('User deleted successfully');
      expect(response.body.data).to.have.property('user');
      
      const { user } = response.body.data;
      expect(user.id).to.equal(secondUserId);
      expect(user.username).to.equal('seconduser');

      // Verify user was actually deleted
      await request(app)
        .get(`/api/users/${secondUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject self-deletion attempt', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Cannot delete your own user account');
      expect(response.body.error).to.equal('SELF_DELETE_NOT_ALLOWED');
    });

    it('should return error for invalid ID', async () => {
      // Act
      const response = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.equal('INVALID_USER_ID');
    });
  });

  describe('GET /api/stats', () => {
    beforeEach(async () => {
      // Create additional users for statistics
      const users = [
        { username: 'statsuser1', email: 'stats1@example.com', password: 'Password123' },
        { username: 'statsuser2', email: 'stats2@example.com', password: 'Password123' }
      ];

      for (const userData of users) {
        await request(app)
          .post('/api/auth/register')
          .send(userData);
      }
    });

    it('should return application statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Statistics retrieved successfully');
      expect(response.body.data).to.have.property('totalUsers');
      expect(response.body.data).to.have.property('timestamp');
      
      expect(response.body.data.totalUsers).to.equal(3); // testuser + statsuser1 + statsuser2
      expect(response.body.data.timestamp).to.be.a('string');
    });

    it('should reject access without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/stats')
        .expect(401);

      // Assert
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.equal('UNAUTHORIZED');
    });
  });
});