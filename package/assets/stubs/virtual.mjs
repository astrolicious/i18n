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

	// First try direct match
	let route = config.paths.routes.find(
		(route) => route.locale === _locale && route.pattern === path,
	);
	
	// If no direct match and path doesn't contain dynamic segments, 
	// try to find child routes (for parent route lookups)
	if (!route && !path.includes('[')) {
		const potentialRoutes = config.paths.routes.filter(
			(route) => route.locale === _locale && route.pattern.startsWith(path + "/") && route.pattern.includes('[')
		);
		
		// Pick the shortest matching route (most specific parent)
		if (potentialRoutes.length > 0) {
			route = potentialRoutes.sort((a, b) => a.pattern.length - b.pattern.length)[0];
			const routeSegments = route.injectedRoute.pattern.split('/');
			const pathSegments = path.split('/');
			
			// Take only the non-dynamic part of the route
			let basePath = '';
			for (let i = 0; i < routeSegments.length; i++) {
				if (routeSegments[i].includes('[')) break;
				if (i === 0 && routeSegments[i] === '') continue;
				basePath += '/' + routeSegments[i];
			}
			
			return basePath || '/';
		}
	}
	
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
	
	// Check if this is a rest route by looking at the pattern
	const isRestRoute = route.injectedRoute.pattern.includes('[...');
	
	if (isRestRoute) {
		// Find which parameters are rest parameters by checking the pattern
		const patternSegments = route.injectedRoute.pattern.split('/');
		const restSegments = patternSegments.filter(seg => seg.includes('[...'));
		
		// If any rest parameter is missing, return just the base path
		const missingRestParams = restSegments.some(segment => {
			const paramName = segment.replace('[...', '').replace(']', '');
			return !params[paramName];
		});
		
		if (missingRestParams) {
			// Extract base path (everything before the rest parameter)
			const routeSegments = newPath.split('/');
			let basePath = '';
			for (let i = 0; i < routeSegments.length; i++) {
				if (routeSegments[i].includes('[')) break;
				if (i === 0 && routeSegments[i] === '') continue;
				basePath += '/' + routeSegments[i];
			}
			return basePath || '/';
		}
	}
	
	for (const param of route.params) {
		const value = params[param];
		if (!value) {
			throw new Error(`Must provide "${param}" param`);
		}
		
		// Check if this parameter appears as a rest parameter in the pattern
		const isRestParam = route.injectedRoute.pattern.includes(`[...${param}]`);
		const paramPattern = isRestParam ? `[...${param}]` : `[${param}]`;
		
		newPath = newPath.replace(paramPattern, value);
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
	const currentPathname = _withoutTrailingSlash(config.paths.pathname);

	const currentLocaleRoutes = config.paths.routes.filter(
		(route) => route.locale === getLocale(),
	);

	// Static routes - direct match
	let currentLocaleRoute = currentLocaleRoutes
		.filter((route) => route.params.length === 0)
		.find(
			(route) =>
				route.injectedRoute.pattern === currentPathname,
		);

	// Extract current parameters from URL for paginated routes
	let currentParams = {};
	
	// Static routes - parent route match (for rest parameters)
	if (!currentLocaleRoute) {
		currentLocaleRoute = currentLocaleRoutes
			.filter((route) => route.params.length > 0)
			.find((route) => {
				// Extract the base part of the injected route (before dynamic segments)
				const routeSegments = route.injectedRoute.pattern.split('/');
				let basePath = '';
				for (let i = 0; i < routeSegments.length; i++) {
					if (routeSegments[i].includes('[')) break;
					if (i === 0 && routeSegments[i] === '') continue;
					basePath += '/' + routeSegments[i];
				}
				
				// Check for exact match first (for non-paginated routes)
				if (basePath === currentPathname) {
					return true;
				}
				
				// If this matches the base path, extract parameters from current URL (only for paginated routes)
				if (currentPathname.startsWith(basePath + '/')) {
					// Extract rest parameter from URL
					const remainingPath = currentPathname.substring(basePath.length);
					if (remainingPath) {
						// Find rest parameter name from route pattern
						const restSegment = routeSegments.find(seg => seg.includes('[...'));
						if (restSegment) {
							const paramName = restSegment.replace('[...', '').replace(']', '');
							currentParams[paramName] = remainingPath.startsWith('/') ? remainingPath.substring(1) : remainingPath;
						}
					}
					return true;
				}
				
				return false;
			});
	}

	// Dynamic routes - regex matching
	if (!currentLocaleRoute) {
		currentLocaleRoute = currentLocaleRoutes
			.filter((route) => route.params.length > 0)
			.find((route) => {
				// Convert the route pattern to a regex pattern
				let pattern = route.injectedRoute.pattern.replace(/[*.]/g, "\\$&");
				pattern = Object.keys(
					config.paths.dynamicParams?.[locale] ?? {},
				).reduce((acc, key) => acc.replace(`[${key}]`, ".*"), pattern);

				// Escape all special characters
				pattern = pattern.replace(/[-[\]{}()+?,\\^$|#\s]/g, "\\$&");

				return new RegExp(`^${pattern}$`).test(currentPathname);
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

	// Map parameters between locales
	const allDynamicParams = config.paths.dynamicParams ?? {};
	const mergedParams = { ...currentParams };
	
	// For each parameter, try to find mapping across locales
	for (const [paramName, currentValue] of Object.entries(currentParams)) {
		let mappedValue = currentValue; // fallback
		
		// Search all locales to find where this value exists
		for (const [searchLocale, localeParams] of Object.entries(allDynamicParams)) {
			// Find key where this value exists
			const foundKey = Object.keys(localeParams).find(key => localeParams[key] === currentValue);
			if (foundKey) {
				// Found the key, now get value for target locale
				if (allDynamicParams[locale]?.[foundKey]) {
					mappedValue = allDynamicParams[locale][foundKey];
					break;
				}
			}
		}
		
		mergedParams[paramName] = mappedValue;
	}
	
	// Add any additional params from target locale
	Object.assign(mergedParams, allDynamicParams[locale] ?? {});

	// Check if we have all required parameters before calling getLocalePath
	const missingParams = route.params.filter(param => !mergedParams[param]);
	if (missingParams.length > 0) {
		// Return base path for dynamic routes with missing params
		const routeSegments = route.injectedRoute.pattern.split('/');
		let basePath = '';
		for (let i = 0; i < routeSegments.length; i++) {
			if (routeSegments[i].includes('[')) break;
			if (i === 0 && routeSegments[i] === '') continue;
			basePath += '/' + routeSegments[i];
		}
		return basePath || '/';
	}

	return getLocalePath(
		route.pattern,
		mergedParams,
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
