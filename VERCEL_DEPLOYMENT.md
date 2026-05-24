# 🌐 GuestPulse Vercel Deployment Guide

## 🚀 **Quick Deployment to Vercel**

Your frontend is already configured for Vercel deployment! Here are the options:

---

## ✅ **Option 1: Automatic Deployment (Recommended)**

### **Step 1: Push to GitHub**
```bash
cd /Users/andikrisnatha/project/pulse1
git add .
git commit -m "Production ready - API configured for pulse.anvayabali.com"
git push origin main
```

### **Step 2: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will automatically detect Vite settings

### **Step 3: Configure Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:

```bash
VITE_API_BASE_URL = https://pulse.anvayabali.com/api
VITE_APP_NAME = GuestPulse
VITE_APP_ENV = production
VITE_ENABLE_MOCK_DATA = false
```

### **Step 4: Deploy**
1. Click **"Deploy"**
2. Wait for build to complete (~30 seconds)
3. Get your Vercel URL: `https://your-project.vercel.app`

---

## 🎯 **Option 2: Manual Deployment via CLI**

### **Install Vercel CLI**
```bash
npm i -g vercel
```

### **Deploy**
```bash
cd /Users/andikrisnatha/project/pulse1
vercel login
vercel --prod
```

---

## 📋 **Configuration Files Explained**

### **vercel.json** (Created)
```json
{
  "env": {
    "VITE_API_BASE_URL": "https://pulse.anvayabali.com/api",
    "VITE_APP_ENV": "production",
    "VITE_ENABLE_MOCK_DATA": "false"
  }
}
```

### **.env.production** (Ready)
```bash
VITE_API_BASE_URL=https://pulse.anvayabali.com/api
VITE_APP_NAME="GuestPulse"
VITE_APP_ENV=production
VITE_ENABLE_MOCK_DATA=false
```

---

## 🧪 **Post-Deployment Testing**

### **1. Check Environment Variables**
Your deployed site should use these settings:
- API URL: `https://pulse.anvayabali.com/api`
- Mock Data: `false` (using real API)
- Environment: `production`

### **2. Test Login**
Go to your Vercel URL and login with:
- Email: `ak@ak.ak`
- Password: `123456789`

### **3. Check Browser Console**
Open DevTools → Console and verify:
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ User data loads properly
- ✅ Dashboard displays correctly

### **4. Verify API Connectivity**
Check Network tab in DevTools:
- Look for requests to `pulse.anvayabali.com/api`
- Should see successful responses (200 status)
- Check response data contains user information

---

## ⚠️ **Common Vercel Issues**

### **Issue 1: API Calls Fail**
**Cause**: Wrong API URL or backend not deployed yet
**Solution**:
1. Verify backend is deployed at `https://pulse.anvayabali.com/api`
2. Check environment variables in Vercel dashboard
3. Test API directly: `curl https://pulse.anvayabali.com/api/me`

### **Issue 2: CORS Errors**
**Cause**: Backend CORS doesn't include Vercel domain
**Solution**:
1. Add your Vercel domain to backend CORS config
2. Clear Laravel cache on backend
3. Redeploy backend if needed

### **Issue 3: Build Fails**
**Cause**: Missing dependencies or configuration
**Solution**:
1. Check `package.json` has correct scripts
2. Verify `vite.config.js` is correct
3. Check build logs for specific errors

### **Issue 4: White Screen After Deployment**
**Cause**: JavaScript errors or missing assets
**Solution**:
1. Check browser console for errors
2. Verify all assets are loading
3. Check Network tab for failed requests

---

## 🔧 **Local Testing Before Deployment**

### **Test Production Build Locally**
```bash
cd /Users/andikrisnatha/project/pulse1
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

---

## 📊 **Environment Configuration Summary**

| Environment | API URL | Mock Data | Purpose |
|------------|---------|-----------|---------|
| **Development** | `http://localhost:8000/api` | `false` | Local development |
| **Production** | `https://pulse.anvayabali.com/api` | `false` | Live deployment |

---

## 🚦 **Deployment Checklist**

### **Before Deployment:**
- [ ] Backend API is deployed and working
- [ ] CORS includes Vercel domain
- [ ] Test user exists in production database
- [ ] API endpoint accessible: `https://pulse.anvayabali.com/api/login`

### **Vercel Configuration:**
- [ ] Environment variables set correctly
- [ ] `vercel.json` configuration present
- [ ] `.env.production` file correct
- [ ] Build settings verified

### **After Deployment:**
- [ ] Visit Vercel URL
- [ ] Test login functionality
- [ ] Check browser console (no errors)
- [ ] Verify API calls in Network tab
- [ ] Test dashboard loads correctly
- [ ] Check mobile responsiveness

---

## 🎉 **Success Criteria**

Your deployment is successful when:

1. ✅ **Login Works**: Can login with `ak@ak.ak` / `123456789`
2. ✅ **No CORS Errors**: Browser console shows no CORS issues
3. ✅ **API Calls Work**: Network tab shows successful API requests
4. ✅ **Data Loads**: Dashboard displays real data from backend
5. ✅ **No Console Errors**: Clean browser console with no errors

---

## 📞 **Quick Reference**

**Frontend URL**: `https://pulsev2-nu.vercel.app/`
**Backend API**: `https://pulse.anvayabali.com/api`
**Test Credentials**: `ak@ak.ak` / `123456789`

**Useful Commands:**
```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

---

## 💡 **Pro Tips**

1. **Always test locally first**: Use `npm run build && npm run preview`
2. **Check environment variables**: Verify they match your backend
3. **Monitor Vercel logs**: Check deployment logs for errors
4. **Test thoroughly**: Try all features after deployment
5. **Keep backend in sync**: Backend changes may require frontend updates

---

**Your frontend is ready for Vercel deployment!** 🚀

The `vercel.json` file and environment variables are configured. Just push to GitHub and connect to Vercel, or use the CLI for direct deployment.