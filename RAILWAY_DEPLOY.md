# 🚀 DEPLOY KE RAILWAY - LANGKAH MUDAH

## ⚡ Quick Deploy (5 Menit)

### 1️⃣ Push ke GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2️⃣ Deploy di Railway
1. Buka [railway.app](https://railway.app)
2. **Login** dengan GitHub
3. **New Project** → **Deploy from GitHub**
4. **Pilih** repository `ricemill-backend`
5. Railway otomatis detect dan deploy!

### 3️⃣ Add Database
1. Di project dashboard, klik **"Add Service"**
2. Pilih **PostgreSQL**
3. Railway auto-generate DATABASE_URL
4. Database ready dalam 1 menit!

### 4️⃣ Set Environment Variables
Di Railway project settings → Variables:
```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-12345
```

## ✅ Selesai!

Setelah deploy berhasil, Anda akan mendapat URL seperti:
```
https://ricemill-backend-production-xxxx.railway.app
```

## 🧪 Test API Online
- **Health Check**: `https://your-app.railway.app/health`
- **Swagger Docs**: `https://your-app.railway.app/api-docs` 
- **Suppliers**: `https://your-app.railway.app/api/suppliers`

## 📱 Update Frontend
Ganti base URL di frontend Vue.js:
```javascript
// Ganti dari localhost
const API_URL = 'https://your-app.railway.app'
```

## 🔄 Auto-Deploy
Setiap `git push` ke GitHub = otomatis deploy ke Railway!

---
**Total waktu: 5 menit** ✨
**Biaya: GRATIS** (500 jam/bulan) 💰