import i18n from "@astrolicious/i18n";
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	integrations: [
		// TODO: fix typing error (in AIK?)
		// @ts-ignore
		i18n({
			defaultLocale: "en",
			locales: ["en", "fr"],
			client: {
				data: true
			}
		}),
		tailwind(),
	],
});
