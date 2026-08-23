'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneVerification, PhoneVerificationStep } from '@/components/ui/phone-verification';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/lib/languages';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Please enter your first name'),
  lastName: z.string().min(1, 'Please enter your last name'),
  phoneNumber: z.string().min(1, 'Please enter your phone number'),
  language: z.string().min(1, 'Please select a language'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function OnboardingProfileForm() {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<PhoneVerificationStep>('input');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { nextUserStep, previousUserStep } = useAuthStore();

  // Refs for file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup avatar preview on unmount
  useEffect(() => {
    return () => {
      // Cleanup avatar preview URL to prevent memory leaks
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      language: DEFAULT_LANGUAGE.value,
    },
  });

  const selectedLanguage = watch('language');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const phoneNumber = watch('phoneNumber');

  // Check if all required fields are completed
  const isFormValid = () => {
    return (
      selectedAvatar &&
      firstName?.trim() &&
      lastName?.trim() &&
      phoneNumber?.trim() &&
      phoneVerificationStep === 'verified' &&
      selectedLanguage
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    // Check if phone is verified
    if (phoneVerificationStep !== 'verified') {
      toast.error('Please verify your phone number before continuing');
      return;
    }

    // Check if avatar is selected (mandatory)
    if (!selectedAvatar) {
      toast.error('Please upload a profile picture before continuing');
      return;
    }

    // Check if all required fields are filled
    if (!data.firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    if (!data.lastName.trim()) {
      toast.error('Please enter your last name');
      return;
    }

    if (!data.phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        preferredLanguage: data.language,
      };

      // Update profile with avatar if selected
      const result = await apiService.updateProfile(profileData, selectedAvatar || undefined);
      
      toast.success('Profile updated successfully!');
      nextUserStep();
    } catch (error) {
      console.error('Failed to save profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    previousUserStep();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processAvatarFile(file);
  };

  const removeAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      // Process the file directly instead of simulating an event
      processAvatarFile(file);
    }
  };

  const processAvatarFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedAvatar(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="p-5 sm:p-8">
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
            A few details to personalize your experience and build trust.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Upload Picture */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div 
              className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-500 border-dashed' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={handleAvatarClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className={`w-10 h-10 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
              )}
            </div>
            {avatarPreview && (
              <button
                type="button"
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              {avatarPreview ? 'Change picture' : 'Upload picture'}
            </button>
            {avatarPreview ? (
              <p className="text-xs text-gray-500">
                {selectedAvatar?.name} ({Math.round((selectedAvatar?.size || 0) / 1024)}KB)
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Click or drag & drop an image
              </p>
            )}
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First name
            </label>
            <div className="relative">
              <Input
                {...register('firstName')}
                placeholder="John"
                className="pl-10 h-12"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last name
            </label>
            <div className="relative">
              <Input
                {...register('lastName')}
                placeholder="Doe"
                className="pl-10 h-12"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <PhoneVerification
          value={phoneNumber || ''}
          onChange={(value) => setValue('phoneNumber', value)}
          onVerificationChange={setPhoneVerificationStep}
          required
          error={errors.phoneNumber?.message}
        />

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">🌐</span>
                </div>
                <span className="text-sm">
                  {SUPPORTED_LANGUAGES.find(lang => lang.value === selectedLanguage)?.label || 'Select language'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showLanguageDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    key={language.value}
                    type="button"
                    onClick={() => {
                      setValue('language', language.value);
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.language && (
            <p className="text-sm text-red-600 mt-1">{errors.language.message}</p>
          )}
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
              disabled={isLoading || !isFormValid()}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 h-12 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 
               phoneVerificationStep !== 'verified' ? 'Verify Phone First' :
               !selectedAvatar ? 'Upload Profile Picture' :
               !firstName?.trim() || !lastName?.trim() ? 'Complete Required Fields' :
               'Next →'}
            </Button>
        </div>
      </form>
    </div>
  );
}
