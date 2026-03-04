"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { LoginCredentials } from "@/api/authApi";

interface LoginDialogProps {
  isEmbedded?: boolean;
  onBackToSignup?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onSignupClick?: () => void;
}

export function LoginDialog({ isEmbedded = false, onBackToSignup, isOpen, onClose, onSignupClick }: LoginDialogProps) {
  const { login, loginMutation } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      onClose?.();
      router.push("/dashboard");
    } catch (err) {
      // Error is handled by TanStack Query
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign in clicked");
    // Add your Google sign in logic here
  };

  const loginContent = (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">
          Welcome back
        </DialogTitle>
        <DialogDescription>
          Sign in to your Growstart account to continue.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Google Sign In Button */}


        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {loginMutation.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {(loginMutation.error as any)?.response?.data?.message || "Login failed. Please try again."}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="john@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
                className="pr-10"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
              )}
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          onClick={handleGoogleSignIn}
        >
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          {isEmbedded ? (
            <button
              type="button"
              onClick={onBackToSignup}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignupClick}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </button>
          )}
        </p>
      </div>
    </>
  );

  if (isEmbedded) {
    return loginContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {loginContent}
      </DialogContent>
    </Dialog>
  );
}
