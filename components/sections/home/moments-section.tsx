"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {useTranslations} from "next-intl";
import { useRouter } from "next/navigation";

export function MomentsSection() {
  const t = useTranslations("Home");
  const router = useRouter();
  return (
    <section className="relative py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background Pattern/Image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/assets/site-images/home_people_banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-4 lg:space-y-5">
            <h2 className="text-4xl font-bold md:text-5xl lg:text-[48px] text-gray-900 dark:text-white leading-tight">
              {t("momentsTitle")}
            </h2>

            <p className="text-[14px] font-[500] text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
              {t("momentsBody")}
            </p>

            <div className="lg:mt-[35px]">
              <Button
                onClick={() => router.push("/services")}
                size="lg"
                className="bg-brand-900 hover:bg-brand-700 text-white px-8 py-6 text-base md:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {t("browseServices")}
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-[350px] md:h-[450px] lg:h-[550px] flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src="/assets/site-images/home_people.png"
                alt={t("momentsAlt")}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
