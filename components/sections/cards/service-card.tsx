import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

export interface ServiceCardData {
  id: string;
  providerName: string;
  providerAvatar: string;
  isPro: boolean;
  isOnline?: boolean;
  serviceImage: string;
  description: string;
  price: string;
  rating: number;
}

interface ServiceCardProps {
  service: ServiceCardData;
  onClick?: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const [avatarError, setAvatarError] = useState(false);

  // Get initials from provider name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link
      href={`/services/${service.id}`}
      className="block bg-white dark:bg-gray-800 rounded-[20px] overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* Service Image with Overlay */}
      <div className="relative h-[340px] overflow-hidden rounded-[20px]">
        <Image
          src={service.serviceImage}
          alt={service.description}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Provider Info Header Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5 bg-gray-600/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-3 py-1.5 min-h-[36px]">
            <div className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
              {!avatarError ? (
                <>
                  <Image
                    src={service.providerAvatar}
                    alt={service.providerName}
                    width={24}
                    height={24}
                    className="rounded-full object-cover w-full h-full"
                    onError={() => setAvatarError(true)}
                  />
                  {service.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <Image
                        src="/assets/icons/online_indicator.svg"
                        alt="Online"
                        width={10}
                        height={10}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold leading-none select-none">
                  {getInitials(service.providerName)}
                </div>
              )}
            </div>
            <h3 className="font-medium text-white text-sm max-w-[100px] truncate">
              {service.providerName}
            </h3>
          </div>

          {service.isPro && (
            <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                Pro
              </span>
              <Image
                src="/assets/icons/verify_filled.svg"
                alt="Verified"
                width={14}
                height={14}
              />
            </div>
          )}
        </div>
      </div>

      {/* Service Details - Outside Image */}
      <div className="px-4 py-5 text-center bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
          {service.description}
        </p>

        <div className="flex items-center justify-center space-x-2 text-sm">
          <span className="font-bold text-sm text-gray-900 dark:text-white">
            {service.price}
          </span>
          <span className="text-gray-300 dark:text-gray-300">|</span>
          <div className="flex items-center space-x-1">
            <Image
              src="/assets/icons/star_icon.svg"
              alt="Rating"
              width={16}
              height={16}
            />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {service.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
