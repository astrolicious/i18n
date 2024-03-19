declare module "i18n:astro/sitemap" {
	const sitemap: (args: import("./route-config.js").CallbackSchema) => void;

	export default sitemap;
}
