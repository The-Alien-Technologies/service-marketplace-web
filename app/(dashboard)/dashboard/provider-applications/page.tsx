"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiService } from "@/lib/api";
import {
  ProviderApplicationDetail,
  ProviderApplicationSummary,
} from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

type ApplicationStatus = "PENDING" | "REJECTED" | "ACTIVE";
type Decision = "APPROVE" | "REJECT";

const statusOptions: Array<{
  value: ApplicationStatus;
  label: string;
}> = [
  { value: "PENDING", label: "Pending review" },
  { value: "REJECTED", label: "Changes requested" },
  { value: "ACTIVE", label: "Approved" },
];

function displayName(
  application: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email: string;
  },
) {
  return (
    [application.firstName, application.lastName].filter(Boolean).join(" ") ||
    application.displayName ||
    application.email.split("@")[0]
  );
}

function formatDate(value?: string, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function resolveFileUrl(value?: string) {
  if (!value) return "#";
  if (!value.startsWith("/")) return value;
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    return new URL(value, new URL(apiUrl).origin).toString();
  } catch {
    return value;
  }
}

export default function ProviderApplicationsPage() {
  const t = useTranslations("AdminOps");
  const common = useTranslations("Common");
  const [status, setStatus] = useState<ApplicationStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<
    ProviderApplicationSummary[]
  >([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<ProviderApplicationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const listRequestId = useRef(0);

  const fetchApplications = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await apiService.getProviderApplications({
        page,
        limit: 10,
        status,
        search: search.trim() || undefined,
      });
      if (requestId !== listRequestId.current) return;
      setApplications(result.applications);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      if (requestId !== listRequestId.current) return;
      setLoadError(
        error instanceof Error
          ? error.message
          : "Provider applications could not be loaded.",
      );
    } finally {
      if (requestId === listRequestId.current) setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchApplications(), 300);
    return () => window.clearTimeout(timer);
  }, [fetchApplications]);

  useEffect(() => {
    const applicationId = new URLSearchParams(window.location.search).get(
      "application",
    );
    if (applicationId) setSelectedId(applicationId);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedApplication(null);
      return;
    }

    let cancelled = false;
    setIsLoadingDetail(true);
    void apiService
      .getProviderApplication(selectedId)
      .then((application) => {
        if (!cancelled) setSelectedApplication(application);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "The application details could not be loaded.",
          );
          setSelectedId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const submitDecision = async () => {
    if (!selectedId || !decision) return;
    const reason = rejectionReason.trim();
    if (decision === "REJECT" && !reason) return;

    setIsSubmittingDecision(true);
    try {
      await apiService.reviewProviderApplication(
        selectedId,
        decision,
        decision === "REJECT" ? reason : undefined,
      );
      toast.success(
        decision === "APPROVE"
          ? "Provider application approved"
          : "Changes requested from provider",
      );
      setDecision(null);
      setRejectionReason("");
      setSelectedId(null);
      await fetchApplications();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The application decision could not be saved.",
      );
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const selectedName = useMemo(
    () =>
      selectedApplication
        ? displayName(selectedApplication)
        : "this provider",
    [selectedApplication],
  );

  return (
    <div className="space-y-7">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">
          {t("providerApplications")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {t("applicationsSubtitle")}
        </p>
      </header>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("applicationStatus")}>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => {
                setStatus(option.value);
                setPage(1);
              }}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 ${
                status === option.value
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {option.value === "PENDING"
                ? t("pendingReview")
                : option.value === "REJECTED"
                  ? t("changesRequested")
                  : t("approved")}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchProviders")}
            aria-label={t("searchProviders")}
            className="h-11 border-slate-300 bg-white pl-9"
          />
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl bg-red-50 px-5 py-10 text-center ring-1 ring-inset ring-red-200" role="alert">
          <AlertCircle className="mx-auto h-6 w-6 text-red-700" />
          <p className="mt-3 font-semibold text-red-950">
            Applications could not be loaded
          </p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-red-800">
            {loadError}
          </p>
          <Button
            variant="outline"
            className="mt-5 border-red-300 bg-white text-red-900 hover:bg-red-100"
            onClick={() => void fetchApplications()}
          >
            {common("retry")}
          </Button>
        </div>
      ) : (
        <section aria-label={`${statusOptions.find((item) => item.value === status)?.label} applications`}>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span>{isLoading ? "Loading applications…" : `${total} application${total === 1 ? "" : "s"}`}</span>
            {totalPages > 0 && <span>Page {page} of {totalPages}</span>}
          </div>

          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-slate-200">
            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center" role="status">
                <Loader2 className="h-6 w-6 animate-spin text-green-700" />
                <span className="sr-only">{common("loading")}</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <ShieldCheck className="h-8 w-8 text-slate-400" />
                <h2 className="mt-4 font-semibold text-slate-900">
                  No applications here
                </h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "No provider applications match this search."
                    : "Applications will appear here when providers reach this stage."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {applications.map((application) => (
                  <li key={application.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(application.id)}
                      className="grid min-h-24 w-full gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:bg-green-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700 sm:grid-cols-[minmax(0,1.4fr)_minmax(9rem,.65fr)_minmax(8rem,.6fr)_auto] sm:items-center sm:px-6"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 font-semibold text-green-800">
                          {application.avatar ? (
                            <Image
                              src={application.avatar}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            displayName(application).charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-950">
                            {displayName(application)}
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-slate-500">
                            {application.email}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm text-slate-600">
                        <span className="block text-xs font-medium text-slate-400 sm:hidden">{t("submitted")}</span>
                        {formatDate(application.providerApplicationSubmittedAt)}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {application._count.verificationDocuments} document{application._count.verificationDocuments === 1 ? "" : "s"}
                      </span>
                      <span className="text-sm font-semibold text-green-700">
                        Review
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={page >= totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      )}

      <Sheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto border-l-slate-200 p-0 sm:max-w-2xl">
          {isLoadingDetail || !selectedApplication ? (
            <div className="flex min-h-dvh items-center justify-center" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-green-700" />
              <span className="sr-only">Loading application details</span>
            </div>
          ) : (
            <>
              <SheetHeader className="border-b border-slate-200 px-5 py-6 pr-14 sm:px-7">
                <div className="flex items-center gap-4">
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 text-lg font-semibold text-green-800">
                    {selectedApplication.avatar ? (
                      <Image
                        src={selectedApplication.avatar}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      displayName(selectedApplication)
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-xl text-slate-950">
                      {displayName(selectedApplication)}
                    </SheetTitle>
                    <SheetDescription className="mt-1 truncate">
                      {selectedApplication.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-8 px-5 py-7 sm:px-7">
                <section aria-labelledby="application-overview">
                  <h2 id="application-overview" className="font-semibold text-slate-950">
                    Application overview
                  </h2>
                  <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">{t("submitted")}</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {formatDate(selectedApplication.providerApplicationSubmittedAt, true)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{t("experience")}</dt>
                      <dd className="mt-1 font-medium capitalize text-slate-900">
                        {selectedApplication.serviceProviderExperienceLevel?.toLowerCase() || "Not supplied"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{t("emailVerification")}</dt>
                      <dd className="mt-1 flex items-center gap-1.5 font-medium text-slate-900">
                        {selectedApplication.emailVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                        ) : (
                          <Clock3 className="h-4 w-4 text-amber-700" />
                        )}
                        {selectedApplication.emailVerified ? "Verified" : "Pending"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{t("phoneVerification")}</dt>
                      <dd className="mt-1 flex items-center gap-1.5 font-medium text-slate-900">
                        {selectedApplication.phoneVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                        ) : (
                          <Clock3 className="h-4 w-4 text-amber-700" />
                        )}
                        {selectedApplication.phoneVerified ? "Verified" : "Pending"}
                      </dd>
                    </div>
                  </dl>
                  {selectedApplication.bio && (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <p className="text-sm text-slate-500">{t("providerBio")}</p>
                      <p className="mt-2 max-w-[70ch] whitespace-pre-wrap text-sm leading-6 text-slate-800">
                        {selectedApplication.bio}
                      </p>
                    </div>
                  )}
                </section>

                <section className="border-t border-slate-200 pt-7" aria-labelledby="services-location">
                  <h2 id="services-location" className="font-semibold text-slate-950">
                    Services and coverage
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedApplication.interests.length ? (
                      selectedApplication.interests.map((interest) => (
                        <span
                          key={interest.id}
                          className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800"
                        >
                          {interest.category?.name || "Service category"}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">{t("noCategories")}</span>
                    )}
                  </div>
                  <div className="mt-5 space-y-2">
                    {selectedApplication.addresses.map((address) => (
                      <p key={address.id} className="flex gap-2 text-sm leading-6 text-slate-700">
                        <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                        {address.formattedAddress}
                      </p>
                    ))}
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-7" aria-labelledby="verification-documents">
                  <h2 id="verification-documents" className="font-semibold text-slate-950">
                    {t("documents")}
                  </h2>
                  <div className="mt-4 divide-y divide-slate-200 rounded-xl ring-1 ring-inset ring-slate-200">
                    {selectedApplication.verificationDocuments.length ? (
                      selectedApplication.verificationDocuments.map((document) => (
                        <a
                          key={document.id}
                          href={resolveFileUrl(document.fileUrl || document.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50 focus-visible:bg-green-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700"
                        >
                          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {document.originalName || document.fileName || "Verification document"}
                            </span>
                            <span className="mt-0.5 block text-xs capitalize text-slate-500">
                              {(document.documentType || document.type || "document")
                                .toLowerCase()
                                .replaceAll("_", " ")}
                            </span>
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                        </a>
                      ))
                    ) : (
                      <p className="px-4 py-6 text-sm text-slate-500">
                        No documents were submitted.
                      </p>
                    )}
                  </div>
                </section>

                {selectedApplication.status !== "PENDING" && (
                  <section className="border-t border-slate-200 pt-7" aria-labelledby="review-record">
                    <h2 id="review-record" className="font-semibold text-slate-950">
                      {t("reviewRecord")}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Reviewed {formatDate(selectedApplication.providerApplicationReviewedAt, true)}
                      {selectedApplication.reviewer
                        ? ` by ${selectedApplication.reviewer.displayName || [selectedApplication.reviewer.firstName, selectedApplication.reviewer.lastName].filter(Boolean).join(" ") || selectedApplication.reviewer.email}`
                        : ""}
                      .
                    </p>
                    {selectedApplication.providerApplicationRejectionReason && (
                      <p className="mt-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-900 ring-1 ring-inset ring-red-200">
                        {selectedApplication.providerApplicationRejectionReason}
                      </p>
                    )}
                  </section>
                )}
              </div>

              {selectedApplication.status === "PENDING" && (
                <SheetFooter className="sticky bottom-0 flex-row border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                  <Button
                    variant="outline"
                    onClick={() => setDecision("REJECT")}
                    className="h-11 flex-1 gap-2 border-red-300 text-red-800 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {t("requestChanges")}
                  </Button>
                  <Button
                    onClick={() => setDecision("APPROVE")}
                    className="h-11 flex-1 gap-2 bg-green-700 text-white hover:bg-green-800"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("approveProvider")}
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!open && !isSubmittingDecision) {
            setDecision(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {decision === "APPROVE"
                ? `Approve ${selectedName}?`
                : `Request changes from ${selectedName}?`}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {decision === "APPROVE"
                ? "This immediately enables the provider dashboard and all provider tools. The provider will be notified by email."
                : "Explain exactly what must change. The provider will see this note and can update and resubmit the application."}
            </DialogDescription>
          </DialogHeader>

          {decision === "REJECT" && (
            <div>
              <label htmlFor="rejection-reason" className="text-sm font-semibold text-slate-900">
                {t("requiredChanges")}
              </label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                maxLength={1000}
                rows={5}
                placeholder={t("changesPlaceholder")}
                className="mt-2 min-h-28 resize-y"
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {rejectionReason.length}/1000
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => {
                setDecision(null);
                setRejectionReason("");
              }}
              disabled={isSubmittingDecision}
            >
              {common("cancel")}
            </Button>
            <Button
              onClick={() => void submitDecision()}
              disabled={
                isSubmittingDecision ||
                (decision === "REJECT" && !rejectionReason.trim())
              }
              className={
                decision === "APPROVE"
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-red-700 text-white hover:bg-red-800"
              }
            >
              {isSubmittingDecision && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {decision === "APPROVE" ? t("approveProvider") : t("sendRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
