/**
 * API Helper Functions
 * 
 * Conceito: Helpers
 * Funções reutilizáveis para facilitar a escrita dos testes
 */

import http from 'k6/http';
import { check } from 'k6';

/**
 * Helper para fazer registro de usuário
 */
export function registerUser(baseUrl, userData) {
  const url = `${baseUrl}/api/auth/register`;
  const payload = JSON.stringify(userData);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'register' },
  };
  
  return http.post(url, payload, params);
}

/**
 * Helper para fazer login
 * Retorna o token JWT para uso posterior
 */
export function loginUser(baseUrl, credentials) {
  const url = `${baseUrl}/api/auth/login`;
  const payload = JSON.stringify(credentials);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'login', type: 'login' }, // Tags para métricas específicas
  };
  
  const response = http.post(url, payload, params);
  
  // Conceito: Checks
  // Validações para garantir que a resposta está correta
  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.token !== undefined;
    },
    'login response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  return response;
}

/**
 * Helper para obter perfil do usuário autenticado
 */
export function getProfile(baseUrl, token) {
  const url = `${baseUrl}/api/users/profile`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'getProfile', type: 'profile' },
  };
  
  return http.get(url, params);
}

/**
 * Helper para atualizar perfil do usuário
 */
export function updateProfile(baseUrl, token, updateData) {
  const url = `${baseUrl}/api/users/profile`;
  const payload = JSON.stringify(updateData);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'updateProfile', type: 'update' },
  };
  
  return http.put(url, payload, params);
}

/**
 * Helper para listar todos os usuários
 */
export function getAllUsers(baseUrl, token) {
  const url = `${baseUrl}/api/users`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'getAllUsers', type: 'list' },
  };
  
  return http.get(url, params);
}

/**
 * Helper para obter usuário por ID
 */
export function getUserById(baseUrl, token, userId) {
  const url = `${baseUrl}/api/users/${userId}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'getUserById', type: 'get' },
  };
  
  return http.get(url, params);
}

/**
 * Helper para deletar usuário
 */
export function deleteUser(baseUrl, token, userId) {
  const url = `${baseUrl}/api/users/${userId}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'deleteUser', type: 'delete' },
  };
  
  return http.del(url, params);
}

/**
 * Helper para verificar token
 */
export function verifyToken(baseUrl, token) {
  const url = `${baseUrl}/api/auth/verify-token`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'verifyToken', type: 'verify' },
  };
  
  return http.post(url, null, params);
}

/**
 * Helper para obter estatísticas (endpoint protegido)
 */
export function getStats(baseUrl, token) {
  const url = `${baseUrl}/api/stats`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { name: 'getStats', type: 'stats' },
  };
  
  return http.get(url, params);
}

/**
 * Helper para health check
 */
export function healthCheck(baseUrl) {
  const url = `${baseUrl}/api/health`;
  const params = {
    tags: { name: 'healthCheck', type: 'health' },
  };
  
  return http.get(url, params);
}

