'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { Category } from '@/types/auth';

export function OnboardingInterestsForm() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { setUser, hideAuth, nextUserStep, previousUserStep } = useAuthStore();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategories();
        console.log('Categories API response:', response);
        console.log('Categories array:', response.categories);
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load service categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleFinish = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one service category');
      return;
    }

    setIsLoading(true);
    try {
      // Save user interests
      await apiService.updateInterests(selectedCategories, 'INTEREST');
      
      // Get updated user profile
      const profileResult = await apiService.getProfile();
      setUser(profileResult.user);
      
      toast.success('Interests saved successfully! Welcome to Pavodah!');
      hideAuth();
    } catch (error) {
      console.error('Failed to save interests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save interests';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    previousUserStep();
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-2">
          Let's finish setting up your account
        </h1>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            What services are you interested in?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pick a few so we can recommend the best providers for you.
          </p>
        </div>
      </div>

      {/* Service Categories */}
      <div className="mb-8">
        {isLoadingCategories ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">No service categories available</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Please try refreshing the page</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`
                  inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${selectedCategories.includes(category.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {selectedCategories.includes(category.id) ? (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={handlePrevious}
          className="text-gray-600 hover:text-gray-700"
        >
          ← Previous
        </Button>
        
        <Button
          onClick={handleFinish}
          disabled={selectedCategories.length === 0 || isLoading || isLoadingCategories}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
        >
          {isLoading ? 'Saving...' : isLoadingCategories ? 'Loading...' : 'Finish →'}
        </Button>
      </div>
    </div>
  );
}
