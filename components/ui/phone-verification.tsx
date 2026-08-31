'use client';

import { ClipboardEvent, useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CountrySelector, countries, Country } from '@/components/ui/country-selector';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

export type PhoneVerificationStep = 'input' | 'verify' | 'verified';

interface PhoneVerificationProps {
  value: string;
  onChange: (value: string) => void;
  onVerificationChange: (step: PhoneVerificationStep) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export function PhoneVerification({
  value,
  onChange,
  onVerificationChange,
  disabled = false,
  required = false,
  error,
}: PhoneVerificationProps) {
  const t = useTranslations('Auth');
  const initialCountry =
    countries.find((country) => value.startsWith(country.dialCode)) ?? countries[0];
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [localNumber, setLocalNumber] = useState(() =>
    value.startsWith(initialCountry.dialCode)
      ? value.slice(initialCountry.dialCode.length)
      : value.replace(/\D/g, ''),
  );
  const [verificationPhoneNumber, setVerificationPhoneNumber] = useState('');
  const [verificationStep, setVerificationStep] = useState<PhoneVerificationStep>('input');
  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(OTP_LENGTH).fill(''),
  );
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationError, setVerificationError] = useState('');

  const verificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    onVerificationChange(verificationStep);
  }, [verificationStep, onVerificationChange]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, []);

  const getRequestedPhoneNumber = () => {
    const digits = localNumber.replace(/\D/g, '');
    const dialCodeDigits = selectedCountry.dialCode.replace(/\D/g, '');
    if (digits.startsWith(dialCodeDigits)) return `+${digits}`;
    return `${selectedCountry.dialCode}${digits.replace(/^0+/, '')}`;
  };

  const showError = (caught: unknown, fallback: string) => {
    const message = caught instanceof Error ? caught.message : fallback;
    setVerificationError(message);
    toast.error(message);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setVerificationError('');
    onChange(localNumber);
  };

  const handlePhoneChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 15);
    setLocalNumber(digits);
    setVerificationError('');
    onChange(digits);
  };

  const handleSendVerification = async () => {
    if (!localNumber) {
      setVerificationError(t('enterPhoneFirst'));
      return;
    }

    setIsSending(true);
    setVerificationError('');
    try {
      const result = await apiService.sendPhoneVerification(getRequestedPhoneNumber());
      setVerificationPhoneNumber(result.phoneNumber);
      onChange(result.phoneNumber);
      setVerificationStep('verify');
      setResendTimer(RESEND_COOLDOWN_SECONDS);
      toast.success(t('phoneCodeSent'));
      window.setTimeout(() => codeInputRefs.current[0]?.focus(), 0);
    } catch (caught) {
      showError(caught, t('phoneCodeSendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length !== OTP_LENGTH || isVerifying) return;

    setIsVerifying(true);
    setVerificationError('');
    try {
      const result = await apiService.verifyPhone(verificationPhoneNumber, code);
      onChange(result.phoneNumber);
      setVerificationPhoneNumber(result.phoneNumber);
      setVerificationStep('verified');
      setResendTimer(0);
      toast.success(t('phoneVerified'));
    } catch (caught) {
      setVerificationCode(Array(OTP_LENGTH).fill(''));
      showError(caught, t('phoneCodeInvalid'));
      window.setTimeout(() => codeInputRefs.current[0]?.focus(), 0);
    } finally {
      setIsVerifying(false);
    }
  };

  const scheduleVerification = (code: string[]) => {
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
    }
    if (code.every(Boolean)) {
      verificationTimeoutRef.current = setTimeout(() => verifyCode(code.join('')), 350);
    }
  };

  const handleCodeChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const nextCode = [...verificationCode];
    nextCode[index] = digit;
    setVerificationCode(nextCode);
    setVerificationError('');

    if (digit && index < OTP_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
    scheduleVerification(nextCode);
  };

  const handleCodePaste = (event: ClipboardEvent<HTMLElement>) => {
    const digits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!digits) return;

    event.preventDefault();
    const nextCode = Array(OTP_LENGTH)
      .fill('')
      .map((_, index) => digits[index] ?? '');
    setVerificationCode(nextCode);
    setVerificationError('');
    codeInputRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
    scheduleVerification(nextCode);
  };

  const handleCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    setVerificationError('');
    try {
      const result = await apiService.resendPhoneVerification(verificationPhoneNumber);
      setVerificationPhoneNumber(result.phoneNumber);
      onChange(result.phoneNumber);
      setVerificationCode(Array(OTP_LENGTH).fill(''));
      setResendTimer(RESEND_COOLDOWN_SECONDS);
      toast.success(t('phoneCodeResent'));
      window.setTimeout(() => codeInputRefs.current[0]?.focus(), 0);
    } catch (caught) {
      showError(caught, t('phoneCodeResendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('phoneNumber')}
        {required && <span className="ml-1 text-red-500">*</span>}
        {verificationStep !== 'verified' && (
          <span className="ml-2 text-xs font-normal text-orange-700 dark:text-orange-400">
            {t('verificationRequired')}
          </span>
        )}
      </label>

      {verificationStep === 'input' && (
        <div className="space-y-2">
          <div className="flex min-w-0">
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryChange}
              disabled={disabled || isSending}
            />
            <Input
              value={localNumber}
              onChange={(event) => handlePhoneChange(event.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              aria-invalid={Boolean(error || verificationError)}
              aria-describedby="phone-verification-hint phone-verification-error"
              placeholder="24 123 4567"
              className="h-12 min-w-0 flex-1 rounded-none"
              disabled={disabled || isSending}
            />
            <button
              type="button"
              onClick={handleSendVerification}
              disabled={isSending || !localNumber || disabled}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-r-lg border border-l-0 border-green-700 bg-green-700 px-4 text-sm font-medium text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-green-200 disabled:bg-green-200 disabled:text-green-900 dark:disabled:border-green-950 dark:disabled:bg-green-950 dark:disabled:text-green-400"
            >
              {isSending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSending ? t('sending') : t('sendCode')}
            </button>
          </div>
          <p id="phone-verification-hint" className="text-xs text-gray-600 dark:text-gray-400">
            {t('smsHint')}
          </p>
        </div>
      )}

      {verificationStep === 'verify' && (
        <div className="space-y-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
          <p className="break-words text-sm text-blue-900 dark:text-blue-200">
            {t.rich('codeSentPhone', {
              number: verificationPhoneNumber,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          <fieldset disabled={disabled || isVerifying}>
            <legend className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              {t('verificationCode')}
            </legend>
            <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    codeInputRefs.current[index] = element;
                  }}
                  aria-label={t('verificationDigit', { position: index + 1 })}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleCodeChange(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event.key)}
                  className="h-11 w-10 rounded-lg border-2 border-gray-300 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-600/20 disabled:cursor-wait disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:h-12 sm:w-12 sm:text-xl"
                />
              ))}
            </div>
          </fieldset>

          <div className="flex min-h-6 items-center justify-center">
            {isVerifying ? (
              <p className="inline-flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('checkingCode')}
              </p>
            ) : resendTimer > 0 ? (
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('resendAvailable', { time: `0:${resendTimer.toString().padStart(2, '0')}` })}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || disabled}
                className="text-sm font-medium text-green-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400"
              >
                {isResending ? t('sendingNewCode') : t('sendNewCode')}
              </button>
            )}
          </div>
        </div>
      )}

      {verificationStep === 'verified' && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4 dark:bg-green-950/30">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-900 dark:text-green-200">
              {t('phoneVerified')}
            </p>
            <p className="break-words text-xs text-green-800 dark:text-green-300">
              {verificationPhoneNumber}
            </p>
          </div>
        </div>
      )}

      {(verificationError || error) && (
        <p
          id="phone-verification-error"
          role="alert"
          aria-live="polite"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {verificationError || error}
        </p>
      )}
    </div>
  );
}
