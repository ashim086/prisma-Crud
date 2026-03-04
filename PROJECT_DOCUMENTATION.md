# 📚 PrismaCrud - Full Stack Authentication Project Documentation

> **Last Updated**: March 4, 2026  
> **Tech Stack**: Next.js 16, Express.js, Prisma 7, PostgreSQL, Google OAuth 2.0

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Quick Start Guide](#-quick-start-guide)
3. [Google OAuth Implementation](#-google-oauth-implementation)
4. [Architecture Diagrams](#-architecture-diagrams)
5. [Database Schema](#-database-schema)
6. [Troubleshooting](#-troubleshooting)
7. [Environment Configuration](#-environment-configuration)
8. [Mermaid Diagram Commands](#-mermaid-diagram-commands)

---

## 🚀 Project Overview

A full-stack authentication system with local auth and Google OAuth integration.

### Features

- ✅ **Local Authentication**: Email/password with bcrypt
- ✅ **Google OAuth 2.0**: Sign in with Google
- ✅ **JWT Tokens**: AccessToken (15 min) + RefreshToken (7 days)
- ✅ **Automatic Token Refresh**: Seamless authentication
- ✅ **Secure Cookies**: HttpOnly, Secure, SameSite
- ✅ **Protected Routes**: Middleware-based authorization
- ✅ **CORS Configured**: Credentials support enabled

### Tech Stack

**Frontend:**

- Next.js 16 (App Router)
- React 19
- TanStack Query v5
- React Hook Form v7
- Axios with credentials

**Backend:**

- Express.js + TypeScript
- Prisma ORM 7
- PostgreSQL (Neon Database)
- JWT Authentication
- bcrypt for password hashing

---

## 🏃 Quick Start Guide

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL database (Neon/Supabase/local)
- Google Cloud Console project (for OAuth)

### Installation

#### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
pnpm install

# Add required packages
pnpm add @prisma/client @prisma/adapter-pg pg cors axios dotenv
pnpm add -D @types/cors @types/express prisma typescript nodemon

# Configure environment variables (see .env section below)
# Create server/.env with your configuration

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start development server
pnpm dev
```

Server runs on: `http://localhost:5000`

#### 2. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
pnpm install

# Add required packages
pnpm add @tanstack/react-query axios react-hook-form

# Configure environment variables (see .env.local section below)
# Create client/.env.local with your configuration

# Start development server
pnpm dev
```

Frontend runs on: `http://localhost:3000`

### Testing the Application

1. **Visit Home Page**: http://localhost:3000
2. **Sign Up**: Create a new account (local auth)
3. **Sign In**: Login with email/password OR Google
4. **Dashboard**: View protected dashboard at `/dashboard`
5. **Logout**: Clear session and return to home

---

## 🔐 Google OAuth Implementation

### Overview

The OAuth flow redirects users to Google for authentication, then creates/updates their account automatically. **No password required** for OAuth users.

### Implementation Steps

#### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Set **Authorized redirect URIs**:
   - Development: `http://localhost:5000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

**⚠️ IMPORTANT**: The redirect URI must **exactly match** including the `/callback` path!

#### Step 2: Backend Files

**`server/src/lib/oauth.ts`** - OAuth helper functions:

```typescript
import crypto from "crypto";
import axios from "axios";

// Generate random state for CSRF protection
export const generateState = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate Google OAuth URL
export const getGoogleAuthUrl = (state: string): string => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  };
  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

// Exchange authorization code for tokens
export const getGoogleTokens = async (code: string) => {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: "authorization_code",
  };

  const response = await axios.post(url, new URLSearchParams(values), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data;
};

// Get user info from Google
export const getGoogleUserInfo = async (access_token: string) => {
  const response = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
  );
  return response.data;
};
```

**`server/src/controller/auth.controller.ts`** - Add these controllers:

```typescript
// Initiate Google OAuth flow
export const googleAuth = asyncHandler(async (req, res, next) => {
  const state = generateState();

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const authUrl = getGoogleAuthUrl(state);
  res.redirect(authUrl);
});

// Handle Google OAuth callback
export const googleCallback = async (req: any, res: any, next: any) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  try {
    const { code, state } = req.query;
    const { oauth_state } = req.cookies;

    // Validate state (CSRF protection)
    if (!state || state !== oauth_state) {
      res.clearCookie("oauth_state");
      return res.redirect(`${frontendUrl}?error=invalid_state`);
    }

    res.clearCookie("oauth_state");

    // If no code (user cancelled), redirect to home
    if (!code || typeof code !== "string") {
      return res.redirect(frontendUrl);
    }

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Check email verification
    if (!googleUser.verified_email) {
      return res.redirect(`${frontendUrl}?error=email_not_verified`);
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: googleUser.email }, { googleId: googleUser.id }],
      },
    });

    if (user) {
      // Update existing user with Google info
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.id,
            provider: "google",
            avatar: googleUser.picture,
            name: googleUser.name || user.name,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          provider: "google",
          avatar: googleUser.picture,
        },
      });
    }

    // Generate JWT tokens
    const accessToken = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userID: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to dashboard
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.clearCookie("oauth_state");
    return res.redirect(frontendUrl);
  }
};
```

**`server/src/routes/auth.routes.ts`** - Add OAuth routes:

```typescript
import { googleAuth, googleCallback } from "../controller/auth.controller";

// Add these routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
```

#### Step 3: Frontend Components

**`client/components/GoogleLoginButton.tsx`**:

```typescript
"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
}
```

**Usage in LoginDialog and SignupDialog**:

```typescript
import GoogleLoginButton from "./GoogleLoginButton";

// In your dialog component:
<GoogleLoginButton />
```

#### Step 4: Update Login Controller

Make password optional for OAuth users in `auth.controller.ts`:

```typescript
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new customError(404, "User not found");
  }

  // Check if OAuth user
  if (!user.password) {
    throw new customError(400, "Please use Google sign-in for this account");
  }

  // Verify password
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new customError(401, "Invalid credentials");
  }

  // ... rest of the login logic
});
```

### OAuth Flow Explained

1. **User clicks "Continue with Google"** → Frontend redirects to backend
2. **Backend generates state token** → Stores in cookie for CSRF protection
3. **Backend redirects to Google** → User sees Google login page
4. **User authenticates with Google** → Google redirects back with code
5. **Backend validates state** → Prevents CSRF attacks
6. **Backend exchanges code for access token** → Gets temporary token from Google
7. **Backend fetches user profile** → Email, name, picture, googleId
8. **Backend creates/updates user** → No password needed for OAuth users
9. **Backend generates JWT tokens** → AccessToken + RefreshToken
10. **Backend sets cookies** → HttpOnly, Secure cookies
11. **Backend redirects to dashboard** → User is logged in!

### Error Handling

The OAuth callback gracefully handles all errors by redirecting to the home page:

- **User cancels**: Redirects to home page (no error shown)
- **Invalid state**: Redirects with `?error=invalid_state`
- **Email not verified**: Redirects with `?error=email_not_verified`
- **Any other error**: Logs error and redirects to home page

---

## 🏗️ Architecture Diagrams

### 1. OAuth Authentication Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend<br/>(Next.js)
    participant Backend as Backend<br/>(Express)
    participant Google as Google OAuth<br/>API
    participant DB as PostgreSQL<br/>Database

    User->>Frontend: Click "Continue with Google"
    Frontend->>Backend: GET /auth/google

    Backend->>Backend: Generate state token (CSRF)
    Backend->>Backend: Set oauth_state cookie
    Backend->>Frontend: Redirect to Google OAuth URL

    Frontend->>Google: Redirect user to Google login
    User->>Google: Enter Google credentials
    Google->>Google: Authenticate user

    Google->>Backend: Redirect to /auth/google/callback<br/>?code=xxx&state=xxx

    Backend->>Backend: Validate state token
    Backend->>Backend: Clear oauth_state cookie

    Backend->>Google: POST /token<br/>Exchange code for access_token
    Google->>Backend: Return access_token

    Backend->>Google: GET /userinfo<br/>with access_token
    Google->>Backend: Return user profile<br/>(email, name, picture, googleId)

    Backend->>DB: Find user by email or googleId

    alt User exists
        Backend->>DB: Update user with Google info
    else User does not exist
        Backend->>DB: Create new user
    end

    DB->>Backend: Return user data

    Backend->>Backend: Generate JWT tokens<br/>(accessToken, refreshToken)
    Backend->>DB: Store refreshToken
    Backend->>Backend: Set httpOnly cookies

    Backend->>Frontend: Redirect to /dashboard
    Frontend->>User: Show dashboard (logged in)
```

