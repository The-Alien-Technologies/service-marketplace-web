"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Flag,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useContactSupport } from "@/hooks/use-contact-support";
import { useProtectedNavigation } from "@/hooks/use-protected-navigation";
import {useTranslations} from "next-intl";

export function TrustSafetyContent() {
  const t = useTranslations("Safety");
  const nav = useTranslations("Navigation");
  const legal = useTranslations("Legal");
  const contactSupport = useContactSupport();
  const navigate = useProtectedNavigation();
  const guideLinks = [
    {label: t("guidePlatform"), href: "#stay-on-platform"},
    {label: t("guideAccount"), href: "#account-security"},
    {label: t("guidePayments"), href: "#payments-disputes"},
    {label: t("guideWarnings"), href: "#warning-signs"},
    {label: t("guideReport"), href: "#report"}
  ];

  return (
    <main className="bg-white text-gray-950">
      <section className="bg-marketplace-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-300 text-green-950 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.03em] sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-green-100 sm:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <div className="self-end border-t border-green-300/30 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-sm font-semibold text-green-200">
              {t("threeRules")}
            </p>
            <ol className="mt-5 space-y-5 text-sm leading-6 text-white">
              <li className="flex gap-3">
                <span className="font-bold text-green-300">1</span>
                {t("rule1")}
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-300">2</span>
                {t("rule2")}
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-300">3</span>
                {t("rule3")}
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20 lg:px-8 lg:py-20">
        <aside
          className="lg:sticky lg:top-8 lg:self-start"
          aria-label={t("onPage")}
        >
          <p className="text-sm font-semibold text-gray-950">{t("onPage")}</p>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {guideLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-11 shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 divide-y divide-gray-200">
          <section id="stay-on-platform" className="scroll-mt-24 pb-12">
            <MessageSquareText
              className="h-7 w-7 text-green-700"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
              {t("platformTitle")}
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              {t("platformBody")}
            </p>
            <ul className="mt-6 max-w-[72ch] space-y-3 text-sm leading-7 text-gray-700">
              <li>
                {t("platform1")}
              </li>
              <li>
                {t("platform2")}
              </li>
              <li>
                {t("platform3")}
              </li>
            </ul>
          </section>

          <section id="account-security" className="scroll-mt-24 py-12">
            <LockKeyhole
              className="h-7 w-7 text-green-700"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
              {t("accountTitle")}
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              {t("accountBody")}
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/profile?tab=password")}
              className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              {t("reviewPassword")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>

          <section id="payments-disputes" className="scroll-mt-24 py-12">
            <CircleDollarSign
              className="h-7 w-7 text-green-700"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
              {t("paymentsTitle")}
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              {t("paymentsBody")}
            </p>
            <div className="mt-7 grid gap-6 border-y border-gray-200 py-6 sm:grid-cols-2">
              <div>
                <BadgeCheck
                  className="h-5 w-5 text-green-700"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-semibold">{t("correctTitle")}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {t("correctBody")}
                </p>
              </div>
              <div>
                <Flag className="h-5 w-5 text-amber-700" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{t("problemTitle")}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {t("problemBody")}
                </p>
              </div>
            </div>
          </section>

          <section id="warning-signs" className="scroll-mt-24 py-12">
            <TriangleAlert
              className="h-7 w-7 text-amber-700"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
              {t("warningTitle")}
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              {t("warningBody")}
            </p>
            <ul className="mt-6 max-w-[72ch] space-y-3 text-sm leading-7 text-gray-700">
              <li>
                {t("warning1")}
              </li>
              <li>
                {t("warning2")}
              </li>
              <li>
                {t("warning3")}
              </li>
              <li>
                {t("warning4")}
              </li>
              <li>
                {t("warning5")}
              </li>
            </ul>
          </section>

          <section id="report" className="scroll-mt-24 pt-12">
            <h2 className="text-3xl font-bold tracking-[-0.025em]">
              {t("reportTitle")}
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              {t("reportBody")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={contactSupport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                {nav("contactSupport")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/disputes")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                {nav("disputes")}
              </button>
            </div>
            <p className="mt-8 max-w-[72ch] border-t border-gray-200 pt-6 text-sm leading-6 text-gray-500">
              {t("emergency")}
            </p>
          </section>
        </div>
      </div>

      <section className="bg-gray-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-xl font-bold">
              {t("policiesTitle")}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {t("policiesBody")}
            </p>
          </div>
          <div className="flex gap-5 text-sm font-semibold">
            <Link
              href="/terms"
              className="hover:text-green-300 hover:underline"
            >
              {legal("termsTitle")}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-green-300 hover:underline"
            >
              {legal("privacyTitle")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
