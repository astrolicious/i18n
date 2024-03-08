import i18n from "@astrolicious/i18n";
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	integrations: [
		// TODO: fix typing error (in AIK?)
		// @ts-ignore
		i18n({
			defaultLocale: "en",
			locales: ["en", "fr"],
			pages: {
				'/about': {
					fr: '/a-propos'
				},
				'/blog': {
					fr: '/le-blog'
				},
				'/blog/[slug]': {
					fr: '/le-blog/[slug]'
				}
			},
			client: {
				data: true,
			},
		}),
		tailwind(),
		react(),
	],
});