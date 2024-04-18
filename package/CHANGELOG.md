# @astrolicious/i18n

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
