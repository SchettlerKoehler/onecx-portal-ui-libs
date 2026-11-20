# ngrx-integration-interface-store-state Specification

## Purpose
Defines the NgRx `onecx` feature state, its actions, reducer and selectors that mirror OneCX platform state (location, permissions, config, MFE, page, theme, workspace, app config, user profile) inside an application store.

## Requirements

### Requirement: OneCX state shape
`OneCxState` SHALL be an interface whose optional members are `location`, `permissions`, `config`, `currentMfe`, `currentPage`, `currentTheme`, `currentWorkspace`, `appConfig` and `userProfile`. The reducer's initial state SHALL be `{}`.

#### Scenario: Initial state
- **WHEN** the reducer is invoked with `undefined` state
- **THEN** the state is `{}`

### Requirement: OneCX actions
`OneCxActions` SHALL be an action group with source `OneCX` and events `navigated` (`event`), `permissionsChanged` (`permissions`), `configChanged` (`config`), `currentMfeChanged` (`currentMfe`), `currentPageChanged` (`currentPage`, may be `undefined`), `currentThemeChanged` (`currentTheme`), `currentWorkspaceChanged` (`currentWorkspace`), `appConfigChanged` (`appConfig`) and `userProfileChanged` (`userProfile`).

#### Scenario: Action type
- **WHEN** `OneCxActions.navigated({ event })` is created
- **THEN** its type is `[OneCX] navigated`

### Requirement: OneCX reducer
`oneCxReducer` SHALL, for each action, return a new state in which the corresponding member (`navigated` -> `location`, `permissionsChanged` -> `permissions`, `configChanged` -> `config`, `currentMfeChanged` -> `currentMfe`, `currentPageChanged` -> `currentPage`, `currentThemeChanged` -> `currentTheme`, `currentWorkspaceChanged` -> `currentWorkspace`, `appConfigChanged` -> `appConfig`, `userProfileChanged` -> `userProfile`) is replaced by the action payload and all other members are preserved.

#### Scenario: Permissions change
- **WHEN** `permissionsChanged({ permissions: ['a'] })` is reduced on `{ config: {...} }`
- **THEN** the result has `permissions: ['a']` and the unchanged `config`

> Note (code-derived): the `navigated` event payload is cast to `NavigatedEventPayload` without validation.

### Requirement: Feature selector
`createOneCxSelector<State>()` SHALL return a feature selector for the feature key `'onecx'`.

#### Scenario: Feature key
- **WHEN** applied to `{ onecx: s }`
- **THEN** it returns `s`

### Requirement: OneCX selectors
`getOneCxSelectors(selectState?)` SHALL return `selectLocation`, `selectBackNavigationPossible`, `selectPermissions`, `selectConfig`, `selectCurrentMfe`, `selectCurrentPage`, `selectCurrentTheme`, `selectCurrentWorkspace`, `selectAppConfig` and `selectUserProfile`, each projecting the like-named state member. `selectState` SHALL default to `createOneCxSelector()`.

#### Scenario: Custom state selector
- **WHEN** a custom `selectState` is passed
- **THEN** all selectors derive from it

### Requirement: Back navigation possible
`selectBackNavigationPossible` SHALL be `true` only when a location exists and its `isFirst` is falsy.

#### Scenario: No location
- **WHEN** `location` is undefined
- **THEN** the selector yields `false`

#### Scenario: First navigation
- **WHEN** `location.isFirst` is `true`
- **THEN** the selector yields `false`

#### Scenario: Later navigation
- **WHEN** `location.isFirst` is `false`
- **THEN** the selector yields `true`
