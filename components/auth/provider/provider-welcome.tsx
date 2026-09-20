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
import Link from "next/link";
import { useTranslations } from "next-intl";

type SignUpFormData = { email: string; password: string; confirmPassword: string };

export function ProviderWelcomeForm() {
  const t = useTranslations("Auth");
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
    resolver: zodResolver(z.object({
      email: z.string().email(t("invalidEmail")),
      password: z.string().min(6, t("passwordLength")),
      confirmPassword: z.string().min(6, t("passwordLength")),
    }).refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    })),
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

      if (result.emailVerificationSent === false) {
        toast.warn(t("verificationDeliveryFailed"));
      } else {
        toast.success(t("accountCreated"));
      }
      nextProviderStep();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("authFailed");
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
      toast.error(error instanceof Error ? error.message : t("authFailed"));
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
            alt="Pavodah"
            className="w-full h-full"
          />
        </div>
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-[30px]">
          {t("welcomePavodah")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("signUp")}</p>
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
          {t("signUpGoogle")}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
            {t("or")}
          </span>
        </div>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("emailAddress")}
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
            {t("password")}
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
                {showPassword ? t("hidePassword") : t("showPassword")}
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
            {t("confirmPassword")}
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
                {showConfirmPassword ? t("hidePassword") : t("showPassword")}
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
          {isLoading ? t("creatingAccount") : t("signUp")}
        </Button>
      </form>

      {/* Terms and Privacy */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {t.rich("termsAgreement", {
            terms: (chunks) => <Link href="/terms" target="_blank" className="text-green-600 hover:text-green-700">{chunks}</Link>,
            privacy: (chunks) => <Link href="/privacy" target="_blank" className="text-green-600 hover:text-green-700">{chunks}</Link>,
          })}
        </p>
      </div>

      {/* Sign In Link */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t("alreadyOnPavodah")}{" "}
        </span>
        <button
          onClick={() => setAuthStep("signin")}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {t("signIn")}
        </button>
      </div>
    </div>
  );
}
