import { z } from "astro/zod";
import { EnumChangefreq } from "sitemap";

export const publicOptionsSchema = z.object({
	customPages: z.array(z.string().url()).optional(),
	entryLimit: z.number().min(1).optional().default(45000),
	changefreq: z.nativeEnum(EnumChangefreq).optional(),
	lastmod: z.date().optional(),
	priority: z.number().min(0).max(1).optional(),
});
export const privateOptionsSchema = z.object({
	internal: z.object({
		i18n: z.object({
			defaultLocale: z.string(),
			locales: z.array(z.string()),
		}),
		routes: z.array(
			z.object({
				locale: z.string(),
				params: z.array(z.string()),
				pattern: z.string(),
				injectedRoute: z.object({
					pattern: z.string(),
					entrypoint: z.string(),
					prerender: z.boolean().optional(),
				}),
			}),
		),
	}),
});

export const optionsSchema = publicOptionsSchema.and(privateOptionsSchema);

export type SitemapOptions = z.infer<typeof optionsSchema>;
