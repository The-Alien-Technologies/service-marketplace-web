"use client";

import { useEffect, useState } from "react";

const copy = {
  en: {title: "Something went wrong", body: "The application ran into an unexpected error.", retry: "Try again", ref: "Ref"},
  fr: {title: "Un problème est survenu", body: "L’application a rencontré une erreur inattendue.", retry: "Réessayer", ref: "Réf."},
  sw: {title: "Hitilafu imetokea", body: "Programu imepata hitilafu isiyotarajiwa.", retry: "Jaribu tena", ref: "Rejea"}
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<keyof typeof copy>("en");
  const t = copy[locale];

  useEffect(() => {
    console.error("Global error:", error);
    const documentLocale = document.documentElement.lang.split("-")[0];
    if (documentLocale === "fr" || documentLocale === "sw") {
      setLocale(documentLocale);
    }
  }, [error]);

  return (
    <html lang={locale}>
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          background: "#fafafa",
          color: "#111827",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
            {t.title}
          </h1>
          <p style={{ color: "#6b7280", margin: "0 0 1rem" }}>
            {t.body}
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                margin: "0 0 1rem",
              }}
            >
              {t.ref}: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
