import { defineConfig } from "astro/config";
import i18n from "./integrations/i18n";
import react from "@astrojs/react";
import node from "@astrojs/node";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  // trailingSlash: "always",
  integrations: [
    i18n({
      strategy: "prefixExceptDefault",
      defaultLocale: "en",
      locales: ["en", "fr"],
      pages: {
        about: {
          fr: "a-propos",
        },
        "blog/[slug]": {
          fr: "le-blog/[slug]",
        },
        "blog/[category]/[slug]": {
          fr: "le-blog/[category]/[slug]",
        },
      },
      localesDir: "./src/locales",
      defaultNamespace: "common",
      client: true,
      // rootRedirect: {
      //   status: 301,
      //   destination: "/en",
      // },
    }),
    react(),
    tailwind(),
  ],
  output: "hybrid",
  adapter: node({
    mode: "standalone",
  }),
});
