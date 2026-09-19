'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Modal } from '@/components/ui/modal';
import { apiService } from '@/lib/api';
import {
  mapBackendStepToFrontendStep,
  type ProviderAuthStep,
} from '@/types/auth';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { VerifyEmailForm } from './verify-email-form';
import { ForgotPasswordForm } from './forgot-password-form';
import { ForgotPasswordSent } from './forgot-password-sent';
import { VerifyPasswordResetOtp } from './verify-password-reset-otp';
import { ResetPasswordForm } from './reset-password-form';
import { ResetPasswordSuccess } from './reset-password-success';
import { PersonalizationForm } from './onboarding/personalization-form';
import { OnboardingLocationForm } from './onboarding/location-form';
import { OnboardingProfileForm } from './onboarding/profile-form';
import { OnboardingInterestsForm } from './onboarding/interests-form';
import {
  ProviderWelcomeForm,
  ProviderProfileForm,
  ProviderBioForm,
  ProviderSkillsForm,
  ProviderExperienceForm,
  ProviderCoverageForm,
  ProviderDocumentsForm,
  ProviderSubmittedForm
} from './provider';

export function AuthModal() {
  const pathname = usePathname();
  const resumeStarted = useRef(false);
  const {
    showAuthModal,
    authStep,
    userAuthStep,
    providerAuthStep,
    authFlow,
    hideAuth,
    hasHydrated,
    isAuthenticated,
    user,
    setProviderAuthStep,
    setUser,
  } = useAuthStore();

  useEffect(() => {
    if (
      resumeStarted.current ||
      !hasHydrated ||
      showAuthModal ||
      pathname !== '/' ||
      !isAuthenticated ||
      user?.role !== 'SERVICE_PROVIDER' ||
      user.hasCompletedOnboarding
    ) {
      return;
    }

    resumeStarted.current = true;
    let cancelled = false;
    void Promise.all([
      apiService.getProfile(),
      apiService.getOnboardingStatus(),
    ])
      .then(([profile, status]) => {
        if (cancelled) return;
        setUser(profile.user);
        if (status.isComplete) return;

        setProviderAuthStep(
          mapBackendStepToFrontendStep(
            status.nextRequiredStep || 'basic_profile',
            'SERVICE_PROVIDER',
          ) as ProviderAuthStep,
        );
      })
      .catch((error) => {
        console.error('Failed to resume provider onboarding:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    isAuthenticated,
    pathname,
    setProviderAuthStep,
    setUser,
    showAuthModal,
    user,
  ]);

  const renderAuthStep = () => {
    // Handle common auth steps (signin, forgot password, etc.) - but NOT verify-email
    switch (authStep) {
      case 'signin':
        return <SignInForm />;
      case 'forgot-password':
        return <ForgotPasswordForm />;
      case 'forgot-password-sent':
        return <ForgotPasswordSent />;
      case 'verify-password-reset-otp':
        return <VerifyPasswordResetOtp />;
      case 'reset-password':
        return <ResetPasswordForm />;
      case 'reset-password-success':
        return <ResetPasswordSuccess />;
    }

    // Handle flow-specific steps
    if (authFlow === 'user') {
      switch (userAuthStep) {
        case 'signup':
          return <SignUpForm />;
        case 'verify-email':
          return <VerifyEmailForm />;
        case 'onboarding-personalize':
          return <PersonalizationForm />;
        case 'onboarding-location':
          return <OnboardingLocationForm />;
        case 'onboarding-profile':
          return <OnboardingProfileForm />;
        case 'onboarding-interests':
          return <OnboardingInterestsForm />;
        default:
          return <SignUpForm />;
      }
    } else if (authFlow === 'provider') {
      switch (providerAuthStep) {
        case 'provider-signup':
          return <ProviderWelcomeForm />;
        case 'verify-email':
          return <VerifyEmailForm />;
        case 'provider-profile':
          return <ProviderProfileForm />;
        case 'provider-bio':
          return <ProviderBioForm />;
        case 'provider-skills':
          return <ProviderSkillsForm />;
        case 'provider-experience':
          return <ProviderExperienceForm />;
        case 'provider-coverage':
          return <ProviderCoverageForm />;
        case 'provider-documents':
          return <ProviderDocumentsForm />;
        case 'provider-submitted':
          return <ProviderSubmittedForm />;
        default:
          return <ProviderWelcomeForm />;
      }
    }

    // Fallback for common steps that don't have a specific flow
    if (authStep === 'verify-email') {
      return <VerifyEmailForm />;
    }

    return <SignInForm />;
  };

  // Determine modal width based on the current step
  const getModalWidth = () => {
    // Check flow-specific steps
    if (authFlow === 'user') {
      if (userAuthStep === 'onboarding-interests') {
        return 'max-w-2xl'; // Wider for interests tags
      }
      if (userAuthStep === 'onboarding-personalize') {
        return 'max-w-xl'; // Wider for personalization title
      }
      if (userAuthStep === 'onboarding-profile') {
        return 'max-w-xl'; // Wider for profile form
      }
    } else if (authFlow === 'provider') {
      if (providerAuthStep === 'provider-skills') {
        return 'max-w-2xl'; // Wider for skills tags
      }
      if (providerAuthStep === 'provider-profile' ||
          providerAuthStep === 'provider-bio' ||
          providerAuthStep === 'provider-experience' ||
          providerAuthStep === 'provider-coverage' ||
          providerAuthStep === 'provider-documents' ||
          providerAuthStep === 'provider-submitted') {
        return 'max-w-xl'; // Wider for profile forms
      }
    }

    // Forgot password steps need exact width for split layout (315px + 522px = 837px)
    if (authStep === 'forgot-password' || 
        authStep === 'forgot-password-sent' || 
        authStep === 'verify-password-reset-otp' ||
        authStep === 'reset-password') {
      return 'max-w-[837px]'; // Exact width for image (315px) + form (522px) layout
    }
    return 'max-w-md'; // Default width for other steps
  };

  return (
    <Modal
      isOpen={showAuthModal}
      onClose={hideAuth}
      showCloseButton={
        authStep === 'signin' || 
        authStep === 'forgot-password' || 
        authStep === 'forgot-password-sent' || 
        authStep === 'verify-password-reset-otp' || 
        authStep === 'reset-password' || 
        authStep === 'reset-password-success' ||
        (authFlow === 'user' && userAuthStep === 'signup') ||
        (authFlow === 'provider' && providerAuthStep === 'provider-signup')
      }
      className={getModalWidth()}
    >
      {renderAuthStep()}
    </Modal>
  );
}
