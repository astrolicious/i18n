import { createResolver, defineIntegration } from "astro-integration-kit";
import { corePlugins } from "astro-integration-kit/plugins";
import { z } from "astro/zod";
import addPageDirPlugin from "astro-pages/plugins/astro-integration-kit.ts";
import { fileURLToPath } from "node:url";
import { withoutTrailingSlash, withLeadingSlash } from "ufo";
import { readFileSync } from "node:fs";

const optionsSchema = z.object({
  strategy: z
    .enum(["prefix", "prefixExceptDefault"])
    .optional()
    .default("prefixExceptDefault"),
  defaultLocale: z.string(),
  locales: z.array(z.string()),
  pages: z
    // TODO: make key stricter to respect astro routing syntax
    .record(
      z.string(),
      z.record(
        // TODO: refine to make it's only part of {locales}
        z.string(),
        // TODO: make key stricter to respect astro routing syntax
        z.string().optional()
      )
    )
    .optional()
    .default({})
    .transform((val) =>
      Object.fromEntries(
        Object.entries(val).map(([key, value]) => [
          withLeadingSlash(withoutTrailingSlash(key)),
          value,
        ])
      )
    ),
  localesDir: z.string().optional().default("./src/locales"),
  client: z.boolean().optional().default(false),
  rootRedirect: z
    .object({
      status: z.number(),
      path: z.string(),
    })
    .optional(),
});
// .refine((val) => val.locales.includes(val.defaultLocale), {
//   message: "`locales` must include the `defaultLocale`",
//   path: ["locales"],
// })

export type Options = z.infer<typeof optionsSchema>;

export const integration = defineIntegration({
  name: "astro-i18n",
  plugins: [...corePlugins, addPageDirPlugin],
  optionsSchema,
  setup({ options }) {
    const { resolve } = createResolver(import.meta.url);

    return {
      "astro:config:setup": ({
        config,
        addPageDir,
        watchIntegration,
        injectRoute,
        addMiddleware,
        addVirtualImport,
        addDts,
      }) => {
        watchIntegration(resolve());
        watchIntegration(
          createResolver(fileURLToPath(config.srcDir)).resolve("routes")
        );

        const { pages } = addPageDir({
          dir: "routes",
          glob: ["**.{astro,ts,js}", "!**/_*"],
        });
        for (const locale of options.locales) {
          for (const [defaultPattern, entrypoint] of Object.entries(pages)) {
            const isDefaultLocale = locale === options.defaultLocale;
            const prefix =
              isDefaultLocale && options.strategy === "prefixExceptDefault"
                ? ""
                : `/${locale}`;
            const staticPattern = withLeadingSlash(
              isDefaultLocale
                ? defaultPattern
                : options.pages?.[defaultPattern]?.[locale] ?? defaultPattern
            );
            const pattern = prefix + staticPattern;

            injectRoute({
              pattern,
              entrypoint,
            });
          }
        }

        addVirtualImport({
          name: "virtual:astro-i18n/options",
          content: `export const options = ${JSON.stringify(options)}`,
        });

        addMiddleware({
          entrypoint: resolve("./middleware.ts"),
          order: "pre",
        });

        addVirtualImport({
          name: "i18n:astro/server",
          content: readFileSync(resolve("./stubs/server-import.mjs"), "utf-8"),
        });
        addDts({
          name: "astro-i18n",
          content: `declare module "i18n:astro/server" {
            export const useI18n: (context: import("astro").AstroGlobal | import("astro").APIContext) => {
              locale: ${options.locales
                .map((locale) => `"${locale}"`)
                .join(" | ")};
            };
          }`,
        });
      },
      "astro:config:done": ({}) => {},
      "astro:server:setup": ({}) => {},
      "astro:server:start": ({}) => {},
      "astro:server:done": ({}) => {},
      "astro:build:setup": ({ pages, target }) => {
        console.dir({ pages, target }, { depth: null });
        const indexPageKey = "src/pages/index.astro";
        const indexPage = pages.get("src/pages/index.astro")!;

        pages.set(indexPageKey, {
          ...indexPage,
          route: { ...indexPage.route, route: "/about" },
        });
      },
      "astro:build:start": ({}) => {},
      "astro:build:generated": ({}) => {},
      "astro:build:ssr": ({ entryPoints, manifest, middlewareEntryPoint }) => {
        console.dir(
          { entryPoints, manifest, middlewareEntryPoint },
          { depth: null }
        );
      },
      "astro:build:done": ({ pages, routes }) => {
        console.dir({ pages, routes }, { depth: null });
      },
    };
  },
});
