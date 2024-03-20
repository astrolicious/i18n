import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import routeConfigPlugin from "@inox-tools/aik-route-config";
import type { AstroConfig, InjectedRoute, RouteData } from "astro";
import { defineIntegration } from "astro-integration-kit";
import { hasIntegration } from "astro-integration-kit/utilities";
import { AstroError } from "astro/errors";
import { ZodError } from "astro/zod";
import { simpleSitemapAndIndex } from "sitemap";
import { generateSitemap } from "./generate-sitemap.js";
import { optionsSchema, type SitemapOptions } from "./options.js";
import { callbackSchema, type CallbackSchema } from "./route-config.js";
import "./virtual.d.ts";
import { normalizePath } from "vite";
import type { Route } from "../types.js";
import { withoutTrailingSlash } from "ufo";

const OUTFILE = "sitemap-index.xml";
const STATUS_CODE_PAGES = new Set(["404", "500"]);

const isStatusCodePage = (_pathname: string): boolean => {
	let pathname = _pathname;
	if (pathname.endsWith("/")) {
		pathname = pathname.slice(0, -1);
	}
	const end = pathname.split("/").pop() ?? "";
	return STATUS_CODE_PAGES.has(end);
};

const formatConfigErrorMessage = (err: ZodError) => {
	const errorList = err.issues.map(
		(issue) => ` ${issue.path.join(".")}  ${`${issue.message}.`}`,
	);
	return errorList.join("\n");
};

type _Route = {
	page: string | undefined;
	// strictest forces us to do weird things
	route:
		| (Omit<Route, "injectedRoute"> & {
				injectedRoute: Omit<InjectedRoute, "prerender"> & {
					prerender?: boolean | undefined;
				};
		  })
		| undefined;
	routeData: RouteData | undefined;
	sitemapOptions: Array<Exclude<CallbackSchema, false>>;
	include: boolean | undefined;
};

export const integration = defineIntegration({
	name: "astro-i18n/sitemap",
	plugins: [routeConfigPlugin],
	optionsSchema,
	setup({ options }) {
		const routes: Array<_Route> = options.internal.routes.map((route) => ({
			page: undefined,
			route,
			routeData: undefined,
			sitemapOptions: [],
			include: undefined,
		}));

		let config: AstroConfig;

		return {
			"astro:config:setup": ({ defineRouteConfig, ...params }) => {
				if (hasIntegration({ ...params, name: "@astrojs/sitemap" })) {
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
							// TODO: proper error message
							throw new Error("Invalid callback");
						}
						for (const r of routeData) {
							const route = routes.find(
								// biome-ignore lint/style/noNonNullAssertion: No undefined route at this stage
								(e) => e.route!.injectedRoute.pattern === r.route,
							);
							if (!route) {
								continue;
							}

							route.routeData = r;
							route.include = response.data !== false;
							if (response.data !== false) {
								route.sitemapOptions.push(response.data);
							}
						}
					},
				});
			},
			"astro:build:done": async (params) => {
				// console.dir(routes, { depth: null });
				const { dir, routes: rawRoutes, pages, logger } = params;
				// console.dir(rawRoutes, { depth: null });
				for (const r of routes.filter((e) => !e.routeData)) {
					r.routeData = rawRoutes.find(
						(e) =>
							// biome-ignore lint/style/noNonNullAssertion: No undefined route at this stage
							withoutTrailingSlash(r.route!.injectedRoute.pattern) === e.route,
					);
					if (r.routeData) {
						r.include = true;
					} else {
						console.warn(r);
						// TODO: proper error
						throw new Error("This should never happen");
					}
				}

				const _routes: Array<_Route> = [
					...routes,
					...rawRoutes
						.filter(
							// biome-ignore lint/style/noNonNullAssertion: Checked above
							(e) => !routes.map((e) => e.routeData!.route).includes(e.route),
						)
						.map(
							(routeData) =>
								({
									include: true,
									routeData,
									page: undefined,
									route: undefined,
									sitemapOptions: [],
								}) satisfies _Route,
						),
				];
				console.dir(
					_routes.map((e) => ({
						...e,
						routeData: e.routeData?.route,
					})),
					{ depth: null },
				);

				try {
					if (!config.site) {
						logger.warn(
							"The Sitemap integration requires the `site` astro.config option. Skipping.",
						);
						return;
					}

					const { customPages, entryLimit } = options;

					if (!config.site) {
						console.warn(
							"The Sitemap integration requires the `site` astro.config option. Skipping.",
						);
						return;
					}
					const finalSiteUrl = new URL(config.base, config.site);

					let pageUrls = pages
						.filter((p) => !isStatusCodePage(p.pathname))
						.map((p) => {
							if (p.pathname !== "" && !finalSiteUrl.pathname.endsWith("/"))
								finalSiteUrl.pathname += "/";
							if (p.pathname.startsWith("/")) p.pathname = p.pathname.slice(1);
							const fullPath = finalSiteUrl.pathname + p.pathname;
							return new URL(fullPath, finalSiteUrl).href;
						});

					const routeUrls = _routes.reduce<string[]>((urls, route) => {
						// biome-ignore lint/style/noNonNullAssertion: Necessary checks have been made
						const r = route.routeData!;
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

							if (config.trailingSlash === "never") {
								urls.push(newUrl);
							} else if (
								config.build.format === "directory" &&
								!newUrl.endsWith("/")
							) {
								urls.push(`${newUrl}/`);
							} else {
								urls.push(newUrl);
							}
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

					// TODO: use dynamic params to generate mappings
					const urlData = generateSitemap(pageUrls, finalSiteUrl.href, options);

					const destDir = fileURLToPath(dir);
					await simpleSitemapAndIndex({
						hostname: finalSiteUrl.href,
						destinationDir: destDir,
						sourceData: urlData,
						limit: entryLimit,
						gzip: false,
					});
					logger.info(
						`\`${OUTFILE}\` created at \`${relative(process.cwd(), destDir)}\``,
					);
				} catch (err) {
					if (err instanceof ZodError) {
						logger.warn(formatConfigErrorMessage(err));
					} else {
						throw err;
					}
				}
			},
		};
	},
});
