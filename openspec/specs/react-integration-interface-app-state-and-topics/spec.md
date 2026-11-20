# react-integration-interface-app-state-and-topics Specification

## Purpose
Provides the React lifecycle-safe topic helper `useTopic` and the app-state, theme, workspace and shell-capability React bindings (`AppStateProvider`, `useAppState`, `ThemeProvider`, `useTheme`, `useWorkspace`, `setCapabilities`, `useShellCapability`) used by OneCX React microfrontends to consume shell-published state.

## Requirements

### Requirement: Lazy topic instantiation and lifecycle
`useTopic(valueTopic, TopicClass)` SHALL return `valueTopic` when it is provided, otherwise a new `TopicClass` instance created once on first render and returned unchanged across re-renders.

#### Scenario: No external topic
- **WHEN** `useTopic(undefined, TopicClass)` is rendered
- **THEN** the result is an instance of `TopicClass`
- **AND** the same instance is returned on re-render

#### Scenario: External topic
- **WHEN** an external topic is passed
- **THEN** that exact instance is returned
- **AND** `destroy()` is never called on it when the component unmounts

> Note (code-derived): the instance is fixed on first render; later changes of `valueTopic` are ignored.

### Requirement: Deferred destruction of internal topics
`useTopic` SHALL call `destroy()` on an internally created topic only after the component has unmounted, deferring the call by one macrotask so that React StrictMode double-mounting does not destroy a still-used topic.

#### Scenario: Real unmount
- **WHEN** a component using an internal topic unmounts and is not re-mounted
- **THEN** `destroy()` is called on the topic after the next tick, not synchronously

#### Scenario: StrictMode remount
- **WHEN** the component is re-mounted before the deferred tick fires
- **THEN** `destroy()` is not called

#### Scenario: Fresh mount after unmount
- **WHEN** a new component instance mounts after a previous one unmounted
- **THEN** it receives a new topic instance

### Requirement: App state topics provider
`AppStateProvider` SHALL expose via `useAppState()` the topics `globalError$`, `globalLoading$`, `currentMfe$`, `currentLocation$`, `currentPage$`, `currentWorkspace$` and `isAuthenticated$`. Each SHALL default to a new topic instance and MAY be overridden individually through the `value` prop.

#### Scenario: Defaults
- **WHEN** `useAppState()` is called under `AppStateProvider` without `value`
- **THEN** all seven topics are defined

#### Scenario: Overrides
- **WHEN** `value` supplies some topics
- **THEN** `useAppState()` returns exactly those instances for them
- **AND** children render normally

> Note (code-derived): the context default is an empty object, so `useAppState()` outside a provider does not throw (despite its documented error) and returns an object with undefined topics.

### Requirement: Current page topic semantics
`currentPage$` SHALL emit page info only when its path matches the document location pathname, and emit `undefined` otherwise (documented on the context type).

#### Scenario: Documented contract
- **WHEN** consumers subscribe to `currentPage$`
- **THEN** they are to treat `undefined` as "page info does not match current location"

### Requirement: Theme provider
`ThemeProvider` SHALL provide `currentTheme$` (a `CurrentThemeTopic`) through `useTheme()`, using `value.currentTheme$` when given. `useTheme()` MUST throw `useTheme must be used within a ThemeProvider` outside the provider.

#### Scenario: Default and override
- **WHEN** no override is given
- **THEN** a new `CurrentThemeTopic` is provided
- **AND** when `value.currentTheme$` is given, that instance is provided

#### Scenario: Outside provider
- **WHEN** `useTheme()` is called without a provider
- **THEN** it throws the error above

### Requirement: Workspace URL helpers
`useWorkspace()` SHALL return `getUrl(productName, appId, endpointName?, endpointParameters?)` returning an `Observable<string>` and `doesUrlExistFor(productName, appId, endpointName?)` returning an `Observable<boolean>`, both derived from `currentWorkspace$` of the surrounding `AppStateProvider`, delegating to `constructRouteUrl` and `doesUrlExistForWorkspace` and using the logger's `warn` for diagnostics.

#### Scenario: URL resolution
- **WHEN** `getUrl` is subscribed
- **THEN** it emits a string for each workspace emission

#### Scenario: Existence check
- **WHEN** `doesUrlExistFor` is subscribed
- **THEN** it emits a boolean for each workspace emission

### Requirement: Shell capability registration and check
`setCapabilities(capabilities)` SHALL register the host's `ShellCapability` list globally by delegating to `setShellCapabilities`; `useShellCapability()` SHALL return `{ hasCapability }` where `hasCapability(capability)` delegates to `hasShellCapability`.

#### Scenario: Register
- **WHEN** `setCapabilities(caps)` is called
- **THEN** `setShellCapabilities(caps)` is invoked

#### Scenario: Check
- **WHEN** `hasCapability(ShellCapability.PARAMETERS_TOPIC)` is called
- **THEN** the result of `hasShellCapability` for that capability is returned

### Requirement: Public entry point surface
The package entry point SHALL export the contexts, providers, hooks, `CONFIG_KEY`, `POLYFILL_SCOPE_MODE` and `useTopic`. Mocks, the default-language constant and the logger SHALL NOT be exported.

#### Scenario: Imports
- **WHEN** a consumer imports from `@onecx/react-integration-interface`
- **THEN** `useTopic`, `useAppState`, `useTheme`, `useWorkspace`, `setCapabilities` and `useShellCapability` are available
