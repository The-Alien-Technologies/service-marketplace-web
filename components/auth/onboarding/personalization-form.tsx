'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export function PersonalizationForm() {
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
          alt="Personalize Experience" 
          className="w-24 h-20" 
        />
      </div>

      {/* Title */}
      <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-4">
        Let's personalize your experience
      </h1>

      {/* Subtitle */}
      <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8 max-w-md mx-auto">
        Just a few details to tailor your experience, this won't take more than a minute.
      </p>

      {/* Get Started Button */}
      <Button
        onClick={handleGetStarted}
        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
      >
        Get Started
      </Button>
    </div>
  );
}
