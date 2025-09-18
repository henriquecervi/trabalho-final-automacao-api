// Simulação de banco de dados em memória
class InMemoryDatabase {
  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  // Gerar próximo ID
  getNextId() {
    return this.currentId++;
  }

  // Salvar usuário
  saveUser(user) {
    this.users.set(user.id, user);
    return user;
  }

  // Buscar usuário por ID
  findUserById(id) {
    return this.users.get(id) || null;
  }

  // Buscar usuário por email
  findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  // Buscar usuário por username
  findUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  // Listar todos os usuários
  getAllUsers() {
    return Array.from(this.users.values());
  }

  // Remover usuário
  deleteUser(id) {
    return this.users.delete(id);
  }

  // Limpar banco (útil para testes)
  clear() {
    this.users.clear();
    this.currentId = 1;
  }

  // Obter quantidade de usuários
  getUserCount() {
    return this.users.size;
  }
}

// Instância singleton do banco
const database = new InMemoryDatabase();

module.exports = database;
