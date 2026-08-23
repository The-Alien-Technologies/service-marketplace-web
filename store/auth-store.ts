import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AuthState,
  AuthStep,
  UserAuthStep,
  ProviderAuthStep,
  User,
  USER_AUTH_STEPS,
  PROVIDER_AUTH_STEPS,
} from "@/types/auth";
import { useNotificationStore } from "@/store/notification-store";
import { clearStoredAuthSession } from "@/lib/client-session";

interface AuthStore extends AuthState {
  // Hydration state
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Forgot password flow state
  forgotPasswordEmail: string | null;
  forgotPasswordOtp: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  showAuth: (step?: AuthStep) => void;
  hideAuth: () => void;
  setAuthStep: (step: AuthStep) => void;
  setUserAuthStep: (step: UserAuthStep) => void;
  setProviderAuthStep: (step: ProviderAuthStep) => void;
  startUserFlow: () => void;
  startProviderFlow: () => void;
  setForgotPasswordEmail: (email: string | null) => void;
  setForgotPasswordOtp: (otp: string | null) => void;
  clearForgotPasswordState: () => void;
  signOut: () => void;

  // Flow-specific navigation methods
  nextUserStep: () => void;
  nextProviderStep: () => void;
  previousUserStep: () => void;
  previousProviderStep: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      showAuthModal: false,
      authStep: "signin",
      userAuthStep: "signup",
      providerAuthStep: "provider-signup",
      authFlow: "user",
      forgotPasswordEmail: null,
      forgotPasswordOtp: null,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      showAuth: (step = "signin") =>
        set({
          showAuthModal: true,
          authStep: step,
        }),

      hideAuth: () =>
        set({
          showAuthModal: false,
        }),

      setAuthStep: (authStep) => set({ authStep }),

      setUserAuthStep: (userAuthStep) =>
        set({
          userAuthStep,
          authFlow: "user",
          authStep: "signup",
          showAuthModal: true,
        }),

      setProviderAuthStep: (providerAuthStep) =>
        set({
          providerAuthStep,
          authFlow: "provider",
          authStep: "signup",
          showAuthModal: true,
        }),

      startUserFlow: () =>
        set({
          authFlow: "user",
          userAuthStep: "signup",
          showAuthModal: true,
        }),

      startProviderFlow: () =>
        set({
          authFlow: "provider",
          providerAuthStep: "provider-signup",
          showAuthModal: true,
        }),

      setForgotPasswordEmail: (forgotPasswordEmail) =>
        set({ forgotPasswordEmail }),

      setForgotPasswordOtp: (forgotPasswordOtp) => set({ forgotPasswordOtp }),

      clearForgotPasswordState: () =>
        set({
          forgotPasswordEmail: null,
          forgotPasswordOtp: null,
        }),

      signOut: async () => {
        clearStoredAuthSession();
        useNotificationStore.getState().reset();
        set({
          user: null,
          isAuthenticated: false,
          showAuthModal: false,
          forgotPasswordEmail: null,
          forgotPasswordOtp: null,
        });
      },

      // Flow-specific navigation methods
      nextUserStep: () => {
        const { userAuthStep } = get();
        const currentIndex = USER_AUTH_STEPS.indexOf(userAuthStep);
        if (currentIndex < USER_AUTH_STEPS.length - 1) {
          const nextStep = USER_AUTH_STEPS[currentIndex + 1];
          set({
            userAuthStep: nextStep,
            authFlow: "user",
            showAuthModal: true,
          });
        }
      },

      nextProviderStep: () => {
        const { providerAuthStep } = get();
        const currentIndex = PROVIDER_AUTH_STEPS.indexOf(providerAuthStep);
        if (currentIndex < PROVIDER_AUTH_STEPS.length - 1) {
          const nextStep = PROVIDER_AUTH_STEPS[currentIndex + 1];
          set({
            providerAuthStep: nextStep,
            authFlow: "provider",
            showAuthModal: true,
          });
        }
      },

      previousUserStep: () => {
        const { userAuthStep } = get();
        const currentIndex = USER_AUTH_STEPS.indexOf(userAuthStep);
        if (currentIndex > 0) {
          const previousStep = USER_AUTH_STEPS[currentIndex - 1];
          set({
            userAuthStep: previousStep,
            authFlow: "user",
            showAuthModal: true,
          });
        }
      },

      previousProviderStep: () => {
        const { providerAuthStep } = get();
        const currentIndex = PROVIDER_AUTH_STEPS.indexOf(providerAuthStep);
        if (currentIndex > 0) {
          const previousStep = PROVIDER_AUTH_STEPS[currentIndex - 1];
          set({
            providerAuthStep: previousStep,
            authFlow: "provider",
            showAuthModal: true,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
