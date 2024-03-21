import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import i18n from "@astrolicious/i18n";
import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
	integrations: [
		i18n({
			defaultLocale: "en",
			locales: ["en", "fr", "it"],
			pages: {
				"/about": {
					fr: "/a-propos",
					it: "/chi-siamo",
				},
				"/blog": {
					fr: "/le-blog",
					it: "/blog",
				},
				"/blog/[slug]": {
					fr: "/le-blog/[slug]",
				},
			},
			client: {
				data: true,
				paths: true,
			},
		}),
		tailwind(),
		react(),
	],
	output: "hybrid",
	adapter: netlify({
		imageCDN: false,
	}),
});
