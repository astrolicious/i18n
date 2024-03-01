export const locale = import.meta.env.SSR
  ? __i18n.locale
  : window.__i18n.locale;
