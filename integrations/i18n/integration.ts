import type { HookParameters } from "astro";
import { createResolver, defineIntegration } from "astro-integration-kit";
import { corePlugins } from "astro-integration-kit/plugins";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePath } from "vite";
import { optionsSchema, type Options } from "./options.js";
import { handleRouting } from "./routing/index.js";

const handleI18next = (
  { defaultLocale, locales, defaultNamespace }: Options,
  { root }: HookParameters<"astro:config:setup">["config"],
  logger: HookParameters<"astro:config:setup">["logger"],
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

  const getResources = () => {
    const resources: Record<string, Record<string, any>> = {};

    const localesDirs = locales
      .map((locale) => ({
        locale,
        dir: normalizePath(join(localesDirPath, locale)),
      }))
      .filter((e) => existsSync(e.dir));

    for (const { locale, dir } of localesDirs) {
      const filenames = readdirSync(dir).filter((f) => f.endsWith(".json"));

      for (const fileName of filenames) {
        const path = normalizePath(join(dir, fileName));
        try {
          const content = JSON.parse(readFileSync(path, "utf-8"));

          resources[locale] ??= {};
          resources[locale][basename(fileName, extname(fileName))] = content;
        } catch (err) {
          logger.warn(`Can't parse "${path}", skipping.`);
        }
      }
    }
    return resources;
  };

  const defaultLocalesDirPath = join(localesDirPath, defaultLocale);
  const relativeLocalesPrefix =
    normalizePath(
      relative(fileURLToPath(new URL("./.astro/", root)), defaultLocalesDirPath)
    ) + "/";

  const localesImports = getLocalesImports(defaultLocalesDirPath);

  const i18nextDts = `
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
    i18nextResources: getResources(),
  };
};

export const integration = defineIntegration({
  name: "astro-i18n",
  plugins: [...corePlugins],
  optionsSchema,
  setup({ options }) {
    const { resolve } = createResolver(import.meta.url);

    return {
      "astro:config:setup": (params) => {
        const {
          config,
          watchIntegration,
          addMiddleware,
          addVirtualImports,
          addDts,
          logger,
        } = params;

        watchIntegration(resolve());

        const localesDirPath = normalizePath(
          fileURLToPath(new URL(options.localesDir, config.root))
        );
        watchIntegration(localesDirPath);

        const { routes } = handleRouting(params)(options);

        const { i18nextDts, i18nextNamespaces, i18nextResources } =
          handleI18next(options, config, logger, localesDirPath);

        addDts({
          name: "i18next",
          content: i18nextDts,
        });

        const imports: Record<string, string> = {};

        imports["virtual:astro-i18n/internal"] = `
            export const options = ${JSON.stringify(options)};
            export const routes = ${JSON.stringify(routes)};
            export const i18nextConfig = ${JSON.stringify({
              namespaces: i18nextNamespaces,
              defaultNamespace: options.defaultNamespace,
              resources: i18nextResources,
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

        addVirtualImports(imports);

        addDts({
          name: "astro-i18n",
          content: [serverDts, clientDts]
            .filter((dts) => dts !== undefined)
            .join("\n\n"),
        });
      },
    };
  },
});
