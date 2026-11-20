# react-integration-interface-configuration Specification

## Purpose
Loads, publishes and exposes the application configuration (environment values) to React microfrontends through `ConfigurationProvider` / `useConfiguration`, and defines the known configuration keys (`CONFIG_KEY`).

## Requirements

### Requirement: Configuration context access
`useConfiguration()` SHALL return `config`, `config$`, `isInitialized`, `getConfig`, `getProperty`, `setProperty` and `init`, and MUST throw `useConfiguration must be used within a ConfigurationProvider` outside the provider.

#### Scenario: Initial state
- **WHEN** the provider has just mounted
- **THEN** `config` is `null`
- **AND** `config$` and all functions are defined
- **AND** `isInitialized` is a promise resolving to `undefined`

#### Scenario: Outside provider
- **WHEN** the hook is used without a provider
- **THEN** it throws

### Requirement: Default library configuration
`ConfigurationProvider` SHALL accept `defaultConfig` (`LibConfig`: `appId`, `portalId`, `skipRemoteConfigLoad`, `remoteConfigURL`), defaulting to empty `appId`/`portalId`, `skipRemoteConfigLoad: false` and `remoteConfigURL: 'assets/env.json'`.

#### Scenario: Custom defaults
- **WHEN** a custom `defaultConfig` is passed
- **THEN** it is used for initialization

### Requirement: Automatic initialization
The provider SHALL invoke `init()` once on mount. `init()` SHALL resolve the configuration payload (inlined config, remote config fetched from `remoteConfigURL` unless `skipRemoteConfigLoad`, or defaults), publish `{ ...defaultValues, ...resolved }` to the configuration topic (with default values stringified, e.g. `skipRemoteConfigLoad` as a string) and resolve `true`; on any error it SHALL log and resolve `false`.

#### Scenario: Success
- **WHEN** `init()` completes
- **THEN** it returns `true`
- **AND** `config` becomes non-null and `getConfig()` returns values such as `appId` and `portalId`

#### Scenario: Remote load failure
- **WHEN** fetching or parsing the remote config fails
- **THEN** the error is logged
- **AND** the defaults are still published

#### Scenario: Diagnostics
- **WHEN** the source is inlined config
- **THEN** an info log notes the ENV was resolved from injected config
- **AND** when defaults are used because remote loading is skipped, an info log (TKA001) explains how to enable it

### Requirement: Configuration subscription
The provider SHALL subscribe to the configuration topic and keep `config` in sync, mapping nullish emissions to `null`, and unsubscribe on unmount.

#### Scenario: Topic update
- **WHEN** the topic emits a new config
- **THEN** `config` updates

### Requirement: Reading configuration
`getConfig()` SHALL resolve with the first available configuration value from the topic. `getProperty(key)` SHALL resolve with that key's value (or `undefined`) and SHALL log an error when `key` is not a `CONFIG_KEY` value, while still returning the lookup result.

#### Scenario: Valid key
- **WHEN** `getProperty(CONFIG_KEY.TKIT_PORTAL_ID)` is called after init
- **THEN** the configured value is returned

#### Scenario: Unknown key
- **WHEN** a key outside `CONFIG_KEY` is passed
- **THEN** `Invalid config key` is logged

### Requirement: Writing configuration
`setProperty(key, value)` SHALL merge the key into the current configuration and publish it, serialized through a semaphore of size 1 so concurrent updates do not lose writes.

#### Scenario: Update
- **WHEN** `setProperty('APP_BASE_HREF', '/new-base')` completes
- **THEN** `getConfig()` returns `APP_BASE_HREF` equal to `/new-base`

> Note (code-derived): the semaphore is a module-level singleton shared by all providers.

### Requirement: Known configuration keys
`CONFIG_KEY` SHALL enumerate the supported keys (theme, Keycloak, portal feature-disable flags, `APP_BASE_HREF`, `APP_VERSION`, `IS_SHELL`, auth service, `POLYFILL_SCOPE_MODE`, `KEYBOARD_FOCUSABLE_SELECTOR`, etc.) with each value equal to its name; `POLYFILL_SCOPE_MODE` SHALL define `PERFORMANCE` and `PRECISION`.

#### Scenario: Enum values
- **WHEN** `CONFIG_KEY.APP_BASE_HREF` is read
- **THEN** it equals `'APP_BASE_HREF'`
