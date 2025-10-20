/**
 * @returns {import("../../src/types.ts").I18nConfig}
 */
const _getConfig = () => "@@_CONFIG_@@";
/**
 * @returns {import("i18next").i18n}
 */
const _getI18next = () => "@@_I18NEXT_@@";

/**
 *
 * @param {string} name
 * @param {{ serverOnly: boolean; clientFeatures: Array<"data" | "translations" | "paths"> }} param0
 */
const _envCheck = (name, { serverOnly = false, clientFeatures = [] } = {}) => {
	if (serverOnly && !import.meta.env.SSR) {
		throw new Error(`\`${name}\` is only available on the server`);
	}
	if (clientFeatures.length > 0 && !import.meta.env.SSR) {
		const config = _getConfig();
		if (!config) {
			throw new Error(
				`\`${name}\` on the client requires using the \`<I18nClient />\` component`,
			);
		}

		for (const feature of Object.keys(config.clientOptions)) {
			if (clientFeatures.includes(feature) && !config[feature]) {
				throw new Error(
					`\`${name}\` on the client requires setting \`client: { ${feature}: true }\` in the integration config`,
				);
			}
		}
	}
};

/**
 *
 * @param {string} locale
 */
const _dir = (locale) => {
	const rtlLocales = [
		"ar",
		"shu",
		"sqr",
		"ssh",
		"xaa",
		"yhd",
		"yud",
		"aao",
		"abh",
		"abv",
		"acm",
		"acq",
		"acw",
		"acx",
		"acy",
		"adf",
		"ads",
		"aeb",
		"aec",
		"afb",
		"ajp",
		"apc",
		"apd",
		"arb",
		"arq",
		"ars",
		"ary",
		"arz",
		"auz",
		"avl",
		"ayh",
		"ayl",
		"ayn",
		"ayp",
		"bbz",
		"pga",
		"he",
		"iw",
		"ps",
		"pbt",
		"pbu",
		"pst",
		"prp",
		"prd",
		"ug",
		"ur",
		"ydd",
		"yds",
		"yih",
		"ji",
		"yi",
		"hbo",
		"men",
		"xmn",
		"fa",
		"jpr",
		"peo",
		"pes",
		"prs",
		"dv",
		"sam",
		"ckb",
	];

	return rtlLocales.includes(locale) ? "rtl" : "ltr";
};

/**
 * @param {string} path
 */
const _withoutTrailingSlash = (path) =>
	path.endsWith("/") ? path.slice(0, -1) : path;

export const t = (...args) => {
	_envCheck("t", { clientFeatures: ["data", "translations"] });
	const config = _getConfig();
	const i18next = _getI18next();

	if (!config.translations.initialized) {
		i18next.init({
			lng: config.data.locale,
			defaultNS: config.translations.i18nextConfig.defaultNamespace,
			ns: config.translations.i18nextConfig.namespaces,
			resources: config.translations.i18nextConfig.resources,
		});
		config.translations.initialized = true;
	}
	return i18next.t(...args);
};

export const getLocale = () => {
	_envCheck("getLocale", { clientFeatures: ["data"] });
	return _getConfig().data.locale;
};

export const getLocales = () => {
	_envCheck("getLocales", { clientFeatures: ["data"] });
	return _getConfig().data.locales;
};

export const getDefaultLocale = () => {
	_envCheck("getDefaultLocale", { clientFeatures: ["data"] });
	return _getConfig().data.defaultLocale;
};

export const getHtmlAttrs = () => {
	_envCheck("getHtmlAttrs", { clientFeatures: ["data"] });
	return {
		lang: getLocale(),
		dir: _dir(getLocale()),
	};
};

/**
 *
 * @param {Record<string, Record<string, string>> | Array<{ locale: string; params: Record<string | string> }>} _params
 */
export const setDynamicParams = (_params) => {
	_envCheck("setDynamicParams", { serverOnly: true });
	const config = _getConfig();

	const params = Array.isArray(_params)
		? _params.reduce((obj, e) => {
				obj[e.locale] = {
					...(obj[e.locale] ?? {}),
					...e.params,
				};
				return obj;
			}, {})
		: _params;

	config.paths.dynamicParams = {
		...config.paths.dynamicParams,
		...params,
	};
};

/**
 *
 * @param {string} path
 * @param {Record<string, string | undefined>} params
 * @param {string} _locale
 */
export const getLocalePath = (path, params = {}, _locale = getLocale()) => {
	_envCheck("getLocalePath", { clientFeatures: ["data", "paths"] });
	const config = _getConfig();

	const route = config.paths.routes.find(
		(route) => route.locale === _locale && route.pattern === path,
	);
	if (!route) {
		const prefix =
			config.paths.strategy === "prefix"
				? `/${_locale}`
				: _locale === config.data.defaultLocale
					? ""
					: `/${_locale}`;
		return `${prefix}${path}`;
	}

	let newPath = route.injectedRoute.pattern;
	for (const param of route.params) {
		const value = params[param];
		if (!value) {
			throw new Error(`Must provide "${param}" param`);
		}
		newPath = newPath.replace(`[${param}]`, value);
	}

	return newPath;
};

/**
 *
 * @param {string} locale
 */
export const switchLocalePath = (locale) => {
	_envCheck("switchLocalePath", { clientFeatures: ["data", "paths"] });
	const config = _getConfig();

	const currentLocaleRoutes = config.paths.routes.filter(
		(route) => route.locale === getLocale(),
	);

	// Static
	let currentLocaleRoute = currentLocaleRoutes
		.filter((route) => route.params.length === 0)
		.find(
			(route) =>
				route.injectedRoute.pattern ===
				_withoutTrailingSlash(config.paths.pathname),
		);

	// Dynamic
	if (!currentLocaleRoute) {
		currentLocaleRoute = currentLocaleRoutes
			.filter((route) => route.params.length > 0)
			.find((route) => {
				// Convert the route pattern to a regex pattern

				// Replace all dynamic params with the ".*" regex pattern
				let pattern = route.injectedRoute.pattern.replace(/[*.]/g, "\\$&");
				pattern = Object.keys(
					config.paths.dynamicParams?.[locale] ?? {},
				).reduce((acc, key) => acc.replace(`[${key}]`, ".*"), pattern);

				// Escape all special characters
				pattern = pattern.replace(/[-[\]{}()+?,\\^$|#\s]/g, "\\$&");

				return new RegExp(`^${pattern}$`).test(
					_withoutTrailingSlash(config.paths.pathname),
				);
			});
	}

	// Fallback
	if (!currentLocaleRoute) {
		currentLocaleRoute = currentLocaleRoutes.sort(
			(a, b) => a.pattern.length - b.pattern.length,
		)[0];
	}

	const route = config.paths.routes.find(
		(route) =>
			route.locale === locale && currentLocaleRoute.pattern === route.pattern,
	);
	if (!route) {
		throw new Error("Couldn't find a route. Open an issue");
	}

	return getLocalePath(
		route.pattern,
		config.paths.dynamicParams?.[locale] ?? undefined,
		locale,
	);
};

export const getSwitcherData = () => {
	_envCheck("getSwitcherData", { clientFeatures: ["data", "paths"] });
	return getLocales().map((locale) => ({
		locale,
		href: switchLocalePath(locale),
	}));
};

export const getLocalePlaceholder = () => {
	throw new Error(
		"`getLocalePlaceholder` should only be called within `getStaticPaths`",
	);
};

export const getLocalesPlaceholder = () => {
	throw new Error(
		"`getLocalesPlaceholder` should only be called within `getStaticPaths`",
	);
};

export const getDefaultLocalePlaceholder = () => {
	throw new Error(
		"`getDefaultLocalePlaceholder` should only be called within `getStaticPaths`",
	);
};
