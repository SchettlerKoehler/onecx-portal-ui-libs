# react-utils-composition Specification

## Purpose
Higher-order components and helpers for composing the providers a OneCX React microfrontend or remote component needs: app globals, base platform providers, style isolation and theme registry. Used when bootstrapping apps (`withApp`) and remote components (`withRemote`).

## Requirements

### Requirement: composeProviders
`composeProviders(...providers)` SHALL return a function that wraps a component with all given provider HOCs so that the first provider is the outermost wrapper and the last is applied directly to the component (providers are applied right to left).

#### Scenario: No providers
- **WHEN** no providers are given
- **THEN** the component is returned unchanged

#### Scenario: Order
- **WHEN** providers A, B, C are given
- **THEN** the rendered tree is A(B(C(Component)))

### Requirement: App globals
`AppGlobals` SHALL contain `PRODUCT_NAME`. `withAppGlobals(Component, appGlobals)` SHALL return a component that renders `Component` inside an app-globals context provider with the given value and sets `displayName` to `withAppGlobals(<displayName|name|'Component'>)`. `useAppGlobals()` SHALL return the provided globals and MUST throw `Error('useAppGlobals must be used within an AppGlobalsProvider')` outside a provider.

#### Scenario: Provided globals
- **WHEN** a wrapped component calls `useAppGlobals()`
- **THEN** it receives the `appGlobals` object

#### Scenario: Missing provider
- **WHEN** `useAppGlobals()` is used outside a wrapped tree
- **THEN** it throws the error above

#### Scenario: Display name fallback
- **WHEN** the wrapped component has neither `displayName` nor `name`
- **THEN** the display name is `withAppGlobals(Component)`

### Requirement: withBaseProviders
`withBaseProviders(Component)` SHALL render `Component` inside, from outermost to innermost, `AppStateProvider`, `ConfigurationProvider`, `SyncedRouterProvider` and `UserProvider`, together with a `TranslationBridge` sibling rendered before the component, and SHALL forward all props. Importing it also loads the dynamic-scoping portal patch (see `react-utils-dynamic-scoping`).

#### Scenario: Providers present
- **WHEN** a component wrapped with `withBaseProviders` is rendered
- **THEN** app state, configuration, synced router and user providers and the translation bridge are active around it

### Requirement: withApp
`withApp(Component, appGlobals)` SHALL compose, outermost to innermost: `withAppGlobals`, `withAppPrimereactStylesIsolation`, `withAppStyles`, `withBaseProviders`.

#### Scenario: Composition order
- **WHEN** an app component is wrapped with `withApp`
- **THEN** globals are available to the style isolation provider, which wraps the theme registry, which wraps the base providers

### Requirement: withRemote
`withRemote(Component, appGlobals)` SHALL compose, outermost to innermost: `withAppGlobals`, `withRemoteStyles`, `withRemotesPrimereactStylesIsolation`, `withBaseProviders`.

#### Scenario: Remote composition
- **WHEN** a remote component is wrapped with `withRemote`
- **THEN** it is rendered with globals, theme registry, remote PrimeReact isolation and base providers in that order

### Requirement: Style HOCs
`withAppStyles` and `withRemoteStyles` SHALL wrap a component in `StyleRegistry`. `withAppPrimereactStylesIsolation` SHALL wrap a component in `AppPrimeReactStyleProvider`, and `withRemotesPrimereactStylesIsolation` SHALL wrap it in `RemotesPrimeReactStyleProvider`. Props MUST be forwarded unchanged.

#### Scenario: Props forwarded
- **WHEN** a component wrapped by any of these HOCs receives props
- **THEN** the inner component receives the same props
