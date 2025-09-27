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
module.exports = specs;