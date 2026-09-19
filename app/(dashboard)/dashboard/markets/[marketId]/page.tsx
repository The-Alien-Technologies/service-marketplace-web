import { MarketDetail } from "@/components/market/market-detail";

export default async function MarketDetailRoute({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = await params;
  return <MarketDetail marketId={marketId} />;
}