### 2. System Architecture (Component Diagram)

```mermaid
flowchart TB
    subgraph Client["Frontend (Next.js - Port 3000)"]
        LoginPage[Login/Signup Page]
        GoogleBtn[GoogleLoginButton Component]
        Dashboard[Dashboard Page]
        AuthContext[AuthContext Provider]
    end

    subgraph Server["Backend (Express - Port 5000)"]
        subgraph Routes["Routes Layer"]
            AuthRoutes[auth.routes.ts<br/>- POST /auth/login<br/>- POST /auth/register<br/>- GET /auth/google<br/>- GET /auth/google/callback]
        end

        subgraph Controllers["Controllers Layer"]
            AuthController[auth.controller.ts<br/>- login()<br/>- register()<br/>- googleAuth()<br/>- googleCallback()]
        end

        subgraph Middleware["Middleware"]
            AuthMiddleware[authenticateToken<br/>JWT Verification]
            ErrorHandler[Global Error Handler]
            CORS[CORS Config]
        end

        subgraph Lib["Helper Functions"]
            OAuth[oauth.ts<br/>- generateState()<br/>- getGoogleAuthUrl()<br/>- getGoogleTokens()<br/>- getGoogleUserInfo()]
            JWT[token.ts<br/>- generateToken()<br/>- verifyToken()]
            Bcrypt[bcrypt.ts<br/>- hashPassword()<br/>- comparePassword()]
        end
    end

    subgraph External["External Services"]
        GoogleAPI[Google OAuth API<br/>- Authorization<br/>- Token Exchange<br/>- User Info]
        Database[(PostgreSQL<br/>Neon Database)]
    end

    LoginPage --> GoogleBtn
    GoogleBtn -->|window.location.href| AuthRoutes
    AuthRoutes --> AuthController
    AuthController --> OAuth
    OAuth --> GoogleAPI
    GoogleAPI -->|User Info| AuthController
    AuthController --> Database
    AuthController -->|Set Cookies| Client
    AuthContext -->|useQuery| AuthRoutes
    AuthMiddleware --> JWT

    style OAuth fill:#4285f4,color:#fff
    style GoogleAPI fill:#ea4335,color:#fff
    style Database fill:#336791,color:#fff
    style AuthMiddleware fill:#fbbc04,color:#000
```

