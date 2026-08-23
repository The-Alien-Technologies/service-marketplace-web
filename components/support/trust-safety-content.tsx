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

const GUIDE_LINKS = [
  { label: "Keep work on Pavodah", href: "#stay-on-platform" },
  { label: "Protect your account", href: "#account-security" },
  { label: "Payments and disputes", href: "#payments-disputes" },
  { label: "Recognize warning signs", href: "#warning-signs" },
  { label: "Report a concern", href: "#report" },
];

export function TrustSafetyContent() {
  const contactSupport = useContactSupport();
  const navigate = useProtectedNavigation();

  return (
    <main className="bg-white text-gray-950">
      <section className="bg-marketplace-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-300 text-green-950 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.03em] sm:text-6xl">
              Trust is built into every clear next step.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-green-100 sm:text-lg">
              Learn how to protect your account, keep a reliable record of
              marketplace work, and raise concerns through the right Pavodah
              channel.
            </p>
          </div>

          <div className="self-end border-t border-green-300/30 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-sm font-semibold text-green-200">
              Three rules worth remembering
            </p>
            <ol className="mt-5 space-y-5 text-sm leading-6 text-white">
              <li className="flex gap-3">
                <span className="font-bold text-green-300">1</span>
                Keep payment, messages, and delivery decisions in Pavodah.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-300">2</span>
                Never share your password or a one-time verification code.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-300">3</span>
                Stop and report pressure, impersonation, or suspicious payment
                requests.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20 lg:px-8 lg:py-20">
        <aside
          className="lg:sticky lg:top-8 lg:self-start"
          aria-label="On this page"
        >
          <p className="text-sm font-semibold text-gray-950">On this page</p>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {GUIDE_LINKS.map((link) => (
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
              Keep the work and conversation on Pavodah
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              Use Pavodah Messages for scope, delivery questions, and important
              decisions. Use the order page for payment and delivery actions.
              This gives both parties a consistent record if support needs to
              understand what happened.
            </p>
            <ul className="mt-6 max-w-[72ch] space-y-3 text-sm leading-7 text-gray-700">
              <li>
                Do not move payment to a personal bank or mobile-money account.
              </li>
              <li>
                Do not rely on screenshots as proof of a completed payment.
              </li>
              <li>
                Check the order state in Pavodah before starting or releasing
                work.
              </li>
            </ul>
          </section>

          <section id="account-security" className="scroll-mt-24 py-12">
            <LockKeyhole
              className="h-7 w-7 text-green-700"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
              Protect access to your account
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              Pavodah support should never ask you to disclose your password or
              a one-time verification code. Use a password you do not reuse on
              another service, keep your email and phone details current, and
              review unexpected security notifications promptly.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/profile?tab=password")}
              className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              Review password settings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>

          <section id="payments-disputes" className="scroll-mt-24 py-12">
            <CircleDollarSign
              className="h-7 w-7 text-green-700"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.025em]">
              Follow the payment and order state
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              Complete checkout through Pavodah and use the order details as the
              source of truth. Payment, delivery, refund, and dispute states can
              change at different times; a message from another user does not
              replace the status shown on the order.
            </p>
            <div className="mt-7 grid gap-6 border-y border-gray-200 py-6 sm:grid-cols-2">
              <div>
                <BadgeCheck
                  className="h-5 w-5 text-green-700"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-semibold">When work is correct</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Accept the delivery using the action on the eligible order.
                </p>
              </div>
              <div>
                <Flag className="h-5 w-5 text-amber-700" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">When there is a problem</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Raise a dispute from the order when the option is available
                  and describe the issue with relevant detail.
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
              Pause when something feels wrong
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              Suspicious behavior often uses urgency or secrecy. Do not proceed
              until you have checked the request through a trusted Pavodah
              screen.
            </p>
            <ul className="mt-6 max-w-[72ch] space-y-3 text-sm leading-7 text-gray-700">
              <li>
                A request to pay outside Pavodah or to send an extra “release”
                fee.
              </li>
              <li>
                A request for your password, verification code, or full
                payment-card details.
              </li>
              <li>
                A link that imitates Pavodah but uses an unfamiliar web address.
              </li>
              <li>
                Pressure to move quickly before you can review the order or
                profile.
              </li>
              <li>
                Threats, harassment, impersonation, or services that appear
                unlawful.
              </li>
            </ul>
          </section>

          <section id="report" className="scroll-mt-24 pt-12">
            <h2 className="text-3xl font-bold tracking-[-0.025em]">
              Report a concern
            </h2>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-gray-600">
              For an order-quality or payment disagreement, use the dispute
              action on the order when available. For suspicious behavior,
              account access, harassment, or anything that does not fit an order
              dispute, contact Pavodah support.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={contactSupport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                Contact support
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/disputes")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                View disputes
              </button>
            </div>
            <p className="mt-8 max-w-[72ch] border-t border-gray-200 pt-6 text-sm leading-6 text-gray-500">
              If someone is in immediate danger, contact the appropriate local
              emergency service first. Pavodah support is not an emergency
              response service.
            </p>
          </section>
        </div>
      </div>

      <section className="bg-gray-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-xl font-bold">
              Policies behind the marketplace
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Read how Pavodah handles platform use and personal information.
            </p>
          </div>
          <div className="flex gap-5 text-sm font-semibold">
            <Link
              href="/terms"
              className="hover:text-green-300 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="hover:text-green-300 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
