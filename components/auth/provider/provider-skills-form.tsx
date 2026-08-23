'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { Category } from '@/types/auth';
import { Search, Monitor, Palette, Home, Type, TrendingUp, Zap, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Icon mapping for categories (can be extended based on category names)
const categoryIcons: { [key: string]: any } = {
  'programming': Monitor,
  'tech': Monitor,
  'design': Palette,
  'graphics': Palette,
  'home': Home,
  'decor': Home,
  'write': Type,
  'translate': Type,
  'marketing': TrendingUp,
  'digital': TrendingUp,
  'ai': Zap,
  'services': Zap,
  'photography': Camera,
  'photo': Camera,
};

// Function to get icon for a category based on its name
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  return Monitor; // Default icon
};

export function ProviderSkillsForm() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { nextProviderStep, previousProviderStep } = useAuthStore();

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

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNext = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one service category');
      return;
    }

    setIsLoading(true);
    try {
      // Save provider skills/services
      await apiService.updateInterests(selectedCategories, 'SERVICE');
      
      toast.success('Skills saved successfully!');
      nextProviderStep();
    } catch (error) {
      console.error('Failed to save skills:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save skills';
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
          <span>65%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-6">
          Let's finish setting up your account
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Skills & Services
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select Categories
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search categories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Service Categories */}
      <div className="mb-8">
        {isLoadingCategories ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery ? 'No categories match your search' : 'No service categories available'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredCategories.map((category) => {
              const IconComponent = getCategoryIcon(category.name);
              const isSelected = selectedCategories.includes(category.id);
              return (
                <div
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`inline-flex items-center space-x-3 px-4 py-3 rounded-full cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {/* Circular checkbox */}
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-400 dark:border-gray-500'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Icon */}
                  <IconComponent className={`w-4 h-4 ${
                    isSelected
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                  
                  {/* Category text */}
                  <span className={`text-sm font-medium whitespace-nowrap ${
                    isSelected
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {category.name}
                  </span>
                </div>
              );
            })}
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
          onClick={handleNext}
          disabled={selectedCategories.length === 0 || isLoading || isLoadingCategories}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
        >
          {isLoading ? 'Saving...' : isLoadingCategories ? 'Loading...' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
