import type { HookParameters, InjectedRoute } from "astro";
import { createResolver, defineIntegration } from "astro-integration-kit";
import { corePlugins } from "astro-integration-kit/plugins";
import { addPageDir } from "astro-pages";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { withLeadingSlash } from "ufo";
import { normalizePath } from "vite";
import { optionsSchema, type Options } from "./options.js";

export type Route = {
  locale: string;
  originalPattern: string;
  staticPattern: string;
  originalEntrypoint: string;
  injectedRoute: InjectedRoute;
};

const computeRoutes = (
  {
    config,
    logger,
  }: Pick<HookParameters<"astro:config:setup">, "config" | "logger">,
  { strategy, locales, defaultLocale, pages: customPages }: Options
) => {
  const routes: Array<Route> = [];

  const isPrerendered = (str: string) => {
    const match = str.match(/export const prerender = (\w+)/);
    if (match) {
      return match[1] === "true";
    }
    return undefined;
  };

  const dir = "routes";
  let { pages } = addPageDir({
    config,
    logger,
    dir,
    glob: ["**.{astro,ts,js}", "!**/_*"],
  });

  const dirPath = fileURLToPath(new URL(dir, config.srcDir));
  const entrypointsDirPath = resolve(
    fileURLToPath(config.root),
    "./.astro/astro-i18n/entrypoints"
  );
  rmSync(entrypointsDirPath, { recursive: true, force: true });

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
      const newEntrypoint = join(
        entrypointsDirPath,
        locale,
        normalizePath(relative(dirPath, entrypoint))
      );
      mkdirSync(dirname(newEntrypoint), { recursive: true });
      let content = readFileSync(entrypoint, "utf-8").replaceAll(
        "getLocalePlaceholder()",
        `"${locale}"`
      );

      let [, frontmatter, ...remainingParts] = content.split("---");

      function updateRelativeImports(
        originalPath: string,
        currentFilePath: string,
        newFilePath: string
      ) {
        const absolutePath = resolve(dirname(currentFilePath), originalPath);
        const relativePath = relative(dirname(newFilePath), absolutePath);
        return normalizePath(relativePath);
      }

      // Handle static imports
      frontmatter = frontmatter.replace(
        /import\s+([\s\S]*?)\s+from\s+['"](.+?)['"]/g,
        (_match, p1: string, p2: string) => {
          console.log(p1);
          const updatedPath =
            p2.startsWith("./") || p2.startsWith("../")
              ? updateRelativeImports(p2, entrypoint, newEntrypoint)
              : p2;
          return `import ${p1} from '${updatedPath}'`;
        }
      );
      // Handle dynamic imports
      frontmatter = frontmatter.replace(
        /import\s*\(\s*['"](.+?)['"]\s*\)/g,
        (_match, p1: string) => {
          const updatedPath =
            p1.startsWith("./") || p1.startsWith("../")
              ? updateRelativeImports(p1, entrypoint, newEntrypoint)
              : p1;
          return `import('${updatedPath}')`;
        }
      );

      content = `---${frontmatter}---${remainingParts.join("---")}`;
      writeFileSync(newEntrypoint, content, "utf-8");
      const prerender = isPrerendered(content);

      routes.push({
        locale,
        originalPattern,
        staticPattern,
        originalEntrypoint: entrypoint,
        injectedRoute: {
          pattern,
          // TODO: https://github.com/withastro/astro/issues/10294
          entrypoint: newEntrypoint,
          prerender,
        },
      });
    }
  }

  return routes;
};

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
      "astro:config:setup": ({
        config,
        watchIntegration,
        injectRoute,
        addMiddleware,
        addVirtualImports,
        addDts,
        logger,
      }) => {
        watchIntegration(resolve());
        watchIntegration(
          createResolver(fileURLToPath(config.srcDir)).resolve("routes")
        );

        const localesDirPath = normalizePath(
          fileURLToPath(new URL(options.localesDir, config.root))
        );
        watchIntegration(localesDirPath);

        const routes = computeRoutes({ config, logger }, options);
        for (const { injectedRoute } of routes) {
          injectRoute(injectedRoute);
        }

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
