declare module "i18n:astro/sitemap" {
	const sitemap: (args: import("../sitemap/route-config.js").CallbackSchema) => void;

	export default sitemap;
}
