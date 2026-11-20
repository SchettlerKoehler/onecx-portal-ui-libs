# angular-remote-components-models-and-module Specification

## Purpose
Public contracts, module and helpers of `@onecx/angular-remote-components` that remote components and host applications use.

## Requirements

### Requirement: Remote component interfaces
The library SHALL export `ocxRemoteComponent` (method `ocxInitRemoteComponent(config: RemoteComponentConfig)`) for Angular remote components and `ocxRemoteWebcomponent` (property `ocxRemoteComponentConfig: RemoteComponentConfig`) for web components, and SHALL re-export `RemoteComponentConfig` and `REMOTE_COMPONENT_CONFIG` from `@onecx/angular-utils`.

#### Scenario: Config delivery
- **WHEN** a slot creates a component
- **THEN** the configuration is passed through the method (Angular) or property (web component) matching the interface

### Requirement: AngularRemoteComponentsModule
`AngularRemoteComponentsModule` SHALL declare and export `SlotComponent` and provide `SLOT_SERVICE` as an alias of `SlotService`.

#### Scenario: Import module
- **WHEN** a module imports `AngularRemoteComponentsModule`
- **THEN** `<ocx-slot>` is usable and wired to `SlotService`

### Requirement: Deprecated translate provider
`provideTranslateServiceForRoot(config = {})` (deprecated) SHALL return ngx-translate default providers with no-op compiler and loader, the default parser and the default missing translation handler, with entries of `config` overriding these defaults.

#### Scenario: Override loader
- **WHEN** a custom loader is passed in `config`
- **THEN** it replaces the no-op loader

### Requirement: Version
The library SHALL not expose behavior in `version.ts` to consumers other than the internal `LIB_VERSION` constant.

#### Scenario: Not exported
- **WHEN** the public index is inspected
- **THEN** `version` is not exported
