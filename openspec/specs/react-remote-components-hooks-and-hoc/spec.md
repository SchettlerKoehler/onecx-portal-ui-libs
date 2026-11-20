# react-remote-components-hooks-and-hoc Specification

## Purpose
Provides the hooks `useSlot` and `usePermission` and the higher-order component `withSlot` for accessing slot and permission services and for wiring up the required providers in a React microfrontend.

## Requirements

### Requirement: useSlot hook
`useSlot` SHALL return the `SlotServiceInterface` from `SlotContext` and MUST throw `Error('useSlot must be used within a SlotProvider')` when no provider exists.

#### Scenario: Inside provider
- **WHEN** `useSlot` is called under `SlotProvider`
- **THEN** it returns the service exposing `getComponentsForSlot`, `isSomeComponentDefinedForSlot` and `loadComponent`

#### Scenario: Outside provider
- **WHEN** `useSlot` is called without provider
- **THEN** it throws the error above

### Requirement: usePermission hook
`usePermission` SHALL return the permission context value (with `getPermissions`) and MUST throw `Error('usePermission must be used within a PermissionProvider')` when no provider exists. Calls to `getPermissions` SHALL be delegated to the context.

#### Scenario: Inside provider
- **WHEN** `usePermission().getPermissions(appId, productName)` is called
- **THEN** the context's implementation is invoked

#### Scenario: Outside provider
- **WHEN** called without provider
- **THEN** it throws the error above

### Requirement: withSlot higher-order component
`withSlot(Component)` SHALL return a function component that renders `Component` with all props passed through, nested inside `PermissionProvider` (outer) and `SlotProvider` (inner).

#### Scenario: Wrapped component
- **WHEN** the returned component is rendered with props
- **THEN** the wrapped component receives the props
- **AND** both `SlotContext` and `PermissionContext` are available to it
