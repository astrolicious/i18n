import { defineMiddleware } from "astro:middleware";
import { options, i18nextConfig } from "virtual:astro-i18n/internal";
import {  als } from "virtual:astro-i18n/als";
import { withTrailingSlash } from "ufo";
import { init as initI18next } from "i18next";

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

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = withTrailingSlash(context.url.pathname);
  const locale = extractLocaleFromUrl(pathname);

  context.locals.__i18n = {
    locale,
    pathname,
    dynamicParams: {},
  };

  als.run(context, next);

  initI18next({
    lng: locale,
    defaultNS: i18nextConfig.defaultNamespace,
    ns: i18nextConfig.namespaces,
    resources: i18nextConfig.resources,
  });

  next();
});
