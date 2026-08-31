import {cookies, headers} from "next/headers";
import {getRequestConfig} from "next-intl/server";
import {
  localeCookieName,
  normalizeLocale,
  resolveAcceptLanguage
} from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale =
    normalizeLocale(cookieStore.get(localeCookieName)?.value) ??
    resolveAcceptLanguage(headerStore.get("accept-language"));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    formats: {
      dateTime: {
        short: {year: "numeric", month: "short", day: "numeric"},
        long: {year: "numeric", month: "long", day: "numeric"},
        dateTime: {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }
      },
      number: {
        currency: {style: "currency", currency: "GHS"},
        integer: {maximumFractionDigits: 0}
      }
    }
  };
});
