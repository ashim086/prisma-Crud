// AUTH API FUNCTIONS

import { api } from ".";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: User;
}

/**
 * Register a new user
 * Cookies are automatically set by the server
 */
export const register = async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", credentials);
    return data;
};

/**
 * Login user with email and password
 * Cookies are automatically set by the server
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    return data;
};

/**
 * Logout user
 * Clears cookies on the server
 */
export const logout = async (): Promise<{ message: string }> => {
    const { data } = await api.post("/auth/logout");
    return data;
};

/**
 * Refresh access token
 * Uses refresh token from cookies
 */
export const refreshToken = async (): Promise<{ message: string }> => {
    const { data } = await api.post("/auth/refresh");
    return data;
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    // Backend returns { success, message, data: user }
    // We need to extract the actual user data
    return data.data || data;
};

// USER API FUNCTIONS (EXAMPLE)

/**
 * Get all users
 */
export const getUsers = async (): Promise<User[]> => {
    const { data } = await api.get("/getusers");
    return data;
};

/**
 * Create a new user
 */
export const createUser = async (userData: { name: string; email: string; password: string }): Promise<User> => {
    const { data } = await api.post("/add-user", userData);
    return data;
};
