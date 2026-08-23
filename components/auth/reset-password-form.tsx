'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthStep, forgotPasswordEmail, forgotPasswordOtp, clearForgotPasswordState } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!forgotPasswordEmail || !forgotPasswordOtp) {
      toast.error('Missing verification information. Please start over.');
      setAuthStep('forgot-password');
      return;
    }

    setIsLoading(true);
    try {
      // Call the reset password API with email, OTP, and new password
      await apiService.resetPassword(forgotPasswordEmail, forgotPasswordOtp, data.password);
      
      // Move to success confirmation
      setAuthStep('reset-password-success');
      toast.success('Password reset successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    clearForgotPasswordState();
    setAuthStep('signin');
  };

  return (
    <div className="flex min-h-[600px]">
      {/* Left Side - Image (315px / 37.6%) */}
        <div className="hidden md:flex md:w-[315px] md:flex-shrink-0">
          <img 
            src="/assets/site-images/forgot-password-left-image.jpg" 
            alt="Reset Password" 
            className="w-full h-full object-cover object-left rounded-l-lg"
          />
        </div>

      {/* Right Side - Form Content (522px / 62.4%) */}
      <div className="flex w-full flex-col justify-center p-5 sm:p-8 md:w-[522px] md:flex-shrink-0">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6">
            <img 
              src="/assets/logo/logo.svg" 
              alt="Pavodah Logo" 
              className="w-full h-full"
            />
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Set up new password
          </h1>
          
          {/* Lock Icon */}
          <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
            <img 
              src="/assets/icons/padlock.svg" 
              alt="Padlock Icon" 
              className="w-8 h-8"
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Enter a new password for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New password
            </label>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-sm text-green-600 hover:text-green-700">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm password
            </label>
            <div className="relative">
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-sm text-green-600 hover:text-green-700">
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Reset Password Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isLoading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>

        {/* Back to Sign In */}
        <div className="text-center mt-6">
          <button
            onClick={handleBackToSignIn}
            className="text-sm text-green-600 hover:text-green-700 font-medium underline"
          >
            Back to Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
