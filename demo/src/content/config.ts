import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

const postsCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		author: z.string(),
		defaultLocaleVersion: reference("posts").optional(),
	}),
});

const postsGlobCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/posts" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		author: z.string(),
		defaultLocaleVersion: reference("postsGlob").optional(),
	}),
});

export const collections = {
	posts: postsCollection,
	postsGlob: postsGlobCollection,
};
