import type { LinkItem, SitemapItemLoose } from "sitemap";
import type { Route } from "./integration.js";
import type { SitemapOptions } from "./options.js";
import { createImpossibleError } from "./utils.js";

const normalizeDynamicParams = (
	_params: Route["sitemapOptions"][number]["dynamicParams"],
) => {
	if (!_params) {
		return [];
	}

	if (Array.isArray(_params)) {
		return _params;
	}

	return Object.entries(_params).map(([locale, params]) => ({
		locale,
		params,
	}));
};

type NoUndefinedField<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(
	routes: Array<Route>,
	_finalSiteUrl: string,
	opts: SitemapOptions,
) {
	const { changefreq, priority, lastmod: lastmodSrc } = opts;
	const lastmod = lastmodSrc?.toISOString();

	const getLinksFromRoute = (route: NoUndefinedField<Route>, page: string) => {
		if (!route.route) {
			return [];
		}

		const links: Array<LinkItem> = [];

		const equivalentRoutes = routes.filter(
			(e) =>
				e.route &&
				e.route.pattern === route.route.pattern &&
				e.route.locale !== route.route.locale,
		) as Array<NoUndefinedField<Route>>;

		links.push({
			lang: route.route.locale,
			url: page,
		});

		// Handle static links
		if (route.routeData.params.length === 0) {
			for (const equivalentRoute of equivalentRoutes) {
				links.push({
					lang: equivalentRoute.route.locale,
					url: `${new URL(page).origin}${
						equivalentRoute.route.injectedRoute.pattern
					}`,
				});
			}

			return [...links].sort((a, b) =>
				a.url.localeCompare(b.url, "en", { numeric: true }),
			);
		}

		const index = route.pages.indexOf(page);
		const sitemapOptions = route.sitemapOptions[index];
		if (!sitemapOptions) {
			return [];
		}

		for (const equivalentRoute of equivalentRoutes) {
			const options = normalizeDynamicParams(
				sitemapOptions?.dynamicParams,
			).find((e) => e.locale === equivalentRoute.route.locale);

			if (!options) {
				throw createImpossibleError(
					"This situation should never occur (no options were found)",
				);
			}

			let newPage = equivalentRoute.route.injectedRoute.pattern;
			for (const [key, value] of Object.entries(options.params)) {
				if (!value) {
					throw createImpossibleError(
						"This situation should never occur (value is not set)",
					);
				}

				newPage = newPage.replace(`[${key}]`, value);
			}
			newPage = `${new URL(page).origin}${newPage}`;
			links.push({
				lang: equivalentRoute.route.locale,
				url: newPage,
			});
		}
		return [...links].sort((a, b) =>
			a.url.localeCompare(b.url, "en", { numeric: true }),
		);
	};

	const urlData: Array<SitemapItemLoose> = [];
	for (const route of routes) {
		for (const page of route.pages) {
			const links: Array<LinkItem> = [];
			if (route.route) {
				const _links = getLinksFromRoute(
					// Required because TS
					{
						...route,
						route: route.route,
					},
					page,
				);
				links.push(..._links);
			}

			const obj: SitemapItemLoose = {
				url: page,
				links,
			};

			// TODO: get from sitemap options first
			if (changefreq) {
				Object.assign(obj, { changefreq });
			}
			if (lastmod) {
				Object.assign(obj, { lastmod });
			}
			if (priority) {
				Object.assign(obj, { priority });
			}

			urlData.push(obj);
		}
	}

	return [...urlData].sort((a, b) =>
		a.url.localeCompare(b.url, "en", { numeric: true }),
	);
}
