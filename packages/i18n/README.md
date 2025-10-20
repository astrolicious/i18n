> [!WARNING]  
> This integration is unmaintained due to lack of time. It should mostly work but do not expect fixes or new features.

# `@astrolicious/i18n`

This is yet another i18n integration for [Astro](https://astro.build/) with server and client utilities, type safety and translations built-in.

## Documentation

Read the [Astro I18n docs](https://astro-i18n.netlify.app/).

## Contributing

This package is structured as a monorepo:

- `playground` contains code for testing the package
- `package` contains the actual package

Install dependencies using pnpm: 

```bash
pnpm i --frozen-lockfile
```

Start the playground and package watcher:

```bash
pnpm dev
```

You can now edit files in `package`. Please note that making changes to those files may require restarting the playground dev server.

## Licensing

[MIT Licensed](https://github.com/astrolicious/i18n/blob/main/LICENSE). Made with ❤️ by [Florian Lefebvre](https://github.com/florian-lefebvre).

## Acknowledgements

- https://github.com/yassinedoghri/astro-i18next
- https://i18n.nuxtjs.org/