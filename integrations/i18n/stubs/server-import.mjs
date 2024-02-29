import { routes, options } from "virtual:astro-i18n/internal";
export { t } from "i18next";

export const locales = options.locales;

/**
 *
 * @param {string} locale
 */
const dir = (locale) => {
  const rtlLocales = [
    "ar",
    "shu",
    "sqr",
    "ssh",
    "xaa",
    "yhd",
    "yud",
    "aao",
    "abh",
    "abv",
    "acm",
    "acq",
    "acw",
    "acx",
    "acy",
    "adf",
    "ads",
    "aeb",
    "aec",
    "afb",
    "ajp",
    "apc",
    "apd",
    "arb",
    "arq",
    "ars",
    "ary",
    "arz",
    "auz",
    "avl",
    "ayh",
    "ayl",
    "ayn",
    "ayp",
    "bbz",
    "pga",
    "he",
    "iw",
    "ps",
    "pbt",
    "pbu",
    "pst",
    "prp",
    "prd",
    "ug",
    "ur",
    "ydd",
    "yds",
    "yih",
    "ji",
    "yi",
    "hbo",
    "men",
    "xmn",
    "fa",
    "jpr",
    "peo",
    "pes",
    "prs",
    "dv",
    "sam",
    "ckb",
  ];

  return rtlLocales.includes(locale) ? "rtl" : "ltr";
};

/**
 *
 * @param {import("astro").AstroGlobal | import("astro").APIContext} context
 */
export const useI18n = (context) => {
  const locale = context.locals.__i18n.locale;

  const getHtmlAttrs = () => ({
    lang: locale,
    dir: dir(locale),
  });

  /**
   *
   * @param {Record<string, string>} params
   */
  const setDynamicParams = (params) => {
    context.locals.__i18n.dynamicParams = {
      ...context.locals.__i18n.dynamicParams,
      ...params,
    };
  };

  /**
   *
   * @param {string} path
   * @param {Record<string, string | undefined>} params
   */
  const getLocalePath = (path, params = {}, _locale = locale) => {
    const route = routes.find(
      (route) => route.locale === _locale && route.originalPattern === path
    );
    if (!route) {
      throw new Error("Invalid path");
    }

    let newPath = route.injectedRoute.pattern;
    const matches = newPath.match(/\[([^\]]+)]/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(1, -1);
        const value = params[key];
        if (!value) {
          throw new Error(`Must provide "${key}" param`);
        }
        newPath = newPath.replace(match, value);
      }
    }

    return newPath;
  };

  /**
   *
   * @param {string} locale
   */
  const switchLocalePath = (locale) => {
    const currentLocaleRoute = routes
      .filter((route) => route.locale === context.locals.__i18n.locale)
      .find((route) => {
        if (
          Object.keys(context.locals.__i18n.dynamicParams).length === 0 &&
          route.injectedRoute.pattern === context.locals.__i18n.pathname
        ) {
          return true;
        }

        for (const param of Object.keys(
          context.locals.__i18n.dynamicParams?.[locale] ?? {}
        )) {
          if (!route.injectedRoute.pattern.includes(param)) {
            return false;
          }
        }

        return true;
      });

    if (!currentLocaleRoute) {
      throw new Error("Couldn't find a currentLocaleRoute. Open an issue");
    }

    const route = routes.find(
      (route) =>
        route.locale === locale &&
        currentLocaleRoute.originalPattern === route.originalPattern
    );
    if (!route) {
      throw new Error("Couldn't find a route. Open an issue");
    }

    return getLocalePath(
      route.originalPattern,
      context.locals.__i18n.dynamicParams?.[locale] ?? undefined,
      locale
    );
  };

  return {
    locale,
    getHtmlAttrs,
    setDynamicParams,
    getLocalePath,
    switchLocalePath,
  };
};
