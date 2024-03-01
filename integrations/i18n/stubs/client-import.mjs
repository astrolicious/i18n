import { routes } from "virtual:astro-i18n/internal";

export const locale = import.meta.env.SSR
  ? __i18n.locale
  : window.__i18n.locale;

/**
 *
 * @param {string} path
 * @param {Record<string, string | undefined>} params
 */
export const getLocalePath = (path, params = {}, _locale = locale) => {
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
