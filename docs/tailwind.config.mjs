import starlightPlugin from "@astrojs/starlight-tailwind";

const customColors = {
	gray: {
		50: "#EEEFF2",
		100: "#DFE1E7",
		200: "#BFC4CE",
		300: "#9DA3B4",
		400: "#7D869B",
		500: "#616A7F",
		600: "#494F5F",
		700: "#313540",
		800: "#17191E",
		900: "#0B0C0E",
		950: "#070709",
	},
	accent: {
		50: "#FCEDF4",
		100: "#FAE0EC",
		200: "#F5BDD6",
		300: "#F09DC3",
		400: "#EB7AAD",
		500: "#E65B9A",
		600: "#E13884",
		700: "#B61B61",
		800: "#7C1342",
		900: "#3E0921",
		950: "#1F0511",
	},
};

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: {
				accent: customColors.accent,
				gray: customColors.gray,
			},
			fontFamily: {
				sans: ["Inter"],
				mono: ["JetBrains Mono Variable"],
			},
		},
	},
	plugins: [starlightPlugin()],
};
