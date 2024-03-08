import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
	return new Response("Hello world");
};
