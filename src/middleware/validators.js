const { body } = require('express-validator');

// Validations for user registration
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must contain only letters, numbers and underscore'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Email must have a valid format')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter and one number')
];

// Validations for login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email must have a valid format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validations for profile update
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must contain only letters, numbers and underscore'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email must have a valid format')
    .normalizeEmail(),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter and one number')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile
};
