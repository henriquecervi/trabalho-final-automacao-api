// Configurações da aplicação
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'seu-jwt-secret-aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001']
  }
};

module.exports = config;
