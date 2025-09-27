# 🌾 Rice Mill Management API - Frontend Developer Guide

## 🚀 Quick Start

### Server Information
- **Development URL**: `http://localhost:3001`
- **Production URL**: Akan berubah sesuai domain deployment (contoh: `https://your-api-domain.com`)
- **Environment**: Otomatis terdeteksi
- **Version**: 1.0.0

### 📋 Important URLs

#### Development:
- **API Documentation (Swagger UI)**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health
- **Root Endpoint**: http://localhost:3001/

#### Production (contoh):
- **API Documentation (Swagger UI)**: https://your-api-domain.com/api-docs
- **Health Check**: https://your-api-domain.com/health
- **Root Endpoint**: https://your-api-domain.com/

> **💡 Penting**: URL akan berubah otomatis saat deployment! Lihat [Deployment Guide](DEPLOYMENT_GUIDE.md) untuk detail lengkap.

## 🔧 Setup Instructions

1. **Start the backend server**:
   ```bash
   cd ricemill-backend
   npm run dev
   ```

2. **Access Swagger Documentation**:
   Open your browser and go to: http://localhost:3001/api-docs

## 🔐 Authentication (Currently Disabled)

> **Note**: Authentication is currently **DISABLED** for testing purposes. You can call all APIs without tokens.

When authentication is enabled, the flow will be:
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login` 
3. Use returned JWT token in headers: `Authorization: Bearer <token>`

### Example Auth Flow (when enabled):
```javascript
// Register
const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123',
    role: 'admin'
  })
});

// Login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});
```

## 📊 API Endpoints Overview

### 🏥 System Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/health` | Health check and system status |
| GET | `/` | Welcome message with API info |

### 🏪 Suppliers Management
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/suppliers` | Get all suppliers (pagination) |
| POST | `/api/suppliers` | Create new supplier |
| GET | `/api/suppliers/:id` | Get supplier by ID |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |
| GET | `/api/suppliers/stats` | Get supplier statistics |
| GET | `/api/suppliers/active` | Get active suppliers only |
| GET | `/api/suppliers/search?q=keyword` | Search suppliers |

### 📦 Purchase Management
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/purchases` | Get all purchases |
| POST | `/api/purchases` | Create new purchase |
| GET | `/api/purchases/:id` | Get purchase by ID |
| PUT | `/api/purchases/:id` | Update purchase |
| DELETE | `/api/purchases/:id` | Delete purchase |
| GET | `/api/purchases/stats` | Purchase statistics |
| GET | `/api/purchases/search` | Search purchases |
| GET | `/api/purchases/inventory` | Available inventory |
| GET | `/api/purchases/trends` | Monthly trends |

### 💰 Sales Management
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/sales` | Get all sales |
| POST | `/api/sales` | Create new sale |
| GET | `/api/sales/:id` | Get sale by ID |
| PUT | `/api/sales/:id` | Update sale |
| DELETE | `/api/sales/:id` | Delete sale |
| GET | `/api/sales/stats` | Sales statistics |
| GET | `/api/sales/search` | Search sales |
| GET | `/api/sales/profitability` | Profitability analysis |

### 🧾 Invoice Management
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/invoices` | Get all invoices |
| POST | `/api/invoices` | Create new invoice |
| GET | `/api/invoices/:id` | Get invoice by ID |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| PATCH | `/api/invoices/:id/paid` | Mark invoice as paid |
| GET | `/api/invoices/stats` | Invoice statistics |
| GET | `/api/invoices/overdue` | Get overdue invoices |
| GET | `/api/invoices/aging-report` | Get aging report |
| POST | `/api/invoices/:id/items` | Add invoice item |
| PUT | `/api/invoices/items/:itemId` | Update invoice item |
| DELETE | `/api/invoices/items/:itemId` | Delete invoice item |

### 👥 User Management
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/stats` | User statistics |

## 🌟 Environment-Aware API Configuration

### Automatic Environment Detection
```javascript
// Frontend akan otomatis detect environment
const ENV_CONFIG = {
    isDevelopment: window.location.hostname === 'localhost',
    
    development: {
        baseUrl: 'http://localhost:3001'
    },
    production: {
        // Otomatis menggunakan domain yang sama dengan frontend
        baseUrl: window.location.protocol + '//' + window.location.hostname
    },
    
    getCurrentUrl() {
        return this.isDevelopment ? this.development.baseUrl : this.production.baseUrl;
    }
};

const API_BASE_URL = ENV_CONFIG.getCurrentUrl();
```

### Custom API Domain (Production)
```javascript
// Jika API menggunakan domain terpisah
const ENV_CONFIG = {
    production: {
        baseUrl: 'https://api.your-domain.com'  // Custom API domain
    }
};
```

## 🌟 Example API Calls

### Environment-Aware Fetch
```javascript
// Otomatis menggunakan URL yang tepat untuk environment
async function fetchSuppliers() {
    const response = await fetch(`${API_BASE_URL}/api/suppliers`);
    return response.json();
}

// Untuk development: http://localhost:3001/api/suppliers
// Untuk production: https://your-domain.com/api/suppliers
```

### 1. Create Supplier
```javascript
const response = await fetch('http://localhost:3001/api/suppliers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'PT. Beras Sejahtera',
    contact_person: 'Budi Santoso',
    phone: '081234567890',
    address: 'Jl. Raya Pertanian No. 123, Jakarta',
    status: 'active'
  })
});
```

### 2. Create Purchase
```javascript
const response = await fetch('http://localhost:3001/api/purchases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2024-01-15',
    supplier_id: 1,
    supplier: 'PT. Beras Sejahtera',
    quantity: 100,
    weight: 5000.50,
    price: 25000000.00,
    truck_cost: 500000.00,
    labor_cost: 300000.00
  })
});
```

### 3. Create Sale
```javascript
const response = await fetch('http://localhost:3001/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2024-01-20',
    purchase_id: 1,
    quantity: 50,
    weight: 2500.25,
    price: 15000000.00,
    pellet: 200000.00,
    fuel: 150000.00,
    labor: 100000.00
  })
});
```

### 4. Get Statistics
```javascript
// Supplier stats
const supplierStats = await fetch('http://localhost:3001/api/suppliers/stats');

// Purchase stats  
const purchaseStats = await fetch('http://localhost:3001/api/purchases/stats');

// Sales stats
const salesStats = await fetch('http://localhost:3001/api/sales/stats');

// Invoice stats
const invoiceStats = await fetch('http://localhost:3001/api/invoices/stats');
```

## 📝 Response Format

All API responses follow this structure:

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { // for paginated endpoints
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🔍 Key Features for Frontend

### 1. Automatic Calculations
- **Purchase Total Cost**: Automatically calculated from `price + truck_cost + labor_cost`
- **Sale Net Profit**: Automatically calculated based on purchase costs and sale price
- **Rendement**: Automatically calculated percentage of yield
- **Invoice Item Totals**: Automatically calculated from `quantity * price`

### 2. Business Logic
- **Purchase-Sale Relationship**: Sales can be linked to specific purchases
- **Supplier Management**: Active/inactive status management
- **Invoice Status Tracking**: Paid/unpaid status with due dates
- **Inventory Management**: Track available inventory from purchases

### 3. Advanced Features
- **Search & Filtering**: All endpoints support search and filtering
- **Pagination**: All list endpoints support pagination
- **Statistics**: Comprehensive business analytics
- **Validation**: Comprehensive input validation with error messages

## 🎯 Frontend Development Tips

1. **Environment Detection**: Frontend demo sudah include automatic environment detection
2. **Error Handling**: Always check `success` field in responses
3. **Validation**: Backend provides detailed validation error messages
4. **Decimal Numbers**: Use proper decimal handling for monetary values
5. **Date Formats**: Use `YYYY-MM-DD` format for dates
6. **Status Management**: Handle enum values (active/inactive, paid/unpaid)
7. **Deployment Ready**: Configuration otomatis menyesuaikan environment

### Development vs Production
```javascript
// Development
const API_URL = 'http://localhost:3001/api';

// Production - Option 1 (Same domain)
const API_URL = `${window.location.origin}/api`;

// Production - Option 2 (Custom API domain)
const API_URL = 'https://api.your-domain.com/api';

// Production - Option 3 (Environment variable)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
```

## 🚀 CORS Configuration
- **Development**: Accepts requests from `localhost` domains
- **Production**: Configured to accept requests from your frontend domain
- **Custom Origins**: Can be configured via `ALLOWED_ORIGINS` environment variable

## 🔄 Deployment Impact
Ketika API di-deploy ke production:
1. ✅ **Base URL berubah otomatis** dari `localhost:3001` ke domain production
2. ✅ **Frontend demo tetap berfungsi** karena ada environment detection
3. ✅ **CORS dikonfigurasi** untuk domain production
4. ✅ **Environment variables** digunakan untuk konfigurasi yang berbeda

## 📚 Additional Resources
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Panduan lengkap deployment
- [Postman Collection](postman-collection.json) - Testing dengan Postman
- [Test Script](test-api.js) - Automated API testing script

## 📞 Need Help?
1. Check the Swagger documentation: http://localhost:3001/api-docs
2. Test endpoints directly in Swagger UI
3. Check server logs for detailed error messages
4. All APIs are currently accessible without authentication for testing

---

**Happy Coding! 🌾**