# @astrolicious/i18n

## 0.4.2

### Patch Changes

- 2f00eb3: Fixes a case where non pages were included in the sitemap
- 2f00eb3: Fixes trailing slash handling in sitemap
- 2f00eb3: Fixes duplicated urls with complex routes
- 2f00eb3: Fixes a case where invalid dynamic params would cause wrong alternates to be generated

## 0.4.1

### Patch Changes

- 261316d: Fixes an issue with `ZodError`

## 0.4.0

### Minor Changes

- 9a97712: Reworks internals to use Astro Integration Kit 0.13, this is non breaking

## 0.3.3

### Patch Changes

- 551d663: Fixes a case where having `trailingSlash: "true"` when using the sitemap would not register routes
- 7ba135e: Allows dynamic routes not to always have an equivalent in another locale when using the sitemap

## 0.3.2

### Patch Changes

- 6159cd0: Allows using endpoints under `src/routes`

## 0.3.1

### Patch Changes

- afcd189: Fixes `switchLocalePath` (and anything that depends on it like `getSwitcherData`) when not in dev mode

## 0.3.0

### Minor Changes

- e138d1b: Adds a new `getLocalesPlaceholder` utility to retrieve `locales` provided in the integration config from inside `getStaticPaths`
- e138d1b: Allows passing custom paths to `getLocalePath` (not registered in the integration config). This will simply prefix paths based on the choosen strategy

### Patch Changes

- e138d1b: Fixes `getLocalePath` typing to allow specifying a locale

## 0.2.1

### Patch Changes

- c4950e5: Fixes a case where build would fail with the sitemap enabled and a route containing uppercase characters

## 0.2.0

### Minor Changes

- 8bc6c8e: Adds a new `getDefaultLocalePlaceholder` utility
- 8bc6c8e: Adds Content Collections helpers
- 8bc6c8e: Adds sitemap support

## 0.1.2

### Patch Changes

- 7ba64a1: Refactors to use the latest version of `astro-integration-kit`

## 0.1.1

### Patch Changes

- d697474: Adds support for View Transitions

## 0.1.0

### Minor Changes

- 868816f: Adds a new `getDefaultLocale` utility

## 0.0.4

### Patch Changes

- 0aaff4a: Fixes types by making `i18next` a peer dependency and cleans a few things

## 0.0.3

### Patch Changes

- 5a7c47a: Fixes links and package names

## 0.0.2

### Patch Changes

- e46e6ca: Initial release

## 0.0.1

### Patch Changes

- bf6f9fc: Test release
