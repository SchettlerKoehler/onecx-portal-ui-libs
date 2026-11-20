# react-utils-theme Specification

## Purpose
Applies runtime OneCX theme variables to scoped style elements and scope roots, and provides a per-product proxy for PrimeReact's style container so style ids are scoped per product. Exposed via `StyleRegistry`, `applyThemeVariables`, `getOrCreateScopedStyleContainer`, `getRealStyleContainer` and `extractComponentName`.

## Requirements

### Requirement: StyleRegistry
`StyleRegistry` SHALL use `PRODUCT_NAME` from app globals to derive the theme style id `<P>|<P>`, render children within a PrimeReact provider with `unstyled: false`, `appendTo: 'self'` and the scoped style container for that id, and subscribe to `CurrentThemeTopic`, calling `applyThemeVariables(theme, themeStyleId)` for each theme. On unmount it SHALL unsubscribe and destroy the topic.

#### Scenario: Theme applied
- **WHEN** a theme is published
- **THEN** `applyThemeVariables` is called with it and the style id

#### Scenario: Cleanup
- **WHEN** unmounted
- **THEN** the subscription is unsubscribed and the topic destroyed

### Requirement: Theme variable mapping
`applyThemeVariables(theme, styleId, queryRoot = document)` SHALL do nothing when `theme.properties` is missing. Otherwise it SHALL flatten all categories of `theme.properties`, keeping only string (trimmed, non-empty), number and boolean values (skipping others and falsy categories), and map each key to a CSS variable: key converted to kebab-case, a leading `app`/`app-` removed, prefixed with `--app-`. Each variable SHALL additionally be provided without the `--app-` prefix (`--<name>`).

#### Scenario: Mapping
- **WHEN** a property `appPrimaryColor: '#fff'` is provided
- **THEN** `--app-primary-color` and `--primary-color` are set to `#fff`

#### Scenario: Unsupported values
- **WHEN** a value is an object or null
- **THEN** it is skipped

#### Scenario: No properties
- **WHEN** the theme has no `properties`
- **THEN** nothing happens and no error is thrown

### Requirement: Applying to scope roots
The variables SHALL be set as inline style properties on all elements matching `[data-style-id]` or `[data-intermediate-style-id]` for the candidate ids: the full style id and, if it contains `|`, the part before `|`.

#### Scenario: Scope root styled
- **WHEN** an element has `data-style-id="app|app"`
- **THEN** it receives the CSS variables inline

### Requirement: Applying to scoped style elements
The system SHALL find `style[data-app-styles="<id>"]` and `style[data-app-primereact-style="<id>"]` elements for the candidate ids and insert into each a block delimited by `/* app-theme-runtime:start */` and `/* app-theme-runtime:end */` containing `@layer tokens { :scope { <variables> } }` and `@layer base {}`. The block SHALL be inserted right after the opening brace of the top-level `@scope(...)` body, or prepended when no body opener exists; a previous runtime block MUST be removed first. If no such style element exists, a warning is logged and only scope roots are updated.

#### Scenario: Re-application
- **WHEN** a theme is applied twice
- **THEN** only one runtime block exists in the style element

#### Scenario: No style elements
- **WHEN** no scoped style element exists
- **THEN** a warning is logged and scope root variables are still applied

#### Scenario: Empty style element
- **WHEN** a scoped style element is empty
- **THEN** it receives just the runtime block

### Requirement: Scoped style container
`getOrCreateScopedStyleContainer(productId)` SHALL return a cached `document.head` Proxy per product id (same instance for same id, different instances for different ids). The proxy SHALL rewrite `data-primereact-style-id="X"` selectors in `querySelector`/`querySelectorAll` to `"<component>-<productId>"`, and when a `<style>` appended through it gets `data-primereact-style-id` set, rename the value to `<component>-<productId>`. Other properties and methods SHALL pass through to `document.head` (functions bound to it); non-style children are appended without registering. Elements not appended through the proxy MUST NOT be renamed.

#### Scenario: Per-product isolation
- **WHEN** two products inject the same PrimeReact component style
- **THEN** each gets its own style element with its own suffixed id and neither finds the other's

#### Scenario: Existing suffix re-scoped
- **WHEN** a style id already carries another product's suffix
- **THEN** it is stripped and the current product's suffix applied

### Requirement: extractComponentName
`extractComponentName(id)` SHALL strip a leading `undefined-` and a `-<X>|<X>` suffix (where the part after `|` repeats before it), returning the bare component name; ids without `|` or without a matching suffix pattern are returned (minus any `undefined-` prefix) unchanged. It MUST be idempotent.

#### Scenario: Suffix removal
- **WHEN** the id is `button-AppA|AppA`
- **THEN** `button` is returned

#### Scenario: Malformed prefix
- **WHEN** the id is `undefined-button`
- **THEN** `button` is returned

### Requirement: getRealStyleContainer
`getRealStyleContainer()` SHALL return the real `document.head`.

#### Scenario: Real head
- **WHEN** called
- **THEN** it returns `document.head`

> Note (code-derived): the first call to `getOrCreateScopedStyleContainer` globally patches `HTMLStyleElement.prototype.setAttribute` (once, idempotent).
