import { z } from "astro/zod";
import { withLeadingSlash, withoutTrailingSlash } from "ufo";

const routeStringSchema = z.string().regex(/^[a-zA-Z0-9_/[\]-]+$/);
const redirectStatusSchema = z
	.literal(300)
	.or(z.literal(301))
	.or(z.literal(302))
	.or(z.literal(303))
	.or(z.literal(304))
	.or(z.literal(307))
	.or(z.literal(308));

export const optionsSchema = z
	.object({
		/**
		 * @description Sets the default locale for your website.
		 * @link https://astro-i18n.netlify.app/usage/configuration/#defaultlocale-required
		 */
		defaultLocale: z.string(),
		/**
		 * @description Sets the available locales for your website. Must include the default locale.
		 * @link https://astro-i18n.netlify.app/usage/configuration/#locales-required
		 */
		locales: z.array(z.string()),
		/**
		 * @description Defines how your routes are generated:
		 *
		 * - `"prefixWithoutDefault"` will not add a prefix for your default locale		 *
		 * - `"prefix"` will add a prefix for your default locale.
		 *
		 * @default `"prefixWithoutDefault"`
		 * @link https://astro-i18n.netlify.app/usage/configuration/#strategy
		 */
		strategy: z
			.enum(["prefix", "prefixExceptDefault"])
			.optional()
			.default("prefixExceptDefault"),
		/**
		 * @description Allows you to define translated paths for your locales.
		 * @link https://astro-i18n.netlify.app/usage/configuration/#pages
		 */
		pages: z
			.record(
				routeStringSchema,
				z.record(z.string(), routeStringSchema.optional()),
			)
			.optional()
			.default({})
			.transform((val) =>
				Object.fromEntries(
					Object.entries(val).map(([key, value]) => [
						withLeadingSlash(withoutTrailingSlash(key)),
						value,
					]),
				),
			),
		/**
		 * @description A path relative to the root where locales files are located for translations features.
		 * @default `"./src/locales"`
		 * @link https://astro-i18n.netlify.app/usage/configuration/#localesdir
		 */
		localesDir: z
			.string()
			.optional()
			.default("./src/locales")
			.refine((val) => val.startsWith("./") || val.startsWith("../"), {
				message: "Must be a relative path (ie. start with `./` or `../`)",
			}),
		/**
		 * @description Sets the default namespace for locales. Since `astro-i18n` uses `i18next` under the hood,
		 * it allows to split translations data in multiple json files under `src/locales/[locale]/`. If you're not
		 * using a file called `common.json`, you need to update this property to have proper types completions
		 * when using `t`.
		 *
		 * @default `"common"`
		 * @link https://astro-i18n.netlify.app/usage/configuration/#defaultnamespace
		 */
		defaultNamespace: z.string().optional().default("common"),
		/**
		 * @description Client usage is disabled by default because it sends some JavaScript to the browser. Enabling
		 * any of the following features requires importing the `<I18nClient/>` component.
		 *
		 * - `t`: `data`, `translations`
		 * - `getLocale`: `data`
		 * - `getLocales`: `data`
		 * - `getDefaultLocale`: `data`
		 * - `getHtmlAttrs`: `data`
		 * - `setDynamicParams`: N/A, server only
		 * - `getLocalePath`: `data`, `paths`
		 * - `switchLocalePath`: `data`, `paths`
		 * - `getSwitcherData`: `data`, `paths`
		 * - `getLocalePlaceholder`: N/A, `getStaticPaths` only
		 *
		 * @default `false`
		 * @link https://astro-i18n.netlify.app/usage/configuration/#client
		 */
		client: z
			.literal(false)
			.or(
				z.object({
					/**
					 * @description Allows using `t` on the client.
					 * @default `false`
					 * @link https://astro-i18n.netlify.app/usage/configuration/#client
					 */
					translations: z.boolean().optional().default(false),
					/**
					 * @description Allows using `t`, `getLocale`, `getLocales`, `getHtmlAttrs`, `getLocalePath`,
					 * `switchLocalePath` and `getSwitcherData` on the client.
					 *
					 * @default `false`
					 * @link https://astro-i18n.netlify.app/usage/configuration/#client
					 */
					data: z.boolean().optional().default(false),
					/**
					 * @description Allows using `getLocalePath`, `switchLocalePath` and `getSwitcherData` on the client.
					 * @default `false`
					 * @link https://astro-i18n.netlify.app/usage/configuration/#client
					 */
					paths: z.boolean().optional().default(false),
				}),
			)
			.optional()
			.default(false)
			.transform((val) =>
				typeof val === "boolean"
					? {
							data: val,
							translations: val,
							paths: val,
					  }
					: val,
			),
		/**
		 * @description When using `strategy: "prefix"`, you may want to redirect your users from the root to a specific
		 * page (likely the default locale root). This option allows you to do so.
		 * @link https://astro-i18n.netlify.app/usage/configuration/#rootredirect
		 */
		rootRedirect: z
			.object({
				status: redirectStatusSchema,
				destination: z.string(),
			})
			.optional(),
	})
	.refine(({ locales, defaultLocale }) => locales.includes(defaultLocale), {
		message: "`locales` must include the `defaultLocale`",
		path: ["locales"],
	})
	.refine(
		({ pages, locales }) =>
			Object.values(pages).every((record) =>
				Object.keys(record).every((locale) => locales.includes(locale)),
			),
		{
			message: "`pages` locale keys must be included in `locales`",
			path: ["pages"],
		},
	)
	.refine(
		({ strategy, rootRedirect }) => {
			if (strategy === "prefix") {
				return true;
			}
			return rootRedirect === undefined;
		},
		{
			message: "`rootRedirect` should only be used with `strategy: 'prefix'`",
			path: ["rootRedirect"],
		},
	);

export type Options = z.infer<typeof optionsSchema>;
