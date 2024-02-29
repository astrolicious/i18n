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

declare module "virtual:astro-i18n/internal" {
  export const options: import("./integration.js").Options;
  export const routes: Array<import("./integration.js").Route>;
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