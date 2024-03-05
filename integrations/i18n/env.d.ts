/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    __i18n: {
      locale: string;
      pathname: string;
      dynamicParams: Record<string, Record<string, string>>;
    };
  }
}

type I18nextConfig = {
  namespaces: Array<string>;
  defaultNamespace: string;
  resources: Record<string, Record<string, any>>;
};

declare module "virtual:astro-i18n/internal" {
  export const options: import("./options.js").Options;
  export const routes: Array<import("./routing/index.js").Route>;
  export const i18nextConfig: I18nextConfig;
  export const als: import("node:async_hooks").AsyncLocalStorage<
    import("astro").AstroGlobal | import("astro").APIContext
  >;
}

type InternalGlobalI18n = {
  locale: string;
  pathname: string;
  dynamicParams: Record<string, Record<string, string>>;
};

interface Window {
  __i18n: InternalGlobalI18n & {
    i18nextConfig: I18nextConfig;
  };
}

// TODO: reenable when proper monorepo
// declare module "i18n:astro/server" {
//   type Locale = string;
//   type LocalePath = string;

//   export const useI18n: (
//     context: import("astro").AstroGlobal | import("astro").APIContext
//   ) => {
//     locale: Locale;
//     getHtmlAttrs: () => {
//       lang: string;
//       dir: "rtl" | "ltr";
//     };
//     setDynamicParams: (params: Record<string, Record<string, string>>) => void;
//     getLocalePath: (
//       path: LocalePath,
//       params?: Record<string, string | undefined>
//     ) => string;
//     switchLocalePath: (locale: Locale) => string;
//   };
//   export const locales: ["en", "fr"];
//   export const getLocalePlaceholder: () => Locale;
// }
