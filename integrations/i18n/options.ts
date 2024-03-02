import { z } from "astro/zod";
import { withLeadingSlash, withoutTrailingSlash } from "ufo";

const routeStringSchema = z.string().regex(/^[a-zA-Z0-9_/[\]-]+$/);

export const optionsSchema = z
  .object({
    strategy: z
      .enum(["prefix", "prefixExceptDefault"])
      .optional()
      .default("prefixExceptDefault"),
    defaultLocale: z.string(),
    locales: z.array(z.string()),
    pages: z
      .record(
        routeStringSchema,
        z.record(z.string(), routeStringSchema.optional())
      )
      .optional()
      .default({})
      .transform((val) =>
        Object.fromEntries(
          Object.entries(val).map(([key, value]) => [
            withLeadingSlash(withoutTrailingSlash(key)),
            value,
          ])
        )
      ),
    localesDir: z.string().optional().default("./src/locales"),
    defaultNamespace: z.string().optional().default("common"),
    client: z.boolean().optional().default(false),
    rootRedirect: z
      .object({
        status: z.number(),
        path: z.string(),
      })
      .optional(),
  })
  .refine((val) => val.locales.includes(val.defaultLocale), {
    message: "`locales` must include the `defaultLocale`",
    path: ["locales"],
  })
  .refine(
    (val) =>
      Object.values(val.pages).every((record) =>
        Object.keys(record).every((locale) => val.locales.includes(locale))
      ),
    {
      message: "`pages` locale keys must be included in `locales`",
      path: ["pages"],
    }
  );

export type Options = z.infer<typeof optionsSchema>;
