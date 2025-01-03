import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { defineUtility, watchDirectory } from "astro-integration-kit";
import { normalizePath } from "vite";
import type { Options } from "../options.js";
import { getNamespaces } from "./namespaces.js";
import { getResources } from "./resources.js";

const getPaths = (root: URL, options: Options) => {
	const localesDir = normalizePath(
		fileURLToPath(new URL(options.localesDir, root)),
	);
	const defaultLocalesDir = join(localesDir, options.defaultLocale);

	return {
		localesDir,
		defaultLocalesDir,
	};
};

const LOGGER_LABEL = "astro-i18n/i18next";

export const handleI18next = defineUtility("astro:config:setup")(
	(params, options: Options) => {
		const logger = params.logger.fork(LOGGER_LABEL);

		const paths = getPaths(params.config.root, options);
		watchDirectory(params, paths.localesDir);
		logger.info(
			`Registered watcher for "${normalizePath(
				relative(fileURLToPath(params.config.root), paths.localesDir),
			)}" directory`,
		);

		const { namespaces } = getNamespaces(
			paths.defaultLocalesDir,
			options.defaultNamespace,
			logger,
		);
		const resources = getResources(logger, options, paths.localesDir);
		const dtsContent = `
	type Resources = ${JSON.stringify(resources[options.defaultLocale] ?? {})}
	
    declare module "i18next" {
      interface CustomTypeOptions {
        defaultNS: "${options.defaultNamespace}";
        resources: Resources;
      }
    }
    export {}
    `;

		return {
			namespaces,
			resources,
			dtsContent,
		};
	},
);
