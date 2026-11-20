# angular-utils-translation-missing-handler Specification

## Purpose
`MultiLanguageMissingTranslationHandler` (exported from `@onecx/angular-utils`) resolves keys missing in the active ngx-translate language by trying the user's other preferred locales, first from the static loader tables and then from dynamic translations published by the shell.

## Requirements

### Requirement: Locale candidate order
`handle(params)` SHALL derive the candidate locales from `UserService.profile$` (`settings.locales`) taking the first profile emission; if the profile has no locales settings it SHALL use `getNormalizedBrowserLocales()`. Locales SHALL be tried in order and the first successful translation wins.

#### Scenario: Profile locales
- **WHEN** the profile has locales `['de','en']`
- **THEN** `de` is tried before `en`

#### Scenario: Browser fallback
- **WHEN** the profile has no locales or no settings
- **THEN** the normalised browser locales are used

### Requirement: Static lookup before dynamic lookup
For each locale the handler SHALL read the language table through `translateService.currentLoader.getTranslation(lang)` and resolve the key with ngx-translate `getValue`, interpolating with the injected `TranslateParser` and `interpolateParams`. Only if the static table does not contain a usable value, it SHALL query `DynamicTranslationService.getTranslations(lang, contexts)`, deep-merge all returned context records (ignoring undefined records) and resolve the key from the merged table. Strings and functions SHALL be interpolated; numbers, booleans and bigints SHALL be stringified; other value types (objects, arrays, null, undefined) are treated as missing.

#### Scenario: Static hit
- **WHEN** the static table of a locale contains the key
- **THEN** the dynamic source is not consulted

#### Scenario: Dynamic hit
- **WHEN** the static table lacks the key but the dynamic translations of the same locale contain it
- **THEN** the interpolated dynamic value is returned

#### Scenario: Non-string value types
- **WHEN** the value is a number, boolean or bigint
- **THEN** its string form is returned; a function value is invoked via the parser

### Requirement: Fallback to key
If no locale resolves the key, or the loader throws, the handler SHALL log a warning and emit the raw key. Failure of one locale SHALL not stop trying the following locales.

#### Scenario: Not found anywhere
- **WHEN** no locale yields a value
- **THEN** the key itself is emitted

### Requirement: Stateless resolution
The handler SHALL NOT call `reloadLang`, `use` or `setTranslation` on the `TranslateService` and SHALL NOT change active language state. It SHALL log a warning when the loader is a `TranslateNoOpLoader` and a debug message for each missing key.

#### Scenario: No state mutation
- **WHEN** a dynamic value resolves
- **THEN** no language state of the translate service is changed

### Requirement: Dynamic translation contexts
The contexts passed to the dynamic translation service SHALL be built from the `MULTI_LANGUAGE_IDENTIFIER` values of the handler's own injector (`name` and `version`). If none has `type: 'app'` and the app identity (`APP_ID`) exposes `appElementName`, a context `{ name: appElementName }` SHALL be added. Without identifiers and app identity the contexts list is empty.

#### Scenario: App element name fallback
- **WHEN** only `lib` identifiers exist and `appElementName` is `my-app`
- **THEN** contexts include `{ name: 'my-app' }`

#### Scenario: App identifier present
- **WHEN** an `app` identifier exists
- **THEN** no extra app-element context is added
