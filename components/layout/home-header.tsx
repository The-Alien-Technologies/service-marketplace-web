"use client";

import {
  Search,
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
import { Logo } from "./logo";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCategories } from "@/store/categories-store";
import { useState } from "react";
import { BotChatBox } from "../botChat/bot-chat-box";

interface BotProps {
  botName: string,
  botAvatar: string
}

export function HomeHeader({ botName = "AI Agent Kwadwo" , botAvatar} : BotProps) {
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
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleChatOpen = () => {
    setIsChatOpen(true);
    console.log("ai bot btn click")
  }



  const renderCategoriesDropdown = () => (
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
        {!categoriesLoading && topLevelCategories.length > 0 &&
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
  );

  return (
    <>
    
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left Group: Logo Only */}
          <Logo />

          {isAuthenticated ? (
            /* Authenticated Header (Service Page Style) */
            <div className="hidden lg:flex items-center space-x-6">
              {/* Categories Dropdown */}
              {renderCategoriesDropdown()}

              {/* Help & Support Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium text-sm cursor-pointer">
                    <span>Help & Support</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {/* <button onClick={handleChatOpen}>contact AI support</button> */}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>
                    <span>Help Center</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span onClick={handleChatOpen}>Contact Support</span>
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

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 cursor-pointer">
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
              <button className="relative text-gray-700 hover:text-green-600 cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Messages Icon */}
              <button className="text-gray-700 hover:text-green-600 cursor-pointer">
                <Mail className="w-5 h-5" />
              </button>

              {/* Shopping Bag Icon */}
              <button className="text-gray-700 hover:text-green-600 cursor-pointer">
                <ShoppingBag className="w-5 h-5" />
              </button>

              {/* User Profile / Auth */}
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
            </div>
          ) : (
            /* Unauthenticated Header (Home Page Style) */
            <div className="hidden lg:flex items-center space-x-8">
              <div className="flex items-center space-x-8">
                {/* Search Icon */}
                <button className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  <Search className="w-5 h-5" />
                </button>

                {/* Categories Dropdown */}
                {renderCategoriesDropdown()}

                {/* Help & Support Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600 font-medium text-sm cursor-pointer">
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

                {/* Become a seller */}
                <button
                  onClick={startProviderFlow}
                  className="text-gray-700 hover:text-green-600 font-medium text-sm cursor-pointer"
                >
                  Become a seller
                </button>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => showAuth("signin")}
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:text-gray-900 font-medium text-sm px-4 py-2"
                >
                  Sign in
                </Button>
                <Button
                  onClick={startUserFlow}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-6 py-2 rounded-lg"
                >
                  Sign up
                </Button>
              </div>
            </div>
          )}
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-700 hover:text-green-600 p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col pt-4 px-6 overflow-y-auto lg:hidden">
          <div className="flex justify-between items-center mb-8">
            <Logo />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-800 bg-gray-100 rounded-full"
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
                  {user?.role === "ADMIN" || user?.role === "SERVICE_PROVIDER" ? (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/dashboard");
                      }}
                      className="text-left font-medium text-lg text-gray-800"
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
                        className="text-left font-medium text-lg text-gray-800"
                      >
                        My Orders
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          router.push("/dashboard/profile?tab=general");
                        }}
                        className="text-left font-medium text-lg text-gray-800"
                      >
                        Settings
                      </button>
                    </>
                  )}
                </div>

                {/* Notifications & Messages */}
                <div className="flex flex-col space-y-4 pb-4 border-b border-gray-100">
                  <button className="flex items-center space-x-3 text-gray-800">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-lg">Notifications</span>
                  </button>
                  <button className="flex items-center space-x-3 text-gray-800">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-lg">Messages</span>
                  </button>
                  <button className="flex items-center space-x-3 text-gray-800">
                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-lg">Cart</span>
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
                            className="text-left text-gray-600 text-base py-1"
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
                    <div className="mt-3 flex flex-col space-y-3 pl-4">
                      <button className="text-left text-gray-600 text-base py-1">Help Center</button>
                      <button className="text-left text-gray-600 text-base py-1">Contact Support</button>
                      <button className="text-left text-gray-600 text-base py-1">Community</button>
                      <button className="text-left text-gray-600 text-base py-1">Trust & Safety</button>
                    </div>
                  </details>

                  <div className="flex justify-between items-center font-medium text-lg text-gray-800 pt-2">
                    Language
                    <span className="text-gray-500 text-base">EN</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left font-medium text-lg text-red-600 pt-2 pb-8"
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
                            className="text-left text-gray-600 text-base py-1"
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
                    <div className="mt-3 flex flex-col space-y-3 pl-4">
                      <button className="text-left text-gray-600 text-base py-1">Help Center</button>
                      <button className="text-left text-gray-600 text-base py-1">Contact Support</button>
                    </div>
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
                  <button
                    onClick={() => {
                      startProviderFlow();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-center font-medium text-green-600 border-t border-gray-100 pt-6 mt-2"
                  >
                    Become a seller
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

      {/* Chat Box */}
      <BotChatBox
      isOpen={isChatOpen}
      onClose={() => setIsChatOpen(false)}
      botName={botName}
      botAvatar={botAvatar}
      />
    </>
  );
}
