import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { addDts, defineUtility } from "astro-integration-kit";
import { normalizePath } from "vite";
import type { Options } from "../options.js";
import type { getNamespaces } from "./namespaces.js";

export const injectTypes = defineUtility("astro:config:setup")(
	(
		params,
		{ defaultNamespace }: Options,
		importsData: ReturnType<typeof getNamespaces>["importsData"],
		defaultLocalesDir: string,
	) => {
		const relativeLocalesPrefix = `${normalizePath(
			relative(
				fileURLToPath(new URL("./.astro/", params.config.root)),
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

		addDts(params, { name: "i18next", content });
	},
);
