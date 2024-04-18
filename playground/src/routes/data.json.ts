import { getLocale } from "i18n:astro";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
	return Response.json({ locale: getLocale(), foo: "bar" });
};
