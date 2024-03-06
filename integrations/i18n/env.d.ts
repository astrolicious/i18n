/// <reference types="astro/client" />

declare module "virtual:astro-i18n/internal" {
  export const options: import("./options.js").Options;
  export const routes: Array<import("./routing/index.js").Route>;
  export const i18nextConfig: {
    namespaces: Array<string>;
    defaultNamespace: string;
    resources: Record<string, Record<string, any>>;
  };
}

declare module "virtual:astro-i18n/als" {
  export const als: import("node:async_hooks").AsyncLocalStorage<
    import("./types.js").InternalI18n
  >;
}

interface Window {
  __INTERNAL_ASTRO_I18N_CONFIG__: import("./types.js").InternalI18n;
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
