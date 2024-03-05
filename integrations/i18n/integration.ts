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
import { withTrailingSlash } from "ufo";

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
        import { AsyncLocalStorage } from "node:async_hooks"

            export const options = ${JSON.stringify(options)};
            export const routes = ${JSON.stringify(routes)};
            export const i18nextConfig = ${JSON.stringify({
              namespaces,
              defaultNamespace: options.defaultNamespace,
              resources,
            })};
            export const als = new AsyncLocalStorage
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
          .map(
            (route) =>
              `"${
                config.trailingSlash === "always"
                  ? withTrailingSlash(route.originalPattern)
                  : route.originalPattern
              }"`
          )
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

          const clientStub = readFileSync(
            resolve("./stubs/client-import.mjs"),
            "utf-8"
          );
          const placeholder = '"@@CONTEXT@@"';

          const _imports = [
            {
              name: "i18n:astro/client",
              content: `import { als } from "virtual:astro-i18n/internal";${clientStub.replace(
                placeholder,
                "als.getStore().locals.__i18n"
              )}`,
              ssr: true,
            },
            {
              name: "i18n:astro/client",
              content: clientStub.replace(placeholder, "window.__i18n"),
              ssr: false,
            },
          ];

          const resolveVirtualModuleId = <T extends string>(
            id: T
          ): `\0${T}` => {
            return `\0${id}`;
          };

          const resolutionMap = Object.fromEntries(
            Object.keys(_imports).map((name) => [
              resolveVirtualModuleId(name),
              name,
            ])
          );

          updateConfig({
            vite: {
              plugins: [
                {
                  name: "vite-plugin-astro-i18n-client",
                  resolveId(id) {
                    if (_imports.find((e) => e.name === id))
                      return resolveVirtualModuleId(id);
                  },
                  load(id, options) {
                    const resolution = resolutionMap[id];
                    if (resolution) {
                      const data = _imports.find(
                        (e) =>
                          e.name === resolution &&
                          e.ssr === (options?.ssr ?? false)
                      );
                      if (data) {
                        return data.content;
                      }
                    }
                  },
                },
              ],
            },
          });

          clientDts = `declare module "i18n:astro/client" {
            export const useI18n: () => {
              locale: Locale;
              getLocalePath: (path: LocalePath, params?: Record<string, string | undefined>) => string;
              switchLocalePath: (locale: Locale) => string;
            }
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
