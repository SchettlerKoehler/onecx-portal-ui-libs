# angular-utils-translation Specification

## Purpose
Part of `@onecx/angular-utils`. Provides the ngx-translate infrastructure for OneCX applications: configuring translation file locations, loading and merging several translation files with a window-wide cache shared across applications, synchronising the UI language with the user profile, and dynamic locale ids.

## Requirements

### Requirement: Translation path tokens and providers
`TRANSLATION_PATH` SHALL be a multi-value `InjectionToken` of `string | Observable<string> | Promise<string>` giving translation base URLs. `provideTranslationPathFromMeta(url, path = 'assets/i18n/')` SHALL return a multi-provider for it whose value is `url` without its file name, joined with `path`, with a trailing slash ensured. If `isTest()` is true and `url` is empty or starts with `file://`, it SHALL return `path` unchanged instead; otherwise an empty or `file://` url SHALL throw an error `Cannot construct translation path from local file path. Please check whether the webpack configuration for importMeta is correct: ...`.

#### Scenario: Normal URL
- **WHEN** called with `https://dev.one-cx.org/mfe/workspace/3204.512.js` and `assets/i18n`
- **THEN** the value is `https://dev.one-cx.org/mfe/workspace/assets/i18n/`

#### Scenario: Default path
- **WHEN** `path` is omitted
- **THEN** `assets/i18n/` is appended

#### Scenario: Local file URL outside tests
- **WHEN** the url is `file:///some/local/file.js` and not in a test
- **THEN** an error is thrown

#### Scenario: Local file URL in tests
- **WHEN** `isTest()` is true and the url is undefined or `file://`
- **THEN** the provider value is the relative `path`

### Requirement: Library translation providers
`provideTranslationPaths()` SHALL provide a `LOCALE_ID` equal to the current `UserService.lang$` value, the translation path `onecx-angular-utils/assets/i18n/` of this library (derived from its own module URL) and a `MULTI_LANGUAGE_IDENTIFIER` entry `{ name: '@onecx/angular-utils', version: LIB_VERSION, type: 'lib' }`.

#### Scenario: Library identifier
- **WHEN** `provideTranslationPaths()` is used
- **THEN** the library registers itself as a `lib` identifier with its version

### Requirement: Multi language identifiers
`provideMultiLanguageIdentifier(name, version?, type = 'app')` SHALL return a multi `ValueProvider` for `MULTI_LANGUAGE_IDENTIFIER` with value `{ name, version, type }` (`type` is `'app'` or `'lib'`; version is `undefined` when omitted).

#### Scenario: Defaults
- **WHEN** only `'my-app'` is passed
- **THEN** the value is `{ name: 'my-app', version: undefined, type: 'app' }`

### Requirement: Deprecated path factories
`translationPathFactory(path)` (deprecated) SHALL return a factory taking `AppStateService` and emitting `<currentMfe.remoteBaseUrl>/<path>` once the global loading flag is false. `remoteComponentTranslationPathFactory(path)` (deprecated) SHALL return a factory taking the `REMOTE_COMPONENT_CONFIG` subject and emitting `<config.baseUrl>/<path>`.

#### Scenario: Waiting for loading
- **WHEN** `globalLoading$` is true
- **THEN** `translationPathFactory` emits nothing until it becomes false

### Requirement: OnecxTranslateLoader
`OnecxTranslateLoader` (ngx-translate `TranslateLoader`) SHALL resolve all `TRANSLATION_PATH` entries (strings, observables, promises), remove duplicates, and for the requested language load `<path><lang>.json` from each through `CachingTranslateLoader`, merging the results with `TranslateCombinedLoader`. Without `TRANSLATION_PATH` entries, or with no loader, `getTranslation` SHALL emit `{}`.

#### Scenario: Duplicate paths
- **WHEN** the same path is provided twice
- **THEN** it is loaded only once

#### Scenario: No paths
- **WHEN** no `TRANSLATION_PATH` is provided
- **THEN** the loader emits an empty object

### Requirement: TranslateCombinedLoader
`TranslateCombinedLoader(...loaders)` SHALL load the language from all loaders in parallel and deep-merge results in loader order (later wins on conflicts). A loader that fails SHALL be logged as an error and contribute `{}`.

#### Scenario: Failing loader
- **WHEN** one of two loaders errors
- **THEN** the result contains the other loader's translations only

### Requirement: Deep merge helpers
`mergeDeep(target, source)` SHALL return a new object where nested plain objects are merged recursively and other values (including arrays) from `source` replace those of `target`; it SHALL return a shallow copy of `target` if either argument is not a plain object. `isObject(item)` SHALL be true for non-null non-array objects.

#### Scenario: Nested merge
- **WHEN** `mergeDeep({a:{b:1}}, {a:{c:2}})`
- **THEN** the result is `{a:{b:1,c:2}}`

### Requirement: CachingTranslateLoader
`CachingTranslateLoader(translationCache, injector, prefix, suffix)` SHALL load `<prefix><lang><suffix>` through an HTTP translate loader and the `TranslationCacheService`, so each URL is fetched only once. The HTTP request SHALL be retried up to 2 times with 50 ms delay.

#### Scenario: Cached
- **WHEN** the same language is requested twice
- **THEN** only one HTTP request is performed

### Requirement: TranslationCacheService
`TranslationCacheService` (root) SHALL store translation files in `window.onecxTranslations` keyed by URL so they are shared between applications. `getTranslationFile(url, cacheMissFunction)` SHALL return the cached value if present; if the entry is `null` (another loader is fetching) it SHALL wait for the `translationCache` topic (version 2) to publish that URL and then emit the cached value (`{}` if it was removed); otherwise it SHALL mark the entry `null`, call `cacheMissFunction`, store the result, publish the URL on the topic and emit the result. On failure it SHALL log an error, delete the entry, publish the URL and emit `{}`. `translationTopic$` is lazily created and destroyed on service destroy.

#### Scenario: Cache hit
- **WHEN** a translation for the URL is cached
- **THEN** it is returned without calling `cacheMissFunction`

#### Scenario: Concurrent load
- **WHEN** another application is already loading the URL
- **THEN** the call waits for the topic message for that URL and emits the cached result

#### Scenario: Failed load
- **WHEN** `cacheMissFunction` errors
- **THEN** `{}` is emitted, the cache entry is removed and an error is logged

### Requirement: TranslationConnectionService
`TranslationConnectionService` SHALL call `translateService.use(lang)` on every `UserService.lang$` emission and, on language change, translation change or fallback language change, fetch the translation key `optimus` and pass it to `Optimus.setTranslation`. Both subscriptions SHALL be cancelled on destroy. `provideTranslationConnectionService()` SHALL provide it and an environment initializer that instantiates it.

#### Scenario: Translation event
- **WHEN** `onLangChange` fires
- **THEN** `Optimus.setTranslation` is called with the `optimus` translations

### Requirement: DynamicLocaleId
`DynamicLocaleId` SHALL behave as a string whose value is the current `UserService.lang$` value: `valueOf()` returns it, `length` is its length and all `String.prototype` methods are proxied to it, so it can be used as Angular `LOCALE_ID`.

#### Scenario: Proxy
- **WHEN** the language is `de` and `toUpperCase()` is called
- **THEN** `DE` is returned
