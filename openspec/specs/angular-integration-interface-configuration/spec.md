# angular-integration-interface-configuration Specification

## Purpose
Provides Angular access to platform-wide configuration (shared by the Shell via a topic) and microfrontend-local configuration, together with the injection tokens and the `CONFIG_KEY` catalogue of known keys. Used by the Shell to initialise configuration and by microfrontends to read it.

## Requirements

### Requirement: Platform configuration initialisation
`ConfigurationService.init()` SHALL resolve the configuration (from the injected `APP_CONFIG` defaults, an inlined config, or a remote config loaded via HTTP from `remoteConfigURL`), publish the merged result on `config$` and resolve with `true`. The published value SHALL be the `APP_CONFIG` defaults overlaid with the resolved config.

#### Scenario: Successful init
- **WHEN** `init()` is called and the config is resolved
- **THEN** `config$` publishes `{ ...APP_CONFIG, ...resolvedConfig }`
- **AND** the returned promise resolves to `true`

#### Scenario: Remote load disabled
- **WHEN** `APP_CONFIG.skipRemoteConfigLoad` is truthy and the resolved source is the default config
- **THEN** an informational log with code TKA001 is written and no remote config is requested

#### Scenario: Config resolution fails
- **WHEN** resolving the config rejects
- **THEN** an error "Failed to load env configuration" is logged
- **AND** the promise returned by `init()` rejects with that error

> Note (code-derived): `APP_CONFIG` is injected optionally; without it the defaults are `{}`. The `LibConfig` interface declares `skipRemoteConfigLoad` as boolean, but the service reads it from an untyped string map and coerces with `!!`, so the string `"false"` is truthy.

### Requirement: Platform configuration access
`ConfigurationService` SHALL expose `config$` (a `ConfigurationTopic`, created lazily and replaceable through its setter), `isInitialized` (a promise that resolves when the topic has received a value), `getProperty(key)`, `getConfig()` and `setProperty(key, val)`.

#### Scenario: Read a property
- **WHEN** `getProperty(CONFIG_KEY.APP_VERSION)` is called after the property was set
- **THEN** it resolves with the current value from the topic

#### Scenario: Read an unknown key
- **WHEN** `getProperty` is called with a key that is not a value of `CONFIG_KEY`
- **THEN** an error "Invalid config key " with the key is logged
- **AND** the lookup is still performed and resolves with the value (or `undefined`)

#### Scenario: Read the whole config
- **WHEN** `getConfig()` is called
- **THEN** it resolves with the latest value of the configuration topic

### Requirement: Platform configuration update
`setProperty(key, val)` SHALL read the current configuration, set the key and publish the updated configuration on `config$`. Concurrent calls SHALL be serialised so that no update is lost.

#### Scenario: Set and read back
- **WHEN** `setProperty(CONFIG_KEY.APP_VERSION, '1.x.0')` completes
- **THEN** `getProperty(CONFIG_KEY.APP_VERSION)` resolves with `'1.x.0'`

### Requirement: Configuration service cleanup
`ConfigurationService.ngOnDestroy()` SHALL destroy the configuration topic if it was created.

#### Scenario: Destroy before use
- **WHEN** the service is destroyed without `config$` ever being accessed
- **THEN** no error is raised

### Requirement: Microfrontend configuration service
`AppConfigService` SHALL hold microfrontend-local configuration in `config$` (a `BehaviorSubject` starting as `{}`) and offer `init(baseUrl)`, `getProperty(key)`, `setProperty(key, val)` and `getConfig()`. It is not provided in root and MUST be provided explicitly.

#### Scenario: Init from env.json
- **WHEN** `init('http://base')` is called
- **THEN** `http://base/assets/env.json` is requested and its content is emitted on `config$`
- **AND** the returned promise resolves with `undefined`

#### Scenario: Init fails
- **WHEN** the HTTP request fails
- **THEN** an error is logged and `init` rejects with the original error

#### Scenario: Get and set
- **WHEN** `setProperty('A','1')` and then `setProperty('B','2')` are called
- **THEN** `getProperty('A')` is `'1'` and `getConfig()` equals `{ A: '1', B: '2' }`
- **AND** `getProperty('missing')` returns `undefined`

> Note (code-derived): if the loaded env.json is falsy (e.g. `null`), the `init` promise never settles.

### Requirement: Config key catalogue
The library SHALL export the `CONFIG_KEY` enum listing the well-known configuration keys (theme, token role claim, portal id, supported languages, `APP_BASE_HREF`, `KEYCLOAK_*` settings, `ONECX_PORTAL_*_DISABLED` feature toggles, `APP_VERSION`, `IS_SHELL`, `AUTH_SERVICE`, `AUTH_SERVICE_CUSTOM_URL`, `AUTH_SERVICE_CUSTOM_MODULE_NAME`, `CUSTOM_AUTH_SHARE_SCOPE`, `POLYFILL_SCOPE_MODE`, `KEYBOARD_FOCUSABLE_SELECTOR`, ...) where each member's value equals its name, and the `POLYFILL_SCOPE_MODE` enum with `PERFORMANCE` and `PRECISION`.

#### Scenario: Key values
- **WHEN** a consumer reads `CONFIG_KEY.AUTH_SERVICE`
- **THEN** its value is the string `'AUTH_SERVICE'`

### Requirement: Injection tokens
The library SHALL export `APP_CONFIG` (typed `LibConfig` with `appId`, `portalId`, `skipRemoteConfigLoad`, `remoteConfigURL`), `SANITY_CHECK`, `APPLICATION_NAME` and `DYNAMIC_CONTAINER` (a function returning an `HTMLElement` used for dynamic content outside Angular's tree).

#### Scenario: Token provided
- **WHEN** an application provides `APPLICATION_NAME`
- **THEN** it can be injected as a string
