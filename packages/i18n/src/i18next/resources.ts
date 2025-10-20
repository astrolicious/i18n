import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import type { AstroIntegrationLogger } from "astro";
import { normalizePath } from "vite";
import type { Options } from "../options.js";
import type { I18nextConfig } from "../types.js";

export const getResources = (
	logger: AstroIntegrationLogger,
	{ locales }: Options,
	localesDir: string,
) => {
	const resources: I18nextConfig["resources"] = {};

	const localesDirs = locales
		.map((locale) => ({
			locale,
			dir: normalizePath(join(localesDir, locale)),
		}))
		.filter((e) => existsSync(e.dir));

	for (const { locale, dir } of localesDirs) {
		const filenames = readdirSync(dir).filter((f) => f.endsWith(".json"));

		for (const fileName of filenames) {
			const path = normalizePath(join(dir, fileName));
			try {
				const content = JSON.parse(readFileSync(path, "utf-8"));

				resources[locale] ??= {};
				// biome-ignore lint/style/noNonNullAssertion: fallback is set above
				resources[locale]![basename(fileName, extname(fileName))] = content;
			} catch {
				logger.warn(`Can't parse "${path}", skipping.`);
			}
		}
	}

	logger.info(
		`${Object.keys(Object.values(resources)).length} resources registered`,
	);
	return resources;
};
