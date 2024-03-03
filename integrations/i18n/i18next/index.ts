import type { HookParameters } from "astro";
import type { Options } from "../options.js";
import { normalizePath } from "vite";
import { fileURLToPath } from "url";
import { watchIntegration } from "astro-integration-kit/utilities";
import { getNamespaces } from "./namespaces.js";
import { getResources } from "./resources.js";
import { join } from "path";
import { injectTypes } from "./types.js";

const getPaths = (
  { config }: HookParameters<"astro:config:setup">,
  options: Options
) => {
  const localesDir = normalizePath(
    fileURLToPath(new URL(options.localesDir, config.root))
  );
  const defaultLocalesDir = join(localesDir, options.defaultLocale)

  return {
    localesDir,
    defaultLocalesDir,
  };
};

export const handleI18next =
  (params: HookParameters<"astro:config:setup">) => (options: Options) => {
    const paths = getPaths(params, options);
    watchIntegration({ ...params, dir: paths.localesDir });

    const { namespaces, importsData } = getNamespaces(paths.defaultLocalesDir);
    const resources = getResources(params, options, paths.localesDir);
    injectTypes(params, options, importsData, paths.defaultLocalesDir)

    return {
      namespaces,
      resources,
    };
  };
