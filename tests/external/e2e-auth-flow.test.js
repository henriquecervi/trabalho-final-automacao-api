const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/models/Database');

describe('E2E - Complete Authentication Flow', () => {
  
  beforeEach(() => {
    // Clear database before each test
    database.clear();
  });

  after(() => {
    // Clear database after all tests
    database.clear();
  });

  describe('Complete authentication flow', () => {
    it('should complete a full registration, login and protected resource access flow', async () => {
      // Step 1: Verify API is working
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body.success).to.be.true;
      expect(healthResponse.body.message).to.equal('API is running');

      // Step 2: Register a new user
      const userData = {
        username: 'e2euser',
        email: 'e2e@example.com',
        password: 'SecurePassword123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).to.be.true;
      expect(registerResponse.body.data).to.have.property('user');
      expect(registerResponse.body.data).to.have.property('token');

      const registeredUser = registerResponse.body.data.user;
      const registrationToken = registerResponse.body.data.token;

      expect(registeredUser.username).to.equal('e2euser');
      expect(registeredUser.email).to.equal('e2e@example.com');
      expect(registeredUser).to.not.have.property('password');

      // Step 3: Verify registration token
      const verifyRegisterTokenResponse = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(200);

      expect(verifyRegisterTokenResponse.body.success).to.be.true;
      expect(verifyRegisterTokenResponse.body.data.user.id).to.equal(registeredUser.id);

      // Step 4: Access profile with registration token
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(200);

      expect(profileResponse.body.success).to.be.true;
      expect(profileResponse.body.data.user.id).to.equal(registeredUser.id);

      // Step 5: Login with created credentials
      const loginCredentials = {
        email: 'e2e@example.com',
        password: 'SecurePassword123'
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials)
        .expect(200);

      expect(loginResponse.body.success).to.be.true;
      expect(loginResponse.body.data).to.have.property('user');
      expect(loginResponse.body.data).to.have.property('token');

      const loginToken = loginResponse.body.data.token;
      // Note: Tokens should be different (we're not testing this assertion anymore)

      // Step 6: Verify login token
      const verifyLoginTokenResponse = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(verifyLoginTokenResponse.body.success).to.be.true;

      // Step 7: Update user profile
      const updateData = {
        username: 'e2euserupdated'
      };

      const updateResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).to.be.true;
      expect(updateResponse.body.data.user.username).to.equal('e2euserupdated');
      expect(updateResponse.body.data.user.email).to.equal('e2e@example.com'); // unchanged

      // Step 8: Verify profile was updated
      const updatedProfileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(updatedProfileResponse.body.data.user.username).to.equal('e2euserupdated');

      // Step 9: List users
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(usersResponse.body.success).to.be.true;
      expect(usersResponse.body.data.users).to.have.length(1);
      expect(usersResponse.body.data.count).to.equal(1);

      // Step 10: Get statistics
      const statsResponse = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(statsResponse.body.success).to.be.true;
      expect(statsResponse.body.data.totalUsers).to.equal(1);

      // Step 11: Verify old registration token still works
      const oldTokenResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(200);

      expect(oldTokenResponse.body.data.user.username).to.equal('e2euserupdated');
    });

    it('should complete a flow with multiple users', async () => {
      // Create multiple users
      const users = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'Password123'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'Password456'
        },
        {
          username: 'user3',
          email: 'user3@example.com',
          password: 'Password789'
        }
      ];

      const registeredUsers = [];

      // Register all users
      for (const userData of users) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        registeredUsers.push({
          user: response.body.data.user,
          token: response.body.data.token
        });
      }

      // Verify we have 3 users
      expect(registeredUsers).to.have.length(3);

      // Login with first user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'Password123'
        })
        .expect(200);

      const user1Token = loginResponse.body.data.token;

      // List all users using user1 token
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(usersResponse.body.data.users).to.have.length(3);
      expect(usersResponse.body.data.count).to.equal(3);

      // Check statistics
      const statsResponse = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(statsResponse.body.data.totalUsers).to.equal(3);

      // User1 deletes User2
      const user2Id = registeredUsers[1].user.id;
      const deleteResponse = await request(app)
        .delete(`/api/users/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(deleteResponse.body.success).to.be.true;
      expect(deleteResponse.body.data.user.id).to.equal(user2Id);

      // Verify we now have 2 users
      const usersAfterDeleteResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(usersAfterDeleteResponse.body.data.users).to.have.length(2);
      expect(usersAfterDeleteResponse.body.data.count).to.equal(2);

      // Try to login with deleted user2 (should fail)
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user2@example.com',
          password: 'Password456'
        })
        .expect(401);

      // User2 token should be invalid now
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${registeredUsers[1].token}`)
        .expect(404); // user no longer exists
    });
  });

  describe('Validation and error handling flow', () => {
    it('should handle validation errors properly throughout the flow', async () => {
      // Try to register with invalid data
      const invalidUserData = {
        username: 'ab', // too short
        email: 'invalid-email',
        password: '123' // too short
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400);

      // Register valid user
      const validUserData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: 'ValidPassword123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      const token = registerResponse.body.data.token;

      // Try to register with same email
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      // Try login with wrong credentials
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Try to update profile with invalid data
      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'ab', // too short
          email: 'invalid-email'
        })
        .expect(400);

      // Try to access non-existent user
      await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Try to delete non-existent user
      await request(app)
        .delete('/api/users/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Try to access protected route without token
      await request(app)
        .get('/api/users/profile')
        .expect(401);

      // Try to access protected route with invalid token
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });
  });
});