# angular-integration-interface-app-state Specification

## Purpose
Angular services exposing the shared platform state (current MFE, page, workspace, location, theme, auth state, remote components, capabilities) as topics, plus workspace URL resolution. Used by all OneCX Angular applications and remote components.

## Requirements

### Requirement: Lazily created, overridable state topics
`AppStateService` SHALL expose `globalError$`, `globalLoading$`, `currentMfe$`, `currentLocation$`, `currentPage$`, `currentWorkspace$` and `isAuthenticated$`. Each topic SHALL be created on first access, the same instance SHALL be returned on repeated access, and each SHALL be replaceable via its setter.

#### Scenario: Lazy creation
- **WHEN** a getter is accessed for the first time
- **THEN** a new topic instance is created
- **AND** subsequent accesses return the same instance

#### Scenario: Override
- **WHEN** a topic is assigned through the setter
- **THEN** the getter returns the assigned instance

> Note (code-derived): `currentPage$` only emits when the page path matches `document.location.pathname`, otherwise `undefined` (per source comment). `isAuthenticated$` is initialised once authentication is done and is what the token interceptor waits on.

### Requirement: App state cleanup
`AppStateService.ngOnDestroy()` SHALL destroy every topic that was created and MUST NOT fail for topics never accessed.

#### Scenario: Destroy
- **WHEN** the service is destroyed
- **THEN** only initialised topics receive `destroy()`

### Requirement: Theme service
`ThemeService` SHALL expose `currentTheme$` (a `CurrentThemeTopic`) with lazy creation, setter override and destruction on `ngOnDestroy` (safe when never accessed). The package SHALL re-export `Theme` and `MfeInfo` from `@onecx/integration-interface`.

#### Scenario: Lazy theme topic
- **WHEN** `currentTheme$` is read first
- **THEN** a topic is created and later destroyed with the service

### Requirement: Remote components service
`RemoteComponentsService` SHALL expose `remoteComponents$` (a `RemoteComponentsTopic`) with the same lazy/setter/destroy semantics as the theme service.

#### Scenario: Destroy before use
- **WHEN** the service is destroyed without access to `remoteComponents$`
- **THEN** no error occurs

### Requirement: Shell capability service
`ShellCapabilityService.hasCapability(capability)` SHALL return whether the shell announced that capability; the static `ShellCapabilityService.setCapabilities(capabilities)` SHALL store the capability list globally. When capabilities were never set, `hasCapability` SHALL return `false`. The package SHALL export `Capability` as an alias of the integration-interface `ShellCapability`.

#### Scenario: Present capability
- **WHEN** `setCapabilities([X])` was called
- **THEN** `hasCapability(X)` is `true` and `hasCapability(Y)` is `false`

#### Scenario: Not initialised
- **WHEN** no capabilities were set
- **THEN** `hasCapability` returns `false`

### Requirement: Workspace URL resolution
`WorkspaceService.getUrl(productName, appId, endpointName?, endpointParameters?)` SHALL return an observable emitting, for each workspace emission, the URL built from the workspace base URL, the matching route (by product and app id) and optionally the named endpoint with parameters substituted.

#### Scenario: Endpoint with parameters
- **WHEN** a route and endpoint with alias placeholders match and parameters are given
- **THEN** the emitted URL is route base URL plus endpoint path with parameters filled in, with duplicate slashes normalised

#### Scenario: No match
- **WHEN** the route or endpoint is not found, or no routes exist
- **THEN** the workspace base URL (or the route base URL when only the endpoint is missing) is emitted and a warning is logged

#### Scenario: Empty base URL
- **WHEN** the workspace base URL is an empty string
- **THEN** an empty string URL is emitted when no more specific route applies

### Requirement: Workspace URL existence check
`WorkspaceService.doesUrlExistFor(productName, appId, endpointName?)` SHALL emit `true` when a route for the product/app exists with a non-empty base URL, or when the named endpoint exists in that route, else `false`.

#### Scenario: Existing endpoint
- **WHEN** the endpoint name exists in the matching route
- **THEN** `true` is emitted

#### Scenario: Missing or empty
- **WHEN** the route has no base URL, an empty base URL, no endpoints, or does not exist
- **THEN** `false` is emitted
