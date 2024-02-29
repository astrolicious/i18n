import { createResolver, defineIntegration } from "astro-integration-kit";
import { corePlugins } from "astro-integration-kit/plugins";
import { z } from "astro/zod";
import { addPageDir } from "astro-pages";
import { fileURLToPath } from "node:url";
import { withoutTrailingSlash, withLeadingSlash } from "ufo";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import type { HookParameters, InjectedRoute } from "astro";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { normalizePath } from "vite";

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
  defaultNamespace: z.string().optional().default("common"),
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
        normalizePath(relative(dirPath, entrypoint))
      );
      mkdirSync(dirname(newEntrypoint), { recursive: true });
      // TODO: handle relative paths? or at least put it as a limitation
      const content = readFileSync(entrypoint, "utf-8").replaceAll(
        "getLocalePlaceholder()",
        `"${locale}"`
      );
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

const handleI18next = (
  { defaultLocale, defaultNamespace }: Options,
  { root }: HookParameters<"astro:config:setup">["config"],
  localesDirPath: string
) => {
  const getLocalesImports = (localesDir: string) => {
    const data: Array<{
      namespaceName: string;
      fileName: string;
      importName: string;
    }> = [];

    if (!existsSync(localesDir)) {
      return data;
    }

    const filenames = readdirSync(localesDir).filter((f) =>
      f.endsWith(".json")
    );
    let i = 0;
    for (const fileName of filenames) {
      data.push({
        namespaceName: basename(fileName, extname(fileName)),
        fileName,
        importName: `_i18next${i}`,
      });
      i++;
    }

    return data;
  };

  const defaultLocalesDirPath = join(localesDirPath, defaultLocale);
  const relativeLocalesPrefix =
    normalizePath(
      relative(fileURLToPath(new URL("./.astro/", root)), defaultLocalesDirPath)
    ) + "/";

  const localesImports = getLocalesImports(defaultLocalesDirPath);

  const i18nextDts = `
    import "i18next";
    ${localesImports
      .map(
        ({ importName, fileName }) =>
          `import type ${importName} from "${normalizePath(
            join(relativeLocalesPrefix, fileName)
          )}";`
      )
      .join("\n")}
    declare module "i18next" {
      interface CustomTypeOptions {
        defaultNS: "${defaultNamespace}";
        resources: {
          ${localesImports
            .map(
              ({ namespaceName, importName }) =>
                `"${namespaceName}": typeof ${importName};`
            )
            .join("\n")}
        }
      }
    }`;

  return {
    i18nextDts,
    i18nextNamespaces: localesImports.map((e) => e.namespaceName),
  };
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

        const localesDirPath = fileURLToPath(
          new URL(options.localesDir, config.root)
        );
        watchIntegration(localesDirPath);

        const routes = computeRoutes({ config, injectRoute, logger }, options);
        for (const { injectedRoute } of routes) {
          injectRoute(injectedRoute);
        }

        const { i18nextDts, i18nextNamespaces } = handleI18next(
          options,
          config,
          localesDirPath
        );

        addDts({
          name: "i18next",
          content: i18nextDts,
        });

        addVirtualImport({
          name: "virtual:astro-i18n/internal",
          content: `
            export const options = ${JSON.stringify(options)};
            export const routes = ${JSON.stringify(routes)};
            export const i18nextConfig = ${JSON.stringify({
              namespaces: i18nextNamespaces,
              defaultNamespace: options.defaultNamespace,
            })};
          `,
        });

        addMiddleware({
          entrypoint: resolve("./middleware.ts"),
          order: "pre",
        });

        addVirtualImport({
          name: "i18n:astro/server",
          content: readFileSync(resolve("./stubs/server-import.mjs"), "utf-8"),
        });

        const serverDts = `declare module "i18n:astro/server" {
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
            export const t: typeof import("i18next").t;
          }`;

        addDts({
          name: "astro-i18n",
          content: [serverDts].join("\n\n"),
        });
      },
    };
  },
});
