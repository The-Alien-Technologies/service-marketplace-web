'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

export function VerifyPasswordResetOtp() {
  const t = useTranslations('Auth');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { setAuthStep, forgotPasswordEmail, setForgotPasswordOtp, clearForgotPasswordState } = useAuthStore();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const code = otpCode.join('');
    if (code.length === 6) {
      handleVerify(code);
    }
  }, [otpCode]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerify = useCallback(async (code: string) => {
    if (!forgotPasswordEmail) {
      toast.error(t('missingEmail'));
      return;
    }

    if (code.length !== 6) {
      toast.error(t('completeCode'));
      return;
    }

    setIsLoading(true);
    try {
      // Verify the OTP code
      await apiService.verifyPasswordResetOtp(forgotPasswordEmail, code);
      
      // Store the OTP for the reset password step
      setForgotPasswordOtp(code);
      
      // Move to reset password form
      setAuthStep('reset-password');
      toast.success(t('codeVerified'));
    } catch (error: unknown) {
      // Clear the code on error
      setOtpCode(['', '', '', '', '', '']);
      
      // Handle specific error messages from the API
      let errorMessage = t('invalidCode');
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      
      // Show attempts left if available
      if (error && typeof error === 'object' && 'attemptsLeft' in error) {
        const attemptsLeft = (error as { attemptsLeft: number }).attemptsLeft;
        errorMessage = t('attemptsRemaining', { message: errorMessage, count: attemptsLeft });
      }
      
      toast.error(errorMessage);
      
      // Focus first input
      const firstInput = document.querySelector(`input[name="otp-0"]`) as HTMLInputElement;
      firstInput?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [forgotPasswordEmail, setForgotPasswordOtp, setAuthStep, t]);

  const handleResend = async () => {
    if (!forgotPasswordEmail) {
      toast.error(t('missingEmail'));
      return;
    }

    setIsResending(true);
    try {
      // Resend the forgot password email
      await apiService.forgotPassword(forgotPasswordEmail);
      
      toast.success(t('codeSentAgain'));
      setResendTimer(30);
      setCanResend(false);
      
      // Clear current code
      setOtpCode(['', '', '', '', '', '']);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('resendCodeFailed');
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
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
          alt={t('enterVerificationCode')}
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
            {t('enterVerificationCode')}
          </h1>
          
          {/* Email Icon */}
          <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
            <img 
              src="/assets/icons/email-sent.svg" 
              alt=""
              className="w-8 h-8"
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            {t.rich('codeSentTo', {
              address: forgotPasswordEmail ?? '',
              strong: (chunks) => (
                <span className="font-medium text-gray-900 dark:text-white">{chunks}</span>
              ),
            })}
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
            {t('verificationCode')}
          </label>
          <div className="flex justify-center space-x-3">
            {otpCode.map((digit, index) => (
              <input
                key={index}
                name={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                aria-label={t('verificationDigit', { position: index + 1 })}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center mb-6">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {t('verifyingCode')}
            </p>
          </div>
        )}

        {/* Resend Section */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('didNotReceiveCode')}{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-green-600 hover:text-green-700 font-medium underline disabled:opacity-50"
              >
                {isResending ? t('sending') : t('resend')}
              </button>
            ) : (
              <span className="text-gray-500">
                {t('resendCountdown', { seconds: resendTimer })}
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
            {t('backToSignIn')}
          </button>
        </div>
      </div>
    </div>
  );
}
