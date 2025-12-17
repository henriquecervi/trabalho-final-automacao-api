/**
 * K6 Test Configuration
 * 
 * Conceito: Variável de Ambiente
 * Este arquivo centraliza as configurações e utiliza variáveis de ambiente
 */

export const config = {
  // Base URL da API - usando variável de ambiente
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  
  // Configurações de thresholds
  thresholds: {
    // Conceito: Thresholds
    // Define limites aceitáveis de performance
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% das requisições < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.05'], // Taxa de erro < 5%
    checks: ['rate>0.95'], // 95% dos checks devem passar
    'http_req_duration{type:login}': ['p(95)<800'], // Login específico
    'http_req_duration{type:profile}': ['p(95)<400'], // Profile específico
  },
  
  // Conceito: Stages
  // Define diferentes estágios de carga durante o teste
  stages: [
    { duration: '10s', target: 1 },
    { duration: '20s', target: 2 },
  ],
  
  // Configurações de execução
  vus: 1, // Virtual Users default
  duration: '10s', // Duração total alternativa
  
  // Tags customizadas
  tags: {
    testType: 'performance',
    environment: __ENV.ENVIRONMENT || 'local',
  },
};

export default config;

