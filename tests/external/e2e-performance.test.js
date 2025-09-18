const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/models/Database');

describe('E2E - Performance and Load Tests', () => {
  
  beforeEach(() => {
    // Clear database before each test
    database.clear();
  });

  after(() => {
    // Clear database after all tests
    database.clear();
  });

  describe('Basic performance tests', () => {
    it('should process multiple registrations quickly', async () => {
      const startTime = Date.now();
      const numberOfUsers = 50;
      const registrationPromises = [];

      // Create multiple users simultaneously
      for (let i = 1; i <= numberOfUsers; i++) {
        const userData = {
          username: `perfuser${i}`,
          email: `perfuser${i}@example.com`,
          password: 'Performance123'
        };

        registrationPromises.push(
          request(app)
            .post('/api/auth/register')
            .send(userData)
            .expect(201)
        );
      }

      const responses = await Promise.all(registrationPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all users were created
      expect(responses).to.have.length(numberOfUsers);
      responses.forEach((response, index) => {
        expect(response.body.success).to.be.true;
        expect(response.body.data.user.username).to.equal(`perfuser${index + 1}`);
      });

      // Verify performance (should complete in less than 10 seconds)
      expect(totalTime).to.be.lessThan(10000);
      console.log(`\n    ✓ Creation of ${numberOfUsers} users completed in ${totalTime}ms`);

      // Verify database
      const statsResponse = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${responses[0].body.data.token}`)
        .expect(200);

      expect(statsResponse.body.data.totalUsers).to.equal(numberOfUsers);
    });

    it('should process multiple logins simultaneously', async () => {
      // First, create some users
      const numberOfUsers = 20;
      const users = [];

      for (let i = 1; i <= numberOfUsers; i++) {
        const userData = {
          username: `loginuser${i}`,
          email: `loginuser${i}@example.com`,
          password: 'LoginTest123'
        };

        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        users.push({
          email: userData.email,
          password: userData.password
        });
      }

      // Now login with all simultaneously
      const startTime = Date.now();
      const loginPromises = users.map(user =>
        request(app)
          .post('/api/auth/login')
          .send(user)
          .expect(200)
      );

      const loginResponses = await Promise.all(loginPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all logins were successful
      expect(loginResponses).to.have.length(numberOfUsers);
      loginResponses.forEach(response => {
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('token');
      });

      // Verify performance (should complete in less than 5 seconds)
      expect(totalTime).to.be.lessThan(5000);
      console.log(`\n    ✓ Login of ${numberOfUsers} users completed in ${totalTime}ms`);
    });

    it('should handle simultaneous profile queries', async () => {
      // Create user
      const userData = {
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'ProfileTest123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.data.token;

      // Make multiple profile queries simultaneously
      const numberOfRequests = 30;
      const startTime = Date.now();

      const profilePromises = Array(numberOfRequests).fill().map(() =>
        request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
      );

      const profileResponses = await Promise.all(profilePromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all queries were successful
      expect(profileResponses).to.have.length(numberOfRequests);
      profileResponses.forEach(response => {
        expect(response.body.success).to.be.true;
        expect(response.body.data.user.username).to.equal('profileuser');
      });

      // Verify performance
      expect(totalTime).to.be.lessThan(3000);
      console.log(`\n    ✓ ${numberOfRequests} profile queries completed in ${totalTime}ms`);
    });
  });

  describe('API stress tests', () => {
    it('should maintain consistency during concurrent operations', async () => {
      // Create initial user
      const adminData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminTest123'
      };

      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      const adminToken = adminResponse.body.data.token;

      // Concurrent operations: create users, login, query stats
      const operations = [];

      // 10 registrations
      for (let i = 1; i <= 10; i++) {
        operations.push(
          request(app)
            .post('/api/auth/register')
            .send({
              username: `stressuser${i}`,
              email: `stress${i}@example.com`,
              password: 'StressTest123'
            })
        );
      }

      // 5 stats queries
      for (let i = 0; i < 5; i++) {
        operations.push(
          request(app)
            .get('/api/stats')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      // 5 user queries
      for (let i = 0; i < 5; i++) {
        operations.push(
          request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify most operations were successful
      const successfulOperations = results.filter(result => 
        result.status === 'fulfilled' && 
        (result.value.status === 200 || result.value.status === 201)
      );

      const successRate = (successfulOperations.length / results.length) * 100;
      expect(successRate).to.be.greaterThan(90); // At least 90% success

      console.log(`\n    ✓ ${results.length} concurrent operations: ${successRate.toFixed(1)}% success in ${totalTime}ms`);

      // Verify final consistency
      const finalStatsResponse = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should have at least admin + some created users
      expect(finalStatsResponse.body.data.totalUsers).to.be.greaterThan(0);
    });

    it('should respond within time limit for all routes', async () => {
      // Create user for testing
      const userData = {
        username: 'timeoutuser',
        email: 'timeout@example.com',
        password: 'TimeoutTest123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.data.token;
      const userId = registerResponse.body.data.user.id;

      // Test timeout for all main routes
      const timeoutTests = [
        {
          name: 'Health Check',
          request: request(app).get('/api/health'),
          timeout: 1000
        },
        {
          name: 'Login',
          request: request(app).post('/api/auth/login').send({
            email: 'timeout@example.com',
            password: 'TimeoutTest123'
          }),
          timeout: 2000
        },
        {
          name: 'Verify Token',
          request: request(app).post('/api/auth/verify-token').set('Authorization', `Bearer ${token}`),
          timeout: 1000
        },
        {
          name: 'Get Profile',
          request: request(app).get('/api/users/profile').set('Authorization', `Bearer ${token}`),
          timeout: 1000
        },
        {
          name: 'List Users',
          request: request(app).get('/api/users').set('Authorization', `Bearer ${token}`),
          timeout: 2000
        },
        {
          name: 'Get User by ID',
          request: request(app).get(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`),
          timeout: 1000
        },
        {
          name: 'Get Stats',
          request: request(app).get('/api/stats').set('Authorization', `Bearer ${token}`),
          timeout: 1000
        }
      ];

      for (const test of timeoutTests) {
        const startTime = Date.now();
        
        await test.request.expect((res) => {
          const responseTime = Date.now() - startTime;
          expect(responseTime).to.be.lessThan(test.timeout, 
            `${test.name} took ${responseTime}ms (limit: ${test.timeout}ms)`);
        });

        console.log(`\n    ✓ ${test.name}: ${Date.now() - startTime}ms`);
      }
    });
  });
});