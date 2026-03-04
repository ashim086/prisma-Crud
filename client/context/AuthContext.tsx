"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login as loginApi, logout as logoutApi, register as registerApi, getCurrentUser, LoginCredentials, SignupCredentials, User } from "@/api/authApi";

interface AuthContextType {
    user: User | null | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: SignupCredentials) => Promise<void>;
    logout: () => Promise<void>;
    loginMutation: ReturnType<typeof useMutation<any, any, LoginCredentials>>;
    registerMutation: ReturnType<typeof useMutation<any, any, SignupCredentials>>;
    logoutMutation: ReturnType<typeof useMutation<any, any, void>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    // Query to get current user (this will fail if not authenticated)
    const { data: user, isLoading, error } = useQuery({
        queryKey: ["currentUser"],
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        // Return undefined on error instead of throwing
        throwOnError: false,
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: loginApi,
        onSuccess: (data) => {
            // Set user data in cache
            queryClient.setQueryData(["currentUser"], data.data);
        },
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: registerApi,
        onSuccess: (data) => {
            // Set user data in cache
            queryClient.setQueryData(["currentUser"], data.data);
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: logoutApi,
        onSuccess: () => {
            // Clear user data from cache
            queryClient.setQueryData(["currentUser"], null);
            queryClient.clear();
        },
    });

    const login = async (credentials: LoginCredentials) => {
        await loginMutation.mutateAsync(credentials);
    };

    const register = async (credentials: SignupCredentials) => {
        await registerMutation.mutateAsync(credentials);
    };

    const logout = async () => {
        await logoutMutation.mutateAsync();
    };

    const value = {
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loginMutation,
        registerMutation,
        logoutMutation,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
