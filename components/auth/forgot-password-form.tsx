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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address' ),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthStep, setForgotPasswordEmail, clearForgotPasswordState } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // Call the forgot password API
      await apiService.forgotPassword(data.email);
      
      // Store email for the next steps
      setForgotPasswordEmail(data.email);
      
      // Move to email sent confirmation
      setAuthStep('forgot-password-sent');
      toast.success('Password reset email sent successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
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
            alt="Forgot Password" 
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
            Forgot your password
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
            Don't worry. Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Input
                {...register('email')}
                type="email"
                placeholder="joel.am13@gmail.com"
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Reset Password Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isLoading ? 'Sending...' : 'Reset password'}
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
