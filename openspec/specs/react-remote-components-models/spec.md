# react-remote-components-models Specification

## Purpose
Defines the public types and interfaces of `@onecx/react-remote-components` that describe remote component configuration, slot service contracts and the contract a remote component must fulfil. Used by remote component authors and by shell/host applications.

## Requirements

### Requirement: Remote component configuration shape
The system SHALL export the type `RemoteComponentConfig` with the string fields `appId`, `productName`, `baseUrl` and the string array `permissions`.

#### Scenario: Config handed to a remote component
- **WHEN** a slot creates a remote component element
- **THEN** the element's `ocxRemoteComponentConfig` property holds an object with `appId`, `productName`, `baseUrl` and `permissions`

### Requirement: Remote web component contract
The system SHALL export the interface `ocxRemoteWebcomponent` declaring a property `ocxRemoteComponentConfig` of type `RemoteComponentConfig`, and the interface `ocxRemoteComponent` declaring a method `ocxInitRemoteComponent(config: RemoteComponentConfig): void`.

#### Scenario: Web component receives config
- **WHEN** a custom element implements `ocxRemoteWebcomponent`
- **THEN** the host can assign the configuration via `ocxRemoteComponentConfig`

#### Scenario: Component with init method
- **WHEN** a component implements `ocxRemoteComponent`
- **THEN** it exposes `ocxInitRemoteComponent` accepting a `RemoteComponentConfig`

### Requirement: Slot service types
The system SHALL export `RemoteComponentInfo` (`appId`, `productName`, `baseUrl`, `technology`, optional `elementName`), `SlotComponentConfiguration` (`componentType`, `remoteComponent`, `permissions`, where `componentType` and `permissions` may be promises or plain values) and `SlotServiceInterface` (`remoteComponents$`, `getComponentsForSlot`, `isSomeComponentDefinedForSlot`, `loadComponent`).

#### Scenario: Consumers type the slot service
- **WHEN** a consumer obtains the result of `useSlot`
- **THEN** it conforms to `SlotServiceInterface`
- **AND** `getComponentsForSlot(slotName)` returns an `Observable<SlotComponentConfiguration[]>`
