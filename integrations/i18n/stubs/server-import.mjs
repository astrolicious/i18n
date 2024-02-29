/**
 *
 * @param {import("astro").AstroGlobal | import("astro").APIContext} context
 */
export const useI18n = (context) => {
  return {
    locale: context.locals.__i18n.locale,
  };
};
