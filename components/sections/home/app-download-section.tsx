"use client";

import Image from "next/image";

export function AppDownloadSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#1a3a2e] to-[#0d1f1a] dark:from-gray-900 dark:to-gray-950 overflow-hidden md:mb-[96px]">
      <div className="w-[80%] mx-auto pt-[31px]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 items-center min-h-[400px] md:min-h-[500px]">
          {/* Left Side - Phone Image (2/5) */}
          <div className="relative md:col-span-2 h-[400px] md:h-[500px] flex items-center justify-center md:justify-start md:pl-8">
            <div className="relative w-full h-full max-w-[400px] mx-auto">
              {/* Desktop Image */}
              <Image
                src="/assets/site-images/home_female_hand.png"
                alt="Mobile app on phone"
                fill
                className="hidden md:block object-cover object-left"
                priority
              />
              {/* Mobile Image */}
              <Image
                src="/assets/site-images/home_female_hand_mobile.png"
                alt="Mobile app on phone"
                fill
                className="block md:hidden object-contain object-center"
                priority
              />
            </div>
          </div>

          {/* Right Side - Content (3/5) */}
          <div className="md:col-span-3 px-6 sm:px-8 lg:px-16 py-8 md:py-0 text-white flex flex-col justify-center space-y-8">
            {/* Stylish Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-bold leading-tight font-[family-name:var(--font-dancing-script)]">
              Get Services Anytime, Anywhere
            </h2>

            {/* Description */}
            <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-xl leading-relaxed">
              Hire trusted pros or sell your skills on the go. Download the{" "}
              <span className="text-[#86EFAC] font-semibold">Pavodah</span> app
              today.
            </p>

            {/* App Store Badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#"
                className="inline-block transition-transform hover:scale-105"
                aria-label="Download on Google Play Store"
              >
                <Image
                  src="/assets/site-images/playstore_badge.png"
                  alt="Get it on Google Play"
                  width={150}
                  height={45}
                  className="h-[45px] w-auto"
                />
              </a>
              <a
                href="#"
                className="inline-block transition-transform hover:scale-105"
                aria-label="Download on App Store"
              >
                <Image
                  src="/assets/site-images/app_store_badge.png"
                  alt="Download on the App Store"
                  width={150}
                  height={45}
                  className="h-[45px] w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
