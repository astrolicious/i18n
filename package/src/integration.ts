import { readFileSync } from "node:fs";
import {
	addIntegration,
	addVirtualImports,
	createResolver,
	defineIntegration,
} from "astro-integration-kit";
import { handleI18next } from "./i18next/index.js";
import { optionsSchema } from "./options.js";
import { handleRouting } from "./routing/index.js";
import { integration as sitemapIntegration } from "./sitemap/integration.js";

const VIRTUAL_MODULE_ID = "i18n:astro";
const CLIENT_ID = "__INTERNAL_ASTRO_I18N_CONFIG__";

export const integration = defineIntegration({
	name: "astro-i18n",
	optionsSchema,
	setup({ options, name }) {
		const { resolve } = createResolver(import.meta.url);

		let dtsContent: string;
		let i18nextDtsContent: string;

		return {
			hooks: {
				"astro:config:setup": (params) => {
					const { addMiddleware, logger, updateConfig } = params;

					const { routes } = handleRouting(params, options);
					const {
						namespaces,
						resources,
						dtsContent: _dtsContent,
					} = handleI18next(params, options);
					i18nextDtsContent = _dtsContent;

					addMiddleware({
						entrypoint: resolve("../assets/middleware.ts"),
						order: "pre",
					});

					const defaultLocaleRoutes = routes.filter(
						(route) => route.locale === options.defaultLocale,
					);

					const virtualTypesStub = readFileSync(
						resolve("../assets/stubs/virtual.d.ts"),
						"utf-8",
					);
					const typesPlaceholders = {
						id: "@@_ID_@@",
						locale: '"@@_LOCALE_@@"',
						localePathParams: '"@@_LOCALE_PATH_PARAMS_@@"',
						locales: '"@@_LOCALES_@@"',
					};

					dtsContent = virtualTypesStub
						.replace(typesPlaceholders.id, VIRTUAL_MODULE_ID)
						.replace(
							typesPlaceholders.locale,
							options.locales.map((locale) => `"${locale}"`).join(" | "),
						)
						.replace(
							typesPlaceholders.localePathParams,
							`{${defaultLocaleRoutes
								.map(
									(route) =>
										`"${route.pattern}": ${
											route.params.length === 0
												? "never"
												: `{
											${route.params
												.map((param) => `"${param}": string;`)
												.join("\n")}
											}`
										}`,
								)
								.join(";\n")}}`,
						)
						.replace(
							typesPlaceholders.locales,
							JSON.stringify(options.locales),
						);

					if (options.sitemap) {
						addIntegration(params, {
							integration: sitemapIntegration({
								...options.sitemap,
								internal: {
									i18n: {
										defaultLocale: options.defaultLocale,
										locales: options.locales,
									},
									routes,
								},
							}),
						});

						const virtualSitemapTypesStub = readFileSync(
							resolve("../assets/stubs/sitemap.d.ts"),
							"utf-8",
						);

						dtsContent += virtualSitemapTypesStub;
					}

					const enabledClientFeatures = Object.entries(options.client)
						.map(([name, enabled]) => ({ name, enabled }))
						.filter((e) => e.enabled);
					if (enabledClientFeatures.length > 0) {
						logger.info(
							`Client features enabled: ${enabledClientFeatures
								.map((e) => `"${e.name}"`)
								.join(
									", ",
								)}. Make sure to use the \`<I18nClient />\` component`,
						);
					}

					const virtualModuleStub = readFileSync(
						resolve("../assets/stubs/virtual.mjs"),
						"utf-8",
					);
					const scriptPlaceholders = {
						config: '"@@_CONFIG_@@"',
						i18next: '"@@_I18NEXT_@@"',
					};

					addVirtualImports(params, {
						name,
						imports: [
							{
								id: "virtual:astro-i18n/internal",
								content: `
								export const options = ${JSON.stringify(options)};
								export const routes = ${JSON.stringify(routes)};
								export const i18nextConfig = ${JSON.stringify({
									namespaces,
									defaultNamespace: options.defaultNamespace,
									resources,
								})};
								export const clientId = ${JSON.stringify(CLIENT_ID)};
							`,
							},
							{
								id: "virtual:astro-i18n/als",
								content: `
								import { AsyncLocalStorage } from "node:async_hooks";
								export const als = new AsyncLocalStorage;
							`,
							},
							{
								id: VIRTUAL_MODULE_ID,
								content: `
								import { als } from "virtual:astro-i18n/als";
								import _i18next from "i18next";
								${virtualModuleStub
									.replaceAll(scriptPlaceholders.config, "als.getStore()")
									.replaceAll(scriptPlaceholders.i18next, "_i18next")}`,
								context: "server",
							},
							{
								id: VIRTUAL_MODULE_ID,
								content: (() => {
									let content = "";
									if (options.client.translations) {
										content += `import _i18next from "i18next"; `;
									}

									content += virtualModuleStub.replaceAll(
										scriptPlaceholders.config,
										`JSON.parse(document.getElementById(${JSON.stringify(
											CLIENT_ID,
										)}).textContent)`,
									);

									if (options.client.translations) {
										content = content.replaceAll(
											scriptPlaceholders.i18next,
											"_i18next",
										);
									}

									return content;
								})(),
								context: "client",
							},
						],
					});

					logger.info("Types injected");

					if (options.strategy === "prefix" && options.rootRedirect) {
						updateConfig({
							redirects: {
								"/": options.rootRedirect,
							},
						});
					}
				},
				"astro:config:done": (params) => {
					params.injectTypes({
						filename: "astro-i18n.d.ts",
						content: dtsContent,
					});
					params.injectTypes({
						filename: "i18next.d.ts",
						content: i18nextDtsContent,
					});
				},
			},
		};
	},
});
