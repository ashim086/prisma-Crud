import { Router } from "express";
import { 
    createPost, 
    getPostsByUserId, 
    deletePostsByUserId,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost
} from "../controller/post.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// GET /posts - Get all posts (protected)
router.get("/", authenticateToken, getAllPosts);

// GET /posts/:id - Get post by ID (protected)
router.get("/:id", authenticateToken, getPostById);

// POST /posts/user/:userId - Create a post for a user (protected)
router.post("/user/:userId", authenticateToken, createPost);

// GET /posts/user/:id - Get all posts by user ID (protected)
router.get("/user/:id", authenticateToken, getPostsByUserId);

// DELETE /posts/user/:userID - Delete all posts by user ID (protected)
router.delete("/user/:userID", authenticateToken, deletePostsByUserId);

// PATCH /posts/:id - Update post by ID (protected)
router.patch("/:id", authenticateToken, updatePost);

// DELETE /posts/:id - Delete post by ID (protected)
router.delete("/:id", authenticateToken, deletePost);

export default router;