### 3. Database Schema (Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ UserPost : "has many"
    User ||--o{ RefreshToken : "has many"

    User {
        int id PK
        string name
        string email UK
        string password "nullable, for OAuth users"
        string googleId UK "nullable, unique"
        string provider "local or google"
        string avatar "nullable, profile picture URL"
        enum role "ADMIN or USER"
        datetime createdAt
    }

    UserPost {
        int id PK
        string description
        datetime creadtedat
        int userID FK
    }

    RefreshToken {
        int id PK
        string token UK
        int userID FK
        datetime expiresAt
        datetime creadtedAt
    }
```

### 4. OAuth State Machine

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> InitiatingOAuth: User clicks "Continue with Google"

    InitiatingOAuth --> GeneratingState: Backend generates state token
    GeneratingState --> StoringState: Store state in cookie
    StoringState --> RedirectingToGoogle: Redirect to Google OAuth

    RedirectingToGoogle --> GoogleLogin: User at Google login page
    GoogleLogin --> GoogleAuthenticated: User enters credentials
    GoogleLogin --> Cancelled: User clicks cancel
    Cancelled --> [*]: Redirect to home page

    GoogleAuthenticated --> Callback: Google redirects with code & state

    Callback --> ValidatingState: Backend validates state
    ValidatingState --> InvalidState: State mismatch
    InvalidState --> [*]: Redirect to home page

    ValidatingState --> ExchangingCode: State valid
    ExchangingCode --> FetchingUserInfo: Got access token

    FetchingUserInfo --> CheckingUser: Got user info from Google

    CheckingUser --> UserExists: User found in DB
    CheckingUser --> CreatingUser: User not found

    UserExists --> UpdatingUser: Update with Google info
    CreatingUser --> GeneratingTokens: New user created
    UpdatingUser --> GeneratingTokens: User updated

    GeneratingTokens --> StoringRefreshToken: JWT tokens generated
    StoringRefreshToken --> SettingCookies: Tokens stored in DB
    SettingCookies --> Authenticated: Cookies set

    Authenticated --> Dashboard: Redirect to dashboard
    Dashboard --> [*]
```

### 5. Cookie & Token Flow

```mermaid
flowchart LR
    subgraph OAuth_Flow["OAuth Authentication"]
        A[User clicks Google button]
        B[Backend sets oauth_state cookie]
        C[Google redirects back]
        D[Backend validates state from cookie]
        E[Backend clears oauth_state cookie]
    end

    subgraph Token_Generation["Token Generation"]
        F[Generate JWT accessToken<br/>15 min expiry]
        G[Generate refreshToken<br/>7 days expiry]
        H[Store refreshToken in DB]
    end

    subgraph Cookie_Setting["Cookie Setting"]
        I[Set accessToken cookie<br/>httpOnly, secure, sameSite]
        J[Set refreshToken cookie<br/>httpOnly, secure, sameSite]
    end

    subgraph Authenticated_Request["Subsequent Requests"]
        K[User makes request]
        L[Cookie auto-sent by browser]
        M[Middleware extracts accessToken]
        N[Verify JWT signature]
        O{Valid?}
        P[Attach user to req.user]
        Q[Return 401 Unauthorized]
    end

    A --> B --> C --> D --> E
    E --> F
    F --> G --> H
    H --> I
    I --> J
    J --> K
    K --> L --> M --> N --> O
    O -->|Yes| P
    O -->|No| Q

    style F fill:#34a853
    style G fill:#34a853
    style I fill:#fbbc04
    style J fill:#fbbc04
    style O fill:#ea4335
```

### 6. Error Handling Flow

```mermaid
flowchart TD
    Start[OAuth Callback Request] --> HasCode{Code<br/>Provided?}

    HasCode -->|No - User Cancelled| R1[Redirect to home page]
    HasCode -->|Yes| ValidateState{State<br/>Valid?}

    ValidateState -->|No| R2[Clear state cookie<br/>Redirect to home with error]
    ValidateState -->|Yes| ExchangeCode[Exchange code for token]

    ExchangeCode --> CodeExchange{Exchange<br/>Success?}
    CodeExchange -->|No| R3[Log error<br/>Redirect to home]
    CodeExchange -->|Yes| FetchUser[Fetch user info from Google]

    FetchUser --> FetchSuccess{Fetch<br/>Success?}
    FetchSuccess -->|No| R4[Log error<br/>Redirect to home]
    FetchSuccess -->|Yes| VerifyEmail{Email<br/>Verified?}

    VerifyEmail -->|No| R5[Redirect to home with error]
    VerifyEmail -->|Yes| CheckDB[Check user in database]

    CheckDB --> DBOperation{DB<br/>Operation<br/>Success?}
    DBOperation -->|No| R6[Log error<br/>Redirect to home]
    DBOperation -->|Yes| GenerateTokens[Generate JWT tokens]

    GenerateTokens --> TokenGen{Token<br/>Generation<br/>Success?}
    TokenGen -->|No| R7[Log error<br/>Redirect to home]
    TokenGen -->|Yes| SetCookies[Set httpOnly cookies]

    SetCookies --> Redirect[Redirect to dashboard]
    Redirect --> Success[🎉 User logged in!]

    R1 --> End[User at home page]
    R2 --> End
    R3 --> End
    R4 --> End
    R5 --> End
    R6 --> End
    R7 --> End

    style Success fill:#34a853,color:#fff
    style R1 fill:#ea4335,color:#fff
    style R2 fill:#ea4335,color:#fff
    style R3 fill:#ea4335,color:#fff
    style R4 fill:#ea4335,color:#fff
    style R5 fill:#ea4335,color:#fff
    style R6 fill:#ea4335,color:#fff
    style R7 fill:#ea4335,color:#fff
```

### 7. Authentication Methods Comparison

```mermaid
flowchart TB
    subgraph Local_Auth["Local Authentication (Email/Password)"]
        L1[User submits email + password]
        L2[Backend hashes password with bcrypt]
        L3[Compare with DB hash]
        L4[Generate JWT tokens]
        L5[Set httpOnly cookies]
    end

    subgraph OAuth_Auth["OAuth Authentication (Google)"]
        O1[User clicks Google button]
        O2[Redirect to Google]
        O3[Google authenticates]
        O4[Exchange code for token]
        O5[Fetch user info]
        O6[Create/Update user in DB<br/>No password stored]
        O7[Generate JWT tokens]
        O8[Set httpOnly cookies]
    end

    subgraph Common["Common Flow"]
        C1[User authenticated]
        C2[Access protected routes]
        C3[Token refresh on expiry]
        C4[Logout clears cookies]
    end

    L1 --> L2 --> L3 --> L4 --> L5 --> C1
    O1 --> O2 --> O3 --> O4 --> O5 --> O6 --> O7 --> O8 --> C1
    C1 --> C2 --> C3
    C2 --> C4

    style Local_Auth fill:#e3f2fd
    style OAuth_Auth fill:#fce4ec
    style Common fill:#f1f8e9
```

---

## 📊 Database Schema

### Prisma Schema (schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  ADMIN
  USER
}

