import type { HookParameters } from "astro";
import type { Options } from "../options.js";
import { normalizePath } from "vite";
import { fileURLToPath } from "node:url";
import { watchIntegration } from "astro-integration-kit/utilities";
import { getNamespaces } from "./namespaces.js";
import { getResources } from "./resources.js";
import { join, relative } from "node:path";
import { injectTypes } from "./types.js";
import { createLogger } from "./utils.js";

const getPaths = (
  { config }: HookParameters<"astro:config:setup">,
  options: Options
) => {
  const localesDir = normalizePath(
    fileURLToPath(new URL(options.localesDir, config.root))
  );
  const defaultLocalesDir = join(localesDir, options.defaultLocale);

  return {
    localesDir,
    defaultLocalesDir,
  };
};

export const handleI18next =
  (params: HookParameters<"astro:config:setup">) => (options: Options) => {
    const logger = createLogger(params.logger);
    logger.info("Starting...");

    const paths = getPaths(params, options);
    watchIntegration({ ...params, dir: paths.localesDir });
    logger.info(
      `Registered watcher for "${normalizePath(
        relative(fileURLToPath(params.config.root), paths.localesDir)
      )}" directory`
    );

    const { namespaces, importsData } = getNamespaces(
      paths.defaultLocalesDir,
      options.defaultNamespace,
      logger
    );
    const resources = getResources(logger, options, paths.localesDir);
    injectTypes(params, options, importsData, paths.defaultLocalesDir);

    return {
      namespaces,
      resources,
    };
  };
