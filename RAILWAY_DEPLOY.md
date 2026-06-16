# Railway Deployment Guide

## 🚀 Deploy to Railway (Recommended for Backend Apps)

### Why Railway?
- ✅ Persistent Node.js server (not serverless)
- ✅ SQLite database works perfectly
- ✅ Email systems (Web3Forms, nodemailer) work
- ✅ File uploads persist in `/uploads`
- ✅ No timeout limits
- ✅ Better for Express.js backends

---

## Step-by-Step Deployment

### 1. Go to Railway
- Visit: https://railway.app
- Sign in with GitHub

### 2. Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose your `portfolio-3d` repository
- Click **"Deploy Now"**

### 3. Configure Environment Variables
Click on your service → **Variables** tab → Add:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-change-this-in-production
PORT=3000
SITE_URL=https://your-project.railway.app
```

**Important:** Replace `your-project.railway.app` with your actual Railway URL after deployment.

### 4. Deploy Settings
Railway will auto-detect `railway.json` and use `Dockerfile.railway`

**Build Command:** (automatic from Dockerfile)
```
Docker build using Dockerfile.railway
```

**Start Command:** (from railway.json)
```
node server/index.js
```

### 5. Wait for Build (2-3 minutes)
You'll see:
```
Building...
✓ Docker image built
Starting service...
✓ Service started on port 3000
```

### 6. Access Your Site
- **Portfolio:** `https://your-project.up.railway.app`
- **Admin Panel:** `https://your-project.up.railway.app/admin`
- **API Health:** `https://your-project.up.railway.app/api/health`

---

## 📊 Expected Build Logs (Railway)

```
[1/3] Preparing build context...
[2/3] Building Docker image...

Step 1/15 : FROM node:20-alpine AS admin-builder
Step 2/15 : WORKDIR /admin
Step 3/15 : COPY admin/package.json ./
Step 4/15 : RUN npm install
  added 287 packages in 12s
Step 5/15 : COPY admin/ .
Step 6/15 : RUN npm run build
  ✓ Admin panel built successfully

Step 7/15 : FROM node:20-alpine
Step 8/15 : RUN apk add --no-cache python3 make g++
  (installing build tools for better-sqlite3)
Step 9/15 : COPY package.json ./
Step 10/15 : RUN npm install --production
  added 142 packages in 8s
Step 11/15 : COPY server/ ./server/
Step 12/15 : COPY --from=admin-builder /admin/dist ./admin/dist
Step 13/15 : COPY *.html *.css *.js *.png *.jpg *.jpeg *.webp ./
Step 14/15 : RUN mkdir -p uploads backups
Step 15/15 : CMD ["node", "server/index.js"]

[3/3] Deploying...
✓ Service started successfully
Health check passed: /api/health
```

---

## 🧪 Testing After Deployment

### 1. Test Portfolio
- Visit your Railway URL
- Check all images load
- Test contact form
- Verify animations work

### 2. Test Admin Panel
- Go to `/admin`
- Login with: `admin@aditya.dev` + your password
- Check dashboard loads
- Test CRUD operations

### 3. Test Contact Form & Email
1. Fill out contact form on portfolio
2. Submit
3. Check admin Messages page
4. Verify Web3Forms email notification sent

### 4. Test File Uploads
1. Go to Admin → Media
2. Upload an image
3. Verify it persists after page refresh

---

## 🐛 Troubleshooting

### Error: "better-sqlite3 compilation failed"
**Fix:** The Dockerfile already includes python3, make, g++ for compilation

### Error: "Database not found" or "SQLite error"
**Fix:** Railway persists the database, but initial schema needs creation
- The server auto-creates tables on first run
- Check logs for "Database initialized" message

### Error: "Admin panel not found" or 404
**Fix:** Check build logs - did admin build succeed?
- Look for "RUN npm run build" in logs
- Verify `admin/dist` folder was created

### Error: "Images not loading"
**Fix:** Verify Dockerfile copies images
- Look for "COPY *.png *.jpg" in Dockerfile
- Check file names match exactly (case-sensitive)

### Error: "Email not sending"
**Fix:** Web3Forms works on Railway (not Vercel)
- Check console for Web3Forms response
- Verify WEB3FORMS_KEY is set in admin panel Settings

---

## 📈 Railway Free Tier Limits

- **500 hours/month** of runtime (enough for 1 service 24/7)
- **5 GB disk space** (plenty for SQLite + uploads)
- **No sleep** on free tier anymore!
- **Custom domain** support

---

## 🔄 Updating Your Site

After pushing to GitHub:
1. Railway auto-detects changes
2. Automatically rebuilds and deploys
3. Takes 2-3 minutes
4. Zero downtime deployment

---

## 🎯 Why Railway Works Better Than Vercel

| Feature | Vercel | Railway |
|---------|--------|---------|
| Server Type | Serverless | Persistent |
| SQLite Support | ❌ No | ✅ Yes |
| Email Systems | ❌ Fails | ✅ Works |
| File Uploads | ❌ Lost | ✅ Persists |
| Timeout Limit | 10-60s | None |
| Database Writes | ❌ Inconsistent | ✅ Reliable |
| Backend APIs | ⚠️ Limited | ✅ Full support |
| Build Logs | ✅ Good | ✅ Good |

---

## 💡 Pro Tips

1. **Monitor logs:** Railway dashboard → Logs tab
2. **Check health:** Visit `/api/health` endpoint
3. **Custom domain:** Railway supports custom domains on free tier
4. **Database backup:** Use Admin → Backup page
5. **Environment variables:** Never commit secrets to GitHub

---

## 📞 Need Help?

If deployment fails:
1. Copy the **full build log** from Railway
2. Copy any **runtime errors** from Logs tab
3. Share with me for immediate fix

Railway is the **correct platform** for your portfolio with backend! 🚀
