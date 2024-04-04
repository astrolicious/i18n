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
