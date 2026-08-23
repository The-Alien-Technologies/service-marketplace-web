'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { getNextOnboardingStep, needsOnboarding, getOnboardingStepMessage, getOnboardingStatus } from '@/lib/field-based-onboarding';
import { mapBackendStepToFrontendStep } from '@/types/auth';
import { authClient } from '@/lib/auth-client';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setAuthStep, hideAuth, setUserAuthStep, setProviderAuthStep } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const result = await apiService.signIn(data);
      
      // Get user profile after successful login
      const profileResult = await apiService.getProfile();
      setUser(profileResult.user);
      
      try {
        // Check comprehensive onboarding status using field-based validation
        const onboardingStatus = await getOnboardingStatus();
      
      if (!onboardingStatus) {
        // Fallback if we can't get status - assume onboarding needed
        toast.success('Welcome back! Please complete your profile setup.');
        if (profileResult.user.role === 'SERVICE_PROVIDER') {
          setProviderAuthStep('provider-profile');
        } else {
          setUserAuthStep('onboarding-personalize');
        }
        return;
      }
      
      if (!onboardingStatus.isComplete) {
        // User has incomplete onboarding
        const nextStep = onboardingStatus.nextRequiredStep;
        
        if (nextStep) {
          // Map backend step to frontend step based on user role
          const frontendStep = mapBackendStepToFrontendStep(nextStep, profileResult.user.role);
          const completionPercentage = Math.round(onboardingStatus.completionPercentage);
          
          // Special handling for email verification
          if (nextStep === 'email_verification') {
            toast.info('Please verify your email address to continue.');
            if (profileResult.user.role === 'SERVICE_PROVIDER') {
              setProviderAuthStep('verify-email');
            } else {
              setUserAuthStep('verify-email');
            }
          } else {
            toast.success(`Welcome back! Your profile is ${completionPercentage}% complete. Let's continue setting up your account.`);
            // Use flow-specific methods based on user role
            if (profileResult.user.role === 'SERVICE_PROVIDER') {
              setProviderAuthStep(frontendStep as any);
            } else {
              setUserAuthStep(frontendStep as any);
            }
          }
        } else {
          // No specific next step, start with appropriate default based on role
          toast.success('Welcome back! Let\'s finish setting up your account.');
          if (profileResult.user.role === 'SERVICE_PROVIDER') {
            setProviderAuthStep('provider-profile');
          } else {
            setUserAuthStep('onboarding-personalize');
          }
        }
      } else {
        // Onboarding is complete
        toast.success('Welcome back! You have successfully signed in.');
        hideAuth();
      }
      } catch (onboardingError) {
        console.error('Error checking onboarding status:', onboardingError);
        // Fallback to appropriate flow based on role
        toast.success('Welcome back! Let\'s continue setting up your account.');
        if (profileResult.user.role === 'SERVICE_PROVIDER') {
          setProviderAuthStep('provider-profile');
        } else {
          setUserAuthStep('onboarding-personalize');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      
      // Use Better Auth to initiate Google OAuth
      // Pass the intended role in the callback URL so we know which flow this is
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/auth/callback?role=USER",
      });
      
      // The page will redirect to Google, so we don't need to handle response here
      
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error(`Google sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4">
          <img 
            src="/assets/logo/logo.svg" 
            alt="Pavodah Logo" 
            className="w-full h-full"
          />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome to Pavodah
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Sign in
        </p>
      </div>

      {/* Social Auth Buttons */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="google"
          className="w-full h-12 text-sm font-medium"
          onClick={handleGoogleAuth}
          disabled={isLoading}
        >
          <img 
            src="/assets/icons/google-color-svg.svg" 
            alt="Google" 
            className="w-5 h-5 mr-3" 
          />
          Sign in with Google
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">OR</span>
        </div>
      </div>

      {/* Sign In Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Input
              {...register('email')}
              type="email"
              placeholder="joel.sm13@gmail.com"
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-10 pr-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-sm text-green-600 hover:text-green-700">
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => setAuthStep('forgot-password')}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Forgot password?
          </button>
        </div>


        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="text-center mt-6">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          New on Pavodah?{' '}
        </span>
        <button
          onClick={() => setAuthStep('signup')}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
