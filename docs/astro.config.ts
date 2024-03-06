import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://astro-i18n.netlify.app",
	integrations: [
		starlight({
			title: "astro-i18n",
			logo: {
				src: "./src/assets/houston-omg.svg",
			},
			customCss: ["./src/style.css"],
			social: {
				github: "https://github.com/astrolicious/astro-i18n",
				discord: "https://astro.build/chat",
			},
			head: [
				{
					tag: "link",
					attrs: {
						rel: "preconnect",
						href: "https://rsms.me/",
					},
				},
				{
					tag: "link",
					attrs: {
						rel: "stylesheet",
						href: "https://rsms.me/inter/inter.css",
					},
				},
			],
			expressiveCode: {
				themes: ["one-dark-pro", "starlight-light"],
			},
			sidebar: [
				{
					label: "Home",
					link: "/",
				},
				{
					label: "Guides",
					items: [
						// Each item here is one entry in the navigation menu.
						{
							label: "Example Guide",
							link: "/guides/example/",
						},
					],
				},
				{
					label: "Reference",
					autogenerate: {
						directory: "reference",
					},
				},
			],
		}),
		tailwind({ applyBaseStyles: false }),
	],
});
