"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface ServiceHeroProps {
  imageUrl?: string;
  alt?: string;
}

export function ServiceHero({
  imageUrl,
  alt = "Service preview",
}: ServiceHeroProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
      <div className="relative aspect-video">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <ImageIcon className="h-16 w-16" aria-hidden="true" />
            <span className="sr-only">No service image provided</span>
          </div>
        )}
      </div>
    </div>
  );
}
