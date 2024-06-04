import { addDts, defineUtility } from "astro-integration-kit";
import type { Options } from "../options.js";
import type { I18nextConfig } from "../types.js";

export const injectTypes = defineUtility("astro:config:setup")(
	(
		params,
		{ defaultNamespace }: Options,
		resources: I18nextConfig["resources"][string],
	) => {
		const content = `
	type Resources = ${JSON.stringify(resources)}
	
    declare module "i18next" {
      interface CustomTypeOptions {
        defaultNS: "${defaultNamespace}";
        resources: Resources;
      }
    }
    export {}
    `;

		addDts(params, { name: "i18next", content });
	},
);
