export interface Address {
  id: string;
  formattedAddress: string;
  streetNumber?: string;
  route?: string; // street
  locality?: string; // city
  administrativeAreaLevel1?: string; // state/region
  administrativeAreaLevel2?: string; // county
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  isPrimary: boolean;
  label?: string; // e.g., "Home", "Work"
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  featured: boolean;
  parentCategoryId?: string;
  parentCategory?: { id: string; name: string };
  subCategories?: { id: string; name: string; imageUrl?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInterest {
  id: string;
  categoryId: string;
  category?: Category;
  userId: string;
}

export interface VerificationDocument {
  id: string;
  type: string;
  documentType?: string;
  status: "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  url: string;
  fileUrl?: string;
  fileName?: string;
  originalName?: string;
  fileSize?: number;
  mimeType?: string;
  rejectionReason?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "DELETED";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  username?: string;
  avatar?: string;
  role: "USER" | "SERVICE_PROVIDER" | "ADMIN";
  status?: UserStatus;
  phoneVerified?: boolean;
  phoneNumber?: string;
  bio?: string;
  serviceProviderExperienceLevel?: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  marketingNotifications?: boolean;
  preferredLanguage?: string;

  hasCompletedOnboarding: boolean;
  profileCompleteness?: number;
  isServiceProviderVerified?: boolean;
  serviceProviderVerifiedAt?: string;
  providerApplicationSubmittedAt?: string;
  providerApplicationReviewedAt?: string;
  providerApplicationReviewedBy?: string;
  providerApplicationRejectionReason?: string;
  createdAt?: string;
  lastLoginAt?: string;
  lastActiveAt?: string;

  addresses?: Address[];
  interests?: UserInterest[];
  verificationDocuments?: VerificationDocument[];
  services?: any[]; // Keep any for services for now if type not known
  _count?: {
    services?: number;
  };
}

export interface ProviderApplicationSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  status: Extract<UserStatus, "PENDING" | "REJECTED" | "ACTIVE">;
  emailVerified: boolean;
  phoneVerified: boolean;
  isServiceProviderVerified: boolean;
  providerApplicationSubmittedAt: string;
  providerApplicationReviewedAt?: string;
  providerApplicationRejectionReason?: string;
  _count: { verificationDocuments: number };
}

export interface ProviderApplicationDetail extends User {
  status: Extract<UserStatus, "PENDING" | "REJECTED" | "ACTIVE">;
  providerApplicationSubmittedAt: string;
  addresses: Address[];
  interests: UserInterest[];
  verificationDocuments: VerificationDocument[];
  reviewer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email: string;
  } | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  authStep: AuthStep;
  userAuthStep: UserAuthStep;
  providerAuthStep: ProviderAuthStep;
  authFlow: "user" | "provider";
}

export type AuthStep =
  | "signin"
  | "signup"
  | "verify-email"
  | "forgot-password"
  | "forgot-password-sent"
  | "verify-password-reset-otp"
  | "reset-password"
  | "reset-password-success";

export type UserAuthStep =
  | "signup"
  | "verify-email"
  | "onboarding-personalize"
  | "onboarding-location"
  | "onboarding-profile"
  | "onboarding-interests"
  | "onboarding-experience"
  | "onboarding-documents";

export type ProviderAuthStep =
  | "provider-signup"
  | "verify-email"
  | "provider-profile"
  | "provider-bio"
  | "provider-skills"
  | "provider-experience"
  | "provider-coverage"
  | "provider-documents"
  | "provider-submitted";

// Step arrays for easier navigation
export const USER_AUTH_STEPS: UserAuthStep[] = [
  "signup",
  "verify-email",
  "onboarding-personalize",
  "onboarding-location",
  "onboarding-profile",
  "onboarding-interests",
  "onboarding-experience",
  "onboarding-documents",
];

export const PROVIDER_AUTH_STEPS: ProviderAuthStep[] = [
  "provider-signup",
  "verify-email",
  "provider-profile",
  "provider-bio",
  "provider-skills",
  "provider-experience",
  "provider-coverage",
  "provider-documents",
  "provider-submitted",
];

// Mapping function to convert backend onboarding steps to frontend steps
export function mapBackendStepToFrontendStep(
  backendStep: string,
  userRole: "USER" | "SERVICE_PROVIDER" | "ADMIN",
): UserAuthStep | ProviderAuthStep {
  if (userRole === "SERVICE_PROVIDER") {
    const providerStepMap: Record<string, ProviderAuthStep> = {
      email_verification: "verify-email",
      basic_profile: "provider-profile",
      location: "provider-coverage", // Provider location step
      interests: "provider-skills", // Map interests to skills for providers
      experience: "provider-experience",
      verification_documents: "provider-documents",
    };
    return providerStepMap[backendStep] || "provider-profile";
  } else {
    const userStepMap: Record<string, UserAuthStep> = {
      email_verification: "verify-email",
      basic_profile: "onboarding-profile",
      location: "onboarding-location",
      interests: "onboarding-interests",
      experience: "onboarding-experience",
      verification_documents: "onboarding-documents",
    };
    return userStepMap[backendStep] || "onboarding-personalize";
  }
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface OnboardingLocationData {
  address: string;
  useCurrentLocation: boolean;
}

export interface OnboardingProfileData {
  fullName: string;
  phoneNumber: string;
  language: string;
  avatar?: File;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Ensure Category is not duplicated if possible, or merged.
// The file previously had export interface Category. I moved it up.

export interface OnboardingInterestsData {
  categories: string[];
}

export interface OnboardingExperienceData {
  level: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
}

export interface OnboardingDocumentsData {
  documents: File[];
}

export interface OnboardingStep {
  step: string;
  required: boolean;
  completed: boolean;
  label: string;
  description: string;
}

export interface OnboardingStatus {
  isComplete: boolean;
  nextRequiredStep?: string;
  completedSteps: string[];
  requiredSteps: string[];
  steps: OnboardingStep[];
  completionPercentage: number;
}
