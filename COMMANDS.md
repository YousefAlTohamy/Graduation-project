# 🚀 CareerCompass - Commands Guide

## ⚡ Quick Commands

Copy & paste these commands in separate PowerShell windows:

---

### **TERMINAL 1 - Frontend (Port 5173)**
```powershell
cd a:\Graduation-project\frontend
npm run dev
```
✓ Open: **http://localhost:5173**

---

### **TERMINAL 2 - Backend API (Port 8000)**
```powershell
cd a:\Graduation-project\backend-api
php artisan serve
```
✓ Open: **http://localhost:8000/api/health**

---

### **TERMINAL 3 - AI Engine (Port 8001)**
```powershell
cd a:\Graduation-project\ai-engine
.\venv\Scripts\activate
uvicorn main:app --reload --port 8001
```
✓ Open: **http://localhost:8001/docs** (API documentation)

---

## 📋 Troubleshooting Commands

### If Backend Dependencies Are Missing:
```powershell
cd a:\Graduation-project\backend-api
composer install --ignore-platform-reqs
```

### If Frontend Dependencies Are Missing:
```powershell
cd a:\Graduation-project\frontend
npm install
```

### If Python Environment Issue:
```powershell
cd a:\Graduation-project\ai-engine
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Check if Ports Are Available:
```powershell
netstat -ano | findstr :5173
netstat -ano | findstr :8000
netstat -ano | findstr :8001
```

---

## 🎯 Frontend Features Available

✅ User Registration
✅ User Login
✅ CV Upload & Analysis
✅ Skill Extraction
✅ Job Browsing
✅ Gap Analysis
✅ Recommendations
✅ Responsive Design
✅ JWT Authentication

---

## 📁 Important Files

**Frontend Config:**
- `frontend/src/api/client.js` - API client configuration
- `frontend/src/context/AuthContext.jsx` - Authentication logic
- `frontend/tailwind.config.js` - Styling configuration

**Backend Endpoints:**
- `backend-api/routes/api.php` - All API routes
- `backend-api/app/Http/Controllers/Api/` - API controllers

**AI Engine:**
- `ai-engine/main.py` - FastAPI server
- `ai-engine/extractor.py` - Skill extraction

---

## 🔍 Testing Workflow

1. **Register** - Create a new account
   - Name, Email, Password
2. **Login** - Sign in with credentials
3. **Upload CV** - Upload a PDF/DOC file
4. **View Skills** - See extracted skills
5. **Browse Jobs** - View available jobs
6. **Analyze** - Click a job to see gap analysis

---

## ✨ What You Built

🎨 Modern React frontend with:
- Beautiful responsive design
- Professional UI components
- Full authentication system
- API integration
- Error handling
- Loading states
- Form validation
- Protected routes

This is **production-ready code** that will impress any employer or professor! 🎓

---

## 💡 Pro Tips

💾 **Save often** - Use Ctrl+S in your editor
🔄 **HMR** - Frontend auto-refreshes on file save (thanks Vite!)
🐛 **Debugging** - Open browser dev tools (F12)
📱 **Mobile Test** - Resize browser to test responsiveness
🌐 **Network** - Use browser Network tab to see API calls
⚙️ **Backend Issues** - Check backend terminal for errors

---

## 📞 Support Checklist

Before asking for help:
- [ ] All 3 services running (check each terminal)
- [ ] No errors in browser console (F12 → Console)
- [ ] No errors in terminal windows
- [ ] Ports not in use (try different ports if needed)
- [ ] Database connected (for backend)
- [ ] Python venv activated (for AI engine)

---

## 🎓 Graduation Project Ready!

You now have a complete, professional-grade application with:
- ✅ Modern frontend
- ✅ RESTful API
- ✅ AI/ML integration
- ✅ Responsive design
- ✅ Real-world features

**Perfect for your graduation project! 🚀**

Good luck! 🎉
