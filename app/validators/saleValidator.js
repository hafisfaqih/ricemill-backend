const Joi = require('joi');

// Validation schema for creating a new sale
const validateSaleCreate = (data) => {
  // Backward compatibility mapping
  if (data && data.purchase_id && !data.purchaseId) data.purchaseId = data.purchase_id;
  const schema = Joi.object({
    date: Joi.date().iso().required().messages({
      'date.base': 'Date must be a valid date',
      'date.format': 'Date must be in ISO format',
      'any.required': 'Date is required'
    }),
    purchaseId: Joi.number().integer().positive().allow(null).messages({
      'number.base': 'Purchase ID must be a number',
      'number.integer': 'Purchase ID must be an integer',
      'number.positive': 'Purchase ID must be positive'
    }),
    quantity: Joi.number().integer().positive().required().messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required'
    }),
    weight: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Weight must be a number',
      'number.positive': 'Weight must be positive',
      'any.required': 'Weight is required'
    }),
    price: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    }),
    pellet: Joi.number().min(0).precision(2).default(0).messages({
      'number.base': 'Pellet cost must be a number',
      'number.min': 'Pellet cost cannot be negative'
    }),
    fuel: Joi.number().min(0).precision(2).default(0).messages({
      'number.base': 'Fuel cost must be a number',
      'number.min': 'Fuel cost cannot be negative'
    }),
    labor: Joi.number().min(0).precision(2).default(0).messages({
      'number.base': 'Labor cost must be a number',
      'number.min': 'Labor cost cannot be negative'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for updating a sale
const validateSaleUpdate = (data) => {
  if (data && data.purchase_id && !data.purchaseId) data.purchaseId = data.purchase_id;
  const schema = Joi.object({
    date: Joi.date().iso().messages({
      'date.base': 'Date must be a valid date',
      'date.format': 'Date must be in ISO format'
    }),
    purchaseId: Joi.number().integer().positive().allow(null).messages({
      'number.base': 'Purchase ID must be a number',
      'number.integer': 'Purchase ID must be an integer',
      'number.positive': 'Purchase ID must be positive'
    }),
    quantity: Joi.number().integer().positive().messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.positive': 'Quantity must be positive'
    }),
    weight: Joi.number().positive().precision(2).messages({
      'number.base': 'Weight must be a number',
      'number.positive': 'Weight must be positive'
    }),
    price: Joi.number().positive().precision(2).messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive'
    }),
    pellet: Joi.number().min(0).precision(2).messages({
      'number.base': 'Pellet cost must be a number',
      'number.min': 'Pellet cost cannot be negative'
    }),
    fuel: Joi.number().min(0).precision(2).messages({
      'number.base': 'Fuel cost must be a number',
      'number.min': 'Fuel cost cannot be negative'
    }),
    labor: Joi.number().min(0).precision(2).messages({
      'number.base': 'Labor cost must be a number',
      'number.min': 'Labor cost cannot be negative'
    })
  }).min(1); // At least one field must be provided for update

  return schema.validate(data, { abortEarly: false });
};

// Validation schema for sale search/filter parameters
const validateSaleSearch = (data) => {
  if (data && data.purchase_id && !data.purchaseId) data.purchaseId = data.purchase_id;
  const schema = Joi.object({
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
    
    // Quantity and weight filters
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
    minWeight: Joi.number().min(0).precision(2).messages({
      'number.base': 'Minimum weight must be a number',
      'number.min': 'Minimum weight cannot be negative'
    }),
    maxWeight: Joi.number().min(Joi.ref('minWeight')).precision(2).messages({
      'number.base': 'Maximum weight must be a number',
      'number.min': 'Maximum weight must be greater than minimum weight'
    }),
    
    // Price and profit filters
    minPrice: Joi.number().min(0).precision(2).messages({
      'number.base': 'Minimum price must be a number',
      'number.min': 'Minimum price cannot be negative'
    }),
    maxPrice: Joi.number().min(Joi.ref('minPrice')).precision(2).messages({
      'number.base': 'Maximum price must be a number',
      'number.min': 'Maximum price must be greater than minimum price'
    }),
    minProfit: Joi.number().precision(2).messages({
      'number.base': 'Minimum profit must be a number'
    }),
    maxProfit: Joi.number().min(Joi.ref('minProfit')).precision(2).messages({
      'number.base': 'Maximum profit must be a number',
      'number.min': 'Maximum profit must be greater than minimum profit'
    }),
    
    // Purchase ID filter
    purchaseId: Joi.number().integer().positive().messages({
      'number.base': 'Purchase ID must be a number',
      'number.integer': 'Purchase ID must be an integer',
      'number.positive': 'Purchase ID must be positive'
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
    sortBy: Joi.string().valid('date', 'quantity', 'weight', 'price', 'netProfit', 'created_at').default('date').messages({
      'any.only': 'Sort by must be one of: date, quantity, weight, price, netProfit, created_at'
    }),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').messages({
      'any.only': 'Sort order must be ASC or DESC'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  validateSaleCreate,
  validateSaleUpdate,
  validateSaleSearch
};