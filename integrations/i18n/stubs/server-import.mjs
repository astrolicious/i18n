import { withTrailingSlash } from "ufo";
import { routes } from "virtual:astro-i18n/internal";

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
 * @param {string} patternString
 * @returns
 */
const createRegExp = (patternString) => {
  // Escape special characters in the input string
  const escapedPattern = patternString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Construct the regular expression
  const regexPattern = new RegExp(escapedPattern);

  return regexPattern;
};

/**
 *
 * @param {string} inputString
 * @returns
 */
function convertStringToRegExpPattern(inputString) {
  // Escape special characters in the input string
  const escapedString = inputString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regexPattern = escapedString.replace(/\[([^\]]+)\]/g, () => {
    return `([a-zA-Z_]+)`;
  });

  return regexPattern;
}

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
    // TODO: sort routes so that more specific routes come first
    const currentLocaleRoute = routes.find((route) => {
      const regex = createRegExp(
        convertStringToRegExpPattern(
          withTrailingSlash(route.injectedRoute.pattern)
        )
      );

      // TODO: remove
      console.log({ regex, pathname: context.locals.__i18n.pathname });

      return regex.test(context.locals.__i18n.pathname);
    });
    if (!currentLocaleRoute) {
      throw new Error("Couldn't find a currentLocaleRoute. Open an issue");
    }
    // TODO: remove
    console.log(currentLocaleRoute);

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
