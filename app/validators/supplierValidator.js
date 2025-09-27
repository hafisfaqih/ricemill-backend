const Joi = require('joi');

// Validation schemas for Supplier
const supplierSchemas = {
  // Schema for creating a new supplier
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(255)
      .trim()
      .required()
      .messages({
        'string.empty': 'Supplier name is required',
        'string.min': 'Supplier name must be at least 2 characters long',
        'string.max': 'Supplier name cannot exceed 255 characters',
        'any.required': 'Supplier name is required',
      }),
    
    contactPerson: Joi.string()
      .max(255)
      .trim()
      .allow('')
      .optional()
      .messages({
        'string.max': 'Contact person name cannot exceed 255 characters',
      }),
    
    phone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .allow('')
      .optional()
      .messages({
        'string.pattern.base': 'Phone number format is invalid',
      }),
    
    address: Joi.string()
      .allow('')
      .optional(),
    
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status must be either active or inactive',
      }),
  }),

  // Schema for updating an existing supplier
  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(255)
      .trim()
      .optional()
      .messages({
        'string.empty': 'Supplier name cannot be empty',
        'string.min': 'Supplier name must be at least 2 characters long',
        'string.max': 'Supplier name cannot exceed 255 characters',
      }),
    
    contactPerson: Joi.string()
      .max(255)
      .trim()
      .allow('')
      .optional()
      .messages({
        'string.max': 'Contact person name cannot exceed 255 characters',
      }),
    
    phone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .allow('')
      .optional()
      .messages({
        'string.pattern.base': 'Phone number format is invalid',
      }),
    
    address: Joi.string()
      .allow('')
      .optional(),
    
    status: Joi.string()
      .valid('active', 'inactive')
      .optional()
      .messages({
        'any.only': 'Status must be either active or inactive',
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
    
    search: Joi.string()
      .max(255)
      .trim()
      .allow('')
      .optional()
      .messages({
        'string.max': 'Search term cannot exceed 255 characters',
      }),
    
    status: Joi.string()
      .valid('active', 'inactive', 'all')
      .default('all')
      .messages({
        'any.only': 'Status filter must be active, inactive, or all',
      }),
  }),

  // Schema for ID parameter
  id: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Supplier ID must be a number',
        'number.integer': 'Supplier ID must be an integer',
        'number.positive': 'Supplier ID must be positive',
        'any.required': 'Supplier ID is required',
      }),
  }),
};

// Validation middleware factory
const validateSupplier = (schema) => {
  return (req, res, next) => {
    let dataToValidate;
    
    switch (schema) {
      case 'create':
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

    const { error, value } = supplierSchemas[schema].validate(dataToValidate, {
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
      case 'create':
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
  supplierSchemas,
  validateSupplier,
};