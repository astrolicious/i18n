import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegrationLogger } from "astro";
import { defineUtility, watchDirectory } from "astro-integration-kit";
import { normalizePath } from "vite";
import { ROUTES_DIR } from "./index.js";

export const handleRoutesHMR = defineUtility("astro:config:setup")(
	(params, logger: AstroIntegrationLogger) => {
		const { config } = params;

		const dir = normalizePath(join(fileURLToPath(config.srcDir), ROUTES_DIR));
		watchDirectory(params, dir);
		logger.info(
			`Registered watcher for "${normalizePath(
				relative(fileURLToPath(params.config.root), dir),
			)}" directory`,
		);
	},
);
