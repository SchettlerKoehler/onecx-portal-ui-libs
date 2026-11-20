# react-webcomponents-synced-router Specification

## Purpose
Keeps a React Router `BrowserRouter` in a microfrontend in sync with the shell's current-location topic so navigation inside and outside the MFE stays consistent.

## Requirements

### Requirement: Synced router provider
`SyncedRouterProvider` SHALL render its children inside a `BrowserRouter` and provide the current location payload (`CurrentLocationTopicPayload`: `url`, `isFirst`) through `SyncedLocationContext`, initialised to the router pathname with `isFirst: false`.

#### Scenario: Initial value
- **WHEN** the provider mounts at `/a`
- **THEN** the context value is `{ url: '/a', isFirst: false }`

### Requirement: Inbound location sync
The provider SHALL subscribe to `CurrentLocationTopic` and, for emissions whose URL differs from the current pathname, update the context value without navigating or re-publishing it. Emissions SHALL be ignored when the URL is neither empty nor `/` and does not start with the document's `<base href>` (normalised to a trailing slash, default `/`).

#### Scenario: Shell navigates
- **WHEN** the topic emits a URL under the base href that differs from the pathname
- **THEN** the context updates with that URL and `isFirst`
- **AND** the URL is not published back

#### Scenario: Foreign URL
- **WHEN** the emitted URL is outside the base href
- **THEN** it is ignored

> Note (code-derived): the provider does not call `navigate()`; it relies on the shell updating `window.location`.

### Requirement: Outbound location sync
When the router pathname changes and differs from the synced URL (and is not the target of an inbound sync), the provider SHALL publish `{ url: pathname, isFirst: false }` to `CurrentLocationTopic`; publish failures SHALL be logged and not thrown.

#### Scenario: Internal navigation
- **WHEN** the user navigates within the MFE
- **THEN** the new pathname is published

#### Scenario: Echo suppression
- **WHEN** the pathname reaches the target of an inbound topic update
- **THEN** nothing is published and the guard is cleared

### Requirement: Synced location hook
`useSyncedLocation()` SHALL return the current synced location payload and MUST throw an error stating it must be used within a `SyncedRouterProvider` (hinting at the `withApp` HOC) when no provider exists.

#### Scenario: Outside provider
- **WHEN** called without provider
- **THEN** it throws

### Requirement: HOC wrapper
`withSyncedRouter(Component)` SHALL return a component that renders `Component` with unchanged props inside `SyncedRouterProvider`.

#### Scenario: Wrapping
- **WHEN** a wrapped component renders
- **THEN** `useSyncedLocation()` works inside it
