# 🚀 Quick Start Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend client running on `http://localhost:3000`
- CORS package installed in backend: `pnpm add cors @types/cors`

## Step-by-Step Testing

### 1. Start Both Servers

**Backend** (Terminal 1):
```bash
cd prismaCrud
pnpm dev
```

**Frontend** (Terminal 2):
```bash
cd prismaCrud/client
pnpm dev
```

### 2. Create a Test User

You'll need to create a user with a hashed password. You can either:

**Option A: Use an existing user from your database**
- If you've already seeded users from `src/prisma/seed.ts`
- Check what users exist with: `npx prisma studio`

**Option B: Create a new user via API**
- You'll need to hash the password first using bcrypt
- Or update your `/add-user` endpoint to hash passwords automatically

### 3. Test the Frontend

1. **Visit Home Page**: `http://localhost:3000`
   - Should show landing page
   - Click "Get Started" or "Sign In"

2. **Login**: `http://localhost:3000/login`
   - Enter credentials
   - Example: `test@example.com` / `your_password`
   - Should redirect to dashboard on success

3. **Dashboard**: `http://localhost:3000/dashboard`
   - Shows your user info
   - Shows list of all users
   - Has logout button

4. **Test Auto-Refresh**:
   - Open DevTools → Application → Cookies
   - Delete the `accessToken` cookie (keep `refreshToken`)
   - Refresh the page
   - A new `accessToken` should appear automatically!

5. **Test Logout**:
   - Click "Logout" button
   - Should clear cookies and redirect to home

### 4. Test API Endpoints with cURL/Postman

**Login**:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }' \
  -c cookies.txt
```

**Get Current User**:
```bash
curl http://localhost:5000/auth/me \
  -b cookies.txt
```

**Refresh Token**:
```bash
curl -X POST http://localhost:5000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**Logout**:
```bash
curl -X POST http://localhost:5000/auth/logout \
  -b cookies.txt
```

## 🎯 What to Look For

### Success Indicators:
- ✅ No CORS errors in browser console
- ✅ Cookies are set after login (check DevTools)
- ✅ Dashboard shows user data
- ✅ Token auto-refreshes when expired
- ✅ Logout clears cookies and redirects

### Common Issues:

**CORS Error**:
```
Access to XMLHttpRequest at 'http://localhost:5000/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Fix**: Install cors package: `pnpm add cors @types/cors`

**401 Unauthorized**:
- User doesn't exist or wrong password
- Token expired and refresh token is invalid

**Cookies Not Set**:
- Check `withCredentials: true` in axios config
- Check CORS allows credentials on backend

## 📱 Page Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing/home page |
| `/login` | Public | Login form |
| `/dashboard` | Protected | User dashboard with data |

## 🔐 Token Lifecycle

```
Login → Access Token (15 min) + Refresh Token (7 days)
         ↓
    Access Token Expires (401)
         ↓
    Auto-refresh → New Access Token + New Refresh Token
         ↓
    Continue using app
         ↓
    Logout → Clear all tokens
```

## 🛠️ Utility Commands

**View Database**:
```bash
npx prisma studio
```

**Reset Database** (⚠️ deletes all data):
```bash
npx prisma migrate reset
```

**Generate Prisma Client** (after schema changes):
```bash
npx prisma generate
```

## 📖 For More Details

See full documentation in `AUTH_README.md`

---

Enjoy building! 🎉
