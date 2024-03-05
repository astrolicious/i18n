import { routes } from "virtual:astro-i18n/internal";
export { t } from "i18next";

export const useI18n = () => {
  /**
   *
   * @param {(import("astro").AstroGlobal | import("astro").APIContext)["locals"]["__i18n"]} context
   */
  const polymorphicContext = "@@CONTEXT@@"
  // const polymorphicContext = import.meta.env.SSR
  //   ? als.getStore().locals.__i18n
  //   : window.__i18n;

  const locale = polymorphicContext.locale;

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
      .filter((route) => route.locale === locale)
      .find((route) => {
        if (
          Object.keys(polymorphicContext.dynamicParams).length === 0 &&
          route.injectedRoute.pattern === polymorphicContext.pathname
        ) {
          return true;
        }

        for (const param of Object.keys(
          polymorphicContext.dynamicParams?.[locale] ?? {}
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
      polymorphicContext.dynamicParams?.[locale] ?? undefined,
      locale
    );
  };

  return {
    locale,
    getLocalePath,
    switchLocalePath,
  };
};
