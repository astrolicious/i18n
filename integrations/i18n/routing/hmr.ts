import type { HookParameters } from "astro";
import { watchIntegration } from "astro-integration-kit/utilities";
import { join } from "path";
import { fileURLToPath } from "url";
import { ROUTES_DIR } from "./index.js";

export const handleRoutesHMR = (
  params: HookParameters<"astro:config:setup">
) => {
  const { config } = params;
  watchIntegration({
    ...params,
    dir: join(fileURLToPath(config.srcDir), ROUTES_DIR),
  });
};
