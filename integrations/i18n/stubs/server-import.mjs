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

  return {
    locale,
    getHtmlAttrs: () => ({
      lang: locale,
      dir: dir(locale),
    }),
    /**
     *
     * @param {Record<string, string>} params
     */
    setDynamicParams: (params) => {
      context.locals.__i18n.dynamicParams = {
        ...context.locals.__i18n.dynamicParams,
        ...params,
      };
    },
  };
};
