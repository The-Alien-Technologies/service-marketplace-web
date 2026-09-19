export function formatMoney(
  amount: number | string,
  currency: string,
  locale = "en",
): string {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return "—";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}
