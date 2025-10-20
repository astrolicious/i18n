import { z } from "astro/zod";
import { publicOptionsSchema } from "./options.js";

export const callbackSchema = z
	.union([
		z.literal(false),
		z
			.object({
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
				publicOptionsSchema
					.pick({
						lastmod: true,
						priority: true,
						changefreq: true,
					})
					.partial(),
			),
	])
	.optional()
	.default({});

export type CallbackSchema = z.infer<typeof callbackSchema>;
