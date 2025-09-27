const Joi = require('joi');

// Validation schema for creating a new invoice item
const validateInvoiceItemCreate = (data) => {
  const schema = Joi.object({
    invoice_id: Joi.number().integer().positive().required().messages({
      'number.base': 'Invoice ID must be a number',
      'number.integer': 'Invoice ID must be an integer',
      'number.positive': 'Invoice ID must be positive',
      'any.required': 'Invoice ID is required'
    }),
    name: Joi.string().trim().max(255).required().messages({
      'string.base': 'Item name must be a string',
      'string.empty': 'Item name cannot be empty',
      'string.max': 'Item name cannot exceed 255 characters',
      'any.required': 'Item name is required'
    }),
    quantity: Joi.number().integer().positive().required().messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required'
    }),
    price: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for updating an invoice item
const validateInvoiceItemUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().max(255).messages({
      'string.base': 'Item name must be a string',
      'string.empty': 'Item name cannot be empty',
      'string.max': 'Item name cannot exceed 255 characters'
    }),
    quantity: Joi.number().integer().positive().messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.positive': 'Quantity must be positive'
    }),
    price: Joi.number().positive().precision(2).messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive'
    })
  }).min(1); // At least one field must be provided for update

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for invoice item search/filter parameters
const validateInvoiceItemSearch = (data) => {
  const schema = Joi.object({
    // Invoice ID filter
    invoice_id: Joi.number().integer().positive().messages({
      'number.base': 'Invoice ID must be a number',
      'number.integer': 'Invoice ID must be an integer',
      'number.positive': 'Invoice ID must be positive'
    }),
    
    // Item name search
    name: Joi.string().trim().messages({
      'string.base': 'Item name must be a string'
    }),
    
    // Quantity filters
    minQuantity: Joi.number().integer().min(0).messages({
      'number.base': 'Minimum quantity must be a number',
      'number.integer': 'Minimum quantity must be an integer',
      'number.min': 'Minimum quantity cannot be negative'
    }),
    maxQuantity: Joi.number().integer().min(Joi.ref('minQuantity')).messages({
      'number.base': 'Maximum quantity must be a number',
      'number.integer': 'Maximum quantity must be an integer',
      'number.min': 'Maximum quantity must be greater than minimum quantity'
    }),
    
    // Price filters
    minPrice: Joi.number().min(0).precision(2).messages({
      'number.base': 'Minimum price must be a number',
      'number.min': 'Minimum price cannot be negative'
    }),
    maxPrice: Joi.number().min(Joi.ref('minPrice')).precision(2).messages({
      'number.base': 'Maximum price must be a number',
      'number.min': 'Maximum price must be greater than minimum price'
    }),
    
    // Total filters
    minTotal: Joi.number().min(0).precision(2).messages({
      'number.base': 'Minimum total must be a number',
      'number.min': 'Minimum total cannot be negative'
    }),
    maxTotal: Joi.number().min(Joi.ref('minTotal')).precision(2).messages({
      'number.base': 'Maximum total must be a number',
      'number.min': 'Maximum total must be greater than minimum total'
    }),
    
    // Pagination
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
    
    // Sorting
    sortBy: Joi.string().valid('name', 'quantity', 'price', 'total', 'created_at').default('created_at').messages({
      'any.only': 'Sort by must be one of: name, quantity, price, total, created_at'
    }),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC').messages({
      'any.only': 'Sort order must be ASC or DESC'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for bulk invoice items creation
const validateBulkInvoiceItemCreate = (data) => {
  const schema = Joi.object({
    invoice_id: Joi.number().integer().positive().required().messages({
      'number.base': 'Invoice ID must be a number',
      'number.integer': 'Invoice ID must be an integer',
      'number.positive': 'Invoice ID must be positive',
      'any.required': 'Invoice ID is required'
    }),
    items: Joi.array().min(1).max(50).items(
      Joi.object({
        name: Joi.string().trim().max(255).required().messages({
          'string.base': 'Item name must be a string',
          'string.empty': 'Item name cannot be empty',
          'string.max': 'Item name cannot exceed 255 characters',
          'any.required': 'Item name is required'
        }),
        quantity: Joi.number().integer().positive().required().messages({
          'number.base': 'Quantity must be a number',
          'number.integer': 'Quantity must be an integer',
          'number.positive': 'Quantity must be positive',
          'any.required': 'Quantity is required'
        }),
        price: Joi.number().positive().precision(2).required().messages({
          'number.base': 'Price must be a number',
          'number.positive': 'Price must be positive',
          'any.required': 'Price is required'
        })
      })
    ).required().messages({
      'array.base': 'Items must be an array',
      'array.min': 'At least one item is required',
      'array.max': 'Cannot exceed 50 items at once',
      'any.required': 'Items array is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  validateInvoiceItemCreate,
  validateInvoiceItemUpdate,
  validateInvoiceItemSearch,
  validateBulkInvoiceItemCreate
};