# integration-interface-resized-events Specification

## Purpose
`ResizedEventsTopic` lets slot and slot-group owners publish size changes only when some consumer has asked for them. Used by remote component slots and their listeners.

## Requirements

### Requirement: Topic definition and event types
`ResizedEventsTopic` SHALL be registered as `resizedEvents` version 1 without retained state. `ResizedEventType` MUST have `slot_resized`, `slot_group_resized` and `requested_events_changed`. `TopicResizedEventType` SHALL be a `SlotResizedEvent` (payload `slotName`, `slotDetails {width,height}`), a `SlotGroupResizedEvent` (payload `slotGroupName`, `slotGroupDetails {width,height}`) or a `RequestedEventsChangedEvent` (payload `type`, `name`).

#### Scenario: Slot resized event shape
- **WHEN** a slot event is built
- **THEN** it has `type: slot_resized` and a payload with `slotName` and numeric `width`/`height`

### Requirement: Global registry initialization
Constructing `ResizedEventsTopic` SHALL ensure `window['@onecx/integration-interface'].resizedEvents` exists.

#### Scenario: Window properties
- **WHEN** a `ResizedEventsTopic` is created
- **THEN** `window['@onecx/integration-interface']['resizedEvents']` is defined

### Requirement: Request events for an entity
`ResizedEventsTopic.requestEvent(eventType, entityName)` SHALL add `entityName` to the registry list of `eventType` (`slot_resized` or `slot_group_resized`) and SHALL publish a `requested_events_changed` event whose payload contains the requested type and name, so listeners get an initial update.

#### Scenario: Request slot events
- **WHEN** `requestEvent(SLOT_RESIZED, 'test-slot')` is called
- **THEN** the registry list for `slot_resized` contains `test-slot`
- **AND** subscribers receive one `requested_events_changed` event with payload type `slot_resized` and name `test-slot`

> Note (code-derived): repeated requests push duplicate names into the list; there is no unregister.

### Requirement: Publish filtering
`ResizedEventsTopic.publish` SHALL forward `slot_resized` and `slot_group_resized` events only when their slot (or slot group) name was previously requested; otherwise it SHALL resolve without publishing. Other events (e.g. `requested_events_changed`) SHALL always be published.

#### Scenario: Requested slot
- **WHEN** `test-slot` was requested and a `slot_resized` event for it is published
- **THEN** subscribers receive that event

#### Scenario: Unrequested slot group
- **WHEN** a `slot_group_resized` event for a never requested group is published
- **THEN** no event reaches subscribers

#### Scenario: Request-changed passthrough
- **WHEN** a `requested_events_changed` event is published
- **THEN** it reaches subscribers unchanged
