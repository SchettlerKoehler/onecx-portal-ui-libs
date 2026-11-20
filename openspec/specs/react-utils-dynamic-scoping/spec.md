# react-utils-dynamic-scoping Specification

## Purpose
Ensures PrimeReact overlay content rendered through React portals keeps the style scope of the app/remote that triggered it, by propagating intermediate style data attributes. Loaded as a side effect of `withBaseProviders`.

## Requirements

### Requirement: Style data lookup
The system SHALL find the closest element (starting at the node itself and walking up parents) having `data-style-id` or `data-intermediate-style-id`, returning `null` for non-HTMLElements or when none exists. `getStyleDataOrIntermediateStyleData(node)` SHALL return `null` if no such element exists or if its `data-style-id` is `shell-ui`; otherwise it SHALL return `StyleData` with the style id (`data-style-id`, falling back to `data-intermediate-style-id`), the no-portal-layout-styles value and the mfe-element value (each falling back to the matching `intermediate` dataset value).

#### Scenario: Shell scope ignored
- **WHEN** the nearest scope element has `data-style-id="shell-ui"`
- **THEN** no style data is returned

#### Scenario: Intermediate fallback
- **WHEN** only `data-intermediate-style-id` is set
- **THEN** it is returned as the style id

### Requirement: Trigger element
`getOnecxTriggerElement()` SHALL return the global `onecxTriggerElement` (undefined if unset, null if set to null).

#### Scenario: Unset
- **WHEN** no global trigger is set
- **THEN** `undefined` is returned

### Requirement: Intermediate style data attributes
`appendIntermediateStyleData(styleData)` SHALL return a props record containing `data-intermediate-style-id` when the style id is non-empty, `data-intermediate-no-portal-layout-styles` when the value is non-empty or an empty string, and `data-intermediate-mfe-element` likewise; fields that are `undefined` are omitted.

#### Scenario: All undefined
- **WHEN** all fields are undefined
- **THEN** `{}` is returned

#### Scenario: Empty string flags
- **WHEN** the no-portal-layout value is `''`
- **THEN** the attribute is included with `''`

### Requirement: Patched createPortal
When loaded, the system SHALL replace `ReactDOM.createPortal` with a wrapper that, when the portal child is a React element whose single child is a React element whose `className` contains `p-` (a PrimeReact class) and a trigger element with style data exists, clones the inner element adding the intermediate style data props derived from the trigger element. In all other cases it SHALL delegate unchanged to the original `createPortal`.

#### Scenario: PrimeReact overlay with trigger
- **WHEN** a portal renders a `p-`-classed element and the trigger sits in a scoped app
- **THEN** the element receives the `data-intermediate-*` attributes

#### Scenario: No trigger
- **WHEN** no trigger element is set
- **THEN** the portal is created unchanged

> Note (code-derived): the patched wrapper reads `className` via `.includes` without a null check, so a matching inner element without `className` would throw.
