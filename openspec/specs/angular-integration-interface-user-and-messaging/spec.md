# angular-integration-interface-user-and-messaging Specification

## Purpose
Angular services for the current user (profile, language, permissions), portal-wide messages and notifications, and application parameters. Used by applications and remote components.

## Requirements

### Requirement: User profile and language
`UserService` SHALL expose `profile$` (a `UserProfileTopic`) and `lang$` (a `BehaviorSubject<string>`). `lang$` SHALL initially hold the browser language, falling back to `DEFAULT_LANG` (`'en'`), and SHALL be updated whenever `profile$` emits.

#### Scenario: Locales list with general language
- **WHEN** the profile has `settings.locales = ['fr-FR','fr']`
- **THEN** `lang$` is `'fr'` (first general language)

#### Scenario: No general language
- **WHEN** `locales = ['fr-FR','de-DE']`
- **THEN** `lang$` is `'en'`

#### Scenario: Empty locales
- **WHEN** `locales` is `[]`
- **THEN** the first general language of the normalised browser locales is used (e.g. `'en'` for `['en-US','en','fr-FR','fr']`)

### Requirement: Legacy language resolution
`UserService.useOldLangSetting(profile)` SHALL return the language derived from the profile's preferred locale if defined, otherwise the first browser language (with `-` or `_` region suffix split off), otherwise `'en'`.

#### Scenario: Preferred locale
- **WHEN** the profile has a preferred locale (e.g. `'es'`)
- **THEN** that language is returned

#### Scenario: No browser languages
- **WHEN** navigator or its languages are undefined
- **THEN** `'en'` is returned

### Requirement: Permission checks
`UserService.hasPermission(key)` SHALL resolve `true` when `key` is falsy (`undefined`, empty); for a string, whether the current permissions contain it (logging a debug message when not); for an array, `true` only if all entries are permitted. `getPermissions()` SHALL return an observable of the permission list. `permissionsTopic$` SHALL be lazy and replaceable.

#### Scenario: Undefined key
- **WHEN** `hasPermission(undefined)` is called
- **THEN** it resolves `true`

#### Scenario: Array of keys
- **WHEN** one of the keys is missing in the permissions
- **THEN** it resolves `false`

### Requirement: User service readiness and cleanup
`UserService.isInitialized` SHALL resolve once both the permissions topic and profile topic have values. `ngOnDestroy` SHALL destroy `profile$` and, if created, the permissions topic.

#### Scenario: Initialised
- **WHEN** both topics have published
- **THEN** `isInitialized` resolves

### Requirement: Portal messages
`PortalMessageService` (provided `'any'`) SHALL offer `success`, `info`, `error` and `warning`, each taking a `Message` (`PortalMessage`) and publishing it on `message$` with severity `success`, `info`, `error` and `warn` respectively. `summaryKey` and `detailKey` SHALL be translated through `TranslateService` using `summaryParameters` and `detailParameters`; absent keys yield `undefined` text.

#### Scenario: Translated summary and parameters
- **WHEN** `success({ summaryKey, summaryParameters: { username: 'user' } })` is called
- **THEN** a message with severity `success` and the interpolated summary (`Hello user`) is published

#### Scenario: Summary and detail
- **WHEN** both keys and distinct parameters are provided
- **THEN** summary and detail are translated independently

#### Scenario: Warning severity
- **WHEN** `warning(msg)` is called
- **THEN** the published severity is `'warn'`

### Requirement: Notification service
`NotificationService` SHALL expose `notificationTopic` from the underlying integration-interface `NotificationService` created on construction, and SHALL destroy it on `ngOnDestroy`.

#### Scenario: Same topic
- **WHEN** `notificationTopic` is read repeatedly
- **THEN** the same topic is returned

### Requirement: Parameter lookup
`ParametersService.get(key, defaultValue, productName?, appId?)` SHALL resolve with the parameter value for the given key. When `productName`/`appId` are omitted they SHALL be taken from `currentMfe$`. `defaultValue` MAY be a value or a promise.

#### Scenario: Value present
- **WHEN** the shell supports the `PARAMETERS_TOPIC` capability and the parameter exists
- **THEN** its value is returned

#### Scenario: Value or app absent
- **WHEN** the parameter is undefined or no parameters exist for the app
- **THEN** the default value (awaited if a promise) is returned

#### Scenario: Old shell
- **WHEN** the shell lacks the `PARAMETERS_TOPIC` capability
- **THEN** the default value is returned without reading topics

> Note (code-derived): in the capability-missing path a promise default is returned as-is and thereby awaited by the async function.
