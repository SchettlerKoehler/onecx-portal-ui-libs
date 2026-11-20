# react-utils-style-attributes Specification

## Purpose
Shared constants for the data attributes (and their dataset keys) used to mark style scopes, isolation boundaries and theme/layout style elements. Duplicated from the Angular utils to avoid pulling in heavy dependencies.

## Requirements

### Requirement: Shell scope id
The system SHALL export `shellScopeId` with value `'shell-ui'`.

#### Scenario: Value
- **WHEN** `shellScopeId` is read
- **THEN** it equals `'shell-ui'`

### Requirement: Dataset keys
The system SHALL export dataset keys: `dataStyleIdKey` (`styleId`), `dataStyleIsolationKey` (`styleIsolation`), `dataNoPortalLayoutStylesKey` (`noPortalLayoutStyles`), `dataMfeElementKey` (`mfeElement`), `dataIntermediateStyleIdKey`, `dataIntermediateMfeElementKey`, `dataIntermediateStyleIsolationKey`, `dataIntermediateNoPortalLayoutStylesKey`, `dataVariableOverrideIdKey` (`VariableOverrideId`), `dataPortalLayoutStylesKey` (`portalLayoutStylesStyles`) and `dataDynamicPortalLayoutStylesKey` (`dynamicContentPortalLayoutStyles`).

#### Scenario: Keys exported
- **WHEN** a consumer imports the keys
- **THEN** they have the values above (intermediate keys are the camelCase `intermediate...` names)

### Requirement: HTML attribute names
The system SHALL export the matching attribute names: `dataStyleIdAttribute` (`data-style-id`), `dataMfeElementAttribute` (`data-mfe-element`), `dataStyleIsolationAttribute` (`data-style-isolation`), `dataNoPortalLayoutStylesAttribute` (`data-no-portal-layout-styles`), `dataIntermediateStyleIdAttribute` (`data-intermediate-style-id`), `dataIntermediateMfeElementAttribute`, `dataIntermediateStyleIsolationAttribute`, `dataIntermediateNoPortalLayoutStylesAttribute`, `dataVariableOverrideIdAttribute` (`data-variable-override-id`) and `dataPortalLayoutStylesAttribute` (`data-portal-layout-styles`).

#### Scenario: Attributes exported
- **WHEN** a consumer imports the attribute constants
- **THEN** they have the kebab-case `data-*` values above

> Note (code-derived): no attribute constant exists for `dataDynamicPortalLayoutStylesKey`.
