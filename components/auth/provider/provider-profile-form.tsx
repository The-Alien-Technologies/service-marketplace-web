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
import { getSupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/languages';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {persistLocaleCookie} from '@/components/i18n/locale-preference-sync';

type ProfileFormData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  language: string;
};

export function ProviderProfileForm() {
  const locale = useLocale();
  const t = useTranslations('Auth');
  const onboarding = useTranslations('Onboarding');
  const common = useTranslations('Common');
  const language = useTranslations('Language');
  const router = useRouter();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<PhoneVerificationStep>('input');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { nextProviderStep, previousProviderStep } = useAuthStore();

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
    resolver: zodResolver(z.object({
      firstName: z.string().min(1, onboarding('firstNameRequired')),
      lastName: z.string().min(1, onboarding('lastNameRequired')),
      phoneNumber: z.string().min(1, onboarding('phoneRequired')),
      language: z.string().min(1, t('languageRequired')),
    })),
    defaultValues: {
      firstName: '',
      lastName: '',
      language: getSupportedLanguage(locale).value,
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
      toast.error(onboarding('verifyPhoneRequired'));
      return;
    }

    // Check if avatar is selected (mandatory)
    if (!selectedAvatar) {
      toast.error(onboarding('pictureRequired'));
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

      // Update profile with avatar - reuse existing API
      await apiService.updateProfile(profileData, selectedAvatar);
      
      toast.success(onboarding('profileSaved'));
      nextProviderStep();
    } catch (error) {
      console.error('Failed to save profile:', error);
      const errorMessage = error instanceof Error ? error.message : onboarding('profileSaveFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
      processAvatarFile(file);
    }
  };

  const processAvatarFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(onboarding('validImage'));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(onboarding('imageTooLarge'));
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
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>1/7</span>
          <span>14%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '14%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-6">
          {onboarding('finishSetup')}
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {onboarding('basicProfile')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {onboarding('basicProfileBody')}
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
                  alt={onboarding('avatarPreview')}
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
                aria-label={onboarding('removePicture')}
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
              {avatarPreview ? onboarding('changePicture') : onboarding('uploadPicture')}
            </button>
            {avatarPreview ? (
              <p className="text-xs text-gray-500">
                {selectedAvatar?.name} ({Math.round((selectedAvatar?.size || 0) / 1024)}KB)
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {onboarding('pictureHint')}
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

        {/* Full Name */}
        <div>
          <label
            htmlFor="provider-full-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {onboarding('fullName')}
          </label>
          <div className="relative">
            <Input
              id="provider-full-name"
              value={`${firstName || ''} ${lastName || ''}`.trim()}
              placeholder="John Doe"
              className="pl-10 h-12"
              readOnly
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* First Name and Last Name - Hidden but registered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('firstName')}
            </label>
            <Input
              {...register('firstName')}
              placeholder="John"
              className="h-12"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('lastName')}
            </label>
            <Input
              {...register('lastName')}
              placeholder="Doe"
              className="h-12"
            />
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
            {language('label')}
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
                  {SUPPORTED_LANGUAGES.find(lang => lang.value === selectedLanguage)?.label || t('selectLanguage')}
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
                      persistLocaleCookie(language.value);
                      router.refresh();
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
            onClick={() => previousProviderStep()}
            className="text-gray-600 hover:text-gray-700 font-medium"
          >
            ← {common('previous')}
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 h-12 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? common('saving') :
             phoneVerificationStep !== 'verified' ? onboarding('verifyPhoneFirst') :
             !selectedAvatar ? onboarding('uploadProfilePicture') :
             !firstName?.trim() || !lastName?.trim() ? onboarding('completeRequiredFields') :
             `${onboarding('next')} →`}
          </Button>
        </div>
      </form>
    </div>
  );
}
