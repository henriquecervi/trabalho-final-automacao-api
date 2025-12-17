class User {
  constructor(id, username, email, password, createdAt = new Date()) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.createdAt = createdAt;
  }

  // Method to return user without password
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt
    };
  }

  // Basic data validation
  static validate(userData) {
    const errors = [];

    if (!userData.username || userData.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Email must have a valid format');
    }

    if (!userData.password || userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = User;