model User {
  id       Int     @id @default(autoincrement())
  name     String  @default("pedro")
  email    String  @unique
  password String? @unique     // nullable for OAuth users
  googleId String? @unique     // Google OAuth ID
  provider String  @default("local")  // "local" or "google"
  avatar   String?             // Profile picture URL

  role          Role           @default(USER)
  posts         UserPost[]
  refreshTokens RefreshToken[]
  createdAt     DateTime       @default(now())
}

model UserPost {
  id          Int      @id @default(autoincrement())
  description String
  creadtedat  DateTime @default(now())
  userID      Int
  user        User     @relation(fields: [userID], references: [id])
}

model RefreshToken {
  id         Int      @id @default(autoincrement())
  token      String   @unique
  userID     Int
  user       User     @relation(fields: [userID], references: [id])
  expiresAt  DateTime
  creadtedAt DateTime @default(now())
}
```

### Running Migrations

```bash
# Create migration for OAuth fields
npx prisma migrate dev --name add_oauth_fields

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to view data
npx prisma studio
```

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. OAuth Button Not Redirecting

**Symptoms:**

- Button click does nothing
- No network request in DevTools

**Solution:**

```bash
# Restart both servers
cd server && pnpm dev
cd client && pnpm dev

# Clear browser cache or use incognito mode
```

#### 2. Error: redirect_uri_mismatch

**Symptoms:**

- Google shows "Error 400: redirect_uri_mismatch"

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. In "Authorized redirect URIs", add **exactly**:
   - `http://localhost:5000/auth/google/callback`
5. Save and wait 5 minutes for propagation
6. Clear browser cache or use incognito

**⚠️ Common Mistake**: Adding `http://localhost:5000` instead of the full callback URL with `/auth/google/callback`

#### 3. CORS Errors

**Symptoms:**

- "No 'Access-Control-Allow-Origin' header"
- Credentials not sent

**Solution:**
Check backend CORS configuration:

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
```

Check frontend Axios configuration:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
});
```

#### 4. Database Column Errors

**Symptoms:**

- "column (not available) does not exist"
- "Invalid `prisma.user.findFirst()` invocation"

**Solution:**

```bash
# Run migrations
npx prisma migrate dev

# Regenerate Prisma Client
npx prisma generate

# Restart server
pnpm dev
```

#### 5. JWT Token Errors

**Symptoms:**

