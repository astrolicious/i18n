export type InternalI18n = {
  locale: string;
  pathname: string;
  dynamicParams: Record<string, Record<string, string>>;
  i18nextInitialized: boolean;
};
