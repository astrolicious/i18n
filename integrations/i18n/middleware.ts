import { defineMiddleware } from "astro:middleware";
import { options, i18nextConfig } from "virtual:astro-i18n/internal";
import { withTrailingSlash } from "ufo";
import { init as initI18next } from "i18next";
import tmp from "../../src/locales/en/test.json";

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

  initI18next({
    lng: locale,
    debug: import.meta.env.DEV,
    defaultNS: i18nextConfig.defaultNamespace,
    ns: i18nextConfig.namespaces,
    // TODO: load via virtual module
    resources: {
      en: {
        test: tmp,
      },
    },
  });

  next();
});