- "Invalid token"
- "jwt malformed"

**Solution:**

1. Check `.env` has `JWT_SECRET` configured
2. Ensure cookies are set with correct domain
3. Clear all cookies and login again

#### 6. User Cancelled OAuth

**Behavior:**

- User clicks cancel on Google login
- Automatically redirected to home page (no error shown)

This is **expected behavior**. The application gracefully handles cancellation.

### Debugging Checklist

- [ ] Both servers running (backend on 5000, frontend on 3000)
- [ ] Environment variables configured in both `.env` files
- [ ] Google Cloud Console redirect URI matches exactly
- [ ] Prisma migrations applied
- [ ] Prisma Client generated
- [ ] Browser cache cleared or using incognito
- [ ] CORS configured with credentials: true
- [ ] No TypeScript errors in terminal

### Step-by-Step Debug Process

1. **Check Backend Logs**: Look for errors in server terminal
2. **Check Network Tab**: See if requests are reaching backend
3. **Check Cookies**: Verify cookies are being set in DevTools
4. **Check Database**: Use `npx prisma studio` to verify data
5. **Check Environment Variables**: Ensure all required vars are set
6. **Restart Everything**: Sometimes a clean restart fixes issues

---

## ⚙️ Environment Configuration

### Server Environment (.env)

Create `server/.env`:

```env
# ==============================================
# SERVER ENVIRONMENT VARIABLES
# ==============================================

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_PRIVATE_KEY=your_private_key_here

# Google OAuth Credentials
# Get from: https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:3000
```

### Client Environment (.env.local)

Create `client/.env.local`:

```env
# Next.js Public Variables
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**⚠️ IMPORTANT**:

- Never commit `.env` files with real credentials
- Add to `.gitignore`: `.env`, `.env.local`, `.env.production`
- Use different credentials for production

---

## 🎨 Mermaid Diagram Commands

### Viewing Diagrams

#### Option 1: GitHub (Automatic)

Commit this file to GitHub - diagrams render automatically!

#### Option 2: VS Code

Install extension:

```bash
code --install-extension bierner.markdown-mermaid
```

View preview: `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (Mac)

#### Option 3: Mermaid Live Editor

1. Visit https://mermaid.live/
2. Copy any diagram code from this file
3. Paste into editor
4. Download as PNG/SVG

### Generating Diagram Images

#### Install Mermaid CLI

```bash
# Install globally
npm install -g @mermaid-js/mermaid-cli

# Or with pnpm
pnpm add -g @mermaid-js/mermaid-cli
```

#### Generate Individual Diagrams

Save a diagram to a `.mmd` file, then:

```bash
# Generate PNG
mmdc -i oauth-flow.mmd -o docs/oauth-flow.png

# Generate SVG (better quality, scalable)
mmdc -i oauth-flow.mmd -o docs/oauth-flow.svg

# Generate PDF
mmdc -i oauth-flow.mmd -o docs/oauth-flow.pdf

# Custom size
mmdc -i oauth-flow.mmd -o docs/oauth-flow.png -w 1920 -h 1080

# Dark theme
mmdc -i oauth-flow.mmd -o docs/oauth-flow.png -t dark

# Different themes: default, forest, dark, neutral
mmdc -i oauth-flow.mmd -o docs/oauth-flow.png -t forest
```

#### Batch Generate All Diagrams

**For Windows** - Create `generate-diagrams.bat`:

```batch
@echo off
mkdir docs\diagrams 2>nul

echo Generating OAuth Sequence Diagram...
mmdc -i diagrams\oauth-sequence.mmd -o docs\diagrams\oauth-sequence.png
mmdc -i diagrams\oauth-sequence.mmd -o docs\diagrams\oauth-sequence.svg

echo Generating System Architecture...
mmdc -i diagrams\system-architecture.mmd -o docs\diagrams\system-architecture.png
mmdc -i diagrams\system-architecture.mmd -o docs\diagrams\system-architecture.svg

echo Generating Database Schema...
mmdc -i diagrams\database-schema.mmd -o docs\diagrams\database-schema.png
mmdc -i diagrams\database-schema.mmd -o docs\diagrams\database-schema.svg

echo Generating OAuth State Machine...
mmdc -i diagrams\oauth-state-machine.mmd -o docs\diagrams\oauth-state-machine.png
mmdc -i diagrams\oauth-state-machine.mmd -o docs\diagrams\oauth-state-machine.svg

echo Generating Cookie Flow...
mmdc -i diagrams\cookie-flow.mmd -o docs\diagrams\cookie-flow.png
mmdc -i diagrams\cookie-flow.mmd -o docs\diagrams\cookie-flow.svg

echo Generating Error Handling...
mmdc -i diagrams\error-handling.mmd -o docs\diagrams\error-handling.png
mmdc -i diagrams\error-handling.mmd -o docs\diagrams\error-handling.svg

echo Generating Auth Comparison...
mmdc -i diagrams\auth-comparison.mmd -o docs\diagrams\auth-comparison.png
mmdc -i diagrams\auth-comparison.mmd -o docs\diagrams\auth-comparison.svg

echo All diagrams generated successfully!
pause
```

**For Mac/Linux** - Create `generate-diagrams.sh`:

```bash
#!/bin/bash

# Create output directory
mkdir -p docs/diagrams

# Array of diagram files
diagrams=(
    "oauth-sequence"
    "system-architecture"
    "database-schema"
    "oauth-state-machine"
    "cookie-flow"
    "error-handling"
    "auth-comparison"
)

# Generate PNG and SVG for each diagram
for diagram in "${diagrams[@]}"; do
    echo "Generating $diagram..."
    mmdc -i "diagrams/$diagram.mmd" -o "docs/diagrams/$diagram.png"
    mmdc -i "diagrams/$diagram.mmd" -o "docs/diagrams/$diagram.svg"
done

echo "All diagrams generated!"
```

Make executable and run:

```bash
chmod +x generate-diagrams.sh
./generate-diagrams.sh
```

### Using Diagrams in Documentation

#### In README.md:

```markdown
## Architecture

![OAuth Flow](docs/diagrams/oauth-sequence.png)

See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for complete docs.
```

#### In Docusaurus/VitePress:

````markdown
## OAuth Flow

```mermaid
[paste diagram code]
```
````

````

#### In Pull Requests:
Include relevant diagrams to help reviewers understand changes.

### Mermaid Diagram Tips

1. **Comments**: Use `%%` for documentation
```mermaid
%% This diagram shows the OAuth flow
%% Author: Your Name
%% Last Updated: 2026-03-04
````

2. **Styling**: Customize colors and styles

```mermaid
flowchart TD
    A[Start] --> B[End]
    style A fill:#34a853,color:#fff
```

3. **Themes**: Use built-in themes
   - `default` - Mermaid default
   - `forest` - Green theme
   - `dark` - Dark mode
   - `neutral` - Gray theme

4. **Keep in Sync**: Update diagrams when code changes

### Additional Mermaid Resources

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [Mermaid Cheat Sheet](https://jojozhuang.github.io/tutorial/mermaid-cheat-sheet/)
- [GitHub Mermaid Guide](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)

---

## 📚 Additional Resources

### Prisma Documentation

- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### OAuth & Security

- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Simplified](https://www.oauth.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Next.js & React

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query Guide](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)

---

## 🚀 Deployment Considerations

### Environment Variables for Production

**Backend (.env.production):**

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_production_database_url
JWT_SECRET=use-a-strong-random-secret-min-32-chars
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env.production):**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Strong JWT secret (min 32 characters)
- [ ] Secure cookies enabled (`secure: true`)
- [ ] Update Google OAuth redirect URI to production URL
- [ ] Enable CORS only for your frontend domain
- [ ] Add rate limiting to auth endpoints
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] Keep dependencies updated

---

## 📝 License

This project is open source and available for learning purposes.

---

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Last Updated**: March 4, 2026  
**Version**: 1.0.0  
**Maintained by**: [Your Name]

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [Architecture Diagrams](#-architecture-diagrams)
3. Check environment configuration
4. Restart servers and clear cache
5. Open an issue with detailed error logs

---

_Happy Coding! 🚀_
