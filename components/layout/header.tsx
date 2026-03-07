"use client";

import { ChevronDown, Globe, Bell, Mail, ShoppingBag } from "lucide-react";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { useCategories } from "@/store/categories-store";

export function Header() {
  const router = useRouter();
  const { isAuthenticated, user, showAuth, signOut, startUserFlow } =
    useAuthStore();
  const { topLevelCategories, isLoading: categoriesLoading } = useCategories();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <Logo />

          {/* Right: Navigation & Actions */}
          <div className="flex items-center space-x-6">
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium text-sm">
                  <span>Categories</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {categoriesLoading ? (
                  <DropdownMenuItem disabled>
                    <span className="text-gray-400">Loading...</span>
                  </DropdownMenuItem>
                ) : topLevelCategories.length > 0 ? (
                  topLevelCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => router.push(`/categories/${category.id}`)}
                    >
                      <span>{category.name}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-gray-400">No categories</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help & Support Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium text-sm">
                  <span>Help & Support</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>
                  <span>Help Center</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Contact Support</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Community</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Trust & Safety</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-medium">EN</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem>
                  <span>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Français</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Español</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Icon */}
            <button className="relative text-gray-700 hover:text-green-600">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Messages Icon */}
            <button className="text-gray-700 hover:text-green-600">
              <Mail className="w-5 h-5" />
            </button>

            {/* Shopping Bag Icon */}
            <button className="text-gray-700 hover:text-green-600">
              <ShoppingBag className="w-5 h-5" />
            </button>

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-full border border-gray-200 hover:border-green-600 transition-colors">
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
        </div>
      </div>
    </header>
  );
}
