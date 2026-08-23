"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Mail,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactSupport } from "@/hooks/use-contact-support";
import { useProtectedNavigation } from "@/hooks/use-protected-navigation";

type HelpTopic =
  | "Getting started"
  | "Account & security"
  | "Hiring & orders"
  | "Payments & disputes"
  | "Providing services";

type HelpArticle = {
  topic: HelpTopic;
  question: string;
  answer: string;
  action?: { label: string; href: string };
};

const TOPICS: HelpTopic[] = [
  "Getting started",
  "Account & security",
  "Hiring & orders",
  "Payments & disputes",
  "Providing services",
];

const ARTICLES: HelpArticle[] = [
  {
    topic: "Getting started",
    question: "How do I find the right service provider?",
    answer:
      "Browse a category, compare the service details and provider profile, then choose the package that matches your needs. Keep the order and conversation in Pavodah so the work has a clear record.",
    action: { label: "Browse services", href: "/" },
  },
  {
    topic: "Getting started",
    question: "Do I need an account before contacting support?",
    answer:
      "Yes. Signing in lets Pavodah connect your support conversation to your account, show your previous support history, and safely investigate account-specific issues.",
  },
  {
    topic: "Account & security",
    question: "How do I update my profile information?",
    answer:
      "Open Profile & settings, choose General settings, update the relevant details, and save your changes.",
    action: {
      label: "Open profile settings",
      href: "/dashboard/profile?tab=general",
    },
  },
  {
    topic: "Account & security",
    question: "What should I do if I forget my password?",
    answer:
      "Choose Forgot password on the sign-in screen. Pavodah will guide you through email verification before you create a new password.",
  },
  {
    topic: "Account & security",
    question: "How do I change my password while signed in?",
    answer:
      "Open Profile & settings, select Change password, enter your current password, then confirm the new one.",
    action: {
      label: "Change password",
      href: "/dashboard/profile?tab=password",
    },
  },
  {
    topic: "Account & security",
    question: "How do I control notification emails and SMS?",
    answer:
      "Notification preferences are under Profile & settings. In-app, email, and eligible critical SMS notifications can be controlled separately.",
    action: {
      label: "Manage notifications",
      href: "/dashboard/profile?tab=preferences",
    },
  },
  {
    topic: "Hiring & orders",
    question: "Where can I track an order?",
    answer:
      "Open My orders to see the current order status, payment state, delivery details, messages, and any actions available to you.",
    action: { label: "View my orders", href: "/dashboard/orders" },
  },
  {
    topic: "Hiring & orders",
    question: "How do quote requests work?",
    answer:
      "A quote request describes the work, budget, and expected delivery. The provider can respond with updated terms before an order is created.",
    action: { label: "View my quotes", href: "/dashboard/my-quotes" },
  },
  {
    topic: "Hiring & orders",
    question: "Where should I discuss project details?",
    answer:
      "Use Pavodah Messages. Keeping the scope, delivery questions, and decisions in the conversation gives both parties a reliable record.",
    action: { label: "Open messages", href: "/dashboard/messages" },
  },
  {
    topic: "Hiring & orders",
    question: "What should I do when work is delivered?",
    answer:
      "Review the delivery from the order page. Accept it when it matches the agreed work. If there is a material problem, use the dispute option shown for an eligible order instead of resolving it outside Pavodah.",
  },
  {
    topic: "Payments & disputes",
    question: "How can I confirm whether a payment succeeded?",
    answer:
      "Return to the order page after checkout. Pavodah verifies the payment with the payment provider and displays the resulting order and payment status there.",
    action: { label: "Check my orders", href: "/dashboard/orders" },
  },
  {
    topic: "Payments & disputes",
    question: "What should I do after a failed or interrupted payment?",
    answer:
      "Check the order before trying again. If no successful payment is shown, use the payment action on that order. Do not make a separate off-platform payment to the provider.",
  },
  {
    topic: "Payments & disputes",
    question: "How do refunds work?",
    answer:
      "Refund availability depends on the order and payment state. When a refund is initiated, its status appears with the order. Processing time can also depend on the payment provider and your financial institution.",
  },
  {
    topic: "Payments & disputes",
    question: "How do I raise and track a dispute?",
    answer:
      "For an eligible order, choose Raise dispute and explain the issue clearly. You can then follow the review and resolution from the Disputes area.",
    action: { label: "View disputes", href: "/dashboard/disputes" },
  },
  {
    topic: "Providing services",
    question: "How do I create or update a service?",
    answer:
      "Open My services from the provider dashboard. Add accurate service details, pricing, delivery expectations, and portfolio information before publishing.",
    action: { label: "Manage services", href: "/dashboard/services" },
  },
  {
    topic: "Providing services",
    question: "Where do providers respond to quote requests?",
    answer:
      "Open Quote requests from the provider dashboard to review the client brief and respond with the terms you can deliver.",
    action: { label: "Open quote requests", href: "/dashboard/quotes" },
  },
  {
    topic: "Providing services",
    question: "Where can I see earnings and payout status?",
    answer:
      "The Earnings & payouts page shows eligible earnings and payout activity. A payout becomes available only when the related order and settlement state allow it.",
    action: { label: "View earnings", href: "/dashboard/earnings" },
  },
];

export function HelpCenterContent({
  variant = "public",
}: {
  readonly variant?: "public" | "dashboard";
}) {
  const [activeTopic, setActiveTopic] = useState<HelpTopic>(TOPICS[0]);
  const [query, setQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    ARTICLES[0].question,
  );
  const contactSupport = useContactSupport();
  const navigate = useProtectedNavigation();
  const normalizedQuery = query.trim().toLowerCase();

  const visibleArticles = useMemo(() => {
    if (normalizedQuery) {
      return ARTICLES.filter((article) =>
        `${article.question} ${article.answer} ${article.topic}`
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }
    return ARTICLES.filter((article) => article.topic === activeTopic);
  }, [activeTopic, normalizedQuery]);

  const isPublic = variant === "public";

  return (
    <main className={cn(isPublic ? "bg-white" : "max-w-6xl pb-12")}>
      <section
        className={cn(
          "relative overflow-hidden",
          isPublic
            ? "bg-marketplace-600 text-white"
            : "rounded-2xl bg-marketplace-600 text-white",
        )}
      >
        <div
          className={cn(
            "relative z-10",
            isPublic
              ? "mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
              : "px-6 py-10 sm:px-10",
          )}
        >
          <p className="mb-3 text-sm font-semibold text-brand-200">
            Pavodah Help Center
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-[-0.025em] sm:text-5xl">
            Find the next step, without losing the thread.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-green-100 sm:text-lg">
            Practical answers for accounts, orders, payments, disputes, and
            provider work.
          </p>

          <div className="relative mt-8 max-w-2xl">
            <label htmlFor={`help-search-${variant}`} className="sr-only">
              Search the Help Center
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
            />
            <input
              id={`help-search-${variant}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders, payments, passwords…"
              className="h-14 w-full rounded-xl border border-white/20 bg-white pl-12 pr-12 text-base text-gray-950 shadow-[0_12px_28px_rgba(0,0,0,0.18)] outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-marketplace-600"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear Help Center search"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute -bottom-24 right-[8%] h-56 w-56 rounded-full border border-green-300/25"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 right-[15%] h-28 w-28 rounded-full bg-green-300/10"
        />
      </section>

      <section
        className={cn(
          "grid gap-10 py-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16",
          isPublic
            ? "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 lg:py-16"
            : "px-1 sm:px-0",
        )}
      >
        <aside aria-label="Help topics">
          <h2 className="text-sm font-semibold text-gray-950">Browse topics</h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {TOPICS.map((topic) => {
              const count = ARTICLES.filter(
                (article) => article.topic === topic,
              ).length;
              const isActive = !normalizedQuery && activeTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setActiveTopic(topic);
                    setQuery("");
                    setExpandedQuestion(
                      ARTICLES.find((article) => article.topic === topic)
                        ?.question ?? null,
                    );
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center justify-between gap-5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600",
                    isActive
                      ? "bg-green-100 text-green-900"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
                  )}
                >
                  <span>{topic}</span>
                  <span
                    className={cn(
                      "text-xs",
                      isActive ? "text-green-700" : "text-gray-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="border-b border-gray-200 pb-5">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-gray-950">
              {normalizedQuery
                ? `Search results for “${query.trim()}”`
                : activeTopic}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {visibleArticles.length === 1
                ? "1 answer"
                : `${visibleArticles.length} answers`}
            </p>
          </div>

          {visibleArticles.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {visibleArticles.map((article, index) => {
                const isExpanded = expandedQuestion === article.question;
                const panelId = `help-answer-${index}`;
                return (
                  <article key={article.question}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedQuestion(
                          isExpanded ? null : article.question,
                        )
                      }
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-4"
                    >
                      <span>{article.question}</span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "h-5 w-5 shrink-0 text-gray-500 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div
                        id={panelId}
                        className="max-w-[72ch] pb-6 text-[15px] leading-7 text-gray-600"
                      >
                        <p>{article.answer}</p>
                        {article.action && (
                          <button
                            type="button"
                            onClick={() => navigate(article.action!.href)}
                            className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-green-700 hover:text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                          >
                            {article.action.label}
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <h3 className="text-lg font-semibold text-gray-950">
                No matching answer yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                Try a shorter search, browse a topic, or contact support for an
                account-specific question.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-5 min-h-11 font-semibold text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      <section
        className={cn("bg-gray-950 text-white", isPublic ? "" : "rounded-2xl")}
      >
        <div
          className={cn(
            "flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between",
            isPublic
              ? "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
              : "px-6 sm:px-10",
          )}
        >
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em]">
              Need help with your account?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-300">
              Start a secure support conversation so the team can follow the
              issue and your previous messages in one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={contactSupport}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-3 text-sm font-semibold text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <MessageCircle className="h-4 w-4" />
              Contact support
            </button>
            <a
              href="mailto:support@pavodah.com"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <Mail className="h-4 w-4" />
              Email support
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
