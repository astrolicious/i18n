import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { createResolver } from "astro-integration-kit";
import { hmrIntegration } from "astro-integration-kit/dev";
import { defineConfig } from "astro/config";

const { default: i18n } = await import("@astrolicious/i18n");

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	// trailingSlash: "always",
	integrations: [
		i18n({
			strategy: "prefixExceptDefault",
			defaultLocale: "en",
			locales: ["en", "fr"],
			pages: {
				about: {
					fr: "a-propos",
				},
				blog: {
					fr: "le-blog",
				},
				"blog/[slug]": {
					fr: "le-blog/[slug]",
				},
				"blog/[category]/[slug]": {
					fr: "le-blog/[category]/[slug]",
				},
				"news/": {
					fr: "/actualites",
				}
			},
			localesDir: "./src/locales",
			defaultNamespace: "common",
			client: {
				data: true,
				translations: true,
				paths: true,
			},
			sitemap: true,
			// rootRedirect: {
			//   status: 301,
			//   destination: "/en",
			// },
		}),
		react(),
		tailwind(),
		hmrIntegration({
			directory: createResolver(import.meta.url).resolve("../package/dist"),
		}),
	],
	output: "hybrid",
	adapter: node({
		mode: "standalone",
	}),
});
