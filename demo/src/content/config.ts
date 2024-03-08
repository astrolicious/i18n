import { defineCollection, reference, z } from "astro:content";

export const collections = {
	posts: defineCollection({
		type: "content",
		schema: z.object({
			title: z.string(),
			defaultLocaleVersion: reference("posts").optional(),
		}),
	}),
};
