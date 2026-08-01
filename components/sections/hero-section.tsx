"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { Check } from "lucide-react";

export function HeroSection() {
  const { startUserFlow } = useAuthStore();

  return (
    <section
      className="bg-marketplace-600 overflow-hidden">
      <div
        className="relative bg-cover sm:bg-contain bg-no-repeat bg-center sm:bg-right max-w-7xl mx-auto min-h-[480px] sm:min-h-0"
        style={{
          backgroundImage: "url(/assets/site-images/home_background.png)",
        }}
      >
        {/* Content */}
        <div className="relative z-10 mx-auto px-4 md:px-6 py-14 sm:py-[75px]">
          <div className="bg-black/30 sm:bg-transparent p-6 sm:p-0 rounded-2xl max-w-fit backdrop-blur-sm sm:backdrop-blur-none transition-all">
            {/* Main Heading */}
            <h1 className="text-4xl lg:text-[48px] font-bold text-white mb-6 lg:mb-[32px] leading-tight max-w-[700px]">
              Find & hire trusted service providers with{" "}
              <span className="text-brand-400 relative">Pavodah</span>
            </h1>

            {/* Bullet Points */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 sm:mb-[32px]">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Check className="w-[20px] h-[20px] text-black" />
                </div>
                <span className="text-white text-lg font-medium">
                  Get matched with experts near you.
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Check className="w-[20px] h-[20px] text-black" />
                </div>
                <span className="text-white text-lg font-medium">
                  Get the job done. Get peace of mind.
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={startUserFlow}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
