import { createResolver, defineIntegration } from "astro-integration-kit";
import { readFileSync } from "node:fs";
import { handleI18next } from "./i18next/index.js";
import { optionsSchema } from "./options.js";
import { handleRouting } from "./routing/index.js";
import {
	addDts,
	addVirtualImports,
	watchIntegration,
} from "astro-integration-kit/utilities";

const VIRTUAL_MODULE_ID = "i18n:astro";

export const integration = defineIntegration({
	name: "astro-i18n",
	optionsSchema,
	setup({ options, name }) {
		const { resolve } = createResolver(import.meta.url);

		return {
			"astro:config:setup": (params) => {
				const { addMiddleware, config, logger, updateConfig } = params;

				watchIntegration({ ...params, dir: resolve() });

				const { routes } = handleRouting(params)(options);
				const { namespaces, resources } = handleI18next(params)(options);

				addVirtualImports({
					...params,
					name,
					imports: {
						"virtual:astro-i18n/internal": `
              export const options = ${JSON.stringify(options)};
              export const routes = ${JSON.stringify(routes)};
              export const i18nextConfig = ${JSON.stringify({
								namespaces,
								defaultNamespace: options.defaultNamespace,
								resources,
							})};
            `,
						"virtual:astro-i18n/als": `
              import { AsyncLocalStorage } from "node:async_hooks";
              export const als = new AsyncLocalStorage;
            `,
					},
				});

				addMiddleware({
					entrypoint: resolve("./middleware.ts"),
					order: "pre",
				});

				const defaultLocaleRoutes = routes.filter(
					(route) => route.locale === options.defaultLocale,
				);

				addDts({
					logger,
					...config,
					name: "astro-i18n",
					content: `
          declare module "${VIRTUAL_MODULE_ID}" {
            export type Locale = ${options.locales
							.map((locale) => `"${locale}"`)
							.join(" | ")};
            export type LocalePathParams = {
              ${defaultLocaleRoutes
								.map(
									(route) =>
										`"${route.originalPattern}": ${
											route.params.length === 0
												? "never"
												: `{
                              ${route.params
																.map((param) => `"${param}": string;`)
																.join("\n")}
                            }`
										}`,
								)
								.join(";\n")}
            };
            export type LocalePath = keyof LocalePathParams;

            export const t: typeof import("i18next").t;
            export const getLocale: () => Locale;
            export const getLocales: () => ${JSON.stringify(options.locales)};
            export const getHtmlAttrs: () => {
              lang: string;
              dir: "rtl" | "ltr";
            };
            export const setDynamicParams: (
                params: Partial<Record<Locale | (string & {}), Record<string, string>>> | Array<{
                    locale: Locale | (string & {});
                    params: Record<string, string>;
                }>
            ) => void;
            export const getLocalePath: <TPath extends LocalePath>(
              path: TPath,
              ...params: LocalePathParams[TPath] extends never
                ? []
                : [LocalePathParams[TPath]]
            ) => string;
            export const switchLocalePath: (locale: Locale) => string;
            export const getSwitcherData: () => Array<{ locale: string; href: string }>;

            export const getLocalePlaceholder: () => Locale;
          }`,
				});

				const enabledClientFeatures = Object.entries(options.client)
					.map(([name, enabled]) => ({ name, enabled }))
					.filter((e) => e.enabled);
				if (enabledClientFeatures.length > 0) {
					logger.info(
						`Client features enabled: ${enabledClientFeatures
							.map((e) => `"${e.name}"`)
							.join(", ")}. Make sure to use the \`<I18nClient />\` component`,
					);
				}

				const virtualModuleStub = readFileSync(
					resolve("./stubs/virtual.mjs"),
					"utf-8",
				);
				const placeholders = {
					config: '"@@_CONFIG_@@"',
					i18next: '"@@_I18NEXT_@@"',
				};

				const _imports = [
					{
						name: VIRTUAL_MODULE_ID,
						content: `import { als } from "virtual:astro-i18n/als"; import { i18next as _i18next } from "@astrolicious/i18n/deps"; ${virtualModuleStub
							.replaceAll(placeholders.config, "als.getStore()")
							.replaceAll(placeholders.i18next, "_i18next")}`,
						ssr: true,
					},
					{
						name: VIRTUAL_MODULE_ID,
						content: (() => {
							let content = "";
							if (options.client.translations) {
								content += `import { i18next as _i18next } from "@astrolicious/i18n/deps"; `;
							}

							content += virtualModuleStub.replaceAll(
								placeholders.config,
								"window.__INTERNAL_ASTRO_I18N_CONFIG__",
							);

							if (options.client.translations) {
								content = content.replaceAll(placeholders.i18next, "_i18next");
							}

							return content;
						})(),
						ssr: false,
					},
				];

				const resolveVirtualModuleId = <T extends string>(id: T): `\0${T}` => {
					return `\0${id}`;
				};

				const resolutionMap = Object.fromEntries(
					_imports.map(({ name }) => [resolveVirtualModuleId(name), name]),
				);

				updateConfig({
					vite: {
						plugins: [
							{
								name: "vite-plugin-astro-i18n-virtual",
								resolveId(id) {
									if (_imports.find((e) => e.name === id))
										return resolveVirtualModuleId(id);
									return;
								},
								load(id, options) {
									const resolution = resolutionMap[id];
									if (resolution) {
										const data = _imports.find(
											(e) =>
												e.name === resolution &&
												e.ssr === (options?.ssr ?? false),
										);
										if (data) {
											return data.content;
										}
									}
									return;
								},
							},
						],
					},
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
		};
	},
});
