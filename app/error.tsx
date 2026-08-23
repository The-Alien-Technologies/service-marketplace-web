"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500">
          We hit an unexpected error while loading this page. Please try again.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 font-mono">Ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = "/")}>Go home</Button>
        </div>
      </div>
    </div>
  );
}
