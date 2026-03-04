# Prisma 7 + PostgreSQL (Neon) — Database Connection Guide

A step-by-step guide for connecting a PostgreSQL database to a Node.js/Express/TypeScript project using **Prisma 7**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install Dependencies](#2-install-dependencies)
3. [Initialize Prisma](#3-initialize-prisma)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Configure prisma.config.ts](#5-configure-prismaconfigts)
6. [Define the Prisma Schema](#6-define-the-prisma-schema)
7. [Generate Prisma Client](#7-generate-prisma-client)
8. [Connect to the Database in Code](#8-connect-to-the-database-in-code)
9. [Run Migrations](#9-run-migrations)
10. [Verify the Connection](#10-verify-the-connection)
11. [Common Errors & Troubleshooting](#11-common-errors--troubleshooting)
12. [Key Differences in Prisma 7](#12-key-differences-in-prisma-7)

---

## 1. Prerequisites

- **Node.js** (v18+)
- **pnpm** (or npm/yarn)
- **TypeScript** project set up (`tsconfig.json`)
- **A PostgreSQL database** (e.g., Neon, Supabase, local PostgreSQL)

---

## 2. Install Dependencies

### Production dependencies

```bash
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
```

| Package              | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `@prisma/client`     | The Prisma ORM client for querying the database |
| `@prisma/adapter-pg` | PostgreSQL driver adapter (required in Prisma 7) |
| `pg`                 | Node.js PostgreSQL client                       |
| `dotenv`             | Loads environment variables from `.env`          |

### Dev dependencies

```bash
pnpm add -D prisma @types/pg @types/node typescript ts-node
```

| Package      | Purpose                                 |
| ------------ | --------------------------------------- |
| `prisma`     | Prisma CLI for migrations & generation  |
| `@types/pg`  | TypeScript types for the `pg` package   |

---

## 3. Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma.config.ts` — Prisma configuration file (at project root)
- `prisma/schema.prisma` — Default schema file (we move ours to `src/prisma/`)

> **Note:** In Prisma 7, `prisma.config.ts` **must** be at the project root.

---

## 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=6000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=yourSecretKey
```

### For Neon specifically:

```env
DATABASE_URL=postgresql://neondb_owner:your_password@ep-your-endpoint.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

> **Important:** The variable name must be `DATABASE_URL` — this is what `prisma.config.ts` reads.

---

## 5. Configure prisma.config.ts

This file lives at the **project root** (not inside `src/`).

```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Path to your schema file (relative to project root)
  schema: "src/prisma/schema.prisma",

  // Path for migration files
  migrations: {
    path: "src/prisma/migrations",
  },

  // Database URL for Prisma CLI (migrations, db pull, etc.)
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### What each property does:

| Property         | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `schema`         | Path to `schema.prisma` relative to project root                |
| `migrations.path`| Where migration SQL files are stored                            |
| `datasource.url` | Connection string used by Prisma CLI (migrate, db pull, etc.)   |

---

## 6. Define the Prisma Schema
    `
File: `src/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"    // Output path relative to schema file
}

datasource db {
  provider = "postgresql"
  // NOTE: In Prisma 7, do NOT add `url` here.
  // The URL is configured in prisma.config.ts (for CLI)
  // and via the adapter (for runtime).
}
```

### Key points:

- **`output`**: The generated client goes to `src/generated/prisma/` (relative to the schema file location).
- **No `url` in datasource**: Prisma 7 removed `url` from the schema — it must be in `prisma.config.ts` for CLI operations and passed via adapter at runtime.

---

## 7. Generate Prisma Client

```bash
npx prisma generate
```

**Expected output:**
```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from src\prisma\schema.prisma.
✔ Generated Prisma Client (v7.4.2) to .\src\generated\prisma
```

This generates the type-safe client at `src/generated/prisma/`.

> Run this command every time you change `schema.prisma`.

---

## 8. Connect to the Database in Code

File: `src/index.ts`

```typescript
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Step 1: Create the PostgreSQL adapter with your connection string
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Step 2: Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: `Server running with ENV ${process.env.NODE_ENV}` });
});

// Step 3: Connect to DB when server starts
app.listen(PORT, async () => {
    try {
        await prisma.$connect();
        console.log("✅ Database connected successfully!");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
    console.log(`Server running on http://localhost:${PORT}`);
});
```

### How the connection works (3 layers):

```
┌─────────────────────────────────────────────────┐
│  .env                                           │
│  DATABASE_URL=postgresql://user:pass@host/db    │
└──────────────────┬──────────────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │  @prisma/adapter-pg         │
    │  PrismaPg({ connectionString })  │
    │  (creates the pg connection) │
    └──────────────┬──────────────┘
                   │
    ┌──────────────▼──────────────┐
    │  PrismaClient({ adapter })  │
    │  (ORM layer for queries)    │
    └──────────────┬──────────────┘
                   │
    ┌──────────────▼──────────────┐
    │  prisma.$connect()          │
    │  (establishes connection)   │
    └─────────────────────────────┘
```

---

## 9. Run Migrations

Once you have models in your schema, create and apply migrations:

```bash
# Create a new migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Pull existing DB schema into your schema file
npx prisma db pull

# Push schema changes without migration files (prototyping)
npx prisma db push
```

---

## 10. Verify the Connection

### Method 1: Start the server

```bash
npx ts-node src/index.ts
```

**Success output:**
```
✅ Database connected successfully!
Server running on http://localhost:6000
```

### Method 2: Use Prisma CLI

```bash
npx prisma db pull
```

**Success output (empty DB):**
```
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-xxx.neon.tech"
```

### Method 3: Open Prisma Studio

```bash
npx prisma studio
```

This opens a visual database browser at `http://localhost:5555`.

---

## 11. Common Errors & Troubleshooting

### Error: `The datasource.url property is required in your Prisma config file`
**Cause:** `prisma.config.ts` is not at the project root or `DATABASE_URL` is missing from `.env`.
**Fix:** Move `prisma.config.ts` to the root and ensure `.env` has `DATABASE_URL`.

### Error: `The datasource property url is no longer supported in schema files`
**Cause:** You added `url = env("DATABASE_URL")` inside `schema.prisma`.
**Fix:** Remove `url` from the datasource block in `schema.prisma`. In Prisma 7, the URL goes in `prisma.config.ts` and the adapter.

### Error: `PrismaClient needs to be constructed with non-empty, valid PrismaClientOptions`
**Cause:** `new PrismaClient()` was called without an adapter.
**Fix:** Install `@prisma/adapter-pg` and `pg`, then pass the adapter:
```typescript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### Error: `P4001 The introspected database was empty`
**Cause:** The DB connection works but there are no tables yet.
**Fix:** This is not a real error — define models in your schema and run `npx prisma migrate dev`.

---

## 12. Key Differences in Prisma 7

| Feature                  | Prisma 6 (and earlier)             | Prisma 7                                  |
| ------------------------ | ---------------------------------- | ----------------------------------------- |
| Database URL in schema   | `url = env("DATABASE_URL")`        | ❌ Not allowed                            |
| Database URL for CLI     | In `schema.prisma`                 | In `prisma.config.ts` → `datasource.url`  |
| Database URL at runtime  | Auto-read from schema              | Passed via **driver adapter**             |
| Config file              | Not required                       | `prisma.config.ts` at project root        |
| Client construction      | `new PrismaClient()`               | `new PrismaClient({ adapter })`           |
| Required packages        | `prisma`, `@prisma/client`         | + `@prisma/adapter-pg`, `pg`              |

---

## Project Structure Reference

```
prismaCrud/
├── prisma.config.ts          # Prisma config (MUST be at root)
├── .env                      # DATABASE_URL lives here
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Express server + Prisma connection
    ├── generated/
    │   └── prisma/           # Auto-generated Prisma Client
    └── prisma/
        └── schema.prisma     # Database schema & models
```

---

## Quick Start Summary

```bash
# 1. Install packages
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
pnpm add -D prisma @types/pg

# 2. Initialize Prisma
npx prisma init

# 3. Add DATABASE_URL to .env
# 4. Configure prisma.config.ts (project root)
# 5. Define schema in src/prisma/schema.prisma
# 6. Generate client
npx prisma generate

# 7. Create & apply migration
npx prisma migrate dev --name init

# 8. Start server
npx ts-node src/index.ts
# ✅ Database connected successfully!
```
