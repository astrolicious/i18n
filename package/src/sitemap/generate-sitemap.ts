import type { LinkItem, SitemapItemLoose } from "sitemap";
import type { SitemapOptions } from "./options.js";
import type { _Route } from "./integration.js";

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(
	routes: Array<_Route>,
	_finalSiteUrl: string,
	opts: SitemapOptions,
) {
	const { changefreq, priority, lastmod: lastmodSrc } = opts;
	// TODO: find way to respect <link rel="canonical"> URLs here
	// const urls = [...pages];
	// urls.sort((a, b) => a.localeCompare(b, "en", { numeric: true })); // sort alphabetically so sitemap is same each time

	const lastmod = lastmodSrc?.toISOString();

	const getLinksFromRoute = (route: _Route, page: string) => {
		const links: Array<LinkItem> = [];

		const equivalentRoutes = routes.filter(
			(e) =>
				e.route &&
				e.route!.pattern === route.route!.pattern &&
				e.route!.locale !== route.route!.locale,
		);

		links.push({
			lang: route.route!.locale,
			url: page,
		});

		// Handle static links
		if (route.routeData!.params.length === 0) {
			// console.dir(
			// 	{
			// 		equivalent: equivalentRoutes.map(
			// 			(route) => route.route!.injectedRoute.pattern,
			// 		),
			// 	},
			// 	{ depth: null },
			// );

			for (const equivalentRoute of equivalentRoutes) {
				links.push({
					lang: equivalentRoute.route!.locale,
					url: `${new URL(page).origin}${
						equivalentRoute.route!.injectedRoute.pattern
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
		// console.dir(
		// 	{
		// 		current: route.route!.injectedRoute.pattern,
		// 		equivalent: equivalentRoutes.map(
		// 			(route) => route.route!.injectedRoute.pattern,
		// 		),
		// 		// equivalentRoutes,
		// 		index,
		// 		sitemapOptions,
		// 		// route,
		// 	},
		// 	{ depth: null },
		// );
		for (const equivalentRoute of equivalentRoutes) {
			// console.log(equivalentRoute.route!.injectedRoute.pattern);
			const options = sitemapOptions?.dynamicParams?.find(
				(e) => e.locale === equivalentRoute.route!.locale,
			);
			let newPage = equivalentRoute.route!.injectedRoute.pattern;
			for (const [key, value] of Object.entries(options.params)) {
				newPage = newPage.replace(`[${key}]`, value);
			}
			newPage = `${new URL(page).origin}${newPage}`;
			links.push({
				lang: equivalentRoute.route!.locale,
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
			console.log(page);
			const links: Array<LinkItem> = [];
			if (route.route) {
				// console.dir(route, { depth: null });
				// TODO: logic to get equivalent route in other locales
				const _links = getLinksFromRoute(route, page);
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
			console.log("---");
		}
	}

	return [...urlData].sort((a, b) =>
		a.url.localeCompare(b.url, "en", { numeric: true }),
	);
}
