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

declare module "i18n:astro" {
	export type Locale = string;

	// biome-ignore lint/complexity/noBannedTypes: placeholder for development
	export type LocalePathParams = {};

	export type LocalePath = keyof LocalePathParams;
	export const t: typeof import("i18next").t;
	export const getLocale: () => Locale;
	export const getLocales: () => Array<string>;
	export const getDefaultLocale: () => Locale;

	export const getHtmlAttrs: () => {
		lang: string;
		dir: "rtl" | "ltr";
	};

	export const setDynamicParams: (
		params:
			| Partial<Record<Locale | (string & {}), Record<string, string>>>
			| Array<{
					locale: Locale | (string & {});
					params: Record<string, string>;
			  }>,
	) => void;

	export const getLocalePath: <TPath extends LocalePath>(
		path: TPath,
		...params: LocalePathParams[TPath] extends never
			? []
			: [LocalePathParams[TPath]]
	) => string;

	export const switchLocalePath: (locale: Locale) => string;

	export const getSwitcherData: () => Array<{
		locale: string;
		href: string;
	}>;

	export const getLocalePlaceholder: () => Locale;
}
