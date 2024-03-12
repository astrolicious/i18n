import { defineIntegration } from "astro-integration-kit";
import { optionsSchema } from "./options.js";
import type { AstroConfig } from "astro";
import { generateSitemap } from "./generate-sitemap.js";
import { fileURLToPath } from "node:url";
import { simpleSitemapAndIndex } from "sitemap";
import { relative } from "node:path";
import { ZodError } from "astro/zod";
import { hasIntegration } from "astro-integration-kit/utilities";
import { AstroError } from "astro/errors";
import routeConfigPlugin from "@inox-tools/aik-route-config";

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

export const integration = defineIntegration({
	name: "astro-i18n/sitemap",
	plugins: [routeConfigPlugin],
	optionsSchema,
	setup({ options }) {
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
					callbackHandler: (context, callback) => {
						console.log({ context, callback })
					}
				})
			},
			"astro:build:done": async (params) => {
				const { dir, routes, pages, logger } = params;

				try {
					if (!config.site) {
						logger.warn(
							"The Sitemap integration requires the `site` astro.config option. Skipping.",
						);
						return;
					}

					const { customPages, entryLimit } = options;

					let finalSiteUrl: URL;
					if (config.site) {
						finalSiteUrl = new URL(config.base, config.site);
					} else {
						console.warn(
							"The Sitemap integration requires the `site` astro.config option. Skipping.",
						);
						return;
					}

					let pageUrls = pages
						.filter((p) => !isStatusCodePage(p.pathname))
						.map((p) => {
							if (p.pathname !== "" && !finalSiteUrl.pathname.endsWith("/"))
								finalSiteUrl.pathname += "/";
							if (p.pathname.startsWith("/")) p.pathname = p.pathname.slice(1);
							const fullPath = finalSiteUrl.pathname + p.pathname;
							return new URL(fullPath, finalSiteUrl).href;
						});

					const routeUrls = routes.reduce<string[]>((urls, r) => {
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

					if (pageUrls.length === 0) {
						logger.warn(`No pages found!\n\`${OUTFILE}\` not created.`);
						return;
					}

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
