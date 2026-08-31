'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'react-toastify';
import { getOnboardingStatus } from '@/lib/field-based-onboarding';
import { mapBackendStepToFrontendStep } from '@/types/auth';
import { User } from '@/types/auth';
import { getProviderEntryRoute } from '@/lib/provider-access';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackStarted = useRef(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const { setUser, hideAuth, setUserAuthStep, setProviderAuthStep } = useAuthStore();

  useEffect(() => {
    if (callbackStarted.current) return;
    callbackStarted.current = true;

    const handleCallback = async () => {
      try {
        // Wait a moment for Better Auth to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the session from Better Auth
        const { data: session } = await authClient.getSession();
        
        if (!session?.user) {
          throw new Error('No session found after Google authentication');
        }

        // Extract user information from Better Auth session
        const googleUser = session.user;
        
        // Check if the user has a verified email from Google
        if (!googleUser.emailVerified) {
          throw new Error('Google account email is not verified');
        }

        // Get the actual Google access token using Better Auth's getAccessToken function
        console.log('Retrieving Google access token from Better Auth...');
        
        const tokenResult = await authClient.getAccessToken({
          providerId: "google"
        });
        
        if (!tokenResult?.data?.accessToken) {
          throw new Error('Unable to retrieve Google access token from Better Auth');
        }

        console.log('Successfully retrieved Google access token for validation');

        // Get the intended role from URL params (set during auth initiation)
        const intendedRole = searchParams.get('role') as 'USER' | 'SERVICE_PROVIDER' || 'USER';
        console.log('Intended user role:', intendedRole);

        // Send the actual Google access token to our backend for validation with Google's servers
        await apiService.socialAuth('google', tokenResult.data.accessToken, tokenResult.data.idToken, intendedRole);
        
        // Get user profile after successful authentication
        const profileResult = await apiService.getProfile();
        setUser(profileResult.user);
        
        // Handle onboarding flow
        // Note: Google users start with 'USER' role by default and can change to 'SERVICE_PROVIDER' during onboarding
        const destination = await handleOnboardingFlow(profileResult.user);
        router.push(destination);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        router.push('/');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleOnboardingFlow = async (user: User): Promise<string> => {
      try {
        // Check comprehensive onboarding status using field-based validation
        const onboardingStatus = await getOnboardingStatus();
      
        if (!onboardingStatus) {
          // Fallback if we can't get status - assume onboarding needed
          toast.success('Welcome! Please complete your profile setup.');
          if (user.role === 'SERVICE_PROVIDER') {
            setProviderAuthStep('provider-profile');
          } else {
            setUserAuthStep('onboarding-personalize');
          }
          return '/';
        }
      
        if (!onboardingStatus.isComplete) {
          // User has incomplete onboarding
          const nextStep = onboardingStatus.nextRequiredStep;
          
          if (nextStep) {
            // Map backend step to frontend step based on user role
            const frontendStep = mapBackendStepToFrontendStep(nextStep, user.role);
            const completionPercentage = Math.round(onboardingStatus.completionPercentage);
            
            // Special handling for email verification
            if (nextStep === 'email_verification') {
              toast.info('Please verify your email address to continue.');
              if (user.role === 'SERVICE_PROVIDER') {
                setProviderAuthStep('verify-email');
              } else {
                setUserAuthStep('verify-email');
              }
            } else {
              toast.success(`Welcome! Your profile is ${completionPercentage}% complete. Let's continue setting up your account.`);
              // Use flow-specific methods based on user role
              if (user.role === 'SERVICE_PROVIDER') {
                setProviderAuthStep(frontendStep as any);
              } else {
                setUserAuthStep(frontendStep as any);
              }
            }
          } else {
            // No specific next step, start with appropriate default based on role
            toast.success('Welcome! Let\'s finish setting up your account.');
            if (user.role === 'SERVICE_PROVIDER') {
              setProviderAuthStep('provider-profile');
            } else {
              setUserAuthStep('onboarding-personalize');
            }
          }
          return '/';
        } else {
          // Onboarding is complete
          toast.success('Welcome! You have successfully signed in with Google.');
          hideAuth();
          return user.role === 'SERVICE_PROVIDER'
            ? getProviderEntryRoute(user)
            : '/';
        }
      } catch (onboardingError) {
        console.error('Error checking onboarding status:', onboardingError);
        // Fallback to appropriate flow based on role
        toast.success('Welcome! Let\'s continue setting up your account.');
        if (user.role === 'SERVICE_PROVIDER') {
          setProviderAuthStep('provider-profile');
        } else {
          setUserAuthStep('onboarding-personalize');
        }
        return '/';
      }
    };

    handleCallback();
  }, [router, searchParams, setUser, hideAuth, setUserAuthStep, setProviderAuthStep]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img 
              src="/assets/logo/logo.svg" 
              alt="Pavodah Logo" 
              className="w-full h-full animate-pulse"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Completing your sign in...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallback() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
