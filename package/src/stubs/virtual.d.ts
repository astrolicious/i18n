declare module "@@_ID_@@" {
	export type Locale = "@@_LOCALE_@@";

	export type LocalePathParams = "@@_LOCALE_PATH_PARAMS_@@";

	export type LocalePath = keyof LocalePathParams;
	export const t: typeof import("i18next").t;
	export const getLocale: () => Locale;
	export const getLocales: () => "@@_LOCALES_@@";

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
