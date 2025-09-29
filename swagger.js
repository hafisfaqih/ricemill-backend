const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rice Mill Management API',
      version: '1.0.0',
      description: 'Comprehensive API for managing rice mill operations including suppliers, purchases, sales, invoices, and business analytics',
      contact: {
        name: 'API Support',
        email: 'support@ricemill.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    'x-legacy-field-compatibility': {
      description: 'This API prefers camelCase in request/response bodies. For backward compatibility, snake_case field names are also accepted on input (e.g., supplier_id, truck_cost). Responses may include snake_case for persisted legacy columns; future versions will standardize outputs to camelCase. When both are provided in a request body, camelCase takes precedence.'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Error Response
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        
        // Success Response
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            }
          }
        },

        // Pagination
        PaginationInfo: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1
            },
            totalPages: {
              type: 'integer',
              example: 10
            },
            totalItems: {
              type: 'integer',
              example: 100
            },
            itemsPerPage: {
              type: 'integer',
              example: 10
            }
          }
        },

        // Health Check
        HealthCheck: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Rice Mill Management API is running!'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            database: {
              type: 'string',
              example: 'Connected'
            },
            endpoints: {
              type: 'object',
              properties: {
                suppliers: {
                  type: 'string',
                  example: '/api/suppliers'
                },
                purchases: {
                  type: 'string',
                  example: '/api/purchases'
                },
                sales: {
                  type: 'string',
                  example: '/api/sales'
                },
                invoices: {
                  type: 'string',
                  example: '/api/invoices'
                },
                users: {
                  type: 'string',
                  example: '/api/users'
                }
              }
            }
          }
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            username: {
              type: 'string',
              example: 'admin'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager'],
              example: 'admin'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },

        UserCreate: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 255,
              example: 'admin'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager'],
              default: 'manager',
              example: 'admin'
            }
          }
        },

        UserLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'admin'
            },
            password: {
              type: 'string',
              example: 'password123'
            }
          }
        },

        // Supplier schemas
        Supplier: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'PT. Beras Sejahtera'
            },
            contact_person: {
              type: 'string',
              example: 'Budi Santoso'
            },
            phone: {
              type: 'string',
              example: '081234567890'
            },
            address: {
              type: 'string',
              example: 'Jl. Raya Pertanian No. 123, Jakarta'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },

        SupplierCreate: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              maxLength: 255,
              example: 'PT. Beras Sejahtera'
            },
            contact_person: {
              type: 'string',
              maxLength: 255,
              example: 'Budi Santoso'
            },
            phone: {
              type: 'string',
              maxLength: 20,
              example: '081234567890'
            },
            address: {
              type: 'string',
              example: 'Jl. Raya Pertanian No. 123, Jakarta'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              default: 'active',
              example: 'active'
            }
          }
        },

        // Purchase schemas
        Purchase: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-15'
            },
            supplier_id: {
              type: 'integer',
              example: 1
            },
            supplier: {
              type: 'string',
              example: 'PT. Beras Sejahtera'
            },
            quantity: {
              type: 'integer',
              example: 100
            },
            weight: {
              type: 'number',
              format: 'decimal',
              example: 5000.50
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 25000000.00
            },
            truck_cost: {
              type: 'number',
              format: 'decimal',
              example: 500000.00
            },
            labor_cost: {
              type: 'number',
              format: 'decimal',
              example: 300000.00
            },
            total_cost: {
              type: 'number',
              format: 'decimal',
              example: 25800000.00
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },

        PurchaseCreate: {
          type: 'object',
          required: ['date', 'quantity', 'weight', 'price'],
          properties: {
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-15'
            },
            supplier_id: {
              type: 'integer',
              example: 1
            },
            supplier: {
              type: 'string',
              example: 'PT. Beras Sejahtera'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 100
            },
            weight: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              example: 5000.50
            },
            price: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              example: 25000000.00
            },
            truck_cost: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              default: 0,
              example: 500000.00
            },
            labor_cost: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              default: 0,
              example: 300000.00
            }
          }
        },

        // Sale schemas
        Sale: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-20'
            },
            purchase_id: {
              type: 'integer',
              example: 1
            },
            quantity: {
              type: 'integer',
              example: 50
            },
            weight: {
              type: 'number',
              format: 'decimal',
              example: 2500.25
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 15000000.00
            },
            pellet: {
              type: 'number',
              format: 'decimal',
              example: 200000.00
            },
            fuel: {
              type: 'number',
              format: 'decimal',
              example: 150000.00
            },
            labor: {
              type: 'number',
              format: 'decimal',
              example: 100000.00
            },
            net_profit: {
              type: 'number',
              format: 'decimal',
              example: 2050000.00
            },
            rendement: {
              type: 'string',
              example: '50.0%'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T10:30:00Z'
            }
          }
        },

        SaleCreate: {
          type: 'object',
          required: ['date', 'quantity', 'weight', 'price'],
          properties: {
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-20'
            },
            purchase_id: {
              type: 'integer',
              example: 1
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 50
            },
            weight: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              example: 2500.25
            },
            price: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              example: 15000000.00
            },
            pellet: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              default: 0,
              example: 200000.00
            },
            fuel: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              default: 0,
              example: 150000.00
            },
            labor: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              default: 0,
              example: 100000.00
            }
          }
        },

        // Invoice schemas
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            invoice_number: {
              type: 'string',
              example: 'INV-2024-001'
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-25'
            },
            customer: {
              type: 'string',
              example: 'Toko Beras Berkah'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 5000000.00
            },
            due_date: {
              type: 'string',
              format: 'date',
              example: '2024-02-25'
            },
            status: {
              type: 'string',
              enum: ['paid', 'unpaid'],
              example: 'unpaid'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-25T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-25T10:30:00Z'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/InvoiceItem'
              }
            }
          }
        },

        InvoiceCreate: {
          type: 'object',
          required: ['invoice_number', 'date', 'customer', 'amount', 'due_date'],
          properties: {
            invoice_number: {
              type: 'string',
              maxLength: 50,
              example: 'INV-2024-001'
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-25'
            },
            customer: {
              type: 'string',
              maxLength: 255,
              example: 'Toko Beras Berkah'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              example: 5000000.00
            },
            due_date: {
              type: 'string',
              format: 'date',
              example: '2024-02-25'
            },
            status: {
              type: 'string',
              enum: ['paid', 'unpaid'],
              default: 'unpaid',
              example: 'unpaid'
            }
          }
        },

        // Invoice Item schemas
        InvoiceItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            invoice_id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Beras Premium 5kg'
            },
            quantity: {
              type: 'integer',
              example: 100
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 50000.00
            },
            total: {
              type: 'number',
              format: 'decimal',
              example: 5000000.00
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-25T10:30:00Z'
            }
          }
        },

        InvoiceItemCreate: {
          type: 'object',
          required: ['name', 'quantity', 'price'],
          properties: {
            name: {
              type: 'string',
              maxLength: 255,
              example: 'Beras Premium 5kg'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 100
            },
            price: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              example: 50000.00
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./app/routes/*.js', './server.js'], // Path ke file yang mengandung dokumentasi API
};

const specs = swaggerJSDoc(options);
// Programmatically extend paths not yet documented via JSDoc blocks (analytics & invoice item operations)
specs.paths = specs.paths || {};

// Helper to safely add/merge a path
function addPath(path, methods) {
  specs.paths[path] = {
    ...(specs.paths[path] || {}),
    ...methods
  };
}

// Sales profitability analysis endpoint (/api/sales/profitability) if not present
addPath('/api/sales/profitability', {
  get: {
    summary: 'Get sales profitability analysis (aggregated KPIs)',
    tags: ['Sales'],
    parameters: [
      { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
      { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } }
    ],
    responses: {
      200: {
        description: 'Profitability metrics retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    totalRevenue: { type: 'number', example: 150000000 },
                    totalCost: { type: 'number', example: 120000000 },
                    totalProfit: { type: 'number', example: 30000000 },
                    profitMargin: { type: 'string', example: '20.00' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// Inventory turnover based on sales/purchases (/api/sales/inventory-turnover)
addPath('/api/sales/inventory-turnover', {
  get: {
    summary: 'Get inventory turnover metrics',
    tags: ['Sales'],
    parameters: [
      { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
      { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } }
    ],
    responses: {
      200: {
        description: 'Inventory turnover metrics retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    averageInventory: { type: 'number', example: 50000 },
                    costOfGoodsSold: { type: 'number', example: 120000000 },
                    turnoverRatio: { type: 'number', example: 2.4 },
                    daysInInventory: { type: 'number', example: 152.08 }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// Invoice mark as paid endpoint
addPath('/api/invoices/{id}/paid', {
  patch: {
    summary: 'Mark an invoice as paid (idempotent)',
    tags: ['Invoices'],
    parameters: [
      { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: {
        description: 'Invoice marked as paid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Invoice' }
          }
        }
      },
      404: { $ref: '#/components/responses/NotFound' }
    }
  }
});

// Invoice item operations (create, update, delete)
addPath('/api/invoices/{id}/items', {
  post: {
    summary: 'Add an item to an invoice',
    tags: ['Invoices'],
    parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
    requestBody: {
      required: true,
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/InvoiceItemCreate' } }
      }
    },
    responses: {
      201: { description: 'Item added', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
      400: { $ref: '#/components/responses/BadRequest' },
      404: { $ref: '#/components/responses/NotFound' }
    }
  }
});

addPath('/api/invoices/items/{itemId}', {
  put: {
    summary: 'Update an invoice item',
    tags: ['Invoices'],
    parameters: [ { in: 'path', name: 'itemId', required: true, schema: { type: 'integer' } } ],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/InvoiceItemCreate' } } }
    },
    responses: {
      200: { description: 'Item updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
      400: { $ref: '#/components/responses/BadRequest' },
      404: { $ref: '#/components/responses/NotFound' }
    }
  },
  delete: {
    summary: 'Delete an invoice item',
    tags: ['Invoices'],
    parameters: [ { in: 'path', name: 'itemId', required: true, schema: { type: 'integer' } } ],
    responses: {
      200: { description: 'Item deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
      404: { $ref: '#/components/responses/NotFound' }
    }
  }
});

module.exports = specs;