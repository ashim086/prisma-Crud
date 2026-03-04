import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { dbConnection } from "./config/db";
import globalError from "./middlewares/global_error_handler";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - IMPORTANT for authentication with cookies
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true, // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({ message: `Server running with ENV ${process.env.NODE_ENV}` });
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

// Start server
app.listen(PORT, async () => {
    await dbConnection();
    console.log(`Server running on http://localhost:${PORT}`);
});

// Global error handler - MUST be after all routes
app.use(globalError);