import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import routeConfigPlugin from "@inox-tools/aik-route-config";
import type { AstroConfig, InjectedRoute, RouteData } from "astro";
import {
	defineIntegration,
	hasIntegration,
	withPlugins,
} from "astro-integration-kit";
import { AstroError } from "astro/errors";
import { z } from "astro/zod";
import { simpleSitemapAndIndex } from "sitemap";
import { withoutTrailingSlash } from "ufo";
import { normalizePath } from "vite";
import type { Route as InternalRoute } from "../types.js";
import { generateSitemap } from "./generate-sitemap.js";
import { optionsSchema } from "./options.js";
import { type CallbackSchema, callbackSchema } from "./route-config.js";
import {
	createImpossibleError,
	formatConfigErrorMessage,
	getPathnameFromRouteData,
	handleTrailingSlash,
	isStatusCodePage,
	normalizeDynamicParams,
} from "./utils.js";

const OUTFILE = "sitemap-index.xml";

// strictest forces us to do weird things
type _RouteRoute = Omit<InternalRoute, "injectedRoute"> & {
	injectedRoute: Omit<InjectedRoute, "prerender"> & {
		prerender?: boolean | undefined;
	};
};

export type Route = {
	pages: Array<string>;
	route: _RouteRoute | undefined;
	routeData: RouteData;
	sitemapOptions: Array<Exclude<CallbackSchema, false>>;
	include: boolean;
};

export const integration = defineIntegration({
	name: "astro-i18n/sitemap",
	optionsSchema,
	setup({ options, name }) {
		const initialRoutes: Array<Route> = options.internal.routes.map(
			(route) => ({
				pages: [],
				route,
				routeData: undefined as unknown as RouteData,
				sitemapOptions: [],
				include: true,
			}),
		);

		let config: AstroConfig;

		return withPlugins({
			name,
			plugins: [routeConfigPlugin],
			hooks: {
				"astro:config:setup": ({ defineRouteConfig, ...params }) => {
					const { logger } = params;

					if (hasIntegration(params, { name: "@astrojs/sitemap" })) {
						throw new AstroError(
							"Cannot use both `@astrolicious/i18n` sitemap and `@astrojs/sitemap` integrations at the same time.",
							"Remove the `@astrojs/sitemap` integration from your project.",
						);
					}

					config = params.config;

					defineRouteConfig({
						importName: "i18n:astro/sitemap",
						callbackHandler: ({ routeData }, callback) => {
							const response = callbackSchema.safeParse(callback);
							if (!response.success) {
								throw new AstroError(
									formatConfigErrorMessage(response.error),
									"Check your usage of `astro:i18n/sitemap`",
								);
							}
							for (const r of routeData) {
								const route = initialRoutes.find(
									(e) =>
										e.route?.injectedRoute.pattern ===
										getPathnameFromRouteData(r),
								);
								if (!route) {
									continue;
								}

								route.routeData = r;
								route.include = response.data !== false;
								if (response.data !== false) {
									if (
										response.data.changefreq ||
										response.data.lastmod ||
										response.data.priority
									) {
										logger.warn(
											`Setting \`changefreq\`, \`lastmod\` or \`priority\` on a route basis is not implemented yet (eg. on "${r.component}")`,
										);
									}
									route.sitemapOptions.push(response.data);
									if (route.route) {
										const { locale, injectedRoute } = route.route;
										const params = normalizeDynamicParams(
											response.data.dynamicParams,
										)?.find((e) => e.locale === locale);
										if (params) {
											let page = injectedRoute.pattern;
											for (const [key, value] of Object.entries(
												params.params,
											)) {
												if (value) {
													page = page.replace(`[${key}]`, value);
												}
											}
											route.pages.push(page);
										}
									}
								}
							}
						},
					});
				},
				"astro:build:done": async (params) => {
					const { logger } = params;

					for (const route of initialRoutes) {
						if (route.pages.length === 0 && route.route) {
							route.pages.push(route.route.injectedRoute.pattern);
						}
					}

					for (const r of initialRoutes.filter((e) => !e.routeData)) {
						const routeData = params.routes.find(
							(e) =>
								withoutTrailingSlash(r.route?.injectedRoute.pattern) ===
								getPathnameFromRouteData(e),
						);
						if (!routeData) {
							throw createImpossibleError(
								"This situation should never occur (a corresponding routeData should always be found)",
							);
						}
						r.routeData = routeData;
						r.include = true;
					}

					const _routes = [
						...initialRoutes,
						...params.routes
							.filter(
								(e) =>
									!initialRoutes
										.map((e) => getPathnameFromRouteData(e.routeData))
										.includes(getPathnameFromRouteData(e)),
							)
							.map((routeData) => {
								const route: Route = {
									include: true,
									routeData,
									pages: [],
									route: undefined,
									sitemapOptions: [],
								};

								return route;
							}),
					];

					try {
						if (!config.site) {
							logger.warn(
								"The Sitemap integration requires the `site` astro.config option. Skipping.",
							);
							return;
						}

						const { customPages, entryLimit } = options;

						if (!config.site) {
							logger.warn(
								"The `site` astro.config option is required. Skipping.",
							);
							return;
						}
						const finalSiteUrl = new URL(config.base, config.site);

						let pageUrls = params.pages
							.filter((p) => !isStatusCodePage(p.pathname))
							.map((p) => {
								if (p.pathname !== "" && !finalSiteUrl.pathname.endsWith("/"))
									finalSiteUrl.pathname += "/";
								if (p.pathname.startsWith("/"))
									p.pathname = p.pathname.slice(1);
								const fullPath = finalSiteUrl.pathname + p.pathname;
								return new URL(fullPath, finalSiteUrl).href;
							});

						const routeUrls = _routes.reduce<string[]>((urls, route) => {
							const r = route.routeData;
							if (!r) {
								return urls;
							}
							// Only expose pages, not endpoints or redirects
							if (r.type !== "page") return urls;

							/**
							 * Dynamic URLs have entries with `undefined` pathnames
							 */
							if (r.pathname) {
								if (isStatusCodePage(r.pathname ?? r.route)) return urls;

								// `finalSiteUrl` may end with a trailing slash
								// or not because of base paths.
								let fullPath = finalSiteUrl.pathname;
								if (fullPath.endsWith("/"))
									fullPath += r.generate(r.pathname).substring(1);
								else fullPath += r.generate(r.pathname);

								const newUrl = new URL(fullPath, finalSiteUrl).href;

								urls.push(handleTrailingSlash(newUrl, config));
							}

							return urls;
						}, []);

						pageUrls = Array.from(
							new Set([...pageUrls, ...routeUrls, ...(customPages ?? [])]),
						);

						pageUrls = pageUrls.filter((page) => {
							const route = normalizePath(
								`/${relative(config.base, new URL(page).pathname)}`,
							);

							const excludedRoutes = _routes.filter((e) => !e.include);
							for (const { routeData } of excludedRoutes) {
								// biome-ignore lint/style/noNonNullAssertion: <explanation>
								if (routeData!.pattern.test(route)) {
									return false;
								}
							}
							return true;
						});

						if (pageUrls.length === 0) {
							logger.warn(`No pages found!\n\`${OUTFILE}\` not created.`);
							return;
						}

						for (const route of _routes.filter((e) => e.include)) {
							route.pages = route.pages.map((page) =>
								page.startsWith("/")
									? handleTrailingSlash(
											new URL(page, finalSiteUrl).href,
											config,
										)
									: page,
							);
						}

						const urlData = generateSitemap(
							_routes.filter((e) => e.include),
							finalSiteUrl.href,
							options,
							config,
						);

						const destDir = fileURLToPath(params.dir);
						await simpleSitemapAndIndex({
							hostname: finalSiteUrl.href,
							destinationDir: destDir,
							sourceData: urlData,
							limit: entryLimit,
							gzip: false,
						});
						logger.info(
							`\`${OUTFILE}\` created at \`${relative(
								process.cwd(),
								destDir,
							)}\``,
						);
					} catch (err) {
						if (err instanceof z.ZodError) {
							logger.warn(formatConfigErrorMessage(err));
						} else {
							throw err;
						}
					}
				},
			},
		});
	},
});
