import type {
  AstroIntegrationLogger,
  HookParameters,
  InjectedRoute,
} from "astro";
import type { Options } from "../options.js";
import { addPageDir } from "astro-pages";
import { ROUTES_DIR, type Route } from "./index.js";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { withLeadingSlash, withTrailingSlash } from "ufo";
import { normalizePath } from "vite";

const isPrerendered = (str: string) => {
  const match = str.match(/export const prerender = (\w+)/);
  if (match) {
    return match[1] === "true";
  }
  return undefined;
};

const getPages = (
  params: HookParameters<"astro:config:setup">
): Array<InjectedRoute> => {
  return Object.entries(addPageDir({ ...params, dir: ROUTES_DIR }).pages).map(
    ([pattern, entrypoint]) => ({ pattern, entrypoint })
  );
};

const getPaths = ({ config }: HookParameters<"astro:config:setup">) => {
  const routesDir = fileURLToPath(new URL(ROUTES_DIR, config.srcDir));
  const entrypointsDir = resolve(
    fileURLToPath(config.root),
    "./.astro/astro-i18n/entrypoints"
  );

  return {
    routesDir,
    entrypointsDir,
  };
};

const generateRoute = (
  { strategy, defaultLocale, pages }: Options,
  locale: string,
  page: InjectedRoute,
  paths: ReturnType<typeof getPaths>,
  logger: AstroIntegrationLogger,
  trailingSlash: boolean
): Route => {
  const getPattern = () => {
    const isDefaultLocale = locale === defaultLocale;
    const prefix =
      isDefaultLocale && strategy === "prefixExceptDefault" ? "" : `/${locale}`;
    const suffix = withLeadingSlash(
      isDefaultLocale
        ? page.pattern
        : pages?.[page.pattern]?.[locale] ?? page.pattern
    );
    return {
      pattern: prefix + suffix,
      suffix,
    };
  };

  const transformContent = (entrypoint: string) => {
    const updateRelativeImports = (
      originalPath: string,
      currentFilePath: string,
      newFilePath: string
    ) => {
      const absolutePath = resolve(dirname(currentFilePath), originalPath);
      const relativePath = relative(dirname(newFilePath), absolutePath);
      return normalizePath(relativePath);
    };

    mkdirSync(dirname(entrypoint), { recursive: true });

    let content = readFileSync(page.entrypoint, "utf-8");

    content = content.replaceAll("getLocalePlaceholder()", `"${locale}"`);

    let [, frontmatter, ...body] = content.split("---");
    // Handle static imports
    frontmatter = frontmatter.replace(
      /import\s+([\s\S]*?)\s+from\s+['"](.+?)['"]/g,
      (_match, p1: string, p2: string) => {
        const updatedPath =
          p2.startsWith("./") || p2.startsWith("../")
            ? updateRelativeImports(p2, page.entrypoint, entrypoint)
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
            ? updateRelativeImports(p1, page.entrypoint, entrypoint)
            : p1;
        return `import('${updatedPath}')`;
      }
    );

    content = `---${frontmatter}---${body.join("---")}`;
    writeFileSync(entrypoint, content, "utf-8");

    return {
      prerender: isPrerendered(content),
    };
  };

  const { pattern, suffix } = getPattern();
  const entrypoint = join(
    paths.entrypointsDir,
    locale,
    normalizePath(relative(paths.routesDir, page.entrypoint))
  );
  const { prerender } = transformContent(entrypoint);

  logger.info(`Injecting "${pattern}" route`);
  return {
    locale,
    originalPattern: trailingSlash
      ? withTrailingSlash(page.pattern)
      : page.pattern,
    staticPattern: trailingSlash ? withTrailingSlash(suffix) : suffix,
    originalEntrypoint: page.entrypoint,
    injectedRoute: {
      pattern: trailingSlash ? withTrailingSlash(pattern) : pattern,
      entrypoint,
      prerender,
    },
  };
};

export const registerRoutes = (
  params: HookParameters<"astro:config:setup">,
  options: Options,
  logger: AstroIntegrationLogger
) => {
  const { config, injectRoute } = params;
  const { locales } = options;
  logger.info("Starting routes injection...");

  const paths = getPaths(params);
  rmSync(paths.entrypointsDir, { recursive: true, force: true });
  logger.info(
    `Cleaned "${normalizePath(
      relative(fileURLToPath(config.root), paths.entrypointsDir)
    )}" directory`
  );

  const routes: Array<Route> = [];
  const pages = getPages(params);

  for (const locale of locales) {
    for (const page of pages) {
      routes.push(
        generateRoute(
          options,
          locale,
          page,
          paths,
          logger,
          config.trailingSlash === "always"
        )
      );
    }
  }

  for (const { injectedRoute } of routes) {
    injectRoute(injectedRoute);
  }

  return { routes };
};
