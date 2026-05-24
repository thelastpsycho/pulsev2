# 🚀 GuestPulse Production Setup Guide

## ✅ Environment Files Created

### Frontend Environment Files
- ✅ `.env` - Local development configuration
- ✅ `.env.production` - Production build configuration
- ✅ `.env.example` - Template for new environments

### Backend Environment Files
- ✅ `.env` - Updated to production-ready settings
- ✅ `.env.backup` - Backup of original development settings

## 🔧 Changes Made

### Frontend Changes (`/Users/andikrisnatha/project/pulse1/`)
1. **API Client Configuration** (`src/lib/api.js`)
   - Now uses `import.meta.env.VITE_API_BASE_URL` instead of hardcoded URL
   - Falls back to `http://localhost:8000/api` if env var not set
   - Mock data flag is now environment-controlled

2. **Environment Variables**
   - Development: Uses `http://localhost:8000/api`
   - Production: Uses `https://pulse.anvayabali.com/api`

### Backend Changes (`/Users/andikrisnatha/project/pulse/`)
1. **Production Environment** (`.env`)
   - `APP_ENV=production` ✅
   - `APP_DEBUG=false` ✅
   - `APP_URL=https://pulse.anvayabali.com` ✅
   - `LOG_LEVEL=warning` ✅ (reduced from debug)
   - `SANCTUM_STATEFUL_DOMAINS=pulse.anvayabali.com` ✅

2. **CORS Configuration** (`config/cors.php`)
   - Added production domain: `https://pulse.anvayabali.com`
   - Still supports local development URLs

## ⚠️ IMPORTANT: Manual Configuration Required

### 1. Database Security (BACKEND)
**Update your `.env` file with secure database credentials:**
```bash
# Current (INSECURE for production):
DB_USERNAME=root
DB_PASSWORD=root

# Recommended for production:
DB_USERNAME=pulse_prod_user
DB_PASSWORD=your_secure_random_password_here
```

### 2. Production Domain Setup
**If your production domain is different from `pulse.anvayabali.com`:**

**Backend `.env`:**
```bash
APP_URL=https://your-actual-domain.com
SANCTUM_STATEFUL_DOMAINS=your-actual-domain.com
```

**Frontend `.env.production`:**
```bash
VITE_API_BASE_URL=https://your-actual-domain.com/api
```

**Backend CORS (`config/cors.php`):**
```php
'allowed_origins' => [
    'https://your-actual-domain.com',
],
```

### 3. Generate Production APP_KEY
**Generate a secure application key:**
```bash
cd /Users/andikrisnatha/project/pulse
php artisan key:generate
```

### 4. Clear and Cache Configuration
**After environment changes, run:**
```bash
cd /Users/andikrisnatha/project/pulse
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🚀 Deployment Steps

### 1. Frontend Build
```bash
cd /Users/andikrisnatha/project/pulse1
npm run build
```

### 2. Backend Optimization
```bash
cd /Users/andikrisnatha/project/pulse
composer install --optimize-autoloader --no-dev
```

### 3. Set File Permissions
```bash
cd /Users/andikrisnatha/project/pulse
chmod -R 755 storage bootstrap/cache
chown -R webserver:webserver storage bootstrap/cache
```

### 4. Run Migrations (if needed)
```bash
php artisan migrate --force
```

## 🔒 Security Checklist

### Before Going Live:
- [ ] Update database credentials (non-root user)
- [ ] Generate new APP_KEY
- [ ] Set strong passwords for all services
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Configure backup strategy
- [ ] Set up monitoring and error tracking
- [ ] Review user permissions for production users
- [ ] Test all API endpoints with production domain
- [ ] Verify CORS settings allow production domain only
- [ ] Check session security settings
- [ ] Configure rate limiting
- [ ] Set up log rotation

## 🧪 Testing

### Test Production Build Locally:
```bash
# Frontend
cd /Users/andikrisnatha/project/pulse1
npm run build
npm run preview

# Backend (ensure production env is loaded)
cd /Users/andikrisnatha/project/pulse
php artisan serve --host=localhost --port=8001
```

### Test API Connectivity:
```bash
curl -X POST https://pulse.anvayabali.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ak@ak.ak","password":"123456789"}'
```

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Environment | ✅ Ready | `.env` files configured |
| Backend Environment | ✅ Ready | Production settings applied |
| API Integration | ✅ Ready | Mock data disabled, uses real API |
| CORS Configuration | ✅ Ready | Production domain added |
| Database Config | ⚠️ Review | Still using root credentials |
| SSL/HTTPS | ⚠️ Pending | Domain certificate needed |
| Security Hardening | ⚠️ Pending | See security checklist |

## 🆘 Troubleshooting

### Frontend Issues:
**Problem**: API calls failing
**Solution**: Check `VITE_API_BASE_URL` in `.env` file

**Problem**: Build errors
**Solution**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Backend Issues:
**Problem**: 500 errors
**Solution**: Check storage permissions and run `php artisan config:cache`

**Problem**: CORS errors
**Solution**: Verify production domain is in `config/cors.php`

**Problem**: Authentication failing
**Solution**: Check `SANCTUM_STATEFUL_DOMAINS` in `.env`

## 📝 Important Notes

1. **Never commit `.env` files to version control**
2. **Keep `.env.backup` for local development reference**
3. **Use different `.env` files for different environments**
4. **Always test deployment in staging environment first**
5. **Monitor logs after deployment**: `storage/logs/laravel.log`

---

**Environment files created successfully!** 🎉

Your application is now configured for production deployment. Complete the security checklist before going live.