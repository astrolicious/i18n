import type { AstroIntegrationLogger } from "astro";

export const createLogger = (logger: AstroIntegrationLogger) =>
  logger.fork("astro-i18n/i18next");
