const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/models/Database');

describe('GraphQL Integration Tests', () => {
  let authToken;
  let userId;

  // Helper function to make GraphQL requests
  const graphqlRequest = async (query, variables = {}, token = null) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return request(app)
      .post('/graphql')
      .set(headers)
      .send({
        query,
        variables
      });
  };

  before(async () => {
    // Wait for GraphQL to initialize before running tests
    if (app.waitForGraphQL) {
      await app.waitForGraphQL();
    }
    // Small delay to ensure GraphQL is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

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

  describe('Queries', () => {
    describe('health', () => {
      it('should return health status', async () => {
        const query = `
          query {
            health
          }
        `;

        const response = await graphqlRequest(query);

        expect(response.status).to.equal(200);
        expect(response.body.data.health).to.equal('GraphQL API is running');
        expect(response.body.errors).to.be.undefined;
      });
    });

    describe('me', () => {
      it('should return current user profile when authenticated', async () => {
        const query = `
          query {
            me {
              id
              username
              email
              createdAt
            }
          }
        `;

        const response = await graphqlRequest(query, {}, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.me).to.have.property('id', userId.toString());
        expect(response.body.data.me).to.have.property('username', 'testuser');
        expect(response.body.data.me).to.have.property('email', 'test@example.com');
        expect(response.body.data.me).to.have.property('createdAt');
      });

      it('should return authentication error when not authenticated', async () => {
        const query = `
          query {
            me {
              id
              username
              email
            }
          }
        `;

        const response = await graphqlRequest(query);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Authentication required');
        expect(response.body.data.me).to.be.null;
      });
    });

    describe('users', () => {
      it('should return list of users when authenticated', async () => {
        // Create additional users
        await request(app)
          .post('/api/auth/register')
          .send({
            username: 'user2',
            email: 'user2@example.com',
            password: 'Password123'
          });

        const query = `
          query {
            users {
              id
              username
              email
              createdAt
            }
          }
        `;

        const response = await graphqlRequest(query, {}, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.users).to.be.an('array');
        expect(response.body.data.users).to.have.length(2);
        expect(response.body.data.users[0]).to.have.property('username');
        expect(response.body.data.users[0]).to.have.property('email');
      });

      it('should require authentication', async () => {
        const query = `
          query {
            users {
              id
              username
            }
          }
        `;

        const response = await graphqlRequest(query);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Authentication required');
      });
    });

    describe('user', () => {
      it('should return user by ID when authenticated', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              email
              createdAt
            }
          }
        `;

        const response = await graphqlRequest(query, { id: userId }, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.user).to.have.property('id', userId.toString());
        expect(response.body.data.user).to.have.property('username', 'testuser');
      });

      it('should return error for invalid user ID', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
            }
          }
        `;

        const response = await graphqlRequest(query, { id: 'invalid' }, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Invalid user ID');
      });

      it('should return error for non-existent user', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
            }
          }
        `;

        const response = await graphqlRequest(query, { id: '999' }, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('User not found');
      });
    });

    describe('stats', () => {
      it('should return application statistics when authenticated', async () => {
        const query = `
          query {
            stats {
              totalUsers
              timestamp
            }
          }
        `;

        const response = await graphqlRequest(query, {}, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.stats).to.have.property('totalUsers', 1);
        expect(response.body.data.stats).to.have.property('timestamp');
      });

      it('should require authentication', async () => {
        const query = `
          query {
            stats {
              totalUsers
            }
          }
        `;

        const response = await graphqlRequest(query);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Authentication required');
      });
    });
  });

  describe('Mutations', () => {
    describe('register', () => {
      it('should register a new user successfully', async () => {
        const mutation = `
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              user {
                id
                username
                email
                createdAt
              }
              token
            }
          }
        `;

        const variables = {
          input: {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'NewPassword123'
          }
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.register).to.have.property('user');
        expect(response.body.data.register).to.have.property('token');
        expect(response.body.data.register.user).to.have.property('username', 'newuser');
        expect(response.body.data.register.user).to.have.property('email', 'newuser@example.com');
        expect(response.body.data.register.token).to.be.a('string');
      });

      it('should return error for invalid input', async () => {
        const mutation = `
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              user {
                id
                username
              }
              token
            }
          }
        `;

        const variables = {
          input: {
            username: 'ab', // too short
            email: 'invalid-email',
            password: '123' // too short
          }
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.include('Invalid input');
      });

      it('should return error for duplicate email', async () => {
        const mutation = `
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              user {
                id
                username
              }
              token
            }
          }
        `;

        const variables = {
          input: {
            username: 'duplicate',
            email: 'test@example.com', // already exists
            password: 'Password123'
          }
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Email is already in use');
      });
    });

    describe('login', () => {
      it('should login user successfully', async () => {
        const mutation = `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              user {
                id
                username
                email
              }
              token
            }
          }
        `;

        const variables = {
          input: {
            email: 'test@example.com',
            password: 'Password123'
          }
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.login).to.have.property('user');
        expect(response.body.data.login).to.have.property('token');
        expect(response.body.data.login.user).to.have.property('email', 'test@example.com');
        expect(response.body.data.login.token).to.be.a('string');
      });

      it('should return error for invalid credentials', async () => {
        const mutation = `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              user {
                id
              }
              token
            }
          }
        `;

        const variables = {
          input: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Invalid credentials');
      });
    });

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const mutation = `
          mutation UpdateProfile($input: UpdateProfileInput!) {
            updateProfile(input: $input) {
              id
              username
              email
              createdAt
            }
          }
        `;

        const variables = {
          input: {
            username: 'updateduser'
          }
        };

        const response = await graphqlRequest(mutation, variables, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.updateProfile).to.have.property('username', 'updateduser');
        expect(response.body.data.updateProfile).to.have.property('email', 'test@example.com'); // unchanged
      });

      it('should require authentication', async () => {
        const mutation = `
          mutation UpdateProfile($input: UpdateProfileInput!) {
            updateProfile(input: $input) {
              id
              username
            }
          }
        `;

        const variables = {
          input: {
            username: 'newname'
          }
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Authentication required');
      });

      it('should return error for invalid input', async () => {
        const mutation = `
          mutation UpdateProfile($input: UpdateProfileInput!) {
            updateProfile(input: $input) {
              id
              username
            }
          }
        `;

        const variables = {
          input: {
            username: 'ab' // too short
          }
        };

        const response = await graphqlRequest(mutation, variables, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.include('Invalid input');
      });
    });

    describe('deleteUser', () => {
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
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
              id
              username
              email
            }
          }
        `;

        const variables = {
          id: secondUserId
        };

        const response = await graphqlRequest(mutation, variables, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.undefined;
        expect(response.body.data.deleteUser).to.have.property('id', secondUserId.toString());
        expect(response.body.data.deleteUser).to.have.property('username', 'seconduser');
      });

      it('should prevent self-deletion', async () => {
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
              id
              username
            }
          }
        `;

        const variables = {
          id: userId
        };

        const response = await graphqlRequest(mutation, variables, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Cannot delete your own account');
      });

      it('should require authentication', async () => {
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
              id
            }
          }
        `;

        const variables = {
          id: secondUserId
        };

        const response = await graphqlRequest(mutation, variables);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Authentication required');
      });

      it('should return error for invalid user ID', async () => {
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
              id
            }
          }
        `;

        const variables = {
          id: 'invalid'
        };

        const response = await graphqlRequest(mutation, variables, authToken);

        expect(response.status).to.equal(200);
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors[0].message).to.equal('Invalid user ID');
      });
    });
  });
});
