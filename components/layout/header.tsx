"use client";

import {
  ChevronDown,
  Globe,
  Bell,
  Mail,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import Image from "next/image";
import { Logo } from "./logo";
import { useRouter } from "next/navigation";
import { useCategories } from "@/store/categories-store";
import { useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/languages";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  HelpSupportDropdownItems,
  HelpSupportMobileLinks,
} from "./help-support-menu";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    showAuth,
    signOut,
    startUserFlow,
    startProviderFlow,
  } = useAuthStore();
  const { topLevelCategories, isLoading: categoriesLoading } = useCategories();

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <Logo />

          {/* Right: Navigation & Actions (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium text-sm cursor-pointer">
                  <span>Categories</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {categoriesLoading && (
                  <DropdownMenuItem disabled>
                    <span className="text-gray-400">Loading...</span>
                  </DropdownMenuItem>
                )}
                {!categoriesLoading &&
                  topLevelCategories.length > 0 &&
                  topLevelCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => router.push(`/categories/${category.id}`)}
                    >
                      <span>{category.name}</span>
                    </DropdownMenuItem>
                  ))}
                {!categoriesLoading && topLevelCategories.length === 0 && (
                  <DropdownMenuItem disabled>
                    <span className="text-gray-400">No categories</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help & Support Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium text-sm cursor-pointer">
                  <span>Help & Support</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <HelpSupportDropdownItems />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 cursor-pointer">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {DEFAULT_LANGUAGE.shortLabel}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <DropdownMenuItem key={language.value}>
                    <span>{language.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && (
              <>
                <NotificationBell className="p-0 text-gray-700 hover:bg-transparent hover:text-green-600" />
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/messages")}
                  className="rounded-md text-gray-700 hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  aria-label="Messages"
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/orders")}
                  className="rounded-md text-gray-700 hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  aria-label="Orders"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </>
            )}

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-full border border-gray-200 hover:border-green-600 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      {user?.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.firstName || "User"}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-600 text-white text-sm font-semibold">
                          {user?.firstName?.[0] || user?.email?.[0] || "U"}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName || "User"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user?.role === "ADMIN" ||
                  user?.role === "SERVICE_PROVIDER" ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard")}
                      >
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut}>
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard/orders")}
                      >
                        <span>My Orders</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push("/dashboard/profile?tab=general")
                        }
                      >
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut}>
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => showAuth("signin")}
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign in
                </Button>
                <Button
                  onClick={startUserFlow}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className="flex justify-between items-center mb-8">
            <Logo />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col space-y-6">
            {isAuthenticated ? (
              <div className="flex flex-col space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="User"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-600 text-white text-lg font-semibold">
                        {user?.firstName?.[0] || user?.email?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-lg">
                      {user?.firstName || "User"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {user?.email || ""}
                    </span>
                  </div>
                </div>

                {/* Dashboard & Profile Links */}
                <div className="flex flex-col space-y-4 pb-4 border-b border-gray-100">
                  {user?.role === "ADMIN" ||
                  user?.role === "SERVICE_PROVIDER" ? (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/dashboard");
                      }}
                      className="text-left font-medium text-lg text-gray-800 cursor-pointer"
                    >
                      Dashboard
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          router.push("/dashboard/orders");
                        }}
                        className="text-left font-medium text-lg text-gray-800 cursor-pointer"
                      >
                        My Orders
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          router.push("/dashboard/profile?tab=general");
                        }}
                        className="text-left font-medium text-lg text-gray-800 cursor-pointer"
                      >
                        Settings
                      </button>
                    </>
                  )}
                </div>

                {/* Notifications & Messages */}
                <div className="flex flex-col space-y-4 pb-4 border-b border-gray-100">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/dashboard/notifications");
                    }}
                    className="flex items-center space-x-3 text-gray-800 cursor-pointer"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-lg">Notifications</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/dashboard/messages");
                    }}
                    className="flex items-center space-x-3 text-gray-800 cursor-pointer"
                  >
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-lg">Messages</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/dashboard/orders");
                    }}
                    className="flex items-center space-x-3 text-gray-800 cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-lg">Orders</span>
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col space-y-4 pb-4 border-b border-gray-100">
                  <details className="group">
                    <summary className="flex justify-between items-center font-medium text-lg text-gray-800 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      Categories
                      <ChevronDown className="w-5 h-5 transition duration-300 group-open:-rotate-180" />
                    </summary>
                    <div className="mt-3 flex flex-col space-y-3 pl-4">
                      {categoriesLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        topLevelCategories.slice(0, 10).map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              router.push(`/categories/${category.id}`);
                            }}
                            className="text-left text-gray-600 text-base py-1 cursor-pointer"
                          >
                            {category.name}
                          </button>
                        ))
                      )}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex justify-between items-center font-medium text-lg text-gray-800 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      Help & Support
                      <ChevronDown className="w-5 h-5 transition duration-300 group-open:-rotate-180" />
                    </summary>
                    <HelpSupportMobileLinks
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                  </details>

                  <div className="flex justify-between items-center font-medium text-lg text-gray-800 pt-2 cursor-pointer">
                    Language
                    <span className="text-gray-500 text-base">
                      {DEFAULT_LANGUAGE.shortLabel}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left font-medium text-lg text-red-600 pt-2 pb-8 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Navigation Links (Unauthenticated) */}
                <div className="flex flex-col space-y-4 pb-4 border-b border-gray-100">
                  <details className="group">
                    <summary className="flex justify-between items-center font-medium text-lg text-gray-800 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      Categories
                      <ChevronDown className="w-5 h-5 transition duration-300 group-open:-rotate-180" />
                    </summary>
                    <div className="mt-3 flex flex-col space-y-3 pl-4">
                      {categoriesLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        topLevelCategories.slice(0, 10).map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              router.push(`/categories/${category.id}`);
                            }}
                            className="text-left text-gray-600 text-base py-1 cursor-pointer"
                          >
                            {category.name}
                          </button>
                        ))
                      )}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex justify-between items-center font-medium text-lg text-gray-800 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      Help & Support
                      <ChevronDown className="w-5 h-5 transition duration-300 group-open:-rotate-180" />
                    </summary>
                    <HelpSupportMobileLinks
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                  </details>
                </div>

                <div className="pt-2 flex flex-col space-y-4 pb-8">
                  <Button
                    onClick={() => {
                      showAuth("signin");
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-center py-6 text-lg"
                  >
                    Sign in
                  </Button>
                  <Button
                    onClick={() => {
                      startUserFlow();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-center bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  >
                    Sign up
                  </Button>
                  {startProviderFlow && (
                    <button
                      onClick={() => {
                        startProviderFlow();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-center font-medium text-green-600 border-t border-gray-100 pt-6 mt-2 cursor-pointer"
                    >
                      Become a seller
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
