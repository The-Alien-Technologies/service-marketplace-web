"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { marketDisplayName } from "@/lib/market-display";
import { User } from "@/types/auth";
import { CountryAdministrator, Market } from "@/types/market";

type PersonName = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

function displayName(person: PersonName) {
  return (
    person.displayName ||
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.email
  );
}

function initials(person: PersonName) {
  return displayName(person).slice(0, 2).toUpperCase();
}

export function CountryAdministrators({
  initialMarketId = "ALL",
}: {
  initialMarketId?: string;
}) {
  const t = useTranslations("Markets");
  const locale = useLocale();
  const [administrators, setAdministrators] = useState<CountryAdministrator[]>(
    [],
  );
  const [markets, setMarkets] = useState<Market[]>([]);
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState(initialMarketId || "ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "SUSPENDED"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidates, setCandidates] = useState<User[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<User | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState(
    initialMarketId !== "ALL" ? initialMarketId : "",
  );
  const [removeTarget, setRemoveTarget] = useState<CountryAdministrator | null>(
    null,
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [adminData, marketData] = await Promise.all([
        apiService.getCountryAdministrators({
          search: search.trim() || undefined,
          marketId: marketFilter === "ALL" ? undefined : marketFilter,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        }),
        apiService.getAllMarkets(),
      ]);
      setAdministrators(adminData);
      setMarkets(marketData);
    } catch (error) {
      setLoadError(true);
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
    } finally {
      setLoading(false);
    }
  }, [marketFilter, search, statusFilter, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 300);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const query = candidateQuery.trim();
    if (!addOpen || query.length < 2) {
      setCandidates([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setCandidateLoading(true);
      try {
        const result = await apiService.getUsers({
          page: 1,
          limit: 8,
          search: query,
          role: "USER",
          status: "ACTIVE",
        });
        setCandidates(result.users);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("somethingWentWrong"),
        );
      } finally {
        setCandidateLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [addOpen, candidateQuery, t]);

  const filtered = administrators;

  const updateAdmin = async (
    admin: CountryAdministrator,
    change: { marketId?: string; status?: "ACTIVE" | "SUSPENDED" },
  ) => {
    setBusy(admin.id);
    try {
      await apiService.updateCountryAdministrator(admin.id, change);
      toast.success(t("administratorUpdated"));
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
    } finally {
      setBusy(null);
    }
  };

  const assign = async () => {
    if (!selectedCandidate || !selectedMarketId) return;
    setBusy("assign");
    try {
      await apiService.assignCountryAdmin(
        selectedCandidate.id,
        selectedMarketId,
      );
      toast.success(t("adminAssigned"));
      setAddOpen(false);
      setCandidateQuery("");
      setSelectedCandidate(null);
      setSelectedMarketId(initialMarketId !== "ALL" ? initialMarketId : "");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!removeTarget) return;
    setBusy(removeTarget.id);
    try {
      await apiService.removeCountryAdministrator(removeTarget.id);
      toast.success(t("administratorAccessRemoved"));
      setRemoveTarget(null);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-green-700">
            {t("countryOperations")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            {t("countryAdministratorsTitle")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
            {t("countryAdministratorsBody")}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("addAdministrator")}
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="grid gap-3 border-b border-gray-200 p-4 sm:grid-cols-[minmax(0,1fr)_200px_180px] sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchAdministrators")}
              className="pl-9"
            />
          </div>
          <Select value={marketFilter} onValueChange={setMarketFilter}>
            <SelectTrigger aria-label={t("filterByMarket")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allMarkets")}</SelectItem>
              {markets.map((market) => (
                <SelectItem key={market.id} value={market.id}>
                  {marketDisplayName(locale, market)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger aria-label={t("filterByStatus")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
              <SelectItem value="ACTIVE">{t("adminStatus.ACTIVE")}</SelectItem>
              <SelectItem value="SUSPENDED">
                {t("adminStatus.SUSPENDED")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-green-700" />
          </div>
        ) : loadError ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-400" />
            <h2 className="mt-4 font-semibold text-gray-900">
              {t("loadFailed")}
            </h2>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => void refresh()}
            >
              {t("tryAgain")}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-400" />
            <h2 className="mt-4 font-semibold text-gray-900">
              {t("noAdministratorsFound")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("noAdministratorsFoundBody")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="hidden grid-cols-[minmax(240px,1.4fr)_minmax(190px,1fr)_170px_150px_auto] gap-4 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 lg:grid">
              <span>{t("administrator")}</span>
              <span>{t("assignedMarket")}</span>
              <span>{t("accountStatus")}</span>
              <span>{t("lastActive")}</span>
              <span className="sr-only">{t("removeAccess")}</span>
            </div>
            {filtered.map((admin) => (
              <article
                key={admin.id}
                className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(240px,1.4fr)_minmax(190px,1fr)_170px_150px_auto] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-semibold text-green-800">
                    {initials(admin)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-950">
                      {displayName(admin)}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {admin.email}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 lg:hidden">
                    {t("assignedMarket")}
                  </p>
                  <Select
                    value={admin.adminMarketId}
                    onValueChange={(marketId) =>
                      void updateAdmin(admin, { marketId })
                    }
                    disabled={busy === admin.id}
                  >
                    <SelectTrigger
                      aria-label={t("adminMarketAria", {
                        name: displayName(admin),
                      })}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map((market) => (
                        <SelectItem key={market.id} value={market.id}>
                          {marketDisplayName(locale, market)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 lg:hidden">
                    {t("accountStatus")}
                  </p>
                  <Select
                    value={admin.status}
                    onValueChange={(status) =>
                      void updateAdmin(admin, {
                        status: status as "ACTIVE" | "SUSPENDED",
                      })
                    }
                    disabled={busy === admin.id}
                  >
                    <SelectTrigger
                      aria-label={t("adminStatusAria", {
                        name: displayName(admin),
                      })}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        {t("adminStatus.ACTIVE")}
                      </SelectItem>
                      <SelectItem value="SUSPENDED">
                        {t("adminStatus.SUSPENDED")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm">
                  <p className="text-xs font-medium text-gray-500">
                    {t("lastActive")}
                  </p>
                  <p className="mt-1 text-gray-800">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(admin.lastActiveAt))}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveTarget(admin)}
                  className="justify-self-start text-red-700 hover:bg-red-50 hover:text-red-800 lg:justify-self-end"
                  disabled={busy === admin.id}
                >
                  {busy === admin.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserRoundX className="mr-2 h-4 w-4" />
                  )}
                  {t("removeAccess")}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addAdministrator")}</DialogTitle>
            <DialogDescription>{t("addAdministratorBody")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label
                htmlFor="administrator-search"
                className="text-sm font-medium text-gray-900"
              >
                {t("findUser")}
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="administrator-search"
                  value={candidateQuery}
                  onChange={(event) => {
                    setCandidateQuery(event.target.value);
                    setSelectedCandidate(null);
                  }}
                  placeholder={t("searchUserPlaceholder")}
                  className="pl-9"
                />
              </div>
              {candidateLoading && (
                <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-green-700" />
              )}
              {!candidateLoading &&
                candidates.length > 0 &&
                !selectedCandidate && (
                  <div className="mt-2 max-h-52 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200">
                    {candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setCandidateQuery(displayName(candidate));
                        }}
                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {initials(candidate)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">
                            {displayName(candidate)}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {candidate.email}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              {selectedCandidate && (
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                  <ShieldCheck className="h-5 w-5 text-green-700" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-green-950">
                      {displayName(selectedCandidate)}
                    </p>
                    <p className="truncate text-xs text-green-800">
                      {selectedCandidate.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">
                {t("assignedMarket")}
              </label>
              <Select
                value={selectedMarketId}
                onValueChange={setSelectedMarketId}
              >
                <SelectTrigger
                  className="mt-2"
                  aria-label={t("adminCountryAria")}
                >
                  <SelectValue placeholder={t("chooseCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {marketDisplayName(locale, market)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void assign()}
              disabled={
                !selectedCandidate || !selectedMarketId || busy === "assign"
              }
            >
              {busy === "assign" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("assignAdministrator")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeAdministratorTitle")}</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? t("removeAdministratorBody", {
                    name: displayName(removeTarget),
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {t("removeAdministratorNote")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void remove()}
              disabled={!removeTarget || busy === removeTarget?.id}
            >
              {busy === removeTarget?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("removeAccess")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
