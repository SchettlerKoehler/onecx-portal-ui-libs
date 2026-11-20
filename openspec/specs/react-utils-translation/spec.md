# react-utils-translation Specification

## Purpose
Keeps react-i18next in sync with the OneCX user language and resolves the loading path of translation files, including the portal-page translations shipped with this library.

## Requirements

### Requirement: TranslationBridge
`TranslationBridge` SHALL render `null` and subscribe to the user service `lang$` stream. On each emitted language it SHALL call `i18n.changeLanguage(lang)` only if `i18n.isInitialized` is true. It MUST unsubscribe on unmount and re-subscribe when the `lang$` reference changes.

#### Scenario: Language change
- **WHEN** `lang$` emits `'de'` and i18n is initialized
- **THEN** `i18n.changeLanguage('de')` is called

#### Scenario: Not initialized
- **WHEN** `lang$` emits before i18n is initialized
- **THEN** `changeLanguage` is not called

#### Scenario: Unmount
- **WHEN** the component unmounts
- **THEN** the subscription is unsubscribed

### Requirement: getTranslationPathFromMeta
`getTranslationPathFromMeta(metaUrl, path = 'assets/i18n/')` SHALL return the directory of `metaUrl` (file name removed) followed by `/` and `path` with a trailing slash ensured. It MUST throw an `Error` ("Cannot construct translation path from local file path...") when `metaUrl` is undefined/empty or starts with `file://`.

#### Scenario: Valid URL
- **WHEN** `metaUrl` is `https://host/app/main.js`
- **THEN** the result is `https://host/app/assets/i18n/`

#### Scenario: Custom path without trailing slash
- **WHEN** `path` is `'x/y'`
- **THEN** the result ends in `x/y/`

#### Scenario: Local file URL
- **WHEN** `metaUrl` starts with `file://` or is undefined
- **THEN** an error is thrown

### Requirement: registerPortalPageTranslations
`registerPortalPageTranslations(instance, metaUrl, path = 'onecx-react-utils/assets/i18n/')` SHALL set `instance.options.backend.loadPath` to `<translation path>{{lng}}.json`, merging into existing backend options if present, and also update the options of an already created backend connector backend. It MUST return silently, doing nothing, when `metaUrl` is undefined or starts with `file://`.

#### Scenario: Load path set
- **WHEN** called with a valid `metaUrl`
- **THEN** `instance.options.backend.loadPath` ends with `{{lng}}.json`

#### Scenario: Existing backend options
- **WHEN** the instance already has backend options
- **THEN** they are preserved and only `loadPath` is replaced

#### Scenario: Local file
- **WHEN** `metaUrl` is a `file://` URL
- **THEN** the instance is left unchanged without an error
