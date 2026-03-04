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
import GoogleLoginButton from "./GoogleLoginButton";

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

        <GoogleLoginButton />

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
