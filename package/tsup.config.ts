import { defineConfig } from "tsup";
import { peerDependencies } from "./package.json";

export default defineConfig((options) => {
	const dev = !!options.watch;
	return {
		entry: ["src/**/*.(ts|js)"],
		format: ["esm"],
		target: "node18",
		bundle: true,
		dts: true,
		sourcemap: true,
		clean: true,
		splitting: false,
		minify: !dev,
		external: [
			...Object.keys(peerDependencies),
			"virtual:astro-i18n/als",
			"virtual:astro-i18n/internal",
		],
		tsconfig: "tsconfig.json",
	};
});
