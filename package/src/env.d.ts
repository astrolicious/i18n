/// <reference types="astro/client" />

declare module "virtual:astro-i18n/internal" {
	export const options: import("./options.js").Options;
	export const routes: Array<import("./types.js").Route>;
	export const i18nextConfig: import("./types.js").I18nextConfig;
}

declare module "virtual:astro-i18n/als" {
	export const als: import("node:async_hooks").AsyncLocalStorage<
		import("./types.js").I18nConfig
	>;
}

interface Window {
	__INTERNAL_ASTRO_I18N_CONFIG__: import("./types.js").I18nConfig;
}
