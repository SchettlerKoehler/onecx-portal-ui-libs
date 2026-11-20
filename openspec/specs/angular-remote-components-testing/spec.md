# angular-remote-components-testing Specification

## Purpose
Test helpers for applications using slots: `SlotHarness` (testing entry point) and `SlotServiceMock` (mocks entry point).

## Requirements

### Requirement: SlotHarness lookup
`SlotHarness` SHALL match `ocx-slot` elements and be filterable via `SlotHarness.with({ name })` using string matching on the slot name.

#### Scenario: Filter by name
- **WHEN** `with({ name: 'a' })` is used
- **THEN** only the slot with `name="a"` matches

### Requirement: SlotHarness inspection
`getName()` SHALL return the `name` attribute or `null`. `getElement(tagName)` SHALL return the first matching element in the document root or `null`. `getComponentCssProperty(tagName, property)` SHALL return the CSS value or `''` if the element is missing. `getComponentClasses(tagName)` SHALL return the class list or `[]` if the element is missing or has no classes.

#### Scenario: Missing element
- **WHEN** the tag is not found
- **THEN** `''` / `[]` / `null` are returned respectively

> Note (code-derived): `getElement` searches the whole document, not only inside the slot.

### Requirement: Slot service mock
`provideSlotServiceMock(initialAssignments?)` SHALL provide `SLOT_SERVICE` as `SlotServiceMock` and the assignments under `SLOT_SERVICE_MOCK_ASSIGNMENTS`. `getComponentsForSlot` SHALL emit the configured list for the slot (or `[]`), `isSomeComponentDefinedForSlot` SHALL emit whether the slot has entries, and `assignComponents(assignments)` SHALL push new assignments to subscribers.

#### Scenario: Assign later
- **WHEN** `assignComponents({ s: [cfg] })` is called
- **THEN** subscribers of slot `s` receive `[cfg]`

> Note (code-derived): the mock uses a plain `Subject`, so subscribers that subscribe after initial assignments do not receive them; it does not implement `init()`.
