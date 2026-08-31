'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export function ProviderExperienceForm() {
  const t = useTranslations('Onboarding');
  const common = useTranslations('Common');
  const experienceLevels = [
    { value: 'EXPERT' as ExperienceLevel, label: t('expert') },
    { value: 'INTERMEDIATE' as ExperienceLevel, label: t('intermediate') },
    { value: 'BEGINNER' as ExperienceLevel, label: t('beginner') },
  ];
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { nextProviderStep, previousProviderStep } = useAuthStore();

  const handleNext = async () => {
    if (!selectedLevel) {
      toast.error(t('experienceRequired'));
      return;
    }

    setIsLoading(true);
    try {
      // Save experience level using the correct onboarding endpoint
      await apiService.updateExperience(selectedLevel);
      
      toast.success(t('experienceSaved'));
      nextProviderStep();
    } catch (error) {
      console.error('Failed to save experience level:', error);
      const errorMessage = error instanceof Error ? error.message : t('experienceSaveFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    previousProviderStep();
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>3/5</span>
          <span>80%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-6">
          {t('finishSetup')}
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('experienceTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('experienceBody')}
          </p>
        </div>
      </div>

      {/* Experience Level Options */}
      <div className="space-y-3 mb-8">
        {experienceLevels.map((level) => (
          <label
            key={level.value}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <input
              type="radio"
              name="experienceLevel"
              value={level.value}
              checked={selectedLevel === level.value}
              onChange={() => setSelectedLevel(level.value)}
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 focus:ring-2"
            />
            <span className="text-gray-900 dark:text-white font-medium">
              {level.label}
            </span>
          </label>
        ))}
      </div>


      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={handlePrevious}
          className="text-gray-600 hover:text-gray-700"
        >
          ← {common('previous')}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!selectedLevel || isLoading}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
        >
          {isLoading ? common('saving') : `${t('next')} →`}
        </Button>
      </div>
    </div>
  );
}
