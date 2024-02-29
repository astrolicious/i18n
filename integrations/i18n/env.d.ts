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
