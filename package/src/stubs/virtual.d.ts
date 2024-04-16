declare module "@@_ID_@@" {
	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export type Locale = "@@_LOCALE_@@";

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export type LocalePathParams = "@@_LOCALE_PATH_PARAMS_@@";

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export type LocalePath = keyof LocalePathParams;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const t: typeof import("i18next").t;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getLocale: () => Locale;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getLocales: () => "@@_LOCALES_@@";

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getDefaultLocale: () => Locale;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getHtmlAttrs: () => {
		lang: string;
		dir: "rtl" | "ltr";
	};

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const setDynamicParams: (
		params:
			| Partial<Record<Locale | (string & {}), Record<string, string>>>
			| Array<{
					locale: Locale | (string & {});
					params: Record<string, string>;
			  }>,
	) => void;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getLocalePath: <TPath extends LocalePath>(
		path: TPath,
		...params: LocalePathParams[TPath] extends never
			? []
			: [LocalePathParams[TPath]]
	) => string;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const switchLocalePath: (locale: Locale) => string;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getSwitcherData: () => Array<{
		locale: string;
		href: string;
	}>;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getLocalePlaceholder: () => Locale;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getLocalesPlaceholder: () => ReturnType<typeof getLocales>;

	/**
	 * @description TODO:
	 * @link TODO:
	 */
	export const getDefaultLocalePlaceholder: () => Locale;
}
