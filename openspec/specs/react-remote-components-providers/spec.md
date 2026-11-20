# react-remote-components-providers Specification

## Purpose
Provides the React contexts and providers (`PermissionContext`, `PermissionProvider`, `SlotContext`, `SlotProvider`) that resolve remote components registered for slots and the permissions of those components. Used by host microfrontends rendering slots.

## Requirements

### Requirement: Permission context default
`PermissionContext` SHALL default to `undefined` when no `PermissionProvider` is an ancestor.

#### Scenario: Outside provider
- **WHEN** a component reads `PermissionContext` without a `PermissionProvider`
- **THEN** the value is `undefined`

### Requirement: Permission retrieval via topic
`PermissionProvider` SHALL render its children and provide a context value with `getPermissions(appId, productName)` returning a `Promise<string[]>`. On a request it SHALL publish `{ appId, productName }` on the `PermissionsRpcTopic` and resolve with the `permissions` array of the first topic message whose `appId` and `productName` match and whose `permissions` is an array.

#### Scenario: Permissions resolved
- **WHEN** `getPermissions('app', 'prod')` is called
- **THEN** a request `{ appId: 'app', productName: 'prod' }` is published
- **AND** the promise resolves with the permissions of the matching response

#### Scenario: Unrelated messages ignored
- **WHEN** messages for other `appId`/`productName` pairs or without a permissions array arrive
- **THEN** they do not resolve the pending promise

### Requirement: Permission caching
`PermissionProvider` SHALL cache the promise per `appId:productName` key, so repeated calls for the same pair return the cached promise without publishing again, while different pairs are requested independently.

#### Scenario: Same key twice
- **WHEN** `getPermissions` is called twice with the same `appId` and `productName`
- **THEN** only one request is published

#### Scenario: Different keys
- **WHEN** `getPermissions` is called with different pairs
- **THEN** each pair triggers its own request

> Note (code-derived): the cache is never invalidated and a never-answered request stays pending forever.

### Requirement: Slot context default
`SlotContext` SHALL default to `undefined` outside a `SlotProvider`.

#### Scenario: Outside provider
- **WHEN** a component reads `SlotContext` without a `SlotProvider`
- **THEN** the value is `undefined`

### Requirement: Slot provider context shape
`SlotProvider` SHALL provide a `SlotServiceInterface` value containing `remoteComponents$`, `getComponentsForSlot`, `isSomeComponentDefinedForSlot` and `loadComponent`. It requires a `PermissionProvider` ancestor (it uses `usePermission`).

#### Scenario: Shape
- **WHEN** a child reads `SlotContext` inside `SlotProvider`
- **THEN** the four members are present

### Requirement: Resolve components for a slot
`getComponentsForSlot(slotName)` SHALL emit, for each update of the `RemoteComponentsTopic`, an array of `SlotComponentConfiguration` for the components listed in the slot named `slotName`, in the slot's listed order. Component names not present in the topic's `components` SHALL be skipped. An unknown slot SHALL yield an empty array. Each entry SHALL contain `componentType` (promise from `loadComponent`), `remoteComponent` and `permissions` (promise from `getPermissions(appId, productName)`).

#### Scenario: Matching components
- **WHEN** a slot lists components that exist in the topic
- **THEN** one configuration per component is emitted

#### Scenario: Unknown or unlisted
- **WHEN** the slot name is unknown, or a component exists but is not listed in the slot
- **THEN** no configuration is emitted for it

### Requirement: Remote registration
For each resolved component `getComponentsForSlot` SHALL register a remote with the shell module federation instance using `name = appId`, `entry = remoteEntryUrl`, with `force: true`, and `type` `'module'` for technology `WebComponentModule` and `'script'` otherwise.

#### Scenario: Web component module
- **WHEN** a component has technology `WebComponentModule`
- **THEN** its remote is registered with type `module`

#### Scenario: Other technologies
- **WHEN** a component has technology such as React
- **THEN** its remote is registered with type `script`

### Requirement: Angular components rejected
`getComponentsForSlot` SHALL fail the emission with an error `Remote component "<name>" cannot be loaded in React.` when a component has technology `Angular`.

#### Scenario: Angular component
- **WHEN** a slot contains an Angular component
- **THEN** the observable errors with that message

### Requirement: Missing shell instance
When the shell module federation instance cannot be found, `getComponentsForSlot` SHALL log an error and return an observable emitting an empty array, and `loadComponent` SHALL log an error and resolve `undefined`.

#### Scenario: No shell instance
- **WHEN** no federation instance named `onecx-shell-ui` or `onecx_shell_ui` exists
- **THEN** `getComponentsForSlot` emits `[]`
- **AND** `loadComponent` resolves `undefined`

### Requirement: Slot occupancy check
`isSomeComponentDefinedForSlot(slotName)` SHALL emit `true` when a slot with that name has at least one component, otherwise `false` (unknown slot or empty component list).

#### Scenario: Occupied, empty, unknown
- **WHEN** the slot has components, has none, or does not exist
- **THEN** it emits `true`, `false`, `false` respectively

### Requirement: Load a remote module
`loadComponent(component)` SHALL load `<appId>/<exposedModule>` via the shell module federation instance, stripping a leading `./` from `exposedModule`, and resolve with the loaded module. If loading fails it SHALL log an error and resolve `undefined`.

#### Scenario: Prefix stripped
- **WHEN** `exposedModule` is `./Foo`
- **THEN** `loadRemote('<appId>/Foo')` is called

#### Scenario: Load failure
- **WHEN** `loadRemote` rejects
- **THEN** an error is logged and `undefined` is returned

### Requirement: Shell instance lookup
The shell module federation instance SHALL be the first entry of `globalThis.__FEDERATION__.__INSTANCES__` whose name is `onecx-shell-ui` or `onecx_shell_ui`; if the instance list is missing, not an array, or has no match, it SHALL be `undefined`.

#### Scenario: Lookup
- **WHEN** multiple matching instances exist
- **THEN** the first is used
- **AND** with none, no instance is found
> Note (code-derived): `getShellMfInstance` is internal and not exported from the index.
