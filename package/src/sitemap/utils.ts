import type { RouteData } from "astro";
import { AstroError } from "astro/errors";
import type { ZodError } from "astro/zod";

const STATUS_CODE_PAGES = new Set(["404", "500"]);

export const isStatusCodePage = (_pathname: string): boolean => {
	let pathname = _pathname;
	if (pathname.endsWith("/")) {
		pathname = pathname.slice(0, -1);
	}
	const end = pathname.split("/").pop() ?? "";
	return STATUS_CODE_PAGES.has(end);
};

export const formatConfigErrorMessage = (err: ZodError) => {
	const errorList = err.issues.map(
		(issue) => ` ${issue.path.join(".")}  ${`${issue.message}.`}`,
	);
	return errorList.join("\n");
};

export const createImpossibleError = (message: string) =>
	new AstroError(
		message,
		"Please open an issue on GitHub at https://github.com/astrolicious/i18n/issues",
	);

export const getPathnameFromRouteData = ({ segments }: RouteData) => {
	const pathname = segments
		.map((segment) => {
			return segment
				.map((rp) => (rp.dynamic ? `[${rp.content}]` : rp.content))
				.join("");
		})
		.join("/");

	return `/${pathname}`;
};
