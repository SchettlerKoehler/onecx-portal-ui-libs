# angular-utils-style-scoping Specification

## Purpose
Part of `@onecx/angular-utils`. Defines the shared constants and helper functions for style scoping: each OneCX application (shell, microfrontend, remote component) gets its own scope id, CSS variable prefix and `@scope` wrapped CSS, so that the PrimeNG/Optimus theme of one application does not leak into another.

## Requirements

### Requirement: Scoping DOM markers
The library SHALL export dataset keys and matching `data-*` attribute names used to mark scopes: `dataStyleIdKey`/`dataStyleIdAttribute` (`data-style-id`), `dataStyleIsolationKey`/`...Attribute` (`data-style-isolation`, end of a scope), `dataNoPortalLayoutStylesKey`/`...Attribute` (`data-no-portal-layout-styles`), `dataMfeElementKey`/`...Attribute` (`data-mfe-element`), the `dataIntermediate*` variants (`data-intermediate-style-id`, `-mfe-element`, `-style-isolation`, `-no-portal-layout-styles`), `dataVariableOverrideIdKey`/`...Attribute` (`data-variable-override-id`), `dataPortalLayoutStylesKey`/`...Attribute`, `dataDynamicPortalLayoutStylesKey`/`...Attribute` (`data-dynamic-content-portal-layout-styles`), the dynamic container constants (`dataOnecxDynamicContainerKey`, `data-onecx-dynamic-container`, `onecx-dynamic-` / `onecx-dynamic` selector prefixes), `shellScopeId` (`shell-ui`) and the selectors `portalLayoutStylesSheetId` and `dynamicPortalLayoutStylesSheetId`. The `StyleData` interface describes `styleId`, `noPortalLayoutStyles`, `mfeElement`.

#### Scenario: Selector constants
- **WHEN** `portalLayoutStylesSheetId` is read
- **THEN** it equals `[data-style-id]:not([data-no-portal-layout-styles])`

### Requirement: Scope identifier from product and app
`scopeIdFromProductNameAndAppId(productName, appId)` SHALL return `<productName>|<appId>`, logging an error (but still returning the value) when the product name or app id is empty.

#### Scenario: Empty product name
- **WHEN** the product name is `''`
- **THEN** an error is logged and `|<appId>` is returned

### Requirement: Resolving the current scope
`getScopeIdentifier(appStateService, skipStyleScoping?, remoteComponentConfig?)` SHALL resolve `''` when `skipStyleScoping` is truthy (shell); else, if a remote component config subject is given, the scope id from its first emission (`productName`, `appId`); else the scope id from the first `currentMfe$` value of `AppStateService`.

#### Scenario: Shell
- **WHEN** `skipStyleScoping` is true
- **THEN** the result is `''`

#### Scenario: Remote component
- **WHEN** `remoteComponentConfig` emits `{productName: 'p', appId: 'a'}`
- **THEN** the result is `p|a`

### Requirement: CSS variable prefix replacement
`scopeIdentifierToVariablePrefix(scopeId)` SHALL return `--` plus the scope id with every character outside `[a-zA-Z0-9-]` replaced by `-`, plus a trailing `-`. `replaceOptimusPrefix(css, scopeId)` SHALL replace every `--p-` in the CSS by that prefix, and return the CSS unchanged for an empty scope id.

#### Scenario: Prefix
- **WHEN** scope id is `onecx-workspace|onecx-workspace-ui`
- **THEN** `--p-primary` becomes `--onecx-workspace-onecx-workspace-ui-primary`

### Requirement: Scoping Optimus CSS
`scopeOptimusCss(css, scopeId)` SHALL wrap the CSS in `@scope([data-style-id="<id>"][data-no-portal-layout-styles]) to ([data-style-isolation])`, using `shell-ui` as id when `scopeId` is empty. When `CSSScopeRule` is not supported (`isCssScopeRuleSupported()` false) the same selector SHALL be wrapped in `@supports (@scope(...))` instead.

#### Scenario: Unsupported @scope
- **WHEN** `CSSScopeRule` is undefined
- **THEN** the output starts with an `@supports (@scope(` block
