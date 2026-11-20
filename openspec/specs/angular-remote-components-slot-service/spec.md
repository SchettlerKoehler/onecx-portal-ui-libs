# angular-remote-components-slot-service Specification

## Purpose
`SlotService` resolves which remote components are assigned to a named slot, loads them via module federation and attaches their permissions. It is consumed by `SlotComponent` through the `SLOT_SERVICE` token.

## Requirements

### Requirement: Slot service contract
The system SHALL export the `SLOT_SERVICE` injection token and the `SlotServiceInterface` (`init()`, `getComponentsForSlot(slotName)`, `isSomeComponentDefinedForSlot(slotName)`) plus the types `RemoteComponentInfo` and `SlotComponentConfiguration` (`componentType`, `remoteComponent`, `permissions`, the latter two possibly promises).

#### Scenario: Token binding
- **WHEN** `AngularRemoteComponentsModule` is imported
- **THEN** `SLOT_SERVICE` resolves to the existing `SlotService`

### Requirement: Initialization
`SlotService.init()` SHALL resolve immediately without side effects.

#### Scenario: init
- **WHEN** `init()` is called
- **THEN** the returned promise resolves

### Requirement: Components for a slot
`getComponentsForSlot(slotName)` SHALL map the `RemoteComponentsTopic` messages to the ordered list of remote components named in the slot mapping with that name, in the order of the mapping, silently dropping names without a component definition. Each entry SHALL carry a lazily started `componentType` load and the `permissions` obtained from `PermissionService` for the component's `appId` and `productName`. The observable SHALL use `shareReplay`.

#### Scenario: Unknown slot
- **WHEN** no slot mapping matches the name
- **THEN** an empty array is emitted

#### Scenario: Dangling component name
- **WHEN** a slot lists a component name not present in `components`
- **THEN** that name is skipped

### Requirement: Slot occupancy
`isSomeComponentDefinedForSlot(slotName)` SHALL emit `true` iff a slot mapping with that name has at least one component.

#### Scenario: Empty mapping
- **WHEN** the slot exists with an empty component list
- **THEN** `false` is emitted

> Note (code-derived): unlike `getComponentsForSlot`, this method does not guard against a missing `slots` array.

### Requirement: Remote loading
For each component the system SHALL load the remote entry through the shell's module federation instance. For `Technologies.Angular` it SHALL return the export named like `exposedModule` without a leading `./`. For other technologies (web components) it SHALL return `undefined`, since the element is created by the slot. Failures SHALL be logged and result in `undefined`, including when no shell module federation instance exists.

#### Scenario: Angular remote
- **WHEN** `exposedModule` is `./MyComponent`
- **THEN** the export `MyComponent` of the loaded module is the component type

#### Scenario: Load error
- **WHEN** loading throws
- **THEN** an error is logged and `componentType` is `undefined`

### Requirement: Teardown and topic override
On destroy the service SHALL destroy its `RemoteComponentsTopic` if created. The topic is created lazily and may be replaced via the `remoteComponents$` setter.

#### Scenario: Destroy
- **WHEN** the service is destroyed
- **THEN** the topic is destroyed
