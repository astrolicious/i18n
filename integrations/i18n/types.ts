export type I18nextConfig = {
  namespaces: Array<string>;
  defaultNamespace: string;
  resources: Record<string, Record<string, any>>;
};

// TODO: update properties names
export type Route = {
  locale: string;
  params: Array<string>;
  originalPattern: string;
  staticPattern: string;
  originalEntrypoint: string;
  injectedRoute: import("astro").InjectedRoute;
};

export type I18nConfig = {
  clientOptions: import("./options.js").Options["client"];
  translations: {
    initialized: boolean;
    i18nextConfig: I18nextConfig;
  };
  data: {
    locale: string;
    locales: Array<string>;
  };
  paths: {
    pathname: string;
    routes: Array<Route>
    dynamicParams: Record<string, Record<string, string>>;
  };
};
