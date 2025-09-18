const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Stats {
    totalUsers: Int!
    timestamp: String!
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User
    
    # Stats
    stats: Stats!
    
    # Health check
    health: String!
  }

  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    
    # User management
    updateProfile(input: UpdateProfileInput!): User!
    deleteUser(id: ID!): User!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    username: String
    email: String
  }
`;

module.exports = typeDefs;
