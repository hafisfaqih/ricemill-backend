🚀 Rice Mill Management API Endpoints
=====================================

BASE URL: http://localhost:3001

## 🏥 SYSTEM ENDPOINTS
- GET / - Welcome message & API documentation
- GET /health - Health check status

## 🔐 AUTHENTICATION ENDPOINTS (Public)
### Auth Routes (/api/auth)
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout

## 👥 USER MANAGEMENT ENDPOINTS
### User Routes (/api/users)
#### Public Routes:
- POST /api/users/register - Register new user
- POST /api/users/login - User login

#### Protected Routes (Require Authentication):
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile  
- POST /api/users/logout - User logout

#### Admin Only Routes:
- GET /api/users - Get all users
- GET /api/users/search - Search users
- GET /api/users/stats - Get user statistics
- GET /api/users/:id - Get user by ID
- DELETE /api/users/:id - Delete user
- PATCH /api/users/:id/role - Change user role

## 🏪 SUPPLIER MANAGEMENT ENDPOINTS (Public Access)
### Supplier Routes (/api/suppliers)
- GET /api/suppliers - Get all suppliers (with pagination & filtering)
  * Query params: page, limit, search, status
- POST /api/suppliers - Create new supplier
- GET /api/suppliers/stats - Get supplier statistics
- GET /api/suppliers/active - Get all active suppliers
- GET /api/suppliers/search - Search suppliers by name
  * Query param: q (search term)
- GET /api/suppliers/:id - Get supplier by ID
- PUT /api/suppliers/:id - Update supplier
- DELETE /api/suppliers/:id - Delete supplier

## 📦 PURCHASE MANAGEMENT ENDPOINTS (Authentication Required)
### Purchase Routes (/api/purchases)
#### General Access (All Authenticated Users):
- GET /api/purchases - Get all purchases (with pagination & filtering)
- GET /api/purchases/search - Search purchases
- GET /api/purchases/stats - Get purchase statistics
- GET /api/purchases/inventory - Get available inventory
- GET /api/purchases/trends - Get monthly trends
- GET /api/purchases/supplier/:supplierId - Get purchases by supplier
- GET /api/purchases/:id - Get purchase by ID

#### Admin & Manager Only:
- POST /api/purchases - Create new purchase
- PUT /api/purchases/:id - Update purchase

#### Admin Only:
- DELETE /api/purchases/:id - Delete purchase

## 💰 SALES MANAGEMENT ENDPOINTS (Authentication Required)
### Sale Routes (/api/sales)
#### General Access (All Authenticated Users):
- GET /api/sales - Get all sales (with pagination & filtering)
- GET /api/sales/search - Search sales
- GET /api/sales/stats - Get sale statistics
- GET /api/sales/profitability - Get profitability analysis
- GET /api/sales/inventory-turnover - Get inventory turnover analysis
- GET /api/sales/purchase/:purchaseId - Get sales by purchase
- GET /api/sales/:id - Get sale by ID

#### Admin & Manager Only:
- POST /api/sales - Create new sale
- PUT /api/sales/:id - Update sale

#### Admin Only:
- DELETE /api/sales/:id - Delete sale

## 🧾 INVOICE MANAGEMENT ENDPOINTS (Authentication Required)
### Invoice Routes (/api/invoices)
#### General Access (All Authenticated Users):
- GET /api/invoices - Get all invoices (with pagination & filtering)
- GET /api/invoices/search - Search invoices
- GET /api/invoices/stats - Get invoice statistics
- GET /api/invoices/trends - Get monthly trends
- GET /api/invoices/overdue - Get overdue invoices
- GET /api/invoices/aging-report - Get aging report
- GET /api/invoices/generate-number - Generate invoice number
- GET /api/invoices/:id - Get invoice by ID

#### Admin & Manager Only:
- POST /api/invoices - Create new invoice
- PUT /api/invoices/:id - Update invoice
- PATCH /api/invoices/:id/paid - Mark invoice as paid
- POST /api/invoices/:id/items - Add invoice item
- PUT /api/invoices/items/:itemId - Update invoice item

#### Admin Only:
- DELETE /api/invoices/:id - Delete invoice
- DELETE /api/invoices/items/:itemId - Delete invoice item

## 📊 BUSINESS ANALYTICS & REPORTS
### Available Analytics Endpoints:
- GET /api/suppliers/stats - Supplier statistics
- GET /api/purchases/stats - Purchase statistics & trends
- GET /api/purchases/inventory - Current inventory status
- GET /api/purchases/trends - Purchase monthly trends
- GET /api/sales/stats - Sales statistics
- GET /api/sales/profitability - Profitability analysis
- GET /api/sales/inventory-turnover - Inventory turnover rates
- GET /api/invoices/stats - Invoice statistics
- GET /api/invoices/trends - Invoice monthly trends
- GET /api/invoices/aging-report - Payment aging analysis
- GET /api/users/stats - User management statistics

## 🔒 AUTHENTICATION & AUTHORIZATION
### Authentication Methods:
- JWT Token-based authentication
- Bearer token in Authorization header
- Role-based access control (admin, manager)

### Access Levels:
1. **Public** - No authentication required
2. **Authenticated** - Valid JWT token required
3. **Manager** - Manager or Admin role required
4. **Admin** - Admin role required only

## 📝 REQUEST/RESPONSE FORMATS
- **Content-Type**: application/json
- **Authorization**: Bearer {jwt_token}
- **Success Response**: `{ success: true, data: {...}, message: "..." }`
- **Error Response**: `{ success: false, message: "...", error: {...} }`

## 🔧 QUERY PARAMETERS
### Common Query Parameters:
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 10, max: 100)
- **search**: Search term
- **status**: Filter by status
- **sortBy**: Sort field
- **sortOrder**: asc/desc
- **startDate**: Date range start
- **endDate**: Date range end

## 🚨 ERROR CODES
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

## 🔄 BUSINESS LOGIC FEATURES
### Automatic Calculations:
- Purchase total costs (price + truck + labor)
- Sale profit calculations & rendement
- Invoice total amounts from items
- Inventory tracking & availability
- Aging reports for overdue payments
- Statistical analytics across all modules

### Data Relationships:
- Sales linked to purchases for profit tracking
- Invoices with multiple items support
- Supplier tracking across purchases
- User audit trails for all operations