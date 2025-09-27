const Joi = require('joi');

// Validation schema for creating a new invoice
const validateInvoiceCreate = (data) => {
  const schema = Joi.object({
    invoice_number: Joi.string().trim().max(50).required().messages({
      'string.base': 'Invoice number must be a string',
      'string.empty': 'Invoice number cannot be empty',
      'string.max': 'Invoice number cannot exceed 50 characters',
      'any.required': 'Invoice number is required'
    }),
    date: Joi.date().iso().required().messages({
      'date.base': 'Date must be a valid date',
      'date.format': 'Date must be in ISO format',
      'any.required': 'Date is required'
    }),
    customer: Joi.string().trim().max(255).required().messages({
      'string.base': 'Customer must be a string',
      'string.empty': 'Customer cannot be empty',
      'string.max': 'Customer cannot exceed 255 characters',
      'any.required': 'Customer is required'
    }),
    amount: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
    due_date: Joi.date().iso().min(Joi.ref('date')).required().messages({
      'date.base': 'Due date must be a valid date',
      'date.format': 'Due date must be in ISO format',
      'date.min': 'Due date must be after invoice date',
      'any.required': 'Due date is required'
    }),
    status: Joi.string().valid('paid', 'unpaid').default('unpaid').messages({
      'any.only': 'Status must be either paid or unpaid'
    }),
    // Invoice items (optional for creation, can be added separately)
    items: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().max(255).required().messages({
          'string.base': 'Item name must be a string',
          'string.empty': 'Item name cannot be empty',
          'string.max': 'Item name cannot exceed 255 characters',
          'any.required': 'Item name is required'
        }),
        quantity: Joi.number().integer().positive().required().messages({
          'number.base': 'Item quantity must be a number',
          'number.integer': 'Item quantity must be an integer',
          'number.positive': 'Item quantity must be positive',
          'any.required': 'Item quantity is required'
        }),
        price: Joi.number().positive().precision(2).required().messages({
          'number.base': 'Item price must be a number',
          'number.positive': 'Item price must be positive',
          'any.required': 'Item price is required'
        })
      })
    ).messages({
      'array.base': 'Items must be an array'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for updating an invoice
const validateInvoiceUpdate = (data) => {
  const schema = Joi.object({
    invoice_number: Joi.string().trim().max(50).messages({
      'string.base': 'Invoice number must be a string',
      'string.empty': 'Invoice number cannot be empty',
      'string.max': 'Invoice number cannot exceed 50 characters'
    }),
    date: Joi.date().iso().messages({
      'date.base': 'Date must be a valid date',
      'date.format': 'Date must be in ISO format'
    }),
    customer: Joi.string().trim().max(255).messages({
      'string.base': 'Customer must be a string',
      'string.empty': 'Customer cannot be empty',
      'string.max': 'Customer cannot exceed 255 characters'
    }),
    amount: Joi.number().positive().precision(2).messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive'
    }),
    due_date: Joi.date().iso().when('date', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('date')),
      otherwise: Joi.date()
    }).messages({
      'date.base': 'Due date must be a valid date',
      'date.format': 'Due date must be in ISO format',
      'date.min': 'Due date must be after invoice date'
    }),
    status: Joi.string().valid('paid', 'unpaid').messages({
      'any.only': 'Status must be either paid or unpaid'
    })
  }).min(1); // At least one field must be provided for update

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for invoice search/filter parameters
const validateInvoiceSearch = (data) => {
  const schema = Joi.object({
    // Invoice number search
    invoice_number: Joi.string().trim().messages({
      'string.base': 'Invoice number must be a string'
    }),
    
    // Customer search
    customer: Joi.string().trim().messages({
      'string.base': 'Customer must be a string'
    }),
    
    // Date range filters
    startDate: Joi.date().iso().messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
    
    // Due date range filters
    startDueDate: Joi.date().iso().messages({
      'date.base': 'Start due date must be a valid date',
      'date.format': 'Start due date must be in ISO format'
    }),
    endDueDate: Joi.date().iso().min(Joi.ref('startDueDate')).messages({
      'date.base': 'End due date must be a valid date',
      'date.format': 'End due date must be in ISO format',
      'date.min': 'End due date must be after start due date'
    }),
    
    // Amount filters
    minAmount: Joi.number().min(0).precision(2).messages({
      'number.base': 'Minimum amount must be a number',
      'number.min': 'Minimum amount cannot be negative'
    }),
    maxAmount: Joi.number().min(Joi.ref('minAmount')).precision(2).messages({
      'number.base': 'Maximum amount must be a number',
      'number.min': 'Maximum amount must be greater than minimum amount'
    }),
    
    // Status filter
    status: Joi.string().valid('paid', 'unpaid').messages({
      'any.only': 'Status must be either paid or unpaid'
    }),
    
    // Aging filters (for overdue invoices)
    overdue: Joi.boolean().messages({
      'boolean.base': 'Overdue must be a boolean'
    }),
    maxDaysOverdue: Joi.number().integer().min(0).messages({
      'number.base': 'Max days overdue must be a number',
      'number.integer': 'Max days overdue must be an integer',
      'number.min': 'Max days overdue cannot be negative'
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
    sortBy: Joi.string().valid('date', 'due_date', 'amount', 'customer', 'invoice_number', 'status', 'created_at').default('date').messages({
      'any.only': 'Sort by must be one of: date, due_date, amount, customer, invoice_number, status, created_at'
    }),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').messages({
      'any.only': 'Sort order must be ASC or DESC'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for payment update
const validatePaymentUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('paid', 'unpaid').required().messages({
      'any.only': 'Status must be either paid or unpaid',
      'any.required': 'Status is required'
    }),
    payment_date: Joi.date().iso().when('status', {
      is: 'paid',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'date.base': 'Payment date must be a valid date',
      'date.format': 'Payment date must be in ISO format',
      'any.required': 'Payment date is required when status is paid'
    }),
    payment_notes: Joi.string().trim().max(500).messages({
      'string.base': 'Payment notes must be a string',
      'string.max': 'Payment notes cannot exceed 500 characters'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  validateInvoiceCreate,
  validateInvoiceUpdate,
  validateInvoiceSearch,
  validatePaymentUpdate
};