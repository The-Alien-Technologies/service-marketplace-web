"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Landmark, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Market } from "@/types/market";
import {
  MarketPartnerPayout,
  PayoutAccount,
  PayoutDestinationType,
  PayoutInstitution,
} from "@/types/payout";

export function PartnerPayoutPanel({ market }: { market: Market }) {
  const t = useTranslations("Markets");
  const isSuperAdmin = useAuthStore(
    (state) => state.user?.role === "SUPER_ADMIN",
  );
  const defaultType: PayoutDestinationType =
    market.code === "ZA" ? "BASA" : "GHIPSS";
  const [type, setType] = useState<PayoutDestinationType>(defaultType);
  const [institutions, setInstitutions] = useState<PayoutInstitution[]>([]);
  const [institutionCode, setInstitutionCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [payouts, setPayouts] = useState<MarketPartnerPayout[]>([]);
  const [otp, setOtp] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>("load");

  const refresh = useCallback(async () => {
    setBusy("load");
    try {
      const [nextAccount, nextPayouts] = await Promise.all([
        apiService.getPartnerPayoutAccount(market.id),
        apiService.getPartnerPayouts(market.id),
      ]);
      setAccount(nextAccount);
      setPayouts(nextPayouts);
      if (nextAccount) {
        setType(nextAccount.type);
        setInstitutionCode(nextAccount.institutionCode);
        setAccountName(nextAccount.accountName || "");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadFailed"));
    } finally {
      setBusy(null);
    }
  }, [market.id, t]);

  useEffect(() => void refresh(), [refresh]);

  useEffect(() => {
    let active = true;
    apiService
      .getPartnerPayoutInstitutions(type, market.id)
      .then((items) => {
        if (active) setInstitutions(items);
      })
      .catch(() => {
        if (active) setInstitutions([]);
      });
    return () => {
      active = false;
    };
  }, [market.id, type]);

  const saveAccount = async () => {
    if (
      !institutionCode ||
      !accountName.trim() ||
      !/^\d{7,20}$/.test(accountNumber)
    ) {
      toast.error(t("partnerAccountInvalid"));
      return;
    }
    setBusy("account");
    try {
      await apiService.updatePartnerPayoutAccount({
        marketId: market.id,
        type,
        institutionCode,
        accountNumber,
        accountName: accountName.trim(),
      });
      setAccountNumber("");
      toast.success(t("partnerAccountSaved"));
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
      setBusy(null);
    }
  };

  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await action();
      toast.success(t("partnerPayoutUpdated"));
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
      setBusy(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-800">
          <Landmark className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            {t("partnerPayoutTitle")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("partnerPayoutBody")}
          </p>
        </div>
      </div>

      {account && (
        <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          {account.institutionName} · {account.accountName || t("partnerAccountFallback")} ·
          •••• {account.accountNumberLast4} · {account.currency}
          {account.status === "INACTIVE" && (
            <p className="mt-2 font-medium text-amber-700">
              {t("partnerAccountNeedsReverification")}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as PayoutDestinationType);
            setInstitutionCode("");
          }}
        >
          <SelectTrigger aria-label={t("destinationType")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {market.code === "ZA" ? (
              <SelectItem value="BASA">{t("bankAccount")}</SelectItem>
            ) : (
              <>
                <SelectItem value="GHIPSS">{t("bankAccount")}</SelectItem>
                <SelectItem value="MOBILE_MONEY">
                  {t("mobileMoney")}
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <Select value={institutionCode} onValueChange={setInstitutionCode}>
          <SelectTrigger aria-label={t("institution")}>
            <SelectValue placeholder={t("chooseInstitution")} />
          </SelectTrigger>
          <SelectContent>
            {institutions.map((institution) => (
              <SelectItem key={institution.code} value={institution.code}>
                {institution.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          placeholder={t("accountName")}
          aria-label={t("accountName")}
        />
        <Input
          inputMode="numeric"
          autoComplete="off"
          value={accountNumber}
          onChange={(event) =>
            setAccountNumber(event.target.value.replace(/\D/g, ""))
          }
          placeholder={t("accountNumber")}
          aria-label={t("accountNumber")}
        />
      </div>
      <Button
        className="mt-3"
        onClick={() => void saveAccount()}
        disabled={busy !== null}
      >
        {busy === "account" && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("savePartnerAccount")}
      </Button>

      <div className="mt-7 flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
        <div>
          <h3 className="font-semibold text-gray-950">
            {t("partnerPayoutHistory")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("partnerPayoutApprovalHelp")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            void act("request", () =>
              apiService.requestPartnerPayout(market.id),
            )
          }
          disabled={busy !== null || account?.status !== "ACTIVE"}
        >
          <Send className="h-4 w-4" /> {t("requestPartnerPayout")}
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {payouts.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
            {t("noPartnerPayouts")}
          </p>
        ) : (
          payouts.map((payout) => (
            <div
              key={payout.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {new Intl.NumberFormat(market.locale, {
                    style: "currency",
                    currency: payout.currency,
                  }).format(Number(payout.amount))}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {payout.reference} · {payout.status}
                </p>
              </div>
              {isSuperAdmin && payout.status === "REQUESTED" && (
                <Button
                  size="sm"
                  onClick={() =>
                    void act(payout.id, () =>
                      apiService.approvePartnerPayout(payout.id),
                    )
                  }
                  disabled={busy !== null}
                >
                  {t("approvePartnerPayout")}
                </Button>
              )}
              {isSuperAdmin && payout.status === "OTP_REQUIRED" && (
                <div className="flex gap-2">
                  <Input
                    className="w-32"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp[payout.id] || ""}
                    onChange={(event) =>
                      setOtp((current) => ({
                        ...current,
                        [payout.id]: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    aria-label={t("transferOtp")}
                    placeholder={t("transferOtp")}
                  />
                  <Button
                    size="sm"
                    disabled={
                      (otp[payout.id] || "").length !== 6 || busy !== null
                    }
                    onClick={() =>
                      void act(payout.id, () =>
                        apiService.finalizePartnerPayout(
                          payout.id,
                          otp[payout.id],
                        ),
                      )
                    }
                  >
                    {t("submitOtp")}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
