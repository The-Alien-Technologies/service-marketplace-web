"use client";

import { ChevronDown, Globe, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@/lib/languages";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-5 lg:px-8">
      <div className="flex items-center lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open dashboard navigation"
          className="-ml-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <NotificationBell className="text-gray-500 hover:text-gray-700" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1 px-2 font-normal text-gray-600 hover:text-gray-900 sm:px-3"
            >
              <Globe className="w-5 h-5 mr-1" />
              <span>{DEFAULT_LANGUAGE.shortLabel}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SUPPORTED_LANGUAGES.map((language) => (
              <DropdownMenuItem key={language.value}>
                {language.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
