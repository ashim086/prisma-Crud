# Authentication System - Setup Guide

## 🚀 Overview

This is a full-stack authentication system with:
- **Backend**: Express.js + Prisma + PostgreSQL
- **Frontend**: Next.js 16 + React Query + Axios
- **Auth Flow**: JWT Access Tokens + Refresh Token Rotation
- **Security**: HttpOnly cookies, automatic token refresh

---

## 📦 Installation

### Backend Setup

1. **Install dependencies** (if not already done):
```bash
cd prismaCrud
pnpm install
pnpm add cors @types/cors
```

2. **Configure environment variables**:
Create/update `.env` file:
```env
DATABASE_URL="your_postgresql_connection_string"
JWT_PRIVATE_KEY="your_secret_key_here"
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"
PORT=5000
```

3. **Run migrations** (RefreshToken model should already be migrated):
```bash
npx prisma migrate dev
```

4. **Start the server**:
```bash
pnpm dev
```

Server runs on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to client folder**:
```bash
cd client
```

2. **Install dependencies** (should already be done):
```bash
pnpm install
```

3. **Environment variables**:
Already created at `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. **Start the dev server**:
```bash
pnpm dev
```

Client runs on: `http://localhost:3000`

---

## 🔐 Authentication Flow

### 1. **Login** (`POST /auth/login`)
- User provides email & password
- Server validates credentials
- Returns access token (15 min) + refresh token (7 days) as httpOnly cookies
- Access token contains user payload (id, name, email)

### 2. **Protected Routes** (`GET /auth/me`)
- Client sends request with cookies
- Backend middleware verifies access token
- Returns user data if valid
- Returns 401 if expired/invalid

### 3. **Token Refresh** (`POST /auth/refresh`)
- When access token expires (401), axios interceptor automatically calls this
- Uses refresh token from cookies
- **Rotation**: Deletes old refresh token, creates new one
- Returns new access token + refresh token

### 4. **Logout** (`POST /auth/logout`)
- Deletes refresh token from database
- Clears both cookies
- Client redirects to login

---

## 🛠️ Backend API Endpoints

### Authentication Routes

#### `POST /auth/login`
**Body**:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2026-03-04T10:00:00.000Z"
  }
}
```

**Cookies Set**:
- `accessToken` (HttpOnly, 15 min)
- `refreshToken` (HttpOnly, 7 days)

---

#### `GET /auth/me` 🔒 Protected
**Headers**: Cookies with accessToken

**Response** (200):
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2026-03-04T10:00:00.000Z"
  }
}
```

---

#### `POST /auth/refresh`
**Headers**: Cookies with refreshToken

**Response** (200):
```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "message": "Tokens rotated successfully"
  }
}
```

**New Cookies Set**: New accessToken + refreshToken

---

#### `POST /auth/logout`
**Headers**: Cookies with refreshToken (optional)

**Response** (200):
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Cookies Cleared**: accessToken, refreshToken deleted

---

## 💻 Frontend Components

### File Structure
```
client/
├── api/
│   └── index.ts              # Axios instance + API functions
├── app/
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state management
│   ├── providers/
│   │   └── QueryProvider.tsx # React Query setup
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── dashboard/
│   │   └── page.tsx          # Protected dashboard
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Home page
└── .env.local
```

### Key Features

#### **Axios Instance** (`api/index.ts`)
- Base URL configuration
- `withCredentials: true` for cookies
- Automatic 401 handling → refresh token
- Retry failed requests after refresh

#### **Auth Context** (`app/context/AuthContext.tsx`)
```typescript
const { user, isAuthenticated, isLoading, login, logout } = useAuth();
```

- `user`: Current user object or null
- `isAuthenticated`: Boolean auth status
- `isLoading`: Loading state
- `login(credentials)`: Login function
- `logout()`: Logout function

#### **Protected Routes**
```typescript
// In any component
const { isAuthenticated, isLoading } = useAuth();

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login');
  }
}, [isLoading, isAuthenticated, router]);
```

---

## 🧪 Testing the System

### 1. Create a Test User (Backend)
```bash
# Using your existing POST /add-user endpoint
curl -X POST http://localhost:5000/add-user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "$2a$10$hashed_password_here"
  }'
```

Or use bcrypt to hash a password first.

### 2. Test Login (Frontend)
1. Go to `http://localhost:3000/login`
2. Enter credentials
3. Should redirect to `/dashboard`
4. Check browser cookies (should see `accessToken` and `refreshToken`)

### 3. Test Protected Route
1. Go to `http://localhost:3000/dashboard`
2. Should see user info and users list
3. Try opening DevTools → Application → Cookies
4. Delete `accessToken` → Page should auto-refresh token
5. Delete both cookies → Should redirect to login

### 4. Test Logout
1. Click "Logout" button
2. Cookies should be cleared
3. Redirected to home page

---

## 🔒 Security Features

✅ **HttpOnly Cookies**: Prevents XSS attacks  
✅ **Refresh Token Rotation**: Old tokens invalidated on refresh  
✅ **Token Expiry**: Access token (15 min), Refresh token (7 days)  
✅ **CORS Configuration**: Only allow specific origins  
✅ **Secure Cookies**: In production with HTTPS  
✅ **Database Token Storage**: Refresh tokens stored in DB  
✅ **Password Hashing**: Using bcrypt  

---

## 🐛 Common Issues

### CORS Errors
**Solution**: Make sure:
```typescript
// Backend: src/index.ts
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Frontend: api/index.ts
withCredentials: true
```

### Cookies Not Sent
**Solution**: 
- Check `withCredentials: true` in axios
- Verify CORS allows credentials
- Backend and frontend on same domain or CORS configured

### Token Refresh Loop
**Solution**:
- Check `/auth/refresh` endpoint works
- Verify refresh token in DB is valid
- Check token expiry times

---

## 📚 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend Framework | Express.js |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Frontend Framework | Next.js 16 |
| State Management | React Query + Context API |
| HTTP Client | Axios |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Styling | Tailwind CSS |

---

## 🎯 Next Steps

1. ✅ Authentication is complete
2. Add more protected routes
3. Implement role-based access control (RBAC)
4. Add email verification
5. Add password reset functionality
6. Add rate limiting
7. Add logging middleware

---

## 📝 Notes

- Access tokens are short-lived (15 min) for security
- Refresh tokens are long-lived (7 days) but stored in DB and can be revoked
- Token rotation ensures old refresh tokens can't be reused
- Always use HTTPS in production
- Consider adding rate limiting to prevent brute force attacks

---

Happy coding! 🚀
