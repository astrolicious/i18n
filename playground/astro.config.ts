import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import i18n from "@astrolicious/i18n";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [
		i18n({
			strategy: "prefixExceptDefault",
			defaultLocale: "en",
			locales: ["en", "fr"],
			pages: {
				about: {
					fr: "a-propos",
				},
				"blog/[slug]": {
					fr: "le-blog/[slug]",
				},
				"blog/[category]/[slug]": {
					fr: "le-blog/[category]/[slug]",
				},
			},
			localesDir: "./src/locales",
			defaultNamespace: "common",
			client: {
				data: true,
				translations: true,
				paths: true,
			},
			sitemap: {}
			// rootRedirect: {
			//   status: 301,
			//   destination: "/en",
			// },
		}),
		react(),
		tailwind(),
	],
	output: "hybrid",
	adapter: node({
		mode: "standalone",
	}),
});
