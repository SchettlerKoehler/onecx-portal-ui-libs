# shell-auth-service-wrapper Specification

## Purpose
Used by the shell to select, initialise and expose an authentication implementation (keycloak, custom remote, or disabled) and to publish it to microfrontends through `window.onecxAuth`.

## Requirements

### Requirement: Provider and initialisation
`provideAuthService()` SHALL provide `AuthServiceWrapper`, `KeycloakAuthService` and `DisabledAuthService` and an app initialiser that waits for `ConfigurationService.isInitialized` and then calls `AuthServiceWrapper.init()`.

#### Scenario: Application start
- **WHEN** the app initialises
- **THEN** authentication is initialised after configuration is available

### Requirement: Auth service selection
`AuthServiceWrapper.init()` SHALL wait for configuration, choose the implementation from `CONFIG_KEY.AUTH_SERVICE` (default `'keycloak'`): `keycloak` -> `KeycloakAuthService`, `disabled` -> `DisabledAuthService`, `custom` -> a factory loaded from a remote; any other value SHALL throw `Error('Configured AuthService not found')`. It SHALL then call the service's `init()`.

#### Scenario: Default
- **WHEN** `AUTH_SERVICE` is unset
- **THEN** keycloak is used

#### Scenario: Unknown type
- **WHEN** `AUTH_SERVICE` is `foo`
- **THEN** init rejects with "Configured AuthService not found"

### Requirement: Authentication published
When the selected service's `init()` returns a truthy value, the wrapper SHALL publish on `AppStateService.isAuthenticated$`. `init()` SHALL resolve with the service's init result.

#### Scenario: Successful init
- **WHEN** init returns `true`
- **THEN** `isAuthenticated$` is published

#### Scenario: Falsy init
- **WHEN** init returns `false`
- **THEN** `isAuthenticated$` is not published

### Requirement: Custom auth service loading
For `custom`, the wrapper SHALL require `AUTH_SERVICE_CUSTOM_URL` (else throw `URL of the custom auth service is not defined`), load the module federation remote (alias `custom-auth-service`, type `module`, share scope from `CUSTOM_AUTH_SHARE_SCOPE`) exposing `AUTH_SERVICE_CUSTOM_MODULE_NAME` (default `./CustomAuth`) via the shell's MF instance, and call the module's default export (an `AuthServiceFactory`) with an injector callback. Missing shell instance SHALL throw `Shell module federation instance not found`; a missing module SHALL throw `Failed to load custom auth service module`.

#### Scenario: Missing URL
- **WHEN** `AUTH_SERVICE` is `custom` and no URL configured
- **THEN** an error is thrown

### Requirement: Injectables for custom services
The factory callback SHALL return, for `Injectables.KEYCLOAK_AUTH_SERVICE`, the `KeycloakAuthService`; for `Injectables.CONFIG`, the current config; otherwise it SHALL throw `unknown injectable type`. The `AuthService` interface (`init`, `getHeaderValues`, `logout`, `updateTokenIfNeeded`) and `AuthServiceFactory` type define the contract.

#### Scenario: Config injectable
- **WHEN** a factory requests `Injectables.CONFIG`
- **THEN** the configuration is returned

### Requirement: Global auth proxy
On construction the wrapper SHALL, if not already defined, register `window.onecxAuth.authServiceProxy.v1` and the legacy `window.onecxAngularAuth.authServiceProxy.v1`, each exposing `getHeaderValues` and `updateTokenIfNeeded` delegating to the wrapper. `getHeaderValues()` SHALL return `{}` and `updateTokenIfNeeded()` SHALL reject (without error value) while no service is selected.

#### Scenario: Before init
- **WHEN** a microfrontend calls the proxy before init
- **THEN** headers are `{}` and the token update rejects

### Requirement: Logout event
The wrapper SHALL subscribe to `EventsTopic` and call the active service's `logout()` on `AUTH_LOGOUT_BUTTON_CLICKED` events.

#### Scenario: Logout clicked
- **WHEN** such an event arrives
- **THEN** `logout()` is called on the selected service
