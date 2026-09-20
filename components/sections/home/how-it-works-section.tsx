"use client";

import Image from "next/image";
import {useTranslations} from "next-intl";

export function HowItWorksSection() {
  const t = useTranslations("Home");
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center justify-start gap-4 flex-wrap mb-4">
            <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t("trustedPros")}
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 bg-[#ECFDF3] rounded-2xl sm:rounded-3xl p-2 sm:p-[4px]">
              <span className="inline-flex items-center bg-[#4A7C59] dark:bg-brand-900 text-white text-xs font-semibold px-5 py-2 rounded-full whitespace-nowrap">
                {t("howItWorks")}
              </span>
              <p className="text-sm font-[500] text-marketplace-400 dark:text-gray-400 rounded-sm px-2 sm:px-0">
                {t("simpleProcess")}
              </p>
            </div>
          </div>
        </div>

        {/* Process Image */}
        <div className="relative w-full max-w-5xl mx-auto">
          <Image
            src="/assets/site-images/home_trusted_pros.png"
            alt={t("howItWorksAlt")}
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
