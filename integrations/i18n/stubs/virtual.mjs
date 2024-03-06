/**
 * @returns {import("../types.js").I18nConfig}
 */
const _getConfig = () => "@@_CONFIG_@@";
/**
 * @returns {import("i18next").i18n}
 */
const _getI18next = () => "@@_I18NEXT_@@";

/**
 *
 * @param {string} name
 * @param {{ serverOnly: boolean; clientFeatures: Array<"data" | "translations" | "paths"> }} param0
 */
const _envCheck = (name, { serverOnly = false, clientFeatures = [] } = {}) => {
  if (serverOnly && !import.meta.env.SSR) {
    throw new Error(`\`${name}\` is only available on the server`);
  }
  if (clientFeatures.length > 0 && !import.meta.env.SSR) {
    const config = _getConfig();
    if (!config) {
      throw new Error(
        `\`${name}\` on the client requires using the \`<I18nClient />\` component`
      );
    }

    for (const feature of Object.keys(config.clientOptions)) {
      if (clientFeatures.includes(feature) && !config[feature]) {
        throw new Error(
          `\`${name}\` on the client requires setting \`client: { ${feature}: true }\` in the integration config`
        );
      }
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

export const t = (...args) => {
  _envCheck("t", { clientFeatures: ["data", "translations"] });
  const config = _getConfig();
  const i18next = _getI18next();

  if (!config.translations.initialized) {
    i18next.init({
      lng: config.data.locale,
      defaultNS: config.translations.i18nextConfig.defaultNamespace,
      ns: config.translations.i18nextConfig.namespaces,
      resources: config.translations.i18nextConfig.resources,
    });
    config.translations.initialized = true;
  }
  return i18next.t(...args);
};

export const getLocale = () => {
  _envCheck("getLocale", { clientFeatures: ["data"] });
  return _getConfig().data.locale;
};

export const getLocales = () => {
  _envCheck("getLocales", { clientFeatures: ["data"] });
  return _getConfig().data.locales;
};

export const getHtmlAttrs = () => {
  _envCheck("getHtmlAttrs", { clientFeatures: ["data"] });
  return {
    lang: getLocale(),
    dir: _dir(getLocale()),
  };
};

/**
 *
 * @param {Record<string, string>} params
 */
export const setDynamicParams = (params) => {
  _envCheck("setDynamicParams", { serverOnly: true });
  const config = _getConfig();

  config.paths.dynamicParams = {
    ...config.paths.dynamicParams,
    ...params,
  };
};

/**
 *
 * @param {string} path
 * @param {Record<string, string | undefined>} params
 */
export const getLocalePath = (path, params = {}, _locale = getLocale()) => {
  _envCheck("getLocalePath", { clientFeatures: ["data", "paths"] });
  const config = _getConfig();

  const route = config.paths.routes.find(
    (route) => route.locale === _locale && route.originalPattern === path
  );
  if (!route) {
    throw new Error("Invalid path");
  }

  let newPath = route.injectedRoute.pattern;
  for (const param of route.params) {
    const value = params[param];
    if (!value) {
      throw new Error(`Must provide "${param}" param`);
    }
    newPath = newPath.replace(`[${param}]`, value);
  }

  return newPath;
};

/**
 *
 * @param {string} locale
 */
export const switchLocalePath = (locale) => {
  _envCheck("switchLocalePath", { clientFeatures: ["paths"] });
  const config = _getConfig();

  const currentLocaleRoutes = config.paths.routes.filter(
    (route) => route.locale === getLocale()
  );

  let currentLocaleRoute = currentLocaleRoutes.find(
    (route) => route.injectedRoute.pattern === config.paths.pathname
  );
  if (!currentLocaleRoute) {
    currentLocaleRoute = currentLocaleRoutes.find((route) => {
      for (const param of Object.keys(
        config.paths.dynamicParams?.[locale] ?? {}
      )) {
        if (!route.injectedRoute.pattern.includes(param)) {
          return false;
        }
      }

      return true;
    });
  }

  if (!currentLocaleRoute) {
    throw new Error("Couldn't find a currentLocaleRoute. Open an issue");
  }

  const route = config.paths.routes.find(
    (route) =>
      route.locale === locale &&
      currentLocaleRoute.originalPattern === route.originalPattern
  );
  if (!route) {
    throw new Error("Couldn't find a route. Open an issue");
  }

  return getLocalePath(
    route.originalPattern,
    config.paths.dynamicParams?.[locale] ?? undefined,
    locale
  );
};

export const getSwitcherData = () => {
  _envCheck("getSwitcherData", { clientFeatures: ["data", "paths"] });
  return getLocales().map((locale) => ({
    locale,
    href: switchLocalePath(locale),
  }));
};

export const getLocalePlaceholder = () => {
  throw new Error(
    "`getLocalePlaceholder` should only be called within `getStaticPaths`"
  );
};
