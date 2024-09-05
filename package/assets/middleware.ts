import { als } from "virtual:astro-i18n/als";
import { i18nextConfig, options, routes } from "virtual:astro-i18n/internal";
import { defineMiddleware } from "astro/middleware";

const extractLocaleFromUrl = (pathname: string) => {
	for (const locale of options.locales) {
		if (options.strategy === "prefix") {
			if (pathname.startsWith(`/${locale}/`)) {
				return locale;
			}
		} else if (options.strategy === "prefixExceptDefault") {
			if (
				locale !== options.defaultLocale &&
				pathname.startsWith(`/${locale}`)
			) {
				return locale;
			}
		}
	}
	return options.defaultLocale;
};

export const onRequest = defineMiddleware((context, next) => {
	const pathname = context.url.pathname;
	const locale = extractLocaleFromUrl(pathname);

	return als.run(
		{
			clientOptions: options.client,
			translations: {
				initialized: false,
				i18nextConfig,
			},
			data: {
				locale,
				locales: options.locales,
				defaultLocale: options.defaultLocale,
			},
			paths: {
				pathname,
				routes,
				dynamicParams: {},
				strategy: options.strategy,
			},
		},
		next,
	);
});
