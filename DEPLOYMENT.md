# 🚀 Deployment Guide - CRM Energía

This guide explains how to deploy the complete Sales System (Backend + Frontend) to production.

---

## 📋 Prerequisites

- GitHub account (code already pushed)
- Vercel account (for frontend) → [vercel.com](https://vercel.com)
- Backend hosting account (Render, Railway, or similar) → [render.com](https://render.com)
- PostgreSQL database (provided by hosting service)
- Redis cache (provided by hosting service)

---

## 🎯 STEP 1: Deploy Frontend to Vercel

### 1.1 Connect GitHub to Vercel
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Select GitHub organization: `Somossinergia-org`
4. Find repo: `crm-energia`
5. Click "Import"

### 1.2 Configure Build Settings
- **Framework Preset**: Other (Vite)
- **Build Command**: `cd frontend && npm ci && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm ci --prefix frontend`

### 1.3 Set Environment Variables
In Vercel project settings, add:
```
VITE_API_URL = https://your-backend-url.com/api
```

### 1.4 Deploy
Click "Deploy" - Vercel will automatically deploy from `develop` branch.

**✅ Result**: Frontend URL example: `https://crm-energia.vercel.app`

---

## 🎯 STEP 2: Deploy Backend to Render (Recommended)

### 2.1 Create PostgreSQL Database on Render
1. Go to https://dashboard.render.com
2. Click "+ New" → "PostgreSQL"
3. Name: `crm-energia-db`
4. Region: Your preferred region
5. PostgreSQL Version: 15
6. Click "Create Database"
7. **Save connection string** (format: `postgresql://user:password@host:5432/database`)

### 2.2 Create Redis Cache on Render (Optional but Recommended)
1. Click "+ New" → "Redis"
2. Name: `crm-energia-redis`
3. Region: Same as PostgreSQL
4. Click "Create Redis"
5. **Save connection string**

### 2.3 Deploy Node.js Backend
1. Click "+ New" → "Web Service"
2. Select GitHub repo: `crm-energia`
3. **Name**: `crm-energia-backend`
4. **Environment**: Node
5. **Build Command**: `cd backend && npm ci && npm run build`
6. **Start Command**: `cd backend && npm run start`

### 2.4 Set Environment Variables (In Render)
```
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DB_HOST=host.from.database
DB_PORT=5432
DB_NAME=database.name
DB_USER=user
DB_PASSWORD=password

# Redis
REDIS_URL=redis://user:password@host:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-change-this
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@tuempresa.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://crm-energia.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.5 Deploy
Click "Create Web Service" - Render will deploy the backend.

**✅ Result**: Backend URL example: `https://crm-energia-backend.onrender.com`

---

## 🎯 STEP 3: Run Database Migrations

### Option A: Via Render Dashboard
1. Go to backend service on Render
2. Click "Shell" tab
3. Run migrations:
```bash
cd backend
npm run migrate:latest
npm run seed
```

### Option B: Local Connection
1. Connect to your Render PostgreSQL:
```bash
psql postgresql://user:password@host:5432/database < backend/migrations/001_users.sql
psql postgresql://user:password@host:5432/database < backend/migrations/002_prospects.sql
psql postgresql://user:password@host:5432/database < backend/migrations/003_contact_history.sql
# ... run all migrations
```

---

## 🎯 STEP 4: Update Frontend Environment

### 4.1 Add Backend URL to Vercel
1. Go to Vercel project settings
2. Environment Variables
3. Update `VITE_API_URL` to your backend URL: `https://crm-energia-backend.onrender.com/api`
4. Redeploy: Click "Deployments" → "Redeploy" on latest

---

## ✅ Testing Production URLs

### Test Frontend (Mobile-Friendly)
```bash
# Direct mobile access
https://crm-energia.vercel.app

# Login with seed user
Email: comercial@empresa.com
Password: password
```

### Test Backend APIs
```bash
# Health check
curl https://crm-energia-backend.onrender.com/api/health

# Get sales metrics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://crm-energia-backend.onrender.com/api/sales/analytics/metrics?days=30

# Get follow-up alerts
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://crm-energia-backend.onrender.com/api/sales/followup/alerts
```

---

## 🔧 Troubleshooting Production

### Frontend Not Loading
- Check Vercel deployment logs
- Verify `VITE_API_URL` env var is set correctly
- Clear browser cache (Ctrl+Shift+Delete)
- Check Network tab in DevTools

### Backend Returning 500 Errors
- Check Render logs: `Logs` tab on service page
- Verify all env variables are set
- Test database connection: `SELECT 1`
- Check Redis connection if used

### Database Connection Issues
```bash
# Test connection locally
psql postgresql://user:password@host:5432/database -c "SELECT 1"

# Or via backend shell:
# npm run db:test
```

### API CORS Errors
- Verify `CORS_ORIGIN` env var matches frontend URL exactly
- Check backend logs for CORS rejection
- Example: `CORS_ORIGIN=https://crm-energia.vercel.app`

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS URLs only (Vercel/Render provide this)
- [ ] Restrict database to backend IP only (if possible)
- [ ] Enable Redis password authentication
- [ ] Review and limit CORS origins
- [ ] Set up database backups
- [ ] Monitor error logs regularly
- [ ] Keep dependencies updated: `npm audit fix`

---

## 📱 Mobile Testing URLs

After deployment, test on your phone with these URLs:

```
Frontend: https://crm-energia.vercel.app

Features to test:
- Login and authentication
- Dashboard with follow-up alerts
- Pipeline with prospects
- Sales agent panel
- Analytics and reports
- Mobile responsiveness
```

---

## 🆘 Need Help?

### Common Issues

**"Vercel builds fail"**
- Run `npm run build` locally first
- Check `package.json` build scripts
- Verify Node version matches (18+)

**"Backend won't start"**
- Check all env variables are set
- Verify database is accessible
- Check logs in Render dashboard
- Test migrations ran successfully

**"CORS errors in console"**
- Frontend and backend URLs must match exactly
- Update `CORS_ORIGIN` env var
- Hard refresh browser (Ctrl+Shift+R)

**"Blank charts/no data"**
- Check backend API responses (Network tab)
- Verify database has seed data
- Check user permissions/roles

---

## 📊 Monitoring & Maintenance

### Daily
- Check error logs in Render
- Monitor database usage
- Test login functionality

### Weekly
- Review API performance metrics
- Check disk space usage
- Update SSL certificates (auto-handled by Vercel/Render)

### Monthly
- Run `npm audit` and update dependencies
- Review and optimize slow queries
- Backup database

---

## 🚀 Success!

Your CRM Energía is now live! 

**Frontend**: https://crm-energia.vercel.app  
**Backend**: https://crm-energia-backend.onrender.com

Share these URLs with your team and start using the system!

---

*Last updated: 2026-04-16*
