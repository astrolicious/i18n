import type { HookParameters } from "astro";
import { addDts } from "astro-integration-kit/utilities";
import type { Options } from "../options.js";
import type { getNamespaces } from "./namespaces.js";
import { normalizePath } from "vite";
import { join, relative } from "path";
import { fileURLToPath } from "url";

export const injectTypes = (
  { logger, config: { root, srcDir } }: HookParameters<"astro:config:setup">,
  { defaultNamespace }: Options,
  importsData: ReturnType<typeof getNamespaces>["importsData"],
  defaultLocalesDir: string
) => {
  const relativeLocalesPrefix =
    normalizePath(
      relative(fileURLToPath(new URL("./.astro/", root)), defaultLocalesDir)
    ) + "/";

  const content = `
    declare module "i18next" {
      interface CustomTypeOptions {
        defaultNS: "${defaultNamespace}";
        resources: {
          ${importsData
            .map(
              ({ namespaceName, fileName }) =>
                `"${namespaceName}": typeof import("${normalizePath(
                  join(relativeLocalesPrefix, fileName)
                )}");`
            )
            .join("\n")}
        }
      }
    }
    export {}
    `;

  addDts({ logger, root, srcDir, name: "i18next", content });
};
