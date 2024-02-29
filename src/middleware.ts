import { defineMiddleware } from "astro:middleware";
// import { useI18n, locales } from "i18n:astro/server";

export const onRequest = defineMiddleware((context, next) => {
  // const { locale, switchLocalePath } = useI18n(context);
  // console.log(`Locale from middleware: ${locale}`);
  // console.log({ locales })
  // console.log({
  //   en: switchLocalePath("en"),
  //   fr: switchLocalePath("fr"),
  // });

  next();
});
