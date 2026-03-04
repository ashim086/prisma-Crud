import { Router } from "express";
import { login, logout, refresh, getCurrentUser, register, googleAuth, googleCallback } from "../controller/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// POST /auth/register - User registration
router.post("/register", register);

// POST /auth/login - User login
router.post("/login", login);

// POST /auth/refresh - Refresh access token
router.post("/refresh", refresh);

// POST /auth/logout - User logout
router.post("/logout", logout);

// GET /auth/me - Get current user (protected route)
router.get("/me", authenticateToken, getCurrentUser);

// Google OAuth routes
// GET /auth/google - Initiate Google OAuth flow
router.get("/google", googleAuth);

// GET /auth/google/callback - Handle Google OAuth callback
router.get("/google/callback", googleCallback);

export default router;
