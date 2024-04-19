import type { Options } from "../options.js";
import { handleRoutesHMR } from "./hmr.js";
import { registerRoutes } from "./register.js";
import { defineUtility } from "astro-integration-kit";

export const ROUTES_DIR = "routes";
const LOGGER_LABEL = "astro-i18n/routing";

export const handleRouting = defineUtility("astro:config:setup")(
	(params, options: Options) => {
		const logger = params.logger.fork(LOGGER_LABEL);

		handleRoutesHMR(params, logger);
		const { routes } = registerRoutes(params, options, logger);

		return { routes };
	},
);
