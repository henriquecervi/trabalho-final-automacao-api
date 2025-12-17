/**
 * Faker Helper
 * 
 * Conceito: Faker
 * Geração de dados aleatórios usando a extensão K6 Faker (k6/x/faker)
 */

import { Faker } from "k6/x/faker";

// Cria instância do Faker
const faker = new Faker();

/**
 * Gera email aleatório usando K6 Faker
 */
export function randomEmail() {
  return faker.person.email();
}

/**
 * Gera username aleatório usando K6 Faker
 */
export function randomUsername() {
  return faker.person.namePrefixp();
}

/**
 * Gera senha aleatória forte usando K6 Faker
 */
export function randomPassword() {
  return faker.internet.password();
}

/**
 * Gera um usuário completo aleatório
 */
export function randomUser() {
  return {
    username: randomUsername(),
    email: randomEmail(),
    password: randomPassword(),
  };
}

/**
 * Gera nome completo aleatório usando K6 Faker
 */
export function randomFullName() {
  return faker.person.name();
}

/**
 * Seleciona elemento aleatório de um array
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gera dados de perfil para update
 */
export function randomProfileUpdate() {
  const updates = [
    { username: randomUsername() },
    { email: randomEmail() },
    { username: randomUsername(), email: randomEmail() },
  ];
  
  return randomChoice(updates);
}

/**
 * Gera timestamp único para garantir unicidade
 */
export function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`;
}

/**
 * Gera um array de usuários para Data-Driven Testing
 * Conceito: Data-Driven Testing com dados gerados dinamicamente pelo K6 Faker
 * 
 * @param {number} count - Quantidade de usuários a gerar
 * @returns {Array} Array de objetos de usuário
 */
export function generateTestUsers(count = 10) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      username: faker.internet.username(),
      email: faker.person.email(),
      password: faker.internet.password(),
    });
  }
  return users;
}

