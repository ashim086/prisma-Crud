import axios from "axios";

// Create axios instance with default configuration
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    withCredentials: true, // Important: Send cookies with requests
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't retry if:
        // 1. Already retried (_retry flag)
        // 2. Request was to refresh endpoint (prevent infinite loop)
        // 3. Request was to login endpoint
        const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");
        const isLoginEndpoint = originalRequest.url?.includes("/auth/login");
        
        if (
            error.response?.status === 401 && 
            !originalRequest._retry && 
            !isRefreshEndpoint && 
            !isLoginEndpoint
        ) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                await api.post("/auth/refresh");
                
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - just reject without redirecting
                // Let the component handle the error
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);