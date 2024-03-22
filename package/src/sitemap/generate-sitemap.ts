import type { LinkItem, SitemapItemLoose } from "sitemap";
import type { SitemapOptions } from "./options.js";
// import { parseUrl } from "./parse-url.js";
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

	const { defaultLocale } = opts.internal.i18n;

	const getLinksFromRoute = ({ route }: _Route) => {
		// TODO: make it work
		const isDefaultLocale = route!.locale === defaultLocale;
		const defaultRoutes = routes.filter(
			(e) => e.route && e.route.locale === defaultLocale,
		);
		const otherRoutes = routes.filter(
			(e) => e.route && e.route.locale !== route!.locale,
		);
		const foundRoutes = (isDefaultLocale ? otherRoutes : defaultRoutes).filter(
			(e) => e.route!.pattern === route!.pattern,
		);
		if (foundRoutes.length === 0) {
			return [];
		}
		// TODO: do whatever is needed
		// TODO: update playground to test with another locale
		// console.log(temp.route?.injectedRoute.pattern);
		return [];
	};

	const urlData: Array<SitemapItemLoose> = [];
	for (const route of routes) {
		for (const page of route.pages) {
			console.log(page);
			const links: Array<LinkItem> = [];
			if (route.route) {
				// console.dir(route, { depth: null });
				// TODO: logic to get equivalent route in other locales
				const _links = getLinksFromRoute(route);
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
