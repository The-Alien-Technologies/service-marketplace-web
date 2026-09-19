export function marketDisplayName(
  locale: string,
  market: { code: string; name: string },
) {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        market.code.toUpperCase(),
      ) ?? market.name
    );
  } catch {
    return market.name;
  }
}
