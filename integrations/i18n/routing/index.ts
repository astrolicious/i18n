import { handleRoutesHMR } from "./hmr.js";
import type { HookParameters, InjectedRoute } from "astro";
import type { Options } from "../options.js";
import { registerRoutes } from "./register.js";

// TODO: update properties names
export type Route = {
  locale: string;
  originalPattern: string;
  staticPattern: string;
  originalEntrypoint: string;
  injectedRoute: InjectedRoute;
};

export const ROUTES_DIR = "routes";

export const handleRouting =
  (params: HookParameters<"astro:config:setup">) => (options: Options) => {
    const {} = params;

    handleRoutesHMR(params);
    const { routes } = registerRoutes(params)(options);

    return { routes };
  };
