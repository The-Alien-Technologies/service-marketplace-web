"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export function ProviderWelcomeForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthStep, setProviderAuthStep, setUser, nextProviderStep } =
    useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      // Use the signup API with SERVICE_PROVIDER role
      const result = await apiService.signUp({
        ...data,
        role: "SERVICE_PROVIDER",
      });

      // Store user data in auth store so we have the email for verification
      if (result.user) {
        setUser(result.user);
      }

      toast.success(
        "Account created successfully! Please check your email for verification.",
      );
      nextProviderStep();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign up failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);

      // Use Better Auth to initiate Google OAuth for SERVICE_PROVIDER
      // Pass the intended role in the callback URL so we know which flow this is
      await authClient.signIn.social({
        provider: "google",
        callbackURL:
          window.location.origin + "/auth/callback?role=SERVICE_PROVIDER",
      });

      // The page will redirect to Google, so we don't need to handle response here
    } catch (error) {
      console.error("Google provider sign up error:", error);
      toast.error(
        `Google sign up failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4">
          <img
            src="/assets/logo/logo.svg"
            alt="AVADgh Logo"
            className="w-full h-full"
          />
        </div>
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-[30px]">
          Welcome to AVADgh
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sign up</p>
      </div>

      {/* Social Auth Buttons */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="google"
          className="w-full h-12 text-sm font-medium"
          onClick={handleGoogleAuth}
          disabled={isLoading}
        >
          <img
            src="/assets/icons/google-color-svg.svg"
            alt="Google"
            className="w-5 h-5 mr-3"
          />
          Sign up with Google
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
            OR
          </span>
        </div>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Input
              {...register("email")}
              type="email"
              placeholder="joel.sm13@gmail.com"
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </div>
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-sm text-green-600 hover:text-green-700">
                {showPassword ? "Hide" : "Show"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-sm text-green-600 hover:text-green-700">
                {showConfirmPassword ? "Hide" : "Show"}
              </span>
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      {/* Terms and Privacy */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="text-green-600 hover:text-green-700"
          >
            Terms of service
          </a>{" "}
          &{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-green-600 hover:text-green-700"
          >
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Sign In Link */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Already on Pavodah?{" "}
        </span>
        <button
          onClick={() => setAuthStep("signin")}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
