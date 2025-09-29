# Rice Mill Management Backend

Backend API untuk aplikasi Rice Mill Management menggunakan Node.js, Express.js, dan PostgreSQL dengan arsitektur berlapis.

## 🚀 Teknologi yang Digunakan

- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM (Object-Relational Mapping)
- **Joi** - Validasi input
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables

## 📁 Struktur Folder

```
ricemill-backend/
├── app/
│   ├── controllers/        # Request handlers
│   │   └── supplierController.js
│   ├── services/          # Business logic
│   │   └── supplierService.js
│   ├── models/            # Database models
│   │   └── supplier.js
│   ├── routes/            # API routes
│   │   └── supplierRoutes.js
│   └── validators/        # Input validation
│       └── supplierValidator.js
├── config/
│   └── db.js             # Database configuration
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
├── server.js           # Main server file
└── README.md          # Documentation
```

## ⚙️ Setup dan Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd ricemill-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
- Pastikan PostgreSQL sudah terinstall dan berjalan
- Buat database baru:
```sql
CREATE DATABASE ricemill_db;
```

### 4. Configure Environment
Edit file `.env` sesuai dengan konfigurasi database Anda:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ricemill_db
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (for future authentication)
JWT_SECRET=your_jwt_secret_key_here
```

### 5. Jalankan Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000` (atau port yang diset di env). Swagger saat ini dikonfigurasi menunjuk ke `http://localhost:3001` sebagai server dev default; pastikan PORT konsisten.

## � API Documentation (Swagger)

Swagger UI tersedia di:

```
http://localhost:3001/api-docs
```

Jika Anda menjalankan API pada port berbeda, perbarui bagian `servers` di `swagger.js` atau set environment variable yang sesuai.

### Konvensi Field (camelCase vs snake_case)

- Format standar respon & permintaan ke depan: **camelCase** (misal: `supplierId`, `totalCost`, `invoiceNumber`).
- **Backward compatibility**: Input masih menerima snake_case (misal: `supplier_id`, `total_cost`, `invoice_number`).
- Bila kedua format dikirim bersamaan, nilai camelCase akan diprioritaskan.
- Beberapa field di respon mungkin masih tampil snake_case karena nama kolom legacy di database; akan dinormalisasi bertahap.

### High-Level Endpoints

| Domain | Contoh Endpoint | Keterangan |
|--------|-----------------|------------|
| Health | `GET /health` | Status API & koneksi DB |
| Suppliers | `GET /api/suppliers` | CRUD, search, stats, toggle status |
| Purchases | `GET /api/purchases` | CRUD, stats, inventory, trends |
| Sales | `POST /api/sales` | CRUD, stats, profitability, inventory turnover |
| Invoices | `POST /api/invoices` | CRUD, stats, trends, aging, overdue, mark as paid, item management |
| Auth (deferred) | `POST /api/auth/login` | JWT auth akan diaktifkan kembali nanti |

Detail lengkap parameter & schema tersedia di Swagger UI.

## �📊 Database Schema

### Tabel Suppliers
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key (auto increment) |
| name | VARCHAR(255) | Nama supplier (required) |
| contact_person | VARCHAR(255) | Nama contact person |
| phone | VARCHAR(20) | Nomor telepon |
| address | TEXT | Alamat |
| status | ENUM | Status: 'active' or 'inactive' |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 🔗 Contoh API (Suppliers)

Base URL default lokal: `http://localhost:3000` (atau sesuai PORT). Documentasi contoh di bawah tetap relevan; gunakan Swagger untuk daftar paling akurat.

### Health Check
```http
GET /health
```

### Suppliers API

#### 1. Get All Suppliers
```http
GET /api/suppliers
```

**Query Parameters:**
- `page` (number): Halaman (default: 1)
- `limit` (number): Items per halaman (default: 10, max: 100)
- `search` (string): Pencarian berdasarkan nama atau contact person
- `status` (string): Filter status: 'active', 'inactive', 'all' (default: 'all')

**Response:**
```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### 2. Get Supplier by ID
```http
GET /api/suppliers/:id
```

#### 3. Create New Supplier
```http
POST /api/suppliers
Content-Type: application/json

{
  "name": "PT. Beras Sejahtera",
  "contactPerson": "John Doe",
  "phone": "+628123456789",
  "address": "Jl. Raya No. 123, Jakarta",
  "status": "active"
}
```

#### 4. Update Supplier
```http
PUT /api/suppliers/:id
Content-Type: application/json

{
  "name": "PT. Beras Sejahtera Updated",
  "contactPerson": "Jane Doe"
}
```

#### 5. Delete Supplier
```http
DELETE /api/suppliers/:id
```

#### 6. Get Active Suppliers Only
```http
GET /api/suppliers/active
```

#### 7. Search Suppliers
```http
GET /api/suppliers/search?q=search_term
```

#### 8. Toggle Supplier Status
```http
PATCH /api/suppliers/:id/toggle-status
```

#### 9. Get Supplier Statistics
```http
GET /api/suppliers/stats
```

## 🛡️ Validasi Input

Setiap endpoint menggunakan validasi Joi untuk memastikan data yang masuk sesuai format:

- **name**: Required, 2-255 karakter
- **contactPerson**: Optional, max 255 karakter
- **phone**: Optional, format nomor telepon valid
- **address**: Optional, text
- **status**: Must be 'active' or 'inactive'

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "name",
      "message": "Supplier name is required"
    }
  ]
}
```

## 🔧 Development

### Scripts
- `npm start` - Menjalankan server production
- `npm run dev` - Menjalankan server development dengan nodemon

### Features
- ✅ Layered Architecture (Controller, Service, Model)
- ✅ Input validation dengan Joi
- ✅ Error handling yang comprehensive
- ✅ Pagination dan filtering
- ✅ Search functionality
- ✅ CORS support
- ✅ Environment configuration
- ✅ Database connection management
- ✅ Request logging
- ✅ Graceful shutdown

### Testing

Project sudah memiliki smoke test end-to-end dengan Jest & Supertest yang memverifikasi alur penuh (supplier → purchases → sales → analytics → invoices lifecycle).

Jalankan:
```bash
npm test
```

### Future Enhancements
- [ ] Authentication & Authorization dengan JWT (re-enable middleware)
- [ ] Rate limiting
- [x] API documentation dengan Swagger (dasar + analytics & invoice items)
- [ ] Tambah unit & negative case tests
- [ ] Structured logging (Winston / Pino)
- [ ] Docker containerization
- [ ] Database migrations
- [ ] Caching dengan Redis
- [ ] Konsolidasi output field menjadi camelCase seragam

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.