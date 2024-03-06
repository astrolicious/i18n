/// <reference types="astro/client" />

declare module "virtual:astro-i18n/internal" {
  export const options: import("./options.js").Options;
  export const routes: Array<import("./types.js").Route>;
  export const i18nextConfig: import("./types.js").I18nextConfig;
}

declare module "virtual:astro-i18n/als" {
  export const als: import("node:async_hooks").AsyncLocalStorage<
    import("./types.js").I18nConfig
  >;
}

interface Window {
  __INTERNAL_ASTRO_I18N_CONFIG__: import("./types.js").I18nConfig;
}

// TODO: uncomment once we have a proper monorepo structure
// declare module "i18n:astro" {
//   export type Locale = string;
//   export type LocalePath = string;

//   export const locales: Array<string>;
//   export const t: typeof import("i18next").t;
//   export const getLocale: () => Locale;
//   export const getHtmlAttrs: () => {
//     lang: string;
//     dir: "rtl" | "ltr";
//   };
//   export const setDynamicParams: (
//     params: Record<string, Record<string, string>>
//   ) => void;
//   export const getLocalePath: (
//     path: LocalePath,
//     params?: Record<string, string | undefined>
//   ) => string;
//   export const switchLocalePath: (locale: Locale) => string;
//   export const getSwitcherData: () => Array<{ locale: string; href: string }>;

//   export const getLocalePlaceholder: () => Locale;
// }
