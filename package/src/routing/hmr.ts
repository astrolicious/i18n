import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegrationLogger, HookParameters } from "astro";
import { watchIntegration } from "astro-integration-kit/utilities";
import { normalizePath } from "vite";
import { ROUTES_DIR } from "./index.js";

export const handleRoutesHMR = (
	params: HookParameters<"astro:config:setup">,
	logger: AstroIntegrationLogger,
) => {
	const { config } = params;

	const dir = normalizePath(join(fileURLToPath(config.srcDir), ROUTES_DIR));
	watchIntegration({
		...params,
		dir,
	});
	logger.info(
		`Registered watcher for "${normalizePath(
			relative(fileURLToPath(params.config.root), dir),
		)}" directory`,
	);
};
