const Joi = require('joi');

// Validation schemas for Purchase
const purchaseSchemas = {
  // Schema for creating a new purchase
  create: Joi.object({
    date: Joi.date()
      .iso()
      .max('now')
      .required()
      .messages({
        'date.base': 'Purchase date must be a valid date',
        'date.format': 'Purchase date must be in ISO format (YYYY-MM-DD)',
        'date.max': 'Purchase date cannot be in the future',
        'any.required': 'Purchase date is required',
      }),
    
    supplierId: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        'number.base': 'Supplier ID must be a number',
        'number.integer': 'Supplier ID must be an integer',
        'number.positive': 'Supplier ID must be positive',
      }),
    
    supplier: Joi.string()
      .max(255)
      .trim()
      .optional()
      .allow('')
      .messages({
        'string.max': 'Supplier name cannot exceed 255 characters',
      }),
    
    quantity: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 10,000',
        'any.required': 'Quantity is required',
      }),
    
    weight: Joi.number()
      .precision(2)
      .min(0.01)
      .max(1000)
      .required()
      .messages({
        'number.base': 'Weight must be a number',
        'number.min': 'Weight must be greater than 0',
        'number.max': 'Weight cannot exceed 1,000 kg',
        'any.required': 'Weight is required',
      }),

    extraWeight: Joi.number()
      .precision(2)
      .min(0)
      .max(1000)
      .default(0)
      .messages({
        'number.base': 'Extra weight must be a number',
        'number.min': 'Extra weight must be non-negative',
        'number.max': 'Extra weight cannot exceed 1,000 kg',
      }),
    
    price: Joi.number()
      .precision(2)
      .min(0.01)
      .max(1000000)
      .required()
      .messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price must be greater than 0',
        'number.max': 'Price cannot exceed 1,000,000',
        'any.required': 'Price is required',
      }),
    
    pelletCost: Joi.number()
      .precision(2)
      .min(0)
      .max(1000000)
      .default(0)
      .messages({
        'number.base': 'Pellet cost must be a number',
        'number.min': 'Pellet cost must be non-negative',
        'number.max': 'Pellet cost cannot exceed 1,000,000',
      }),

    truckCost: Joi.number()
      .precision(2)
      .min(0)
      .max(1000000)
      .default(0)
      .messages({
        'number.base': 'Truck cost must be a number',
        'number.min': 'Truck cost must be non-negative',
        'number.max': 'Truck cost cannot exceed 1,000,000',
      }),
    
    laborCost: Joi.number()
      .precision(2)
      .min(0)
      .max(1000000)
      .default(0)
      .messages({
        'number.base': 'Labor cost must be a number',
        'number.min': 'Labor cost must be non-negative',
        'number.max': 'Labor cost cannot exceed 1,000,000',
      }),
  }).custom((value, helpers) => {
    // Custom validation: Either supplierId or supplier name must be provided
    if (!value.supplierId && !value.supplier) {
      return helpers.message('Either supplier ID or supplier name must be provided');
    }
    return value;
  }),

  // Schema for updating an existing purchase
  update: Joi.object({
    date: Joi.date()
      .iso()
      .max('now')
      .optional()
      .messages({
        'date.base': 'Purchase date must be a valid date',
        'date.format': 'Purchase date must be in ISO format (YYYY-MM-DD)',
        'date.max': 'Purchase date cannot be in the future',
      }),
    
    supplierId: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        'number.base': 'Supplier ID must be a number',
        'number.integer': 'Supplier ID must be an integer',
        'number.positive': 'Supplier ID must be positive',
      }),
    
    supplier: Joi.string()
      .max(255)
      .trim()
      .optional()
      .allow('')
      .messages({
        'string.max': 'Supplier name cannot exceed 255 characters',
      }),
    
    quantity: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .optional()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 10,000',
      }),
    
    weight: Joi.number()
      .precision(2)
      .min(0.01)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Weight must be a number',
        'number.min': 'Weight must be greater than 0',
        'number.max': 'Weight cannot exceed 1,000 kg',
      }),

    extraWeight: Joi.number()
      .precision(2)
      .min(0)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Extra weight must be a number',
        'number.min': 'Extra weight must be non-negative',
        'number.max': 'Extra weight cannot exceed 1,000 kg',
      }),
    
    price: Joi.number()
      .precision(2)
      .min(0.01)
      .max(1000000)
      .optional()
      .messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price must be greater than 0',
        'number.max': 'Price cannot exceed 1,000,000',
      }),

    pelletCost: Joi.number()
      .precision(2)
      .min(0)
      .max(1000000)
      .optional()
      .messages({
        'number.base': 'Pellet cost must be a number',
        'number.min': 'Pellet cost must be non-negative',
        'number.max': 'Pellet cost cannot exceed 1,000,000',
      }),
    
    truckCost: Joi.number()
      .precision(2)
      .min(0)
      .max(1000000)
      .optional()
      .messages({
        'number.base': 'Truck cost must be a number',
        'number.min': 'Truck cost must be non-negative',
        'number.max': 'Truck cost cannot exceed 1,000,000',
      }),
    
    laborCost: Joi.number()
      .precision(2)
      .min(0)
      .max(1000000)
      .optional()
      .messages({
        'number.base': 'Labor cost must be a number',
        'number.min': 'Labor cost must be non-negative',
        'number.max': 'Labor cost cannot exceed 1,000,000',
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
    
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      }),
    
    endDate: Joi.date()
      .iso()
      .optional()
      .min(Joi.ref('startDate'))
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
        'date.min': 'End date must be after start date',
      }),
    
    supplierId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Supplier ID must be a number',
        'number.integer': 'Supplier ID must be an integer',
        'number.positive': 'Supplier ID must be positive',
      }),
    
    // Use canonical camelCase names; legacy minAmount/maxAmount mapped in middleware
    minTotalCost: Joi.number()
      .precision(2)
      .min(0)
      .optional()
      .messages({
        'number.base': 'Minimum total cost must be a number',
        'number.min': 'Minimum total cost must be non-negative',
      }),
    
    maxTotalCost: Joi.number()
      .precision(2)
      .min(0)
      .optional()
      .min(Joi.ref('minTotalCost'))
      .messages({
        'number.base': 'Maximum total cost must be a number',
        'number.min': 'Maximum total cost must be greater than minimum total cost',
      }),
  }),

  // Schema for ID parameter
  id: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Purchase ID must be a number',
        'number.integer': 'Purchase ID must be an integer',
        'number.positive': 'Purchase ID must be positive',
        'any.required': 'Purchase ID is required',
      }),
  }),
};

