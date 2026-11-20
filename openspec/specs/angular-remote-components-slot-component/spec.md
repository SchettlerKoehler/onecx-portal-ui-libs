# angular-remote-components-slot-component Specification

## Purpose
The `SlotComponent` (`ocx-slot`) lets a host application declare a named extension point and renders the remote components (Angular or web components) that the platform assigned to that slot. Used by host applications and shell code.

## Requirements

### Requirement: Slot name and host attribute
The system SHALL require a `name` input on `ocx-slot` and SHALL reflect it as the `name` attribute on the host element.

#### Scenario: Name reflected
- **WHEN** `<ocx-slot name="my-slot">` is rendered
- **THEN** the host element has attribute `name="my-slot"`

### Requirement: Missing slot service
If the `SLOT_SERVICE` token is not provided, the component SHALL log an error on init and SHALL NOT render any component.

#### Scenario: No SLOT_SERVICE
- **WHEN** `ngOnInit` runs and no `SLOT_SERVICE` is injectable
- **THEN** an error is logged and no components are created

> Note (code-derived): the error message interpolates `this.name` (the signal function) instead of `this.name()`.

### Requirement: Component discovery on init
On init the component SHALL request the components for its slot name from the slot service and SHALL create components only from the first emission (`take(1)`); later changes to the slot assignment are not applied.

#### Scenario: Components assigned
- **WHEN** the slot service emits a list of component configurations
- **THEN** one placeholder `span[data-index]` per entry is appended first, and each entry is then resolved and created

#### Scenario: No components assigned
- **WHEN** the slot service emits an empty list
- **THEN** nothing is created

### Requirement: Ordered creation
Components SHALL appear in slot order regardless of the order in which their types and permissions resolve; each placeholder span marks the position and is removed once its component is created.

#### Scenario: Multiple components
- **WHEN** several components are assigned to a slot
- **THEN** they are rendered in the assignment order

#### Scenario: Placeholder span missing
- **WHEN** the placeholder span for an index cannot be found
- **THEN** an error is logged that ordering may be incorrect and the component is still created (web components are appended to the end)

### Requirement: Angular remote component creation
When a configuration has a resolved `componentType`, the system SHALL instantiate it in the slot's view container, set `data-style-id="<productName>|<appId>"` and `data-style-isolation` on its host element, load the application styles for the remote component, and run change detection. If the instance has an `ocxInitRemoteComponent` method it SHALL be called with `{ appId, productName, baseUrl, permissions }`.

#### Scenario: Remote component with init method
- **WHEN** an Angular remote component implementing `ocxRemoteComponent` is created
- **THEN** `ocxInitRemoteComponent` receives appId, productName, baseUrl and the resolved permissions

### Requirement: Web component creation
When no `componentType` resolves and the technology is `WebComponentModule` or `WebComponentScript` and `elementName` is defined, the system SHALL create a DOM element with that tag name, set the same style attributes, and set the property `ocxRemoteComponentConfig` to `{ appId, productName, baseUrl, permissions }`.

#### Scenario: Web component script
- **WHEN** a configuration has technology `WebComponentScript` and an `elementName`
- **THEN** an element of that name is inserted at the component's position with `ocxRemoteComponentConfig` set

### Requirement: Skipped components
The system SHALL NOT create a component when its `componentType` is falsy and it is not a web component with an element name.

#### Scenario: Load failed
- **WHEN** `componentType` resolves to `undefined` for an Angular technology entry
- **THEN** no component is created

### Requirement: Inputs and outputs propagation
The `inputs` and `outputs` model inputs (default `{}`) SHALL be applied to every created component whenever components, `inputs` or `outputs` change. For Angular components values are set with `setInput`; for web components they are assigned as element properties. Outputs may be `EventEmitter` or `OutputEmitterRef` instances and are passed the same way as inputs.

#### Scenario: Inputs updated after creation
- **WHEN** the host changes `inputs` after the components were created
- **THEN** all created components receive the new values

### Requirement: Slot size events
The component SHALL observe its host element size and publish a `SLOT_RESIZED` event (`slotName`, `slotDetails{width,height}`) on the `ResizedEventsTopic`, debounced by 100 ms. The initial value is `-1 x -1`. When a `REQUESTED_EVENTS_CHANGED` event requests `SLOT_RESIZED` for this slot's name, the component SHALL publish the current size immediately.

#### Scenario: Debounced changes
- **WHEN** several size changes occur within 100 ms
- **THEN** only the last size is published

#### Scenario: Event requested
- **WHEN** a requested-events-changed event names this slot
- **THEN** the current size is published

### Requirement: Cleanup
On destroy the component SHALL destroy its resized-events topic, unsubscribe all subscriptions, disconnect the resize observer, remove the remote-component style usages for each assigned component (scope from productName and appId, slot name) and clear the view container.

#### Scenario: Destroy
- **WHEN** the component is destroyed
- **THEN** the above cleanup is performed
