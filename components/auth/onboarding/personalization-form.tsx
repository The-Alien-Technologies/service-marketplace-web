'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useTranslations } from 'next-intl';

export function PersonalizationForm() {
  const t = useTranslations('Onboarding');
  const { nextUserStep } = useAuthStore();

  const handleGetStarted = () => {
    nextUserStep();
  };

  return (
    <div className="p-5 text-center sm:p-8">
      {/* Illustration */}
      <div className="mb-8 flex justify-center">
        <img 
          src="/assets/icons/personalize-icon.svg" 
          alt={t('personalizeAlt')}
          className="w-24 h-20" 
        />
      </div>

      {/* Title */}
      <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-4">
        {t('personalizeTitle')}
      </h1>

      {/* Subtitle */}
      <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8 max-w-md mx-auto">
        {t('personalizeBody')}
      </p>

      {/* Get Started Button */}
      <Button
        onClick={handleGetStarted}
        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
      >
        {t('getStarted')}
      </Button>
    </div>
  );
}
