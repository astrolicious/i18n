import { handleRoutesHMR } from "./hmr.js";
import type { HookParameters } from "astro";
import type { Options } from "../options.js";
import { registerRoutes } from "./register.js";

export const ROUTES_DIR = "routes";
const LOGGER_LABEL = "astro-i18n/routing";

export const handleRouting =
  (params: HookParameters<"astro:config:setup">) => (options: Options) => {
    const logger = params.logger.fork(LOGGER_LABEL);

    handleRoutesHMR(params, logger);
    const { routes } = registerRoutes(params, options, logger);

    return { routes };
  };