// Validation middleware factory
const validatePurchase = (schema) => {
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

    // Backward compatibility mapping BEFORE validation (body & query)
    if (schema === 'create' || schema === 'update') {
      // Accept legacy snake_case
      if (dataToValidate && dataToValidate.supplier_id && !dataToValidate.supplierId) {
        dataToValidate.supplierId = dataToValidate.supplier_id;
      }
      if (dataToValidate && dataToValidate.truck_cost && !dataToValidate.truckCost) {
        dataToValidate.truckCost = dataToValidate.truck_cost;
      }
      if (dataToValidate && dataToValidate.labor_cost && !dataToValidate.laborCost) {
        dataToValidate.laborCost = dataToValidate.labor_cost;
      }
      if (dataToValidate && dataToValidate.extra_weight && !dataToValidate.extraWeight) {
        dataToValidate.extraWeight = dataToValidate.extra_weight;
      }
      if (dataToValidate && dataToValidate.pellet_cost && !dataToValidate.pelletCost) {
        dataToValidate.pelletCost = dataToValidate.pellet_cost;
      }
    } else if (schema === 'query') {
      if (dataToValidate.supplier_id && !dataToValidate.supplierId) dataToValidate.supplierId = dataToValidate.supplier_id;
      // Legacy amount filters -> new total cost filters
      if (dataToValidate.minAmount && !dataToValidate.minTotalCost) dataToValidate.minTotalCost = dataToValidate.minAmount;
      if (dataToValidate.maxAmount && !dataToValidate.maxTotalCost) dataToValidate.maxTotalCost = dataToValidate.maxAmount;
      if (dataToValidate.start_date && !dataToValidate.startDate) dataToValidate.startDate = dataToValidate.start_date;
      if (dataToValidate.end_date && !dataToValidate.endDate) dataToValidate.endDate = dataToValidate.end_date;
    }

    const { error, value } = purchaseSchemas[schema].validate(dataToValidate, {
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
  purchaseSchemas,
  validatePurchase,
  validatePurchaseUpdate: validatePurchase, // Use same validation for updates
};