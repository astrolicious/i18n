import { z } from "astro/zod";
import { EnumChangefreq } from "sitemap";

export const optionsSchema = z.object({
	customPages: z.array(z.string().url()).optional(),
	entryLimit: z.number().min(1).optional().default(45000),
	changefreq: z.nativeEnum(EnumChangefreq).optional(),
	lastmod: z.date().optional(),
	priority: z.number().min(0).max(1).optional(),
	i18n: z.object({
		defaultLocale: z.string(),
		locales: z.array(z.string()),
	}),
});

export type SitemapOptions = z.infer<typeof optionsSchema>;
