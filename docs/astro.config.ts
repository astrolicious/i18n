import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

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
				plugins: [pluginLineNumbers()],
				defaultProps: {
					overridesByLang: {
						bash: {
							showLineNumbers: false,
						},
					},
				},
			},
			sidebar: [
				{
					label: "Home",
					link: "/",
				},
				{
					label: "Getting started",
					items: [
						{ label: "Installation", link: "/getting-started/installation/" },
						{ label: "Usage", link: "/getting-started/usage/" },
						{ label: "Limitations", link: "/getting-started/limitations/" },
						{ label: "Showcase", link: "/getting-started/showcase/" },
					],
				},
				{
					label: "Usage",
					items: [
						{ label: "Configuration", link: "/usage/configuration/" },
						{ label: "Client usage", link: "/usage/client/" },
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
