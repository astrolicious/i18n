import type { EnumChangefreq, LinkItem, SitemapItemLoose } from "sitemap";
import type { SitemapOptions } from "./options.js";
import { parseUrl } from "./parse-url.js";

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(
	pages: string[],
	finalSiteUrl: string,
	opts: SitemapOptions,
) {
	const { changefreq, priority, lastmod: lastmodSrc, internal: { i18n } } = opts;
	// TODO: find way to respect <link rel="canonical"> URLs here
	const urls = [...pages];
	urls.sort((a, b) => a.localeCompare(b, "en", { numeric: true })); // sort alphabetically so sitemap is same each time

	const lastmod = lastmodSrc?.toISOString();

	const { defaultLocale, locales } = i18n;

	const getPath = (url: string) => {
		const result = parseUrl(url, defaultLocale, locales, finalSiteUrl);
		return result?.path;
	};
	const getLocale = (url: string) => {
		const result = parseUrl(url, defaultLocale, locales, finalSiteUrl);
		return result?.locale ?? defaultLocale;
	};

	const urlData = urls.map((url) => {
		let links: Array<LinkItem> = [];
		const currentPath = getPath(url);
		if (currentPath) {
			const filtered = urls.filter((subUrl) => getPath(subUrl) === currentPath);
			if (filtered.length > 1) {
				links = filtered.map((subUrl) => ({
					url: subUrl,
					lang: locales.find((e) => e === getLocale(subUrl)) ?? defaultLocale,
				}));
			}
		}

		const obj: SitemapItemLoose = {
			url,
			links,
			changefreq: changefreq as EnumChangefreq,
		};

		if (lastmod) {
			Object.assign(obj, { lastmod });
		}
		if (priority) {
			Object.assign(obj, { priority });
		}

		return obj;
	});

	return urlData;
}
