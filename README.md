# 🔐 PrismaCrud - Full Stack Authentication System

A modern full-stack authentication system with **local auth** and **Google OAuth 2.0** integration.

## ⚡ Quick Start

```bash
# Backend
cd server
pnpm install
npx prisma migrate dev
pnpm dev

# Frontend (in another terminal)
cd client
pnpm install
pnpm dev
```

**Backend**: http://localhost:5000  
**Frontend**: http://localhost:3000

## 🚀 Features

- ✅ **Local Authentication** - Email/password with bcrypt
- ✅ **Google OAuth 2.0** - Sign in with Google
- ✅ **JWT Tokens** - AccessToken + RefreshToken rotation
- ✅ **Automatic Token Refresh** - Seamless authentication
- ✅ **Secure Cookies** - HttpOnly, Secure, SameSite
- ✅ **Protected Routes** - Middleware-based authorization
- ✅ **Modern Stack** - Next.js 16, Express, Prisma 7, PostgreSQL

## 📚 Complete Documentation

**👉 [VIEW COMPLETE DOCUMENTATION](PROJECT_DOCUMENTATION.md) 👈**

The complete documentation includes:

- 📖 Detailed setup guides
- 🔐 Google OAuth implementation steps
- 🏗️ Architecture diagrams (Mermaid)
- 📊 Database schema
- 🛠️ Troubleshooting guide
- ⚙️ Environment configuration
- 🎨 Diagram generation commands

## 🏗️ Tech Stack

**Frontend:**

- Next.js 16 (App Router)
- React 19
- TanStack Query v5
- React Hook Form v7
- Axios

**Backend:**

- Express.js + TypeScript
- Prisma ORM 7
- PostgreSQL (Neon)
- JWT Authentication
- Google OAuth 2.0

## 📸 Architecture Preview

The system implements OAuth 2.0 flow:

1. User clicks "Continue with Google"
2. Backend generates state token and redirects to Google
3. User authenticates with Google
4. Google redirects back with authorization code
5. Backend exchanges code for user info
6. User is created/updated in database
7. JWT tokens are generated and set as cookies
8. User is redirected to dashboard

**See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for complete architecture diagrams!**

## ⚙️ Environment Setup

**Server** (`server/.env`):

```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**Client** (`client/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🛠️ Common Issues

**OAuth not working?**

1. Check Google Cloud Console redirect URI is **exactly**: `http://localhost:5000/auth/google/callback`
2. Restart both servers
3. Clear browser cache

**Database errors?**

```bash
npx prisma migrate dev
npx prisma generate
```

**For more troubleshooting, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#-troubleshooting)**

## 📝 Project Structure

```
prismaCrud/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── api/               # API client
├── server/                # Express backend
│   └── src/
│       ├── controller/    # Request handlers
│       ├── routes/        # API routes
│       ├── lib/           # Helper functions (OAuth, JWT, bcrypt)
│       ├── middlewares/   # Auth middleware
│       └── prisma/        # Database schema & migrations
└── PROJECT_DOCUMENTATION.md  # 📚 Complete docs!
```

## 🎯 API Endpoints

**Authentication:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Handle OAuth callback
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

## 🤝 Contributing

This is a learning project. Feel free to:

- Report issues
- Suggest improvements
- Fork and experiment

## 📄 License

Open source for educational purposes.

---

**For complete documentation with architecture diagrams, troubleshooting, and deployment guides:**  
👉 **[READ PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** 👈

---

Made with ❤️ using Next.js, Express, and Prisma
