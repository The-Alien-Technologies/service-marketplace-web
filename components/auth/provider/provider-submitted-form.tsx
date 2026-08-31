'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

export function ProviderSubmittedForm() {
  const t = useTranslations('Onboarding');
  const common = useTranslations('Common');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const { hideAuth, setUser } = useAuthStore();

  const completeApplication = useCallback(async () => {
    if (submissionInFlight.current) return;

    submissionInFlight.current = true;
    setIsCompleting(true);
    setSubmissionError(null);
    try {
      const result = await apiService.completeOnboarding();

      if (result.user) {
        setUser(result.user);
      }

      setIsCompleted(true);
      toast.success(t('applicationSubmitted'));
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      const message =
        error instanceof Error
          ? error.message
          : t('applicationSubmitFailed');
      setSubmissionError(message);
      toast.error(message);
    } finally {
      submissionInFlight.current = false;
      setIsCompleting(false);
    }
  }, [setUser, t]);

  // Complete onboarding when component mounts
  useEffect(() => {
    void completeApplication();
  }, [completeApplication]);

  const handleGoToDashboard = () => {
    hideAuth();
    window.location.href = '/provider-application';
  };

  return (
    <div className="p-5 text-center sm:p-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>5/5</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-6">
          {t('applicationWithTeam')}
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('documentsSubmitted')}
          </h2>
        </div>
      </div>

      {/* Checklist Complete Icon */}
      <div className="mb-8 flex justify-center">
        <img 
          src="/assets/icons/checklist_complete.svg" 
          alt={t('documentsSubmittedAlt')}
          className="w-20 h-20"
        />
      </div>

      {/* Status Message */}
      <div className="mb-8">
        {isCompleting ? (
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            {t('completingOnboarding')}
          </p>
        ) : submissionError ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {submissionError} {t('retrySubmitHint')}
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('reviewingCredentials')}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button
          onClick={submissionError ? () => void completeApplication() : handleGoToDashboard}
          disabled={isCompleting || (!isCompleted && !submissionError)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 disabled:opacity-50"
        >
          {isCompleting
            ? common('submitting')
            : submissionError
              ? t('retrySubmission')
              : t('viewApplicationStatus')}
        </Button>
      </div>
    </div>
  );
}
