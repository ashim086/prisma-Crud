import { prisma } from "../config/db";
import asyncHandler from "../lib/asyncHandler";
import successMsG from "../lib/responseHandler";
import customError from "../lib/customError";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Create a post for a user
 */
export const createPost = asyncHandler(async (req: AuthRequest, res) => {
    const { userId } = req.params;
    const { description } = req.body;

    // Example: Only allow users to create posts for themselves
    if (req.user?.id !== Number(userId)) {
        throw new customError(403, "You can only create posts for yourself");
    }

    // Validate required fields
    if (!description) {
        throw new customError(400, "Description is required");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: {
            id: Number(userId)
        }
    });

    if (!user) {
        throw new customError(404, "User not found");
    }

    // Create post
    const post = await prisma.userPost.create({
        data: {
            description,
            userID: Number(userId)
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    successMsG(201, post, res, 'Post created successfully');
});

/**
 * Get all posts by user ID
 */
export const getPostsByUserId = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!user) {
        throw new customError(404, "User not found");
    }

    // Get posts
    const posts = await prisma.userPost.findMany({
        where: {
            userID: Number(id),
        },
        select: {
            id: true,
            description: true,
            creadtedat: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    successMsG(200, posts, res, 'Posts fetched successfully');
});

/**
 * Delete all posts by user ID
 */
export const deletePostsByUserId = asyncHandler(async (req, res) => {
    const { userID } = req.params;

    // Check if user has posts
    const posts = await prisma.userPost.findMany({
        where: {
            userID: Number(userID)
        }
    });

    if (posts.length === 0) {
        throw new customError(404, "User has no posts");
    }

    // Delete all posts
    const deletedPosts = await prisma.userPost.deleteMany({
        where: {
            userID: Number(userID)
        }
    });

    successMsG(200, { count: deletedPosts.count }, res, 'User posts deleted successfully');
});

/**
 * Get all posts
 */
export const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await prisma.userPost.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        },
        orderBy: {
            creadtedat: 'desc'
        }
    });

    successMsG(200, posts, res, 'All posts fetched successfully');
});

/**
 * Get a single post by ID
 */
export const getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const post = await prisma.userPost.findUnique({
        where: {
            id: Number(id)
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    if (!post) {
        throw new customError(404, "Post not found");
    }

    successMsG(200, post, res, 'Post fetched successfully');
});

/**
 * Update a post by ID
 */
export const updatePost = asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
        throw new customError(400, "Description is required");
    }

    // Check if post exists
    const existingPost = await prisma.userPost.findUnique({
        where: { id: Number(id) }
    });

    if (!existingPost) {
        throw new customError(404, "Post not found");
    }

    // Example: Only allow users to update their own posts
    if (req.user?.id !== existingPost.userID) {
        throw new customError(403, "You can only update your own posts");
    }

    // Update post
    const post = await prisma.userPost.update({
        where: {
            id: Number(id)
        },
        data: {
            description
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    successMsG(200, post, res, 'Post updated successfully');
});

/**
 * Delete a post by ID
 */
export const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if post exists
    const existingPost = await prisma.userPost.findUnique({
        where: { id: Number(id) }
    });

    if (!existingPost) {
        throw new customError(404, "Post not found");
    }

    // Delete post
    const post = await prisma.userPost.delete({
        where: {
            id: Number(id)
        }
    });

    successMsG(200, post, res, 'Post deleted successfully');
});
