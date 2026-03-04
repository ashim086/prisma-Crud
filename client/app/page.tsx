"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { LoginDialog } from "@/components/LoginDialog";
import { SignupDialog } from "@/components/SignupDialog";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false);

  const handleOpenLogin = () => {
    setIsSignupDialogOpen(false);
    setIsLoginDialogOpen(true);
  };

  const handleOpenSignup = () => {
    setIsLoginDialogOpen(false);
    setIsSignupDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Prisma Auth App
            </h1>
            <div className="flex gap-3">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-10 w-24 rounded-lg"></div>
              ) : isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Dashboard
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginDialogOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Auth Demo
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            A full-stack authentication system with Next.js, Prisma, and Express.
            Features session management with refresh tokens and secure cookie handling.
          </p>

          {isAuthenticated && user ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                You're logged in!
              </h3>
              <p className="text-gray-600 mb-6">
                Welcome back, <span className="font-semibold">{user.name}</span>
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsLoginDialogOpen(true)}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Auth</h3>
            <p className="text-gray-600">
              JWT-based authentication with httpOnly cookies for maximum security
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Refresh</h3>
            <p className="text-gray-600">
              Automatic token refresh with rotation for seamless user experience
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Modern Stack</h3>
            <p className="text-gray-600">
              Built with Next.js 16, React Query, Prisma, and Express
            </p>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="mt-24 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8">Built With</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {["Next.js", "React Query", "Prisma", "Express", "TypeScript", "PostgreSQL"].map((tech) => (
              <div key={tech} className="bg-white px-6 py-3 rounded-full shadow-md text-gray-700 font-medium">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Demo Authentication System with Session Management</p>
        </div>
      </footer>

      {/* Dialogs */}
      <LoginDialog 
        isOpen={isLoginDialogOpen} 
        onClose={() => setIsLoginDialogOpen(false)}
        onSignupClick={handleOpenSignup}
      />
      
      <SignupDialog 
        isOpen={isSignupDialogOpen} 
        onClose={() => setIsSignupDialogOpen(false)}
        onLoginClick={handleOpenLogin}
      />
    </div>
  );
}