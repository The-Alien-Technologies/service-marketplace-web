'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';

export function ForgotPasswordSent() {
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { setAuthStep, user, forgotPasswordEmail, clearForgotPasswordState } = useAuthStore();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleResend = async () => {
    const email = forgotPasswordEmail || user?.email;
    if (!email) {
      toast.error('No email address found');
      return;
    }

    setIsResending(true);
    try {
      // Call the forgot password API again
      await apiService.forgotPassword(email);
      
      toast.success('Password reset email sent again!');
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend email';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignIn = () => {
    clearForgotPasswordState();
    setAuthStep('signin');
  };

  // Get email from forgot password flow or user store or use placeholder
  const email = forgotPasswordEmail || user?.email || 'joel.am13@gmail.com';

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

      {/* Right Side - Content (522px / 62.4%) */}
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
          
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Your email is on the way
          </h1>
          
          {/* Email Icon */}
          <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
            <img 
              src="/assets/icons/email-sent.svg" 
              alt="Email Sent Icon" 
              className="w-8 h-8"
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Check your email{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {email}
            </span>
            {' '}for a 6-digit verification code to reset your password.
          </p>
        </div>

        {/* Continue Button */}
        <div className="mb-8">
          <Button
            onClick={() => setAuthStep('verify-password-reset-otp')}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            I have the code
          </Button>
        </div>

        {/* Resend Section */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Didn&apos;t receive an email?{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-green-600 hover:text-green-700 font-medium underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend'}
              </button>
            ) : (
              <span className="text-gray-500">
                Resend ({resendTimer}s)
              </span>
            )}
          </p>
        </div>

        {/* Back to Sign In */}
        <div className="text-center">
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
