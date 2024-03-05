import { options, routes, i18nextConfig } from "virtual:astro-i18n/internal";
import i18next from "i18next";

/**
 * @returns {import("../types.js").InternalI18n}
 */
const getI18n = () => "@@CONTEXT@@";

/**
 *
 * @param {string} name
 * @param {{ serverOnly: boolean; clientEnabled: boolean }} param0
 */
const _envCheck = (
  name,
  { serverOnly = false, clientEnabled = false } = {}
) => {
  if (serverOnly && !import.meta.env.SSR) {
    throw new Error(`\`${name}\` is only available on the server`);
  }
  if (clientEnabled && !import.meta.env.SSR) {
    if (!options.client) {
      throw new Error(
        `\`${name}\` on the client requires \`client: true\` in the integration config`
      );
    }
    if (!("__i18n" in window)) {
      throw new Error(
        `\`${name}\` on the client requires using the \`<I18nClient />\` component`
      );
    }
  }
};

/**
 *
 * @param {string} locale
 */
const _dir = (locale) => {
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

export const locales = options.locales;

export const t = (...args) => {
  if (!i18next.isInitialized) {
    i18next.init({
      lng: getLocale(),
      defaultNS: i18nextConfig.defaultNamespace,
      ns: i18nextConfig.namespaces,
      resources: i18nextConfig.resources,
    });
  }
  return i18next.t(...args);
};

export const getLocale = () => getI18n().locale;

export const getHtmlAttrs = () => ({
  lang: getLocale(),
  dir: _dir(getLocale()),
});

/**
 *
 * @param {Record<string, string>} params
 */
export const setDynamicParams = (params) => {
  _envCheck("setDynamicParams", { serverOnly: true });

  getI18n().dynamicParams = {
    ...getI18n().dynamicParams,
    ...params,
  };
};

/**
 *
 * @param {string} path
 * @param {Record<string, string | undefined>} params
 */
export const getLocalePath = (path, params = {}, _locale = getLocale()) => {
  _envCheck("getLocalePath", { clientEnabled: true });

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
export const switchLocalePath = (locale) => {
  _envCheck("switchLocalePath", { clientEnabled: true });

  const currentLocaleRoute = routes
    .filter((route) => route.locale === getLocale())
    .find((route) => {
      if (
        Object.keys(getI18n().dynamicParams).length === 0 &&
        route.injectedRoute.pattern === getI18n().pathname
      ) {
        return true;
      }

      for (const param of Object.keys(
        getI18n().dynamicParams?.[locale] ?? {}
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
    getI18n().dynamicParams?.[locale] ?? undefined,
    locale
  );
};

export const getSwitcherData = () => {
  return locales.map((locale) => ({
    locale,
    href: switchLocalePath(locale),
  }));
};

export const getLocalePlaceholder = () => {
  throw new Error(
    "`getLocalePlaceholder` should only be called within `getStaticPaths`"
  );
};
