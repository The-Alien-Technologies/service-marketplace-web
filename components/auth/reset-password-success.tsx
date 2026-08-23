'use client';

import { useAuthStore } from '@/store/auth-store';

export function ResetPasswordSuccess() {
  const { setAuthStep, clearForgotPasswordState } = useAuthStore();

  const handleBackToSignIn = () => {
    clearForgotPasswordState();
    setAuthStep('signin');
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Success Content */}
      <div className="text-center">
        {/* Success Check Icon */}
        <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center">
          <img 
            src="/assets/icons/check_mark.svg" 
            alt="Success Checkmark" 
            className="w-16 h-16"
          />
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
          Your password was successfully updated
        </h1>
      </div>

      {/* Back to Sign In Button */}
      <div className="text-center">
        <button
          onClick={handleBackToSignIn}
          className="text-sm text-green-600 hover:text-green-700 font-medium underline"
        >
          Back to Sign in
        </button>
      </div>
    </div>
  );
}
