import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://astro-i18n.netlify.app",
	integrations: [
		starlight({
			title: "I18n for Astro",
			logo: {
				light: "./src/assets/logo-dark.svg",
				dark: "./src/assets/logo-light.svg",
			},
			customCss: ["./src/style.css"],
			social: {
				github: "https://github.com/astrolicious/i18n",
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
			editLink: {
				baseUrl: "https://github.com/astrolicious/i18n/edit/main/docs/",
			},
			lastUpdated: true,
			expressiveCode: {
				themes: ["one-dark-pro"],
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
						{ label: "Known issues", link: "/getting-started/known-issues/" },
						{ label: "Showcase", link: "/getting-started/showcase/" },
					],
				},
				{
					label: "Usage",
					items: [
						{ label: "Configuration", link: "/usage/configuration/" },
						{ label: "Translations", link: "/usage/translations/" },
						{ label: "Client usage", link: "/usage/client/" },
					],
				},
				{ label: "Demo", link: "/demo/" },
				{
					label: "Recipes",
					autogenerate: {
						directory: "recipes",
					},
				},
				{
					label: "Components",
					autogenerate: {
						directory: "reference/components",
					},
				},
				{
					label: "Utilities",
					autogenerate: {
						directory: "reference/utilities",
					},
				},
				{
					label: "Types",
					link: "/reference/types/",
				},
			],
		}),
		tailwind({ applyBaseStyles: false }),
	],
});
