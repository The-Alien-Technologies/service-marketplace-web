"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  Music2,
} from "lucide-react";
import { useCategories } from "@/store/categories-store";

export function Footer() {
  const { topLevelCategories, isLoading } = useCategories();

  const companyLinks = [
    { label: "About AVADgh", href: "#" },
    { label: "Help & Support", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ];

  const sellerLinks = [
    { label: "Become an Agency", href: "#" },
    { label: "Seller Equity Program", href: "#" },
    { label: "Community Hub", href: "#" },
    { label: "Events", href: "#" },
    { label: "Forum", href: "#" },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Logo and Social Icons */}
          <div className="col-span-2 lg:col-span-1 space-y-6 flex flex-col items-start text-left">
            {/* Logo */}
            <Link href="/" className="inline-block">
              <Image
                src="/assets/logo/logo.svg"
                alt="AVADgh Logo"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            {/* Copyright */}
            <p className="text-sm text-gray-400">© AVADghana Ltd. 2025</p>

            {/* Social Media Icons */}
            <div className="flex items-center justify-start gap-4 flex-wrap">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <Music2 size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Pinterest"
              >
                <MessageCircle size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-base font-semibold mb-4">Categories</h3>
            <ul className="space-y-2.5">
              {isLoading && (
                <li className="text-sm text-gray-500">Loading...</li>
              )}
              {!isLoading && topLevelCategories.length > 0 &&
                topLevelCategories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.id}`}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              {!isLoading && topLevelCategories.length === 0 && (
                <li className="text-sm text-gray-500">
                  No categories available
                </li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-base font-semibold mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-base font-semibold mb-4">For Sellers</h3>
            <ul className="space-y-2.5">
              {sellerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
