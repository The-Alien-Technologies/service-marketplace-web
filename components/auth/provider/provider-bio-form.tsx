'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';

const bioSchema = z.object({
  shortBio: z.string().min(10, 'Please write at least 10 characters about yourself').max(500, 'Bio must be less than 500 characters'),
});

type BioFormData = z.infer<typeof bioSchema>;

export function ProviderBioForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { nextProviderStep, previousProviderStep } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BioFormData>({
    resolver: zodResolver(bioSchema),
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
      
      toast.success('Bio saved successfully!');
      nextProviderStep();
    } catch (error) {
      console.error('Failed to save bio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save bio';
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
          Let's finish setting up your account
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Basic Profile Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tell clients about your skills...
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Short Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Short Bio
          </label>
          <div className="relative">
            <textarea
              {...register('shortBio')}
              placeholder="Tell clients about your skills, experience, and what makes you unique. This will help them understand why they should choose you for their projects."
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
            This will be displayed on your profile to help clients understand your expertise.
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
            ← Previous
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || charCount < 10}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 h-12 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : charCount < 10 ? 'Write More' : 'Next →'}
          </Button>
        </div>
      </form>
    </div>
  );
}
