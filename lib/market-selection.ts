import type { Market } from "@/types/market";

export function suggestMarketCode(
  markets: Market[],
  options: {
    persistedCode?: string | null;
    preferredMarketId?: string | null;
    timezone?: string;
    language?: string;
  } = {},
): string {
  const available = markets.filter((market) => market.status !== "INACTIVE");
  const persisted = available.find(
    (market) => market.code === options.persistedCode,
  );
  if (options.persistedCode === "GLOBAL") return "GLOBAL";
  if (persisted) return persisted.code;

  const preferred = available.find(
    (market) => market.id === options.preferredMarketId,
  );
  if (preferred) return preferred.code;

  const timezone = options.timezone?.toLowerCase() ?? "";
  const language = options.language?.toLowerCase() ?? "";
  const inferredCode =
    timezone.includes("johannesburg") || language.includes("-za") ? "ZA" : "GH";

  return (
    available.find((market) => market.code === inferredCode)?.code ?? "GLOBAL"
  );
}
