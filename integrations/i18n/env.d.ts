/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    __i18n: {
      locale: string;
      dynamicParams: Record<string, string>;
    };
  }
}

declare module "virtual:astro-i18n/options" {
  export const options: import("./integration.js").Options;
}
