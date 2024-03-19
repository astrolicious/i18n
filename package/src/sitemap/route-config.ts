import { z } from "astro/zod";
import { optionsSchema } from "./options";

export const callbackSchema = z
	.union([
		z.object({
			optOut: z.literal(true),
		}),
		z
			.object({
				optOut: z.literal(false).optional().default(false),
				dynamicParams: z
					.union([
						z.record(z.record(z.string().optional())),
						z.array(
							z.object({
								locale: z.string(),
								params: z.record(z.string()),
							}),
						),
					])
					.optional(),
			})
			.and(
				optionsSchema
					.pick({
						lastmod: true,
						priority: true,
						changefreq: true,
					})
					.partial(),
			),
	])
	.optional()
	.default({
		optOut: false,
	});

export type CallbackSchema = z.infer<typeof callbackSchema>;
