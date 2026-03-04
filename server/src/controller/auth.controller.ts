import { prisma } from "../config/db";
import asyncHandler from "../lib/asyncHandler";
import { comparePassword, hashPassord } from "../lib/bcrypt";
import customError from "../lib/customError";
import successMsG from "../lib/responseHandler";
import { generateRefreshToken, generateToken } from "../lib/token";
import { AuthRequest } from "../middlewares/auth.middleware";

export type IPayload = {
    id: number,
    email: string,
    name: string
}

export const register = asyncHandler(async (req, res, next) => {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
        throw new customError(400, "Email, password, and name are required");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new customError(409, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassord(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name
        }
    });

    // Generate tokens
    const payload: IPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
    }

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken();

    // Store refresh token in DB
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userID: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });

    // Set cookies
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    successMsG(201, userWithoutPassword, res, 'User registered successfully');
});

export const login = asyncHandler(async (req, res, next) => {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (!user) {
        throw new customError(401, "Authentication error: Invalid email or password")
    }

    //compare password hashed
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
        throw new customError(401, "Authentication error: Invalid email or password")
    }

    //generate tokens
    const payload: IPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
    }

    const accessToken = generateToken(payload)
    const refreshToken = generateRefreshToken();

    // Store refresh token in DB
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userID: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    })

    // Set cookies
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    successMsG(200, user, res, 'Logged in successfully')
})

export const refresh = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        throw new customError(401, "Unauthorized: No refresh token provided");
    }

    // Find token in DB
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
    });

    if (!storedToken) {
        throw new customError(403, "Invalid refresh token");
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({
            where: { token: refreshToken }
        });

        throw new customError(403, "Refresh token expired");
    }

    // Get user info for new access token
    const user = await prisma.user.findUnique({
        where: { id: storedToken.userID }
    });

    if (!user) {
        throw new customError(404, "User not found");
    }

    // DELETE old refresh token (ROTATION STEP)
    await prisma.refreshToken.delete({
        where: { token: refreshToken }
    });

    // Generate new tokens
    const payload: IPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
    }
    const newAccessToken = generateToken(payload);
    const newRefreshToken = generateRefreshToken();

    // Store new refresh token in DB
    await prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userID: storedToken.userID,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    // Send new cookies
    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    successMsG(200, { message: "Tokens rotated successfully" }, res, "Tokens refreshed");
});

export const logout = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
        // Delete refresh token from database
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        }).catch(() => {
            // Token might not exist in DB, continue anyway
        });
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    successMsG(200, { message: "Logged out successfully" }, res, "Logout successful");
});

export const getCurrentUser = asyncHandler(async (req: AuthRequest, res, next) => {
    // Get user from database using ID from token
    const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        }
    });

    if (!user) {
        throw new customError(404, "User not found");
    }

    successMsG(200, user, res, "User retrieved successfully");
});