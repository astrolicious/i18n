import { createResolver, defineIntegration } from "astro-integration-kit";
import { corePlugins } from "astro-integration-kit/plugins";
import { z } from "astro/zod";
import { addPageDir } from "astro-pages";
import { fileURLToPath } from "node:url";
import { withoutTrailingSlash, withLeadingSlash } from "ufo";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { HookParameters, InjectedRoute } from "astro";
import { dirname, relative, resolve } from "node:path";

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

export type Route = {
  locale: string;
  originalPattern: string;
  staticPattern: string;
  originalEntrypoint: string;
  injectedRoute: InjectedRoute;
};

const computeRoutes = (
  params: Pick<
    HookParameters<"astro:config:setup">,
    "config" | "injectRoute" | "logger"
  >,
  { strategy, locales, defaultLocale, pages: customPages }: Options
) => {
  const routes: Array<Route> = [];

  const dir = "routes";
  const { pages } = addPageDir({
    ...params,
    dir,
    glob: ["**.{astro,ts,js}", "!**/_*"],
  });

  const dirPath = fileURLToPath(new URL(dir, params.config.srcDir));

  for (const locale of locales) {
    for (const [originalPattern, entrypoint] of Object.entries(pages)) {
      // Handle pattern
      const isDefaultLocale = locale === defaultLocale;
      const prefix =
        isDefaultLocale && strategy === "prefixExceptDefault"
          ? ""
          : `/${locale}`;
      const staticPattern = withLeadingSlash(
        isDefaultLocale
          ? originalPattern
          : customPages?.[originalPattern]?.[locale] ?? originalPattern
      );
      const pattern = prefix + staticPattern;

      // Handle entrypoint
      const newEntrypoint = resolve(
        fileURLToPath(params.config.root),
        "./.astro/astro-i18n/entrypoints",
        locale,
        relative(dirPath, entrypoint).replaceAll("\\", "/")
      );
      mkdirSync(dirname(newEntrypoint), { recursive: true });
      let content = readFileSync(entrypoint, "utf-8");
      content = content.replaceAll("getLocalePlaceholder()", `"${locale}"`);
      writeFileSync(newEntrypoint, content, "utf-8");

      routes.push({
        locale,
        originalPattern,
        staticPattern,
        originalEntrypoint: entrypoint,
        injectedRoute: {
          pattern,
          entrypoint: newEntrypoint,
        },
      });
    }
  }

  return routes;
};

export const integration = defineIntegration({
  name: "astro-i18n",
  plugins: [...corePlugins],
  optionsSchema,
  setup({ options }) {
    const { resolve } = createResolver(import.meta.url);

    return {
      "astro:config:setup": ({
        config,
        watchIntegration,
        injectRoute,
        addMiddleware,
        addVirtualImport,
        addDts,
        logger,
      }) => {
        watchIntegration(resolve());
        watchIntegration(
          createResolver(fileURLToPath(config.srcDir)).resolve("routes")
        );

        const routes = computeRoutes({ config, injectRoute, logger }, options);
        for (const { injectedRoute } of routes) {
          injectRoute(injectedRoute);
        }

        addVirtualImport({
          name: "virtual:astro-i18n/internal",
          content: `
            export const options = ${JSON.stringify(options)};
            export const routes = ${JSON.stringify(routes)};
          `,
        });

        addMiddleware({
          entrypoint: resolve("./middleware.ts"),
          order: "pre",
        });

        addVirtualImport({
          name: "i18n:astro/server",
          content:
            readFileSync(resolve("./stubs/server-import.mjs"), "utf-8") +
            `\nexport const locales = ${JSON.stringify(options.locales)};`,
        });
        addDts({
          name: "astro-i18n",
          content: `declare module "i18n:astro/server" {
            type Locale = ${options.locales
              .map((locale) => `"${locale}"`)
              .join(" | ")};
            type LocalePath = ${routes
              .filter((route) => route.locale === options.defaultLocale)
              .map((route) => `"${route.originalPattern}"`)
              .join(" | ")};

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
          }`,
        });
      },
    };
  },
});
