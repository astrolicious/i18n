import { existsSync, readdirSync } from "node:fs";
import { basename, extname } from "node:path";

export const getNamespaces = (defaultLocalesDir: string) => {
  const importsData: Array<{
    namespaceName: string;
    fileName: string;
  }> = [];

  if (existsSync(defaultLocalesDir)) {
    const filenames = readdirSync(defaultLocalesDir).filter((f) =>
      f.endsWith(".json")
    );
    for (const fileName of filenames) {
      importsData.push({
        namespaceName: basename(fileName, extname(fileName)),
        fileName,
      });
    }
  }

  const namespaces = importsData.map((e) => e.namespaceName);

  return {
    importsData,
    namespaces,
  };
};
