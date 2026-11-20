# react-integration-interface-user-and-parameters Specification

## Purpose
React providers and hooks for the current user (profile, language, permissions) and for application parameters, used by OneCX React microfrontends.

## Requirements

### Requirement: User context
`UserProvider` SHALL provide through `useUserService()` the values `profile$`, `lang$` (a `BehaviorSubject<string>`), `permissionsTopic$`, `getPermissions`, `hasPermission` and `isInitialized`, each of `profile$`, `lang$`, `permissionsTopic$` overridable via `value`. `useUserService()` MUST throw `useUserService must be used within a UserProvider` outside the provider.

#### Scenario: Defaults and overrides
- **WHEN** no overrides are provided
- **THEN** default topics and a `lang$` are created
- **AND** provided overrides are returned by identity (e.g. `lang$` with value `de`)

### Requirement: Language derivation
`lang$` SHALL start with the browser language (`determineBrowserLanguage()`), falling back to `en`, and SHALL be updated from every `profile$` emission via `resolveProfileLanguage` (default `en`, using normalized browser locales). The subscription SHALL end on unmount.

#### Scenario: Profile change
- **WHEN** the user profile emits
- **THEN** `lang$` emits the resolved profile language

### Requirement: Permission checks
`getPermissions()` SHALL return the permissions topic as an `Observable<string[]>`. `hasPermission(key)` SHALL resolve `true` for undefined/empty input, check a single key against the first permissions emission, and for an array resolve `true` only if all keys are granted.

#### Scenario: Missing key
- **WHEN** `hasPermission(undefined)` is called
- **THEN** it resolves `true`

#### Scenario: Array
- **WHEN** `hasPermission(['a','b'])` is called and only `a` is granted
- **THEN** it resolves `false`

### Requirement: User initialization
`isInitialized` SHALL resolve when both the permissions topic and the profile topic are initialized.

#### Scenario: Awaiting
- **WHEN** both topics are initialized
- **THEN** `isInitialized` resolves

### Requirement: Parameters context
`ParametersProvider` SHALL provide `parameters$` (a `ParametersTopic`, overridable via `value.parameters$`) and `get` through `useParameters()`, which MUST throw `useParameters must be used within a ParametersProvider` outside the provider.

#### Scenario: Provided
- **WHEN** the provider is rendered
- **THEN** `parameters$` and `get` are defined
- **AND** an override instance is returned by identity

### Requirement: Parameter lookup
`get(key, defaultValue, productName?, appId?)` SHALL resolve `defaultValue` immediately when the shell lacks `ShellCapability.PARAMETERS_TOPIC`. Otherwise it SHALL default `productName` and `appId` to those of `currentMfe$`, look the key up with `findParameterValue` on the first parameters emission, and resolve `defaultValue` when no value is found.

#### Scenario: No capability
- **WHEN** the capability is absent
- **THEN** `defaultValue` is returned without reading topics

#### Scenario: Found / not found
- **WHEN** the parameter exists for the product and app
- **THEN** its value is returned
- **AND** otherwise `defaultValue` is returned

> Note (code-derived): requires `AppStateProvider` above `ParametersProvider`; `defaultValue` may be a promise.
