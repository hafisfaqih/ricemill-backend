const Joi = require('joi');

// Validation schemas for User
const userSchemas = {
  // Schema for registering a new user
  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(255)
      .trim()
      .required()
      .messages({
        'string.empty': 'Username is required',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 255 characters',
        'any.required': 'Username is required',
      }),
    
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 100 characters',
        'any.required': 'Password is required',
      }),
    
    role: Joi.string()
      .valid('admin', 'manager')
      .default('manager')
      .messages({
        'any.only': 'Role must be either admin or manager',
      }),
  }),

  // Schema for user login
  login: Joi.object({
    username: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Username is required',
        'any.required': 'Username is required',
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
      }),
  }),

  // Schema for updating user profile
  update: Joi.object({
    username: Joi.string()
      .min(3)
      .max(255)
      .trim()
      .optional()
      .messages({
        'string.empty': 'Username cannot be empty',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 255 characters',
      }),
    
    password: Joi.string()
      .min(6)
      .max(100)
      .optional()
      .messages({
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 100 characters',
      }),
    
    role: Joi.string()
      .valid('admin', 'manager')
      .optional()
      .messages({
        'any.only': 'Role must be either admin or manager',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  // Schema for query parameters
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    
    role: Joi.string()
      .valid('admin', 'manager', 'all')
      .default('all')
      .messages({
        'any.only': 'Role filter must be admin, manager, or all',
      }),
  }),

  // Schema for ID parameter
  id: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
  }),
};

// Validation middleware factory
const validateUser = (schema) => {
  return (req, res, next) => {
    let dataToValidate;
    
    switch (schema) {
      case 'register':
      case 'login':
      case 'update':
        dataToValidate = req.body;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'id':
        dataToValidate = req.params;
        break;
      default:
        return res.status(500).json({
          success: false,
          message: 'Invalid validation schema',
        });
    }

    const { error, value } = userSchemas[schema].validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Assign validated and sanitized values back to request
    switch (schema) {
      case 'register':
      case 'login':
      case 'update':
        req.body = value;
        break;
      case 'query':
        req.query = value;
        break;
      case 'id':
        req.params = value;
        break;
    }

    next();
  };
};

module.exports = {
  userSchemas,
  validateUser,
};