'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

type BioFormData = { shortBio: string };

export function ProviderBioForm() {
  const t = useTranslations('Onboarding');
  const common = useTranslations('Common');
  const [isLoading, setIsLoading] = useState(false);
  const { nextProviderStep, previousProviderStep } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BioFormData>({
    resolver: zodResolver(z.object({
      shortBio: z.string().min(10, t('bioTooShort')).max(500, t('bioTooLong')),
    })),
    defaultValues: {
      shortBio: '',
    },
  });

  const shortBio = watch('shortBio');
  const charCount = shortBio?.length || 0;

  const onSubmit = async (data: BioFormData) => {
    setIsLoading(true);
    try {
      // Save bio using existing API or create new one
      await apiService.updateProfile({ bio: data.shortBio });
      
      toast.success(t('bioSaved'));
      nextProviderStep();
    } catch (error) {
      console.error('Failed to save bio:', error);
      const errorMessage = error instanceof Error ? error.message : t('bioSaveFailed');
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
          <span>2/7</span>
          <span>28%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '28%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-6">
          {t('finishSetup')}
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('basicProfile')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('bioBody')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Short Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('shortBio')}
          </label>
          <div className="relative">
            <textarea
              {...register('shortBio')}
              placeholder={t('bioPlaceholder')}
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-green-500 focus:outline-none resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {charCount}/500
            </div>
          </div>
          {errors.shortBio && (
            <p className="text-sm text-red-600 mt-1">{errors.shortBio.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {t('bioHint')}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrevious}
            className="text-gray-600 hover:text-gray-700 font-medium"
          >
            ← {common('previous')}
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || charCount < 10}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 h-12 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? common('saving') : charCount < 10 ? t('writeMore') : `${t('next')} →`}
          </Button>
        </div>
      </form>
    </div>
  );
}
