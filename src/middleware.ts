import { defineMiddleware } from "astro:middleware";
import { useI18n } from "i18n:astro/server";

export const onRequest = defineMiddleware((context, next) => {
  const { locale } = useI18n(context);
  console.log(`Locale from middleware: ${locale}`);

  next();
});
