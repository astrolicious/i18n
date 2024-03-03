import type { HookParameters } from "astro";
import type { Options } from "../options.js";
import { normalizePath } from "vite";
import { basename, extname, join } from "path";
import { existsSync, readFileSync, readdirSync } from "fs";

export const getResources = (
  { logger }: HookParameters<"astro:config:setup">,
  { locales }: Options,
  localesDir: string
) => {
  const resources: Record<string, Record<string, any>> = {};

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
        resources[locale][basename(fileName, extname(fileName))] = content;
      } catch (err) {
        logger.warn(`Can't parse "${path}", skipping.`);
      }
    }
  }
  return resources;
};
