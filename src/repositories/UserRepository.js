const database = require('../models/Database');
const User = require('../models/User');

class UserRepository {
  
  // Criar novo usuário
  async create(userData) {
    try {
      const id = database.getNextId();
      const user = new User(
        id,
        userData.username,
        userData.email,
        userData.password
      );
      
      return database.saveUser(user);
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
  }

  // Buscar usuário por ID
  async findById(id) {
    try {
      return database.findUserById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por ID: ${error.message}`);
    }
  }

  // Buscar usuário por email
  async findByEmail(email) {
    try {
      return database.findUserByEmail(email);
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  // Buscar usuário por username
  async findByUsername(username) {
    try {
      return database.findUserByUsername(username);
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por username: ${error.message}`);
    }
  }

  // Verificar se email já existe
  async emailExists(email) {
    try {
      const user = await this.findByEmail(email);
      return user !== null;
    } catch (error) {
      throw new Error(`Erro ao verificar email: ${error.message}`);
    }
  }

  // Verificar se username já existe
  async usernameExists(username) {
    try {
      const user = await this.findByUsername(username);
      return user !== null;
    } catch (error) {
      throw new Error(`Erro ao verificar username: ${error.message}`);
    }
  }

  // Listar todos os usuários
  async findAll() {
    try {
      return database.getAllUsers();
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  // Atualizar usuário
  async update(id, userData) {
    try {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new Error('Usuário não encontrado');
      }

      const updatedUser = new User(
        id,
        userData.username || existingUser.username,
        userData.email || existingUser.email,
        userData.password || existingUser.password,
        existingUser.createdAt
      );

      return database.saveUser(updatedUser);
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  // Remover usuário
  async delete(id) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const deleted = database.deleteUser(id);
      return deleted ? user : null;
    } catch (error) {
      throw new Error(`Erro ao remover usuário: ${error.message}`);
    }
  }

  // Obter contagem de usuários
  async count() {
    try {
      return database.getUserCount();
    } catch (error) {
      throw new Error(`Erro ao contar usuários: ${error.message}`);
    }
  }

  // Limpar todos os usuários (útil para testes)
  async clear() {
    try {
      database.clear();
      return true;
    } catch (error) {
      throw new Error(`Erro ao limpar usuários: ${error.message}`);
    }
  }
}

module.exports = UserRepository;
