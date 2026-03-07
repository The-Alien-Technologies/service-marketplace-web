"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Pencil,
  FileText,
  CheckSquare,
  Circle,
  Lock,
  AlertCircle,
  Trash2,
  Globe,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { User } from "@/types/auth";
import { toast } from "react-toastify";

// Inline Switch Component
function Switch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-green-600" : "bg-gray-200",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export default function ProfileSettingsPage() {
  const { user: storedUser, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  // Edit States
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);

  // Form States (initialized from user)
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [professionalForm, setProfessionalForm] = useState({
    bio: "",
  });

  // Password State
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  // Preferences State
  // We map frontend preferences to DTO fields
  // DTO: notificationsEnabled, marketingNotifications, etc.

  // Fetch full profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { user: fullUser } = await apiService.getProfile();
        setUser(fullUser);

        // Initialize forms
        setPersonalForm({
          firstName: fullUser.firstName || "",
          lastName: fullUser.lastName || "",
          phoneNumber: (fullUser as any).phoneNumber || "",
        });
        setProfessionalForm({
          bio: (fullUser as any).bio || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  // Derived Values
  const primaryAddress =
    storedUser?.addresses?.find((a) => a.isPrimary) ||
    storedUser?.addresses?.[0];
  const userInterests = storedUser?.interests || [];
  const verificationDocs = storedUser?.verificationDocuments || [];

  // Handlers
  const handleUpdateProfile = async (
    data: any,
    section: "personal" | "professional",
  ) => {
    try {
      setIsLoading(true);
      const { user: updatedUser } = await apiService.updateUserProfile(data);
      setUser(updatedUser);
      toast.success("Profile updated successfully");
      if (section === "personal") setIsEditingPersonal(false);
      if (section === "professional") setIsEditingProfessional(false);
    } catch (error) {
      toast.error((error as Error).message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceUpdate = async (
    key: string,
    value: boolean | string,
  ) => {
    // Optimistic update would be good, but for simplicity we just call API and existing state syncs via re-fetch or manual set
    // Currently we don't have local state for prefs separate from user, so we assume optimistic update isn't critically needed for toggles if fast enough.
    // But typically toggles need local state. Let's rely on user object updates if possible or manage local state.

    const updateData = { [key]: value };

    try {
      const { user: updatedUser } =
        await apiService.updateUserProfile(updateData);
      setUser(updatedUser);
      toast.success("Preference updated");
    } catch (error) {
      toast.error("Failed to update preference");
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordForm.new !== passwordForm.confirm) return;

    try {
      setIsLoading(true);
      await apiService.changePassword(passwordForm.old, passwordForm.new);
      setPasswordForm({ old: "", new: "", confirm: "" });
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error((error as Error).message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    !passwordForm.confirm || passwordForm.new === passwordForm.confirm;

  if (!storedUser && isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-green-600" />
      </div>
    );
  }

  if (!storedUser)
    return <div className="p-8">Please log in to view profile.</div>;

  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your personal info, professional details, and account
          preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-1 overflow-x-auto">
        {[
          { id: "general", label: "General settings" },
          { id: "password", label: "Change password" },
          { id: "preferences", label: "Preferences & Notifications" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "text-green-700 bg-green-50"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- General Settings Tab --- */}
      {activeTab === "general" && (
        <>
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden relative border-4 border-white shadow-sm">
              {storedUser.avatar ? (
                <Image
                  src={storedUser.avatar}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-700 font-bold text-xl">
                  {(
                    storedUser.firstName?.[0] ||
                    storedUser.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="text-gray-700 border-gray-200 h-9 px-4 rounded-lg bg-white"
              >
                Change picture
              </Button>
              {!storedUser.isServiceProviderVerified && (
                <span className="text-sm font-medium text-orange-500 flex items-center gap-1.5">
                  Pending{" "}
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                </span>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-gray-50/50 rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">
                Personal Information
              </h3>
              {!isEditingPersonal ? (
                <button
                  onClick={() => setIsEditingPersonal(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingPersonal(false);
                      // Reset form
                      setPersonalForm({
                        firstName: storedUser.firstName || "",
                        lastName: storedUser.lastName || "",
                        phoneNumber: (storedUser as any).phoneNumber || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleUpdateProfile(personalForm, "personal")
                    }
                    disabled={isLoading}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                {isEditingPersonal ? (
                  <div className="flex gap-2 w-full max-w-sm">
                    <Input
                      value={personalForm.firstName}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="First Name"
                    />
                    <Input
                      value={personalForm.lastName}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          lastName: e.target.value,
                        })
                      }
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-900 font-medium">
                    {storedUser.firstName} {storedUser.lastName}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between max-w-md">
                <div className="flex items-center gap-3 w-full">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                  {isEditingPersonal ? (
                    <Input
                      value={personalForm.phoneNumber}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Phone Number"
                      className="max-w-xs"
                    />
                  ) : (
                    <span className="text-sm text-gray-900 font-medium">
                      {(storedUser as any).phoneNumber ||
                        "No phone number added"}
                    </span>
                  )}
                </div>
                {!isEditingPersonal && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      storedUser.phoneVerified
                        ? "text-green-600"
                        : "text-amber-600",
                    )}
                  >
                    {storedUser.phoneVerified ? "Verified" : "Not verified"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between max-w-md">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-900 font-medium">
                    {storedUser.email}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    storedUser.emailVerified
                      ? "text-green-600"
                      : "text-amber-600",
                  )}
                >
                  {storedUser.emailVerified ? "Verified" : "Not verified"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-900 font-medium">
                  {primaryAddress
                    ? primaryAddress.formattedAddress
                    : "No address added"}
                </span>
                {/* Editing address is usually complex, redirect or separate modal might be better. Keeping read-only for now or add "Manage Addresses" link later */}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Professional Information
              </h3>
              {!isEditingProfessional ? (
                <button
                  onClick={() => setIsEditingProfessional(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingProfessional(false);
                      setProfessionalForm({
                        bio: (storedUser as any).bio || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleUpdateProfile(professionalForm, "professional")
                    }
                    disabled={isLoading}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            {/* Short Bio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">
                Short Bio
              </label>
              {isEditingProfessional ? (
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={professionalForm.bio}
                  onChange={(e) =>
                    setProfessionalForm({
                      ...professionalForm,
                      bio: e.target.value,
                    })
                  }
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-600 leading-relaxed bg-white">
                  {(storedUser as any).bio || "No bio added yet."}
                </div>
              )}
            </div>

            {/* Skills & Services */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-900">
                Skills & Services
              </label>
              <div className="space-y-2">
                {storedUser.interests && storedUser.interests.length > 0 ? (
                  storedUser.interests.map((interest) => (
                    <div key={interest.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border border-gray-300 bg-green-50 flex items-center justify-center text-green-600">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {interest.category?.name || "Unknown Skill"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No skills listed
                  </div>
                )}
                {/* Adding skills involves a selection UI, keeping read-only for this iteration */}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-900">
                Experience Level
              </label>
              <div className="bg-gray-50/50 rounded-lg p-4 space-y-3">
                {["BEGINNER", "INTERMEDIATE", "EXPERT"].map((level) => {
                  const isSelected =
                    storedUser.serviceProviderExperienceLevel === level;
                  return (
                    <div
                      key={level}
                      className={cn(
                        "flex items-center gap-2",
                        !isSelected && "opacity-50",
                      )}
                    >
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full border-2 border-green-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                        </div>
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          isSelected
                            ? "font-bold text-gray-900"
                            : "text-gray-500",
                        )}
                      >
                        {level.charAt(0) + level.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verification & Trust */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900">
                  Verification & Trust
                </h3>
              </div>

              <div className="space-y-2">
                {verificationDocs.length > 0 ? (
                  verificationDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-gray-50/50 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {doc.fileName || doc.originalName || "Document"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.round((doc.fileSize || 0) / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          doc.status === "APPROVED"
                            ? "text-green-600"
                            : "text-gray-400",
                        )}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No verification documents uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Change Password Tab --- */}
      {activeTab === "password" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">
                Old password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="**********"
                  className="pl-10 pr-12 bg-white"
                  value={passwordForm.old}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, old: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-green-700 hover:underline"
                >
                  {showOldPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="**********"
                  className="pl-10 pr-12 bg-white"
                  value={passwordForm.new}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-green-700 hover:underline"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="**********"
                  className={cn(
                    "pl-10 pr-12 bg-white",
                    !passwordsMatch &&
                      "border-red-300 focus-visible:ring-red-500",
                  )}
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-green-700 hover:underline"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
                {!passwordsMatch && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 pr-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            <Button
              onClick={handlePasswordUpdate}
              disabled={
                isLoading ||
                !passwordsMatch ||
                !passwordForm.new ||
                !passwordForm.old
              }
              className="bg-[#15803d] hover:bg-[#14532d] text-white font-medium rounded-lg"
            >
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-serif text-gray-500">
                i
              </span>
              Security tips
            </h3>
            <div className="bg-gray-50/50 rounded-xl p-6 space-y-3">
              {[
                "At least 8 characters",
                "One uppercase & one lowercase letter",
                "At least one number",
                "At least one special character (!, #, $, %)",
              ].map((tip) => (
                <div key={tip} className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-green-600 rounded flex items-center justify-center bg-white">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Preferences & Notifications Tab --- */}
      {activeTab === "preferences" && (
        <div className="space-y-10 pt-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700">
                In-app Notifications
              </h3>
              <Switch
                checked={storedUser?.notificationsEnabled ?? true}
                onCheckedChange={(val) =>
                  handlePreferenceUpdate("notificationsEnabled", val)
                }
              />
            </div>
            <div className="bg-gray-50/50 rounded-xl p-6">
              <ul className="space-y-3">
                {[
                  "Order updates (New order request, status change, delivery confirmation)",
                  "Messages (New client messages)",
                  "Reviews (When a client leaves feedback)",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700">
                Email Notifications
              </h3>
              <Switch
                checked={storedUser?.emailNotificationsEnabled ?? true}
                onCheckedChange={(val) =>
                  handlePreferenceUpdate("emailNotificationsEnabled", val)
                }
              />
            </div>
            <div className="bg-gray-50/50 rounded-xl p-6">
              <ul className="space-y-3">
                {[
                  "Daily summary (digest)",
                  "Real-time updates (instant alerts)",
                  "Important account alerts only",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700">
                SMS Notifications
              </h3>
              <Switch
                checked={storedUser?.smsNotificationsEnabled ?? false}
                onCheckedChange={(val) =>
                  handlePreferenceUpdate("smsNotificationsEnabled", val)
                }
              />
            </div>
            <div className="bg-gray-50/50 rounded-xl p-6">
              <ul className="space-y-3">
                {[
                  "Critical updates only (Order accepted/declined, payment received)",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <h3 className="text-sm font-medium text-gray-700">
              Language Preference
            </h3>
            <Select
              defaultValue={storedUser?.preferredLanguage || "en-gb"}
              onValueChange={(val) =>
                handlePreferenceUpdate("preferredLanguage", val)
              }
            >
              <SelectTrigger className="bg-white">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <SelectValue placeholder="Select language" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-gb">English-GB</SelectItem>
                <SelectItem value="en-us">English-US</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-red-500 flex items-center gap-2">
              Delete Account <Trash2 className="w-4 h-4" />
            </h3>
            <div className="bg-gray-50/50 rounded-xl p-6">
              <ul className="space-y-3">
                {[
                  "When you delete your account, you lose access to account services, and we permanently delete your personal data.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
