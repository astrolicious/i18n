import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { HookParameters } from "astro";
import { addDts } from "astro-integration-kit/utilities";
import { normalizePath } from "vite";
import type { Options } from "../options.js";
import type { getNamespaces } from "./namespaces.js";

export const injectTypes = (
	{ logger, config }: HookParameters<"astro:config:setup">,
	{ defaultNamespace }: Options,
	importsData: ReturnType<typeof getNamespaces>["importsData"],
	defaultLocalesDir: string,
) => {
	const relativeLocalesPrefix = `${normalizePath(
		relative(
			fileURLToPath(new URL("./.astro/", config.root)),
			defaultLocalesDir,
		),
	)}/`;

	const content = `
    declare module "i18next" {
      interface CustomTypeOptions {
        defaultNS: "${defaultNamespace}";
        resources: {
          ${importsData
						.map(
							({ namespaceName, fileName }) =>
								`"${namespaceName}": typeof import("${normalizePath(
									join(relativeLocalesPrefix, fileName),
								)}");`,
						)
						.join("\n")}
        }
      }
    }
    export {}
    `;

	addDts({ logger, ...config, name: "i18next", content });
};
