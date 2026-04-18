# 🚀 Deploy to Vercel + Render (Supabase)

## 📋 Prerequisites Ready?

✅ Supabase project created  
✅ Database credentials obtained  
✅ .env.supabase filled with real credentials  
✅ Code committed to GitHub  

---

## 🎯 DEPLOY BACKEND TO RENDER + SUPABASE

### Step 1: Connect Supabase to Render

1. Go to https://dashboard.render.com
2. Click **"New"** → **"Web Service"**
3. Select GitHub: `crm-energia`
4. **Name**: `crm-energia-api`
5. **Environment**: Node
6. **Build Command**: 
   ```
   cd backend && npm ci && npm run build
   ```
7. **Start Command**: 
   ```
   cd backend && npm run start
   ```

### Step 2: Add Environment Variables to Render

Click **"Environment"** and add ALL these variables:

```
NODE_ENV=production
PORT=3000

# SUPABASE DATABASE (from .env.supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=postgres

# JWT SECRETS (Generate with: openssl rand -base64 32)
JWT_SECRET=PASTE_RANDOM_32_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=PASTE_ANOTHER_RANDOM_32_CHAR_SECRET_HERE
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# AI API
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# CORS
CORS_ORIGIN=https://crm-energia.vercel.app

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Create Web Service

Click **"Create Web Service"**

⏳ Wait for deployment (2-3 minutes)

**Result**: You'll get a URL like:
```
https://crm-energia-api.onrender.com
```

### Step 4: Test Backend

```bash
# Health check
curl https://crm-energia-api.onrender.com/api/health

# Should return: {"status":"ok"}
```

---

## 🎯 DEPLOY FRONTEND TO VERCEL

### Step 1: Connect Vercel

1. Go to https://vercel.com/new
2. **Import Git Repository**
3. Select: `Somossinergia-org/crm-energia`
4. Click **Import**

### Step 2: Configure Build Settings

- **Framework Preset**: Other (Vite)
- **Build Command**: Auto-detected ✓
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm ci --prefix frontend`

### Step 3: Add Environment Variable

Click **"Environment Variables"**

```
VITE_API_URL=https://crm-energia-api.onrender.com/api
```

### Step 4: Deploy

Click **"Deploy"**

⏳ Wait for deployment (1-2 minutes)

**Result**: You'll get a URL like:
```
https://crm-energia.vercel.app
```

---

## ✅ FINAL VERIFICATION

### Test Frontend (Mobile)
```
https://crm-energia.vercel.app

Login:
Email: comercial@empresa.com
Password: password
```

### Test Backend APIs
```bash
# Get sales metrics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://crm-energia-api.onrender.com/api/sales/analytics/metrics?days=30

# Get follow-up alerts
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://crm-energia-api.onrender.com/api/sales/followup/alerts
```

---

## 🔐 Security Checklist

Before sharing URLs with team:

- [ ] Generate STRONG JWT secrets (use `openssl rand -base64 32`)
- [ ] Don't share credentials in Slack/Email
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Test login works
- [ ] Verify database has seed data
- [ ] Check CORS whitelist correct

---

## 🆘 Troubleshooting

### "Vercel build fails"
```bash
# Test locally first
cd frontend && npm run build
```

### "Render backend crashes"
1. Check logs: Render dashboard → Logs tab
2. Verify all env vars set correctly
3. Test database connection: See SETUP_SUPABASE.md

### "Frontend shows blank page"
1. Check DevTools Console (F12)
2. Verify VITE_API_URL is correct
3. Hard refresh (Ctrl+Shift+R)

### "API returns 403 CORS error"
1. Check CORS_ORIGIN in Render env vars
2. Must match exactly: `https://crm-energia.vercel.app`
3. Redeploy Render after changing

---

## 🎉 Success!

Your CRM is now LIVE:

**Frontend**: https://crm-energia.vercel.app  
**Backend**: https://crm-energia-api.onrender.com  
**Database**: Supabase (PostgreSQL)  

Share the frontend URL with your team! 🚀
