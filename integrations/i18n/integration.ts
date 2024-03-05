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

const VIRTUAL_MODULE_ID = "i18n:astro";

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

        addVirtualImports({
          ...params,
          name,
          imports: {
            "virtual:astro-i18n/internal": `
              export const options = ${JSON.stringify(options)};
              export const routes = ${JSON.stringify(routes)};
              export const i18nextConfig = ${JSON.stringify({
                namespaces,
                defaultNamespace: options.defaultNamespace,
                resources,
              })};
            `,
            "virtual:astro-i18n/als": `
              import { AsyncLocalStorage } from "node:async_hooks";
              export const als = new AsyncLocalStorage;
            `,
          },
        });

        addMiddleware({
          entrypoint: resolve("./middleware.ts"),
          order: "pre",
        });

        addDts({
          logger,
          ...config,
          name: "astro-i18n",
          content: `
          declare module "${VIRTUAL_MODULE_ID}" {
            export type Locale = ${options.locales
              .map((locale) => `"${locale}"`)
              .join(" | ")};
            export type LocalePath = ${routes
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

            export const locales: ${JSON.stringify(options.locales)};
            export const t: typeof import("i18next").t;
            export const getLocale: () => Locale;
            export const getHtmlAttrs: () => {
              lang: string;
              dir: "rtl" | "ltr";
            };
            export const setDynamicParams: (params: Record<string, Record<string, string>>) => void;
            export const getLocalePath: (path: LocalePath, params?: Record<string, string | undefined>) => string;
            export const switchLocalePath: (locale: Locale) => string;
            export const getSwitcherData: () => Array<{ locale: string; href: string }>;

            export const getLocalePlaceholder: () => Locale;
          }`,
        });

        if (options.client) {
          logger.info(
            "Client features enabled, make sure to use the `<I18nClient />` component"
          );
        }

        const virtualModuleStub = readFileSync(
          resolve("./stubs/virtual.mjs"),
          "utf-8"
        );
        const placeholder = '"@@CONTEXT@@"';

        const _imports = [
          {
            name: VIRTUAL_MODULE_ID,
            content: `import { als } from "virtual:astro-i18n/als";${virtualModuleStub.replaceAll(
              placeholder,
              "als.getStore()"
            )}`,
            ssr: true,
          },
          {
            name: VIRTUAL_MODULE_ID,
            content: virtualModuleStub.replaceAll(placeholder, "window.__i18n"),
            ssr: false,
          },
        ];

        const resolveVirtualModuleId = <T extends string>(id: T): `\0${T}` => {
          return `\0${id}`;
        };

        const resolutionMap = Object.fromEntries(
          _imports.map(({ name }) => [resolveVirtualModuleId(name), name])
        );

        updateConfig({
          vite: {
            plugins: [
              {
                name: "vite-plugin-astro-i18n-virtual",
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
