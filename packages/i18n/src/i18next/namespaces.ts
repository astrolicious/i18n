import { existsSync, readdirSync } from "node:fs";
import { basename, extname } from "node:path";
import type { AstroIntegrationLogger } from "astro";

export const getNamespaces = (
	defaultLocalesDir: string,
	defaultNamespace: string,
	logger: AstroIntegrationLogger,
) => {
	const importsData: Array<{
		namespaceName: string;
		fileName: string;
	}> = [];

	if (existsSync(defaultLocalesDir)) {
		const filenames = readdirSync(defaultLocalesDir).filter((f) =>
			f.endsWith(".json"),
		);
		for (const fileName of filenames) {
			importsData.push({
				namespaceName: basename(fileName, extname(fileName)),
				fileName,
			});
		}
	}

	const namespaces = importsData.map((e) => e.namespaceName);
	logger.info(
		`Detected namespaces: ${namespaces.map((ns) => `"${ns}"`).join(",")}`,
	);
	if (!namespaces.includes(defaultNamespace)) {
		logger.warn(`Default namespace "${defaultNamespace}" is not detected`);
	}

	return {
		namespaces,
	};
};
