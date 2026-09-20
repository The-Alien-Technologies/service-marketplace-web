"use client";

import Image from "next/image";
import {useTranslations} from "next-intl";

export function AppDownloadSection() {
  const t = useTranslations("Home");
  return (
    <section className="relative bg-gradient-to-br from-[#1a3a2e] to-[#0d1f1a] dark:from-gray-900 dark:to-gray-950 overflow-hidden md:mb-[96px]">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 items-center min-h-[400px] md:min-h-[500px]">
          {/* Left Side - Phone Image (2/5) */}
          <div className="relative flex h-[320px] items-center justify-center sm:h-[400px] md:col-span-2 md:h-[500px] md:justify-start md:pl-8">
            <div className="relative w-full h-full max-w-[400px] mx-auto">
              {/* Desktop Image */}
              <Image
                src="/assets/site-images/home_female_hand.png"
                alt={t("appImageAlt")}
                fill
                className="hidden md:block object-cover object-left"
                priority
              />
              {/* Mobile Image */}
              <Image
                src="/assets/site-images/home_female_hand_mobile.png"
                alt={t("appImageAlt")}
                fill
                className="block md:hidden object-contain object-center"
                priority
              />
            </div>
          </div>

          {/* Right Side - Content (3/5) */}
          <div className="flex flex-col justify-center space-y-6 px-1 py-8 text-white sm:px-4 md:col-span-3 md:space-y-8 md:py-0 lg:px-16">
            {/* Stylish Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-bold leading-tight font-[family-name:var(--font-dancing-script)]">
              {t("appTitle")}
            </h2>

            {/* Description */}
            <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-xl leading-relaxed">
              {t("appBody")}
            </p>

            {/* App Store Badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#"
                className="inline-block transition-transform hover:scale-105"
                aria-label={t("googlePlay")}
              >
                <Image
                  src="/assets/site-images/playstore_badge.png"
                  alt={t("googlePlay")}
                  width={150}
                  height={45}
                  className="h-[45px] w-auto"
                />
              </a>
              <a
                href="#"
                className="inline-block transition-transform hover:scale-105"
                aria-label={t("appStore")}
              >
                <Image
                  src="/assets/site-images/app_store_badge.png"
                  alt={t("appStore")}
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
