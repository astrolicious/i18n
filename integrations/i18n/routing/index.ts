import { handleRoutesHMR } from "./hmr.js";
import type { HookParameters } from "astro";

export const handleRouting =
  (params: HookParameters<"astro:config:setup">) => () => {
    const {} = params;

    handleRoutesHMR(params);
  };
