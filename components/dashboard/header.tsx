"use client";

import { Bell, ChevronDown, Globe, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="bg-white h-16 flex items-center justify-between px-4 lg:px-8 border-b border-gray-200 shrink-0">
      <div className="flex items-center lg:hidden">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-500 hover:text-gray-700 cursor-pointer">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 font-normal"
            >
              <Globe className="w-5 h-5 mr-1" />
              <span>EN</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>Spanish</DropdownMenuItem>
            <DropdownMenuItem>French</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
