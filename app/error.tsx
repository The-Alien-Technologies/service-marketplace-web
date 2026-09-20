"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {useTranslations} from "next-intl";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");
  const common = useTranslations("Common");
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500">
          {t("unexpected")}
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 font-mono">{common("reference", {reference: error.digest})}</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} variant="outline">
            {common("retry")}
          </Button>
          <Button onClick={() => (window.location.href = "/")}>{common("goHome")}</Button>
        </div>
      </div>
    </div>
  );
}
