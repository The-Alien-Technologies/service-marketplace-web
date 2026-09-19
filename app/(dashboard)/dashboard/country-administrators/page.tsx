import { CountryAdministrators } from "@/components/market/country-administrators";

export default async function CountryAdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ marketId?: string }>;
}) {
  const { marketId } = await searchParams;
  return <CountryAdministrators initialMarketId={marketId || "ALL"} />;
}
