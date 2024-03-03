import { createResolver, defineIntegration } from "astro-integration-kit";
import { readFileSync } from "node:fs";
import { handleI18next } from "./i18next/index.js";
import { optionsSchema } from "./options.js";
import { handleRouting } from "./routing/index.js";
import {
  addDts,
  addVirtualImports,
  watchIntegration,
} from "astro-integration-kit/utilities";

export const integration = defineIntegration({
  name: "astro-i18n",
  optionsSchema,
  setup({ options, name }) {
    const { resolve } = createResolver(import.meta.url);

    return {
      "astro:config:setup": (params) => {
        const { addMiddleware, config, logger, updateConfig } = params;

        watchIntegration({ ...params, dir: resolve() });

        const { routes } = handleRouting(params)(options);
        const { namespaces, resources } = handleI18next(params)(options);

        const imports: Record<string, string> = {};

        imports["virtual:astro-i18n/internal"] = `
            export const options = ${JSON.stringify(options)};
            export const routes = ${JSON.stringify(routes)};
            export const i18nextConfig = ${JSON.stringify({
              namespaces,
              defaultNamespace: options.defaultNamespace,
              resources,
            })};
          `;

        addMiddleware({
          entrypoint: resolve("./middleware.ts"),
          order: "pre",
        });

        imports["i18n:astro/server"] = readFileSync(
          resolve("./stubs/server-import.mjs"),
          "utf-8"
        );

        const serverDts = `type Locale = ${options.locales
          .map((locale) => `"${locale}"`)
          .join(" | ")};
        type LocalePath = ${routes
          .filter((route) => route.locale === options.defaultLocale)
          .map((route) => `"${route.originalPattern}"`)
          .join(" | ")};

          declare module "i18n:astro/server" {
            export const useI18n: (context: import("astro").AstroGlobal | import("astro").APIContext) => {
              locale: Locale;
              getHtmlAttrs: () => {
                lang: string;
                dir: "rtl" | "ltr";
              };
              setDynamicParams: (params: Record<string, Record<string, string>>) => void;
              getLocalePath: (path: LocalePath, params?: Record<string, string | undefined>) => string;
              switchLocalePath: (locale: Locale) => string;
            };
            export const locales: ${JSON.stringify(options.locales)};
            export const getLocalePlaceholder: () => Locale;
            export const t: typeof import("i18next").t;
          }`;

        let clientDts: string | undefined = undefined;
        if (options.client) {
          logger.info("Client features enabled");

          imports["i18n:astro/client"] = readFileSync(
            resolve("./stubs/client-import.mjs"),
            "utf-8"
          );

          clientDts = `declare module "i18n:astro/client" {
            export const locale: Locale;
            export const getLocalePath: (path: LocalePath, params?: Record<string, string | undefined>) => string;
            export const switchLocalePath: (locale: Locale) => string;
            export const t: typeof import("i18next").t;
          }`;
        }

        addVirtualImports({ ...params, name, imports });

        addDts({
          logger,
          ...config,
          name: "astro-i18n",
          content: [serverDts, clientDts]
            .filter((dts) => dts !== undefined)
            .join("\n\n"),
        });

        logger.info("Types injected");

        if (options.strategy === "prefix" && options.rootRedirect) {
          updateConfig({
            redirects: {
              "/": options.rootRedirect,
            },
          });
        }
      },
    };
  },
});
