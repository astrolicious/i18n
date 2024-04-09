declare module "i18n:astro/sitemap" {
	const sitemap: (
		args: import("@astrolicious/i18n/internal").CallbackSchema,
	) => void;

	export default sitemap;
}
