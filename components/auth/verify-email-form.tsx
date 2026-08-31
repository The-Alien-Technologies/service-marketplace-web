'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

export function VerifyEmailForm() {
  const t = useTranslations('Auth');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setUserAuthStep, setProviderAuthStep, user, authFlow, nextUserStep, nextProviderStep } = useAuthStore();

  // Get email from user - should always be available after signup
  const email = user?.email || t('emailFallback');
  
  // Check if we came from provider signup by checking if user role is SERVICE_PROVIDER
  const isProviderFlow = user?.role === 'SERVICE_PROVIDER';

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      await apiService.verifyEmail(email, verificationCode);
      toast.success(t('emailVerified'));
      
      // Redirect based on auth flow
      if (authFlow === 'provider') {
        nextProviderStep();
      } else {
        nextUserStep();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('verificationFailed');
      toast.error(errorMessage);
      setError(errorMessage);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    
    try {
      await apiService.resendEmailVerification(email);
      toast.success(t('verificationCodeSent'));
      setTimeLeft(119); // 1:59
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('verificationResendFailed');
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Logo and Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          <img 
            src="/assets/logo/logo.svg" 
            alt="Pavodah Logo" 
            className="w-full h-full"
          />
        </div>
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-2">
          {t('verifyEmailTitle')}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          {t.rich('emailCodeSent', {
            address: email,
            strong: (chunks) => (
              <span className="font-medium text-gray-900 dark:text-white">{chunks}</span>
            ),
          })}
        </p>
      </div>

      {/* Verification Code Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {t('verificationCode')}
        </label>
        <div className="flex justify-center items-center space-x-3">
          {code.map((digit, index) => (
            <div key={index} className="flex items-center">
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                aria-label={t('verificationDigit', { position: index + 1 })}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="0"
                className="w-14 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading}
              />
              {/* Separator after 3rd input */}
              {index === 2 && (
                <div className="mx-3 text-gray-400 text-xl font-medium">
                  -
                </div>
              )}
            </div>
          ))}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
        )}
      </div>

      {/* Inbox Check Reminder */}
      <div className="flex items-center justify-center mb-6 text-sm text-gray-600 dark:text-gray-400">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('checkInboxSpam')}
      </div>

      {/* Continue Button */}
      <Button
        onClick={() => handleVerify(code.join(''))}
        disabled={code.some(digit => digit === '') || isLoading}
        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium mb-6"
      >
        {isLoading ? t('verifying') : t('continue')}
      </Button>

      {/* Resend Code */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {t('didNotReceiveEmail')}{' '}
          {timeLeft > 0 ? (
            <span className="font-medium">
              {t('resendAt', { time: formatTime(timeLeft) })}
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {isResending ? t('sending') : t('resend')}
            </button>
          )}
        </p>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('havingTrouble')}{' '}
          <a 
            href="mailto:support@pavodah.com" 
            className="text-green-600 hover:text-green-700"
          >
            support@pavodah.com
          </a>
        </p>
      </div>
    </div>
  );
}
