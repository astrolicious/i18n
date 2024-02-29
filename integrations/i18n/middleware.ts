import { defineMiddleware } from "astro:middleware";
import { options } from "virtual:astro-i18n/internal";
import { withTrailingSlash } from "ufo";

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
  const pathname = withTrailingSlash(context.url.pathname);

  context.locals.__i18n = {
    locale: extractLocaleFromUrl(pathname),
    pathname,
    dynamicParams: {}
  };

  next();
});
