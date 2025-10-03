# 🚀 Setup Database PostgreSQL untuk Rice Mill Backend

## MacOS Setup (menggunakan Homebrew)

### 1. Install PostgreSQL
```bash
# Install PostgreSQL melalui Homebrew
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Verifikasi instalasi
postgres --version
```

### 2. Setup Database
```bash
# Buat database baru
createdb ricemill_db

# (Optional) Buat user khusus untuk aplikasi
createuser --interactive --pwprompt ricemill_user

# Login ke PostgreSQL untuk verifikasi
psql ricemill_db
```

### 3. Update konfigurasi .env
Sesuaikan file `.env` dengan kredensial database Anda:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ricemill_db
DB_USERNAME=postgres    # atau 'ricemill_user' jika membuat user baru
DB_PASSWORD=password    # sesuaikan dengan password Anda
```

## Alternative: Docker Setup

### 1. Jalankan PostgreSQL dengan Docker
```bash
# Pull dan jalankan PostgreSQL container
docker run --name ricemill-postgres \
  -e POSTGRES_DB=ricemill_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Verifikasi container berjalan
docker ps
```

### 2. Connect ke database
```bash
# Connect menggunakan psql
docker exec -it ricemill-postgres psql -U postgres -d ricemill_db
```

## Windows Setup

### 1. Download dan Install PostgreSQL
1. Download dari https://www.postgresql.org/download/windows/
2. Jalankan installer dan ikuti wizard setup
3. Catat username dan password yang dibuat

### 2. Setup Database
Buka Command Prompt atau PowerShell sebagai Administrator:
```cmd
# Navigasi ke folder PostgreSQL bin
cd "C:\Program Files\PostgreSQL\15\bin"

# Buat database
createdb -U postgres ricemill_db

# Login untuk verifikasi
psql -U postgres -d ricemill_db
```

## Testing Database Connection

Setelah setup database, test koneksi dengan:
```bash
# Jalankan server
npm run dev

# Jika berhasil, akan muncul:
# ✅ Database connection has been established successfully.
# 🔗 Connected to: ricemill_db at localhost:5432
```

## Common Issues dan Solutions

### Issue 1: Connection Refused Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Pastikan PostgreSQL service berjalan: `brew services start postgresql`
- Cek status: `brew services list | grep postgresql`

### Issue 2: Database tidak ditemukan
```
Error: database "ricemill_db" does not exist
```
**Solution:**
```bash
createdb ricemill_db
```

### Issue 3: Authentication failed
```
Error: password authentication failed for user "postgres"
```
**Solution:**
- Reset password PostgreSQL:
```bash
# Login sebagai superuser
sudo -u postgres psql

# Dalam PostgreSQL shell:
\password postgres
# Masukkan password baru
```

### Issue 4: Port sudah digunakan
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:**
- Ubah PORT di file `.env` ke port lain (misalnya 3002, 3003)
- Atau kill process yang menggunakan port:
```bash
# MacOS/Linux
lsof -ti:3001 | xargs kill

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

## Database Management Tools (Optional)

### 1. pgAdmin (GUI)
```bash
# Install melalui Homebrew
brew install --cask pgadmin4

# Atau download dari: https://www.pgadmin.org/download/
```

### 2. DBeaver (Free Universal Database Tool)
Download dari: https://dbeaver.io/download/

### 3. Command Line Tools
```bash
# List semua database
psql -U postgres -l

# Connect ke database specific
psql -U postgres -d ricemill_db

# Useful psql commands:
\dt          # List tables
\d suppliers # Describe table structure
\q           # Quit
```

## Production Deployment

Untuk production, pertimbangkan:
1. **Managed Database Services:**
   - AWS RDS PostgreSQL
   - Google Cloud SQL
   - Azure Database for PostgreSQL
   - Railway PostgreSQL
   - Render PostgreSQL

2. **Security:**
   - Gunakan environment variables untuk credentials
   - Enable SSL connection
   - Setup firewall rules
   - Regular backups

3. **Performance:**
   - Connection pooling
   - Database indexing
   - Query optimization

## 📦 Migrasi Skema (Production)

Beberapa fitur analitik terbaru membutuhkan kolom tambahan pada tabel `purchases` dan `sales`. Di lingkungan development kolom ini dibuat otomatis karena `sequelize.sync({ alter: true })`, namun di production sinkronisasi otomatis dimatikan untuk alasan keamanan. Akibatnya, Anda **harus menjalankan migrasi manual** sebelum melakukan deploy kode terbaru.

1. Jalankan perintah berikut dari root project backend untuk membuat koneksi ke database production Anda:
   ```bash
   psql "postgres://<user>:<password>@<host>:<port>/<database>"
   ```
   > Sesuaikan credential sesuai environment production.

2. Eksekusi script migrasi yang disediakan:
   ```sql
   \i sql/migrations/2025-10-03-add-purchase-sales-columns.sql
   ```

3. Verifikasi struktur tabel (opsional):
   ```sql
   \d+ purchases
   \d+ sales
   ```

Catatan:
- Script menggunakan `ADD COLUMN IF NOT EXISTS` sehingga aman dijalankan berulang kali.
- Setelah migrasi sukses, endpoint `/api/purchases`, `/api/sales`, dan statistik terkait akan bekerja kembali di production.

## 🔁 Reset Database dari Nol (Staging/Test)

Jika Anda ingin memulai ulang database (mirip `php artisan migrate:fresh` di Laravel) dan **tidak keberatan kehilangan seluruh data**, gunakan script berikut:

```bash
# Pastikan sudah berada di folder backend
cd ricemill-backend

# Jalankan dengan konfirmasi interaktif
npm run db:fresh

# Atau skip konfirmasi dengan opsi --force (gunakan hanya di CI/staging)
npm run db:fresh:force
```

Script `scripts/dbFresh.js` akan:
- Menghubungkan ke database sesuai konfigurasi `.env`
- Menghapus semua tabel dan tipe ENUM terkait
- Menjalankan ulang `sequelize.sync({ force: true })` untuk membuat skema baru

> ⚠️ **Peringatan:** Semua data akan hilang permanen. Gunakan hanya di lingkungan staging/testing atau sebelum database berisi data penting.