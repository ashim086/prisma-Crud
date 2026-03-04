import { Router } from "express";
import { login, logout, refresh, getCurrentUser, register } from "../controller/auth.controller";
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

export default router;
