# 🚀 Deployment Guide - Premium Portfolio

## ✅ Issues Fixed for Deployment

The following problems were identified and resolved:

### 1. **Missing `package-lock.json`**
- **Problem**: Docker build expects `package-lock.json` but files don't exist
- **Fix**: Changed Dockerfile from `npm ci` to `npm install`

### 2. **Admin SPA Routing Conflict**
- **Problem**: `/admin` route might not serve `index.html` correctly
- **Fix**: Updated Express to explicitly serve `/admin/assets` and handle `/admin` + `/admin/*` routes

### 3. **Environment Variables Not Loaded**
- **Problem**: `JWT_SECRET` and other env vars might not be available
- **Fix**: Added dotenv support for development; Railway handles production env vars

### 4. **Docker Build Optimization**
- **Problem**: Building unnecessarily large Docker images
- **Fix**: Created `.dockerignore` to exclude `node_modules`, `.git`, Java files, etc.

---

## 🎯 Deploy to Railway (Step-by-Step)

### Prerequisites
- ✅ GitHub account
- ✅ Your code pushed to GitHub repository

### Steps

#### 1. Push Code to GitHub
```powershell
cd c:\Users\user\.gemini\antigravity-ide\scratch\premium-portfolio
git add .
git commit -m "Fix deployment issues - ready for Railway"
git push
```

#### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `premium-portfolio` repo
5. Click **"Deploy Now"**

#### 3. Set Environment Variables
In Railway dashboard → Your project → **Variables** tab:

```
NODE_ENV=production
JWT_SECRET=change-this-to-random-string-now-123456789
PORT=3000
```

**Important**: Change `JWT_SECRET` to something unique and secure!

#### 4. Generate Public Domain
1. Go to **Settings** tab
2. Scroll to **Domains**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://premium-portfolio-production.up.railway.app`)

#### 5. Wait for Build (2-4 minutes)
- Railway will build Stage 1 (React admin)
- Then Stage 2 (Node.js server)
- Green checkmark = deployed successfully

#### 6. Test Your Site
- **Portfolio**: `https://your-url.up.railway.app`
- **Admin Panel**: `https://your-url.up.railway.app/admin`
- **Health Check**: `https://your-url.up.railway.app/api/health`

---

## 🔐 Admin Login

**First Login:**
- Email: `admin@aditya.dev`
- Password: `soni123`

**⚠️ IMMEDIATELY after first login:**
1. Go to **Security** page
2. Change password to something strong
3. This protects your admin panel

---

## 🐛 Troubleshooting

### Build Fails

**Check logs:**
1. Railway dashboard → Click failed deployment
2. Click **"View Logs"**
3. Look for error messages

**Common errors:**

| Error | Solution |
|-------|----------|
| `npm install failed` | Check `package.json` syntax |
| `better-sqlite3 build failed` | Ensure `python3 make g++` are in Dockerfile |
| `Cannot find module` | Check all `require()` paths in server files |
| `Build timeout` | Railway free tier has 15 min limit - try again |

### Site Shows 502 Bad Gateway

**Causes:**
- Server didn't start properly
- Wrong PORT configuration
- Database initialization failed

**Fix:**
1. Check Railway logs
2. Ensure `PORT=3000` in Variables
3. Look for database errors in logs

### Admin Panel Not Loading

**Check:**
1. URL should be `/admin` (not `/admin.html`)
2. Browser console for JavaScript errors
3. Railway logs for build errors

**Fix:**
- Rebuild: Railway dashboard → **"Deployments"** → **"Redeploy"**
- Clear browser cache: `Ctrl+Shift+R`

### Database Not Persisting

**Railway SQLite limitation:**
- SQLite file is ephemeral on Railway
- Data resets on redeploy

**Solutions:**
1. **Use Railway Persistent Volume** (recommended):
   - Railway dashboard → **"Volumes"** → Create 1GB volume
   - Mount at `/app`
   - Set `DB_PATH=/app/portfolio.db` in Variables

2. **Use PostgreSQL** (for production):
   - Railway → **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Copy `DATABASE_URL` to Variables
   - Update `server/db/connection.js` to use PostgreSQL

---

## 📊 Monitoring

### Health Check Endpoint
```
GET /api/health
```
Returns:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2026-06-16T12:00:00.000Z"
}
```

### Railway Logs
- Real-time logs in Railway dashboard
- Filter by deployment
- Download logs for debugging

---

## 🔄 Updating Your Site

Every time you push to GitHub:
```powershell
git add .
git commit -m "Update description"
git push
```

Railway **automatically rebuilds and redeploys** (takes 2-3 minutes).

**Manual redeploy:**
- Railway dashboard → **"Deployments"** → **"Redeploy"**

---

## 🌐 Custom Domain (Optional)

1. Railway → Settings → Domains → **"Add Custom Domain"**
2. Enter `yourdomain.com`
3. Railway shows DNS records (CNAME/A)
4. Add records to your domain provider (GoDaddy, Namecheap, etc.)
5. Wait 5-30 minutes for DNS propagation
6. Your site is live at `yourdomain.com`!

---

## 💰 Railway Pricing

**Free Tier:**
- 500 hours/month compute (enough for 1 project 24/7)
- 5 GB storage
- 100 GB bandwidth
- No credit card required

**Hobby Plan ($5/month):**
- 2,000 hours/month
- 10 GB storage
- 500 GB bandwidth

---

## 📝 Post-Deployment Checklist

After successful deployment:

- [ ] Site loads at Railway URL
- [ ] Admin panel accessible at `/admin`
- [ ] Login works with default credentials
- [ ] **Password changed** in Security page
- [ ] Environment variables set (JWT_SECRET)
- [ ] Health check returns `{"status": "ok"}`
- [ ] Test creating a project in admin
- [ ] Test contact form submission
- [ ] Check messages appear in admin
- [ ] Database persists (or set up persistent volume)

---

## 🆘 Need Help?

If deployment still fails:

1. **Check Railway logs** for specific error messages
2. **Test locally first** (requires Node.js):
   ```powershell
   npm install
   npm run build:admin
   npm start
   ```
3. **Verify all files exist**:
   - `package.json` ✅
   - `server/index.js` ✅
   - `server/db/schema.js` ✅
   - `Dockerfile` ✅
   - `admin/package.json` ✅
   - `admin/vite.config.js` ✅

4. **Common fix**: Rebuild from scratch
   - Railway → Deployments → Delete all
   - Reconnect GitHub repo
   - Deploy again

---

## 🎉 Success Indicators

You'll know deployment worked when:

✅ Railway shows green checkmark  
✅ Health check returns `{"status": "ok"}`  
✅ Portfolio site loads  
✅ Admin panel loads at `/admin`  
✅ Login works  
✅ You can create/edit/delete content  

**Congratulations! Your portfolio is live! 🚀**
