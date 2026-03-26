import { AuthStep, UserAuthStep, OnboardingStatus } from '@/types/auth';
import { apiService } from './api';

/**
 * Field-based onboarding utilities that use backend validation
 */

/**
 * Get the next onboarding step based on backend field validation
 */
export async function getNextOnboardingStep(): Promise<AuthStep | UserAuthStep | null> {
  try {
    const status = await apiService.getOnboardingStatus();
    
    if (status.isComplete) {
      return null;
    }
    
    if (status.nextRequiredStep) {
      return mapBackendStepToFrontendStep(status.nextRequiredStep);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get onboarding status:', error);
    // Fallback to basic check
    return 'onboarding-personalize';
  }
}

/**
 * Check if user needs onboarding based on backend validation
 */
export async function needsOnboarding(): Promise<boolean> {
  try {
    const status = await apiService.getOnboardingStatus();
    return !status.isComplete;
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    // Assume onboarding is needed if we can't check
    return true;
  }
}

/**
 * Get comprehensive onboarding status from backend
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    return await apiService.getOnboardingStatus();
  } catch (error) {
    console.error('Failed to get onboarding status:', error);
    return null;
  }
}

/**
 * Map backend step names to frontend AuthStep values
 */
function mapBackendStepToFrontendStep(backendStep: string): AuthStep | UserAuthStep {
  const stepMap: Record<string, AuthStep | UserAuthStep> = {
    'email_verification': 'verify-email',
    'basic_profile': 'onboarding-profile',
    'location': 'onboarding-location',
    'interests': 'onboarding-interests',
    'experience': 'onboarding-experience',
    'verification_documents': 'onboarding-documents',
  };

  return stepMap[backendStep] || 'onboarding-personalize';
}

/**
 * Get user-friendly message for onboarding step
 */
export function getOnboardingStepMessage(step: AuthStep | UserAuthStep): string {
  const messages: Record<AuthStep | UserAuthStep, string> = {
    'signin': 'Please sign in to continue.',
    'signup': 'Create your account to get started.',
    'verify-email': 'Please verify your email address to continue.',
    'forgot-password': 'Enter your email to reset your password.',
    'forgot-password-sent': 'Check your email for reset instructions.',
    'verify-password-reset-otp': 'Enter the verification code sent to your email.',
    'reset-password': 'Set up your new password.',
    'reset-password-success': 'Your password has been reset successfully.',
    'onboarding-personalize': 'Let\'s personalize your experience!',
    'onboarding-location': 'Please add your location details.',
    'onboarding-profile': 'Complete your profile information.',
    'onboarding-interests': 'Select your interests and services.',
    'onboarding-experience': 'Tell us about your experience level.',
    'onboarding-documents': 'Upload your verification documents.',
  };

  return messages[step] || 'Please complete your profile setup.';
}

/**
 * Get step progress information
 */
export async function getStepProgress(): Promise<{
  completed: number;
  total: number;
  percentage: number;
} | null> {
  try {
    const status = await apiService.getOnboardingStatus();
    const completed = status.completedSteps.length;
    const total = status.requiredSteps.length;
    
    return {
      completed,
      total,
      percentage: status.completionPercentage,
    };
  } catch (error) {
    console.error('Failed to get step progress:', error);
    return null;
  }
}
