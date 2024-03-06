import { z } from "astro/zod";
import { withLeadingSlash, withoutTrailingSlash } from "ufo";

const routeStringSchema = z.string().regex(/^[a-zA-Z0-9_/[\]-]+$/);
const redirectStatusSchema = z
  .literal(300)
  .or(z.literal(301))
  .or(z.literal(302))
  .or(z.literal(303))
  .or(z.literal(304))
  .or(z.literal(307))
  .or(z.literal(308));

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
    client: z
      .literal(false)
      .or(
        z.object({
          translations: z.boolean().optional().default(false),
          data: z.boolean().optional().default(false),
          paths: z.boolean().optional().default(false),
        })
      )
      .optional()
      .default(false)
      .transform((val) =>
        typeof val === "boolean"
          ? {
              data: val,
              translations: val,
              paths: val,
            }
          : val
      ),
    rootRedirect: z
      .object({
        status: redirectStatusSchema,
        destination: z.string(),
      })
      .optional(),
  })
  .refine(({ locales, defaultLocale }) => locales.includes(defaultLocale), {
    message: "`locales` must include the `defaultLocale`",
    path: ["locales"],
  })
  .refine(
    ({ pages, locales }) =>
      Object.values(pages).every((record) =>
        Object.keys(record).every((locale) => locales.includes(locale))
      ),
    {
      message: "`pages` locale keys must be included in `locales`",
      path: ["pages"],
    }
  )
  .refine(
    ({ strategy, rootRedirect }) => {
      if (strategy === "prefix") {
        return true;
      } else if (strategy === "prefixExceptDefault") {
        return rootRedirect === undefined;
      }
    },
    {
      message: "`rootRedirect` should only be used with `strategy: 'prefix'`",
      path: ["rootRedirect"],
    }
  );

export type Options = z.infer<typeof optionsSchema>;
