import { defineConfig } from "astro/config";
import i18n from "./integrations/i18n";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [i18n({
    strategy: "prefixExceptDefault",
    // strategy: "prefix",
    defaultLocale: "en",
    locales: ["en", "fr"],
    pages: {
      about: {
        fr: "a-propos"
      },
      "blog/[slug]": {
        fr: "le-blog/[slug]"
      },
      "blog/[category]/[slug]": {
        fr: "le-blog/[category]/[slug]"
      }
    },
    localesDir: "./src/locales",
    defaultNamespace: "test",
    client: true,
    rootRedirect: undefined
  }), react()]
});