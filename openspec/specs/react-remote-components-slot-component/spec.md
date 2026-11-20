# react-remote-components-slot-component Specification

## Purpose
`SlotComponent` renders the remote components registered for a named slot in the OneCX platform, creating their custom elements and passing configuration, inputs and outputs. Used by host React microfrontends; requires `withSlot` or the providers.

## Requirements

### Requirement: Slot placeholders
`SlotComponent` (props `name`, optional `inputs`, `outputs`, `skeleton`) SHALL render a wrapper `div` containing one container `div` (id `slot-<index>`) per component currently resolved for slot `name`, each initially showing the `skeleton` node.

#### Scenario: Components resolved
- **WHEN** the slot service emits N components for `name`
- **THEN** N placeholder containers with the skeleton are rendered

#### Scenario: Update
- **WHEN** the components observable emits a new list
- **THEN** the rendered containers are updated

### Requirement: Provider required
`SlotComponent` MUST throw when rendered outside a `SlotProvider` (via `useSlot`).

#### Scenario: No provider
- **WHEN** rendered without `SlotProvider`
- **THEN** the `useSlot` error is thrown

> Note (code-derived): the in-component `slotService` falsy check that logs `SLOT_SERVICE token was not provided...` is only reachable if `useSlot` returns a falsy value.

### Requirement: Element creation
For each resolved component whose `componentType` (awaited) is truthy, the system SHALL create a custom element named `remoteComponent.elementName`, set `ocxRemoteComponentConfig` to `{ appId, productName, baseUrl, permissions }` (permissions awaited), set `data-style-id` to `<productName>|<appId>` and an empty `data-style-isolation` attribute, and append it to the matching container. This SHALL happen only when the number of containers equals the number of components.

#### Scenario: Loaded component
- **WHEN** `componentType` resolves to a truthy value
- **THEN** the element is appended with config and style attributes

#### Scenario: Falsy component type
- **WHEN** `componentType` is falsy or resolves falsy (e.g. load failure)
- **THEN** no element is created

### Requirement: Reuse of existing element
If the container already contains an element matching `elementName`, the system SHALL reuse it instead of creating a new one.

#### Scenario: Existing element
- **WHEN** the container already holds the element
- **THEN** no second element is appended

### Requirement: Inputs and outputs
The system SHALL assign every entry of `inputs` and `outputs` as properties on the created elements.

#### Scenario: Input applied
- **WHEN** `inputs={{ foo: 1 }}`
- **THEN** the created element has property `foo` equal to `1`

> Note (code-derived): inputs/outputs are held in `BehaviorSubject`s initialised from the first render and never updated on later prop changes, so changed props are not re-applied. Assigned-component and view-container registries are module-level, shared across slot instances.

### Requirement: Cleanup
On unmount the system SHALL unsubscribe from observables and remove its containers and created elements from the shared registries.

#### Scenario: Unmount
- **WHEN** the component unmounts
- **THEN** subscriptions end and its registries are cleaned

### Requirement: Observable errors
Errors from the components observable SHALL be logged with `console.error` (`Error in slot components observable:`) and not thrown.

#### Scenario: Error emission
- **WHEN** the components observable errors
- **THEN** the error is logged

### Requirement: Template and appearance - Slot DOM structure
`SlotComponent` (`name`, `inputs`, `outputs`, optional `skeleton`) SHALL render a plain wrapper `<div>` (no class, no styles) containing one child per entry of the slot's components list: `<div id="slot-{index}" key="slot component: {index}">` whose initial content is the `skeleton` node (or empty). Remote component elements are appended into these `div`s by `document.createElement(elementName)` and carry the attributes `data-style-id="{productName}|{appId}"` and `data-style-isolation=""` (set via `dataset.styleId` / `dataset.styleIsolation`); the element receives the property `ocxRemoteComponentConfig = { appId, productName, baseUrl, permissions }`. The component defines no CSS, no ARIA attributes and no `data-testid`.

#### Scenario: Two components
- **WHEN** the slot resolves two components
- **THEN** the DOM is `div > div#slot-0 + div#slot-1`, each holding the skeleton until its custom element is appended

#### Scenario: Loaded element attributes
- **WHEN** a component of product `p` and app `a` is created
- **THEN** the child element has `data-style-id="p|a"` and the empty attribute `data-style-isolation`

#### Scenario: No components
- **WHEN** the slot has no components
- **THEN** only the empty outer `<div>` is rendered and no skeleton is shown

> Note (code-derived): the skeleton is rendered once per component placeholder, not once per slot, and is never removed explicitly; it stays as sibling content next to the appended element.

### Requirement: Template and appearance - withSlot wrapper
`withSlot(Component)` SHALL render `<PermissionProvider><SlotProvider><Component {...props}/></SlotProvider></PermissionProvider>` without adding any DOM element.

#### Scenario: Wrapped tree
- **WHEN** a component is wrapped with `withSlot`
- **THEN** the rendered DOM equals the component's own DOM
