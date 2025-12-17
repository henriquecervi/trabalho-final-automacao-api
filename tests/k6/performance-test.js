/**
 * K6 Performance Test - API REST de Autenticação
 * 
 * Este teste implementa todos os conceitos solicitados:
 * - Thresholds
 * - Checks
 * - Helpers
 * - Trends
 * - Faker
 * - Variável de Ambiente
 * - Stages
 * - Reaproveitamento de Resposta
 * - Uso de Token de Autenticação
 * - Data-Driven Testing
 * - Groups
 */

import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';

// Importa configurações e helpers
import { config } from './config.js';
import * as api from './helpers/api.js';
import * as faker from './helpers/faker.js';

// Conceito: Data-Driven Testing
// Gera dados de teste usando Faker (ao invés de arquivo estático)
const testUsers = faker.generateTestUsers(10);

// Conceito: Trends
// Métricas customizadas para análise detalhada
const loginDuration = new Trend('login_duration', true);
const profileDuration = new Trend('profile_duration', true);
const updateDuration = new Trend('update_duration', true);
const listUsersDuration = new Trend('list_users_duration', true);

// Rate metrics
const successfulLogins = new Rate('successful_logins');
const successfulProfileAccess = new Rate('successful_profile_access');

// Counter metrics
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

// Conceito: Thresholds
// Exporta opções com thresholds definidos no config
export const options = {
  stages: config.stages,
  thresholds: config.thresholds,
  tags: config.tags,
  
  // Configuração adicional para relatório HTML
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

/**
 * Setup: Executado uma vez antes dos testes
 * Prepara o ambiente criando usuários de teste
 */
export function setup() {
  console.log('🚀 Starting K6 Performance Test Setup...');
  console.log(`📍 Base URL: ${config.baseUrl}`);
  console.log(`🌍 Environment: ${config.tags.environment}`);
  
  // Cria alguns usuários para testes posteriores
  const setupUsers = [];
  
  for (let i = 0; i < 1; i++) {
    const user = faker.randomUser();
    const response = api.registerUser(config.baseUrl, user);
    
    if (response.status === 201) {
      const body = JSON.parse(response.body);
      setupUsers.push({
        ...user,
        id: body.data.user.id,
        token: body.data.token,
      });
      console.log(`✅ Setup user created: ${user.username}`);
    }
  }
  
  return { setupUsers, baseUrl: config.baseUrl };
}

/**
 * Função principal do teste
 * Executada por cada Virtual User em cada iteração
 */
export default function (data) {
  const { baseUrl } = data;
  
  // Conceito: Data-Driven Testing
  // Seleciona um usuário aleatório dos dados gerados pelo Faker
  const userData = faker.randomChoice(testUsers);
  
  // Variável para armazenar o token (Reaproveitamento de Resposta)
  let authToken = null;
  let userId = null;
  
  // Conceito: Groups
  // Organiza os testes em grupos lógicos
  
  // ==================== GRUPO 1: AUTENTICAÇÃO ====================
  group('01 - Authentication Flow', function () {
    
    // Subgrupo: Registro
    group('Register New User', function () {
      // Gera dados aleatórios com Faker
      const newUser = {
        username: `${userData.username}_${faker.uniqueId()}`,
        email: `${faker.uniqueId()}_${userData.email}`,
        password: userData.password,
      };
      
      const registerResponse = api.registerUser(baseUrl, newUser);
      totalRequests.add(1);
      
      // Conceito: Checks
      // Valida a resposta do registro
      const registerCheck = check(registerResponse, {
        'register: status is 201': (r) => r.status === 201,
        'register: has success field': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true;
          } catch (e) {
            return false;
          }
        },
        'register: returns user data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.user && body.data.user.id;
          } catch (e) {
            return false;
          }
        },
        'register: returns token': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.token;
          } catch (e) {
            return false;
          }
        },
        'register: response time < 1000ms': (r) => r.timings.duration < 1000,
      });
      
      if (!registerCheck) {
        failedRequests.add(1);
      }
      
      // Conceito: Reaproveitamento de Resposta
      // Extrai o token para usar nas próximas requisições
      if (registerResponse.status === 201) {
        const body = JSON.parse(registerResponse.body);
        authToken = body.data.token;
        userId = body.data.user.id;
      }
    });
    
    sleep(1);
    
    // Subgrupo: Login
    group('User Login', function () {
      // Se não temos token do registro, faz login com usuário existente
      if (!authToken) {
        const credentials = {
          email: userData.email,
          password: userData.password,
        };
        
        const loginResponse = api.loginUser(baseUrl, credentials);
        totalRequests.add(1);
        
        // Conceito: Trends
        // Registra a duração do login para análise
        loginDuration.add(loginResponse.timings.duration);
        
        const loginCheck = check(loginResponse, {
          'login: status is 200': (r) => r.status === 200,
          'login: has token': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.data && body.data.token;
            } catch (e) {
              return false;
            }
          },
          'login: returns user info': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.data && body.data.user && body.data.user.email;
            } catch (e) {
              return false;
            }
          },
          'login: response time < 800ms': (r) => r.timings.duration < 800,
        });
        
        successfulLogins.add(loginCheck);
        
        if (!loginCheck) {
          failedRequests.add(1);
        }
        
        // Reaproveitamento de Resposta
        if (loginResponse.status === 200) {
          const body = JSON.parse(loginResponse.body);
          authToken = body.data.token;
          userId = body.data.user.id;
        }
      }
    });
  });
  
  sleep(1);
  
  // ==================== GRUPO 2: OPERAÇÕES DE PERFIL ====================
  group('02 - Profile Operations', function () {
    
    // Conceito: Uso de Token de Autenticação
    // Todas as requisições abaixo usam o token obtido anteriormente
    
    if (!authToken) {
      console.log('⚠️  No auth token available, skipping profile operations');
      return;
    }
    
    // Subgrupo: Obter Perfil
    group('Get User Profile', function () {
      const profileResponse = api.getProfile(baseUrl, authToken);
      totalRequests.add(1);
      
      // Registra métrica customizada
      profileDuration.add(profileResponse.timings.duration);
      
      const profileCheck = check(profileResponse, {
        'profile: status is 200': (r) => r.status === 200,
        'profile: has user data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.user;
          } catch (e) {
            return false;
          }
        },
        'profile: response time < 400ms': (r) => r.timings.duration < 400,
      });
      
      successfulProfileAccess.add(profileCheck);
      
      if (!profileCheck) {
        failedRequests.add(1);
      }
    });
    
    sleep(0.5);
    
    // Subgrupo: Atualizar Perfil
    group('Update User Profile', function () {
      const updateData = faker.randomProfileUpdate();
      
      // Garante que username e email sejam únicos
      if (updateData.username) {
        updateData.username = `${updateData.username}_${faker.uniqueId()}`;
      }
      if (updateData.email) {
        updateData.email = `${faker.uniqueId()}_${updateData.email}`;
      }
      
      const updateResponse = api.updateProfile(baseUrl, authToken, updateData);
      totalRequests.add(1);
      
      updateDuration.add(updateResponse.timings.duration);
      
      const updateCheck = check(updateResponse, {
        'update: status is 200': (r) => r.status === 200,
        'update: profile updated': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true;
          } catch (e) {
            return false;
          }
        },
        'update: response time < 600ms': (r) => r.timings.duration < 600,
      });
      
      if (!updateCheck) {
        failedRequests.add(1);
      }
    });
    
    sleep(0.5);
    
    // Subgrupo: Verificar Token
    group('Verify Token', function () {
      const verifyResponse = api.verifyToken(baseUrl, authToken);
      totalRequests.add(1);
      
      check(verifyResponse, {
        'verify: status is 200': (r) => r.status === 200,
        'verify: token is valid': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true;
          } catch (e) {
            return false;
          }
        },
      });
    });
  });
  
  sleep(1);
  
  // ==================== GRUPO 3: OPERAÇÕES DE USUÁRIOS ====================
  group('03 - User Operations', function () {
    
    if (!authToken) {
      console.log('⚠️  No auth token available, skipping user operations');
      return;
    }
    
    // Subgrupo: Listar Usuários
    group('List All Users', function () {
      const listResponse = api.getAllUsers(baseUrl, authToken);
      totalRequests.add(1);
      
      listUsersDuration.add(listResponse.timings.duration);
      
      const listCheck = check(listResponse, {
        'list: status is 200': (r) => r.status === 200,
        'list: returns users array': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && Array.isArray(body.data.users);
          } catch (e) {
            return false;
          }
        },
        'list: has count field': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && typeof body.data.count === 'number';
          } catch (e) {
            return false;
          }
        },
        'list: response time < 500ms': (r) => r.timings.duration < 500,
      });
      
      if (!listCheck) {
        failedRequests.add(1);
      }
    });
    
    sleep(0.5);
    
    // Subgrupo: Buscar Usuário por ID
    group('Get User By ID', function () {
      if (userId) {
        const getUserResponse = api.getUserById(baseUrl, authToken, userId);
        totalRequests.add(1);
        
        check(getUserResponse, {
          'getById: status is 200': (r) => r.status === 200,
          'getById: returns user': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.data && body.data.user;
            } catch (e) {
              return false;
            }
          },
        });
      }
    });
  });
  
  sleep(1);
  
  // ==================== GRUPO 4: ESTATÍSTICAS ====================
  group('04 - System Statistics', function () {
    
    if (!authToken) {
      console.log('⚠️  No auth token available, skipping stats');
      return;
    }
    
    group('Get API Stats', function () {
      const statsResponse = api.getStats(baseUrl, authToken);
      totalRequests.add(1);
      
      check(statsResponse, {
        'stats: status is 200': (r) => r.status === 200,
        'stats: returns data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data !== undefined;
          } catch (e) {
            return false;
          }
        },
        'stats: response time < 300ms': (r) => r.timings.duration < 300,
      });
    });
  });
  
  sleep(1);
}

/**
 * Teardown: Executado uma vez após todos os testes
 * Limpa recursos se necessário
 */
export function teardown(data) {
  console.log('🏁 K6 Performance Test Completed!');
  console.log(`📊 Check the HTML report for detailed results`);
}

/**
 * Geração de Relatório HTML
 * Cria um relatório visual com todos os resultados
 */
export function handleSummary(data) {
  return {
    'reports/k6-performance-report.html': htmlReport(data),
    'reports/k6-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

