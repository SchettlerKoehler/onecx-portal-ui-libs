# ngrx-integration-interface-store-connectors Specification

## Purpose
Store connector services that push OneCX platform state (permissions, config, MFE, page, theme, workspace, navigation, app config) into the NgRx store as `OneCxActions`. Applications opt in per connector via provider functions.

## Requirements

### Requirement: Eager connector providers
Each connector SHALL be offered through a function `provide<Name>StoreConnector()` returning the service class plus an environment initialiser that instantiates it at startup, so the connector is active without being injected elsewhere. Provider functions exist for: `provideAppConfigStoreConnector`, `provideConfigurationStoreConnector`, `provideCurrentMfeStoreConnector`, `provideCurrentPageStoreConnector`, `provideCurrentThemeStoreConnector`, `provideCurrentWorkspaceStoreConnector`, `provideNavigatedEventStoreConnector`, `providePermissionsStoreConnector`.

#### Scenario: Provider used
- **WHEN** an application includes `provideCurrentMfeStoreConnector()`
- **THEN** the connector is instantiated at environment initialisation

### Requirement: Streaming connectors
The current-MFE, current-page, current-workspace, permissions and app-config connectors SHALL subscribe on construction to, respectively, `AppStateService.currentMfe$`, `currentPage$`, `currentWorkspace$`, `UserService.getPermissions()` and `AppConfigService.config$`, and SHALL dispatch `currentMfeChanged`, `currentPageChanged`, `currentWorkspaceChanged`, `permissionsChanged` and `appConfigChanged` on every emission. Subscriptions SHALL end when the service is destroyed.

#### Scenario: New emission
- **WHEN** `currentMfe$` emits an `MfeInfo`
- **THEN** `OneCxActions.currentMfeChanged({ currentMfe })` is dispatched

#### Scenario: Page undefined
- **WHEN** `currentPage$` emits `undefined`
- **THEN** `currentPageChanged({ currentPage: undefined })` is dispatched

### Requirement: Configuration connector
`ConfigurationStoreConnectorService` SHALL call `ConfigurationService.getConfig()` once on construction and, if a config is returned, dispatch `configChanged({ config })`.

#### Scenario: Config available
- **WHEN** `getConfig()` resolves with a config
- **THEN** `configChanged` is dispatched

#### Scenario: Config undefined
- **WHEN** `getConfig()` resolves `undefined`
- **THEN** nothing is dispatched

> Note (code-derived): only the first config value is dispatched; later `setProperty` updates are not propagated.

### Requirement: Theme connector
`CurrentThemeStoreConnectorService` SHALL own a `CurrentThemeTopic`, dispatch `currentThemeChanged` for each emission and destroy that topic in `ngOnDestroy`.

#### Scenario: Destroy
- **WHEN** the service is destroyed
- **THEN** its theme topic is destroyed

### Requirement: Navigation connector
`NavigatedEventStoreConnectorService` SHALL dispatch `OneCxActions.navigated({ event })`. If the shell has the `CURRENT_LOCATION_TOPIC` capability it SHALL use the `currentLocation$` payload as `event`; otherwise it SHALL subscribe to `EventsTopic`, keep only events of type `NAVIGATED` and use their `payload`. It SHALL destroy its `EventsTopic` (if created) on destroy.

#### Scenario: Capability present
- **WHEN** `currentLocation$` emits a payload
- **THEN** `navigated({ event: payload })` is dispatched

#### Scenario: Capability missing
- **WHEN** an `EventsTopic` event of type `NAVIGATED` with a payload is received
- **THEN** `navigated({ event: payload })` is dispatched; other event types are ignored

### Requirement: No user profile connector
> Note (code-derived): `OneCxActions.userProfileChanged` and `selectUserProfile` exist but no connector or provider in this library dispatches it; applications must dispatch it themselves.

#### Scenario: Profile action
- **WHEN** an application dispatches `userProfileChanged`
- **THEN** the reducer stores `userProfile`
