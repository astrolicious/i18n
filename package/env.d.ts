/// <reference types="astro/client" />

declare module "virtual:astro-i18n/internal" {
	export const options: import("./src/options.js").Options;
	export const routes: Array<import("./src/types.js").Route>;
	export const i18nextConfig: import("./src/types.js").I18nextConfig;
	export const clientId: string;
}

declare module "virtual:astro-i18n/als" {
	export const als: import("node:async_hooks").AsyncLocalStorage<
		import("./src/types.js").I18nConfig
	>;
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

	type Loose<T> = T | (`/${string}` & {});

	type Strictify<T extends string> = T extends `${infer _}` ? T : never;

	export const getLocalePath: <TPath extends Loose<LocalePath>>(
		path: TPath,
		...args: TPath extends Strictify<LocalePath>
			? LocalePathParams[TPath] extends never
				? [params?: null | undefined, locale?: Locale | undefined]
				: [params: LocalePathParams[TPath], locale?: Locale | undefined]
			: [params?: null | undefined, locale?: Locale | undefined]
	) => string;

	export const switchLocalePath: (locale: Locale) => string;

	export const getSwitcherData: () => Array<{
		locale: string;
		href: string;
	}>;

	export const getLocalePlaceholder: () => Locale;
	export const getLocalesPlaceholder: () => ReturnType<typeof getLocales>;
	export const getDefaultLocalePlaceholder: () => Locale;
}
