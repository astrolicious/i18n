import { defineCollection } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";

export const collections = {
	docs: defineCollection({
		schema: docsSchema({
			extend: z.object({
				// Add a default value to the built-in `banner` field.
				banner: z.object({ content: z.string() }).default({
					content: "This integration is unmaintained due to lack of time. It should mostly work but do not expect fixes or new features.",
				}),
			}),
		}),
	}),
};
