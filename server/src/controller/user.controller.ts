import { prisma } from "../config/db";
import asyncHandler from "../lib/asyncHandler";
import successMsG from "../lib/responseHandler";
import customError from "../lib/customError";
import { hashPassord } from "../lib/bcrypt";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req: AuthRequest, res) => {
    // You can access authenticated user info
    console.log('Request by user:', req.user?.email);
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        }
    });

    successMsG(200, users, res, 'Users fetched successfully');
});

/**
 * Create a new user
 */
export const createUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        throw new customError(400, "Name, email, and password are required");
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
            name,
            email,
            password: hashedPassword
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        }
    });

    successMsG(201, user, res, 'User created successfully');
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    // You can access the authenticated user's info from req.user
    console.log('Authenticated user:', req.user);

    const user = await prisma.user.findUnique({
        where: {
            id: Number(id),
        },
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

    successMsG(200, user, res, 'User fetched successfully');
});

/**
 * Update user by ID
 */
export const updateUser = asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Example: Only allow users to update their own profile
    if (req.user?.id !== Number(id)) {
        throw new customError(403, "You can only update your own profile");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: Number(id) }
    });

    if (!existingUser) {
        throw new customError(404, "User not found");
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await hashPassord(password);

    const user = await prisma.user.update({
        where: {
            id: Number(id)
        },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        }
    });

    successMsG(200, user, res, 'User updated successfully');
});

/**
 * Delete user by ID
 */
export const deleteUser = asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    // Example: Only allow users to delete their own account
    if (req.user?.id !== Number(id)) {
        throw new customError(403, "You can only delete your own account");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: Number(id) }
    });

    if (!existingUser) {
        throw new customError(404, "User not found");
    }

    // Delete associated posts first
    await prisma.userPost.deleteMany({
        where: {
            userID: Number(id)
        }
    });

    // Delete refresh tokens
    await prisma.refreshToken.deleteMany({
        where: {
            userID: Number(id)
        }
    });

    // Delete user
    const user = await prisma.user.delete({
        where: {
            id: Number(id)
        },
        select: {
            id: true,
            name: true,
            email: true,
        }
    });

    successMsG(200, user, res, 'User deleted successfully');
});