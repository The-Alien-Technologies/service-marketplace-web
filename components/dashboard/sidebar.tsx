"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Box,
  Layers,
  ShoppingBag,
  Scale,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  User as UserIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Logo } from "@/components/layout/logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SidebarItem = {
  icon: any;
  label: string;
  href: string;
  subItems?: {
    label: string;
    href: string;
  }[];
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const adminSidebarItems: SidebarGroup[] = [
  {
    title: "MAIN",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: Users,
        label: "Users",
        href: "/dashboard/users",
      },
      {
        icon: Box,
        label: "Services",
        href: "/dashboard/services",
      },
      {
        icon: Layers,
        label: "Categories",
        href: "/dashboard/categories",
      },
      {
        icon: ShoppingBag,
        label: "Orders & Transaction",
        href: "/dashboard/orders",
      },
      {
        icon: Scale,
        label: "Disputes",
        href: "/dashboard/disputes",
      },
      {
        icon: Settings,
        label: "System settings",
        href: "/dashboard/settings",
      },
    ],
  },
];

const providerSidebarItems: SidebarGroup[] = [
  {
    title: "MAIN",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: Box,
        label: "My services",
        href: "/dashboard/services",
      },
      {
        icon: ShoppingBag,
        label: "Orders",
        href: "/dashboard/orders",
      },
      {
        icon: MessageSquare,
        label: "Messages",
        href: "/dashboard/messages",
        subItems: [
          { label: "Customer chat", href: "/dashboard/messages" },
          { label: "Quote request", href: "/dashboard/quotes" },
        ],
      },
      {
        icon: Star,
        label: "Reviews",
        href: "/dashboard/reviews",
      },
    ],
  },
];

const userSidebarItems: SidebarGroup[] = [
  {
    title: "MAIN",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: ShoppingBag,
        label: "My orders",
        href: "/dashboard/orders",
      },
      {
        icon: FileText,
        label: "My quotes",
        href: "/dashboard/my-quotes",
      },
    ],
  },
];

const accountItems = [
  {
    icon: Settings,
    label: "Profile & settings",
    href: "/dashboard/profile?tab=general",
  },
  {
    icon: HelpCircle,
    label: "Help & support",
    href: "/dashboard/support",
  },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isMobile, onClose, className }: SidebarProps = {}) {
  const pathname = usePathname();
  const { signOut, user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Messages"]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Determine sidebar items based on role
  const sidebarItems =
    user?.role === "ADMIN"
      ? adminSidebarItems
      : user?.role === "SERVICE_PROVIDER"
        ? providerSidebarItems
        : userSidebarItems;

  const userRoleLabel =
    user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "SERVICE_PROVIDER"
        ? "Provider"
        : "User";

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    signOut();
  };

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300",
        !isMobile && isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center border-b border-gray-100",
          !isMobile && isCollapsed ? "justify-center" : "justify-between px-6",
        )}
      >
        {!isCollapsed && <Logo withLink={true} />}
        {isMobile ? (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {isCollapsed ? (
              <Logo withLink={false} showText={false} />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-8">
        {sidebarItems.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <h3 className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 transition-opacity duration-200">
                {group.title}
              </h3>
            )}
            <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")}>
              {group.items.map((item) => {
                const isExpanded = expandedItems.includes(item.label);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`) ||
                      item.subItems?.some((sub) => pathname === sub.href);

                // Main Item Content
                const ItemContent = (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive ? "text-green-600" : "text-gray-500",
                      )}
                    />
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && hasSubItems && (
                      <span className="text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </>
                );

                if (hasSubItems && !isCollapsed) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={cn(
                          "w-full flex items-center rounded-lg text-sm font-medium transition-colors px-4 py-3 space-x-3",
                          isActive
                            ? "bg-green-50 text-green-600 border-l-4 border-green-700 rounded-l-none -ml-4 pl-7" // Compensate padding
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isActive ? "text-green-600" : "text-gray-500",
                          )}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        <span className="text-gray-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </button>

                      {/* Nested Items with Tree Lines */}
                      {isExpanded && (
                        <div className="relative ml-6 pl-4 border-l border-gray-200 space-y-1 mt-1 pb-2">
                          {item.subItems!.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => {
                                  if (isMobile) onClose?.();
                                }}
                                className={cn(
                                  "relative flex items-center text-sm font-medium transition-colors py-2 pl-2 hover:text-gray-900 block",
                                  isSubActive
                                    ? "text-green-700 bg-green-50/50 rounded-md"
                                    : "text-gray-500",
                                )}
                              >
                                {/* Curved Line for Tree Structure */}
                                <div className="absolute -left-[17px] top-1/2 -mt-px w-4 h-px bg-gray-200"></div>
                                <div className="absolute -left-[17px] top-0 bottom-1/2 w-px bg-gray-200 -mt-2"></div>

                                {subItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (isMobile) onClose?.();
                    }}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
                      isCollapsed
                        ? "justify-center px-2 py-3"
                        : "space-x-3 px-4 py-3",
                      isActive
                        ? "bg-green-50 text-green-600 border-l-4 border-green-700 rounded-none"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg",
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive ? "text-green-600" : "text-gray-500",
                      )}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          {!isCollapsed && (
            <h3 className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              ACCOUNT SETTINGS
            </h3>
          )}
          <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")}>
            {accountItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (isMobile) onClose?.();
                  }}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    isCollapsed
                      ? "justify-center px-2 py-3"
                      : "space-x-3 px-4 py-3",
                    isActive
                      ? "bg-green-50 text-green-600 border-l-4 border-green-700 rounded-none"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? "text-green-600" : "text-gray-500",
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
            <button
              onClick={() => setShowLogoutDialog(true)}
              className={cn(
                "w-full flex items-center rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed
                  ? "justify-center px-2 py-3"
                  : "space-x-3 px-4 py-3",
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0 text-gray-500" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Snippet */}
      <div
        className={cn(
          "border-t border-gray-200",
          isCollapsed ? "p-4 flex justify-center" : "p-4",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "space-x-3",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
            <img
              src={user?.avatar || ""}
              alt={user?.firstName || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{userRoleLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-red-600 ml-1" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 text-center">
                Are you sure you want to log out?
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500 mt-2">
                You&apos;ll be signed out from your account and will need to log
                in again to continue.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center w-full px-4 pb-4">
            <Button
              variant="outline"
              className="flex-1 border-gray-200"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
