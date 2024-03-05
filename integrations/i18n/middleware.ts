import { defineMiddleware } from "astro:middleware";
import { options } from "virtual:astro-i18n/internal";
import { als } from "virtual:astro-i18n/als";

const extractLocaleFromUrl = (pathname: string) => {
  for (const locale of options.locales) {
    if (options.strategy === "prefix") {
      if (pathname.startsWith(`/${locale}/`)) {
        return locale;
      }
    } else if (options.strategy === "prefixExceptDefault") {
      if (
        locale !== options.defaultLocale &&
        pathname.startsWith(`/${locale}/`)
      ) {
        return locale;
      }
    }
  }
  return options.defaultLocale;
};

export const onRequest = defineMiddleware((context, next) => {
  const pathname = context.url.pathname;
  const locale = extractLocaleFromUrl(pathname);

  return als.run(
    {
      locale,
      pathname,
      dynamicParams: {},
      i18nextInitialized: false,
    },
    next
  );
});
