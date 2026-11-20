# ngrx-accelerator-selectors-storage Specification

## Purpose
Utilities for NgRx state: generating per-property child selectors for a feature state, and helpers for local-storage rehydration (a merge reducer for lazily loaded features and typed key configuration for `ngrx-store-localstorage`-style setups).

## Requirements

### Requirement: Child selector generation
`createChildSelectors(featureSelector, initialChildState)` SHALL return an object with one memoized selector per key of `initialChildState`, named `select` followed by the key with its first character upper-cased (e.g. `searchCriteria` becomes `selectSearchCriteria`). Each selector SHALL return the value of that key from the state yielded by `featureSelector`.

#### Scenario: Selectors created
- **WHEN** called with a feature selector and initial state `{ results: [], searchCriteria: {} }`
- **THEN** the result has `selectResults` and `selectSearchCriteria`
- **AND** each returns the corresponding property of the feature state

#### Scenario: Missing feature state
- **WHEN** the feature selector returns `undefined` or `null`
- **THEN** the child selectors return `undefined` without throwing

#### Scenario: Non-object child state types
- **WHEN** the child state type is a primitive, array or `Date`
- **THEN** the resulting type is an empty record (no selectors in the type)

> Note (code-derived): selector keys come from the runtime keys of `initialChildState`, so properties missing from the initial state get no selector.

### Requirement: Lazy-loading merge reducer
`lazyLoadingMergeReducer(state, rehydratedState, action)` SHALL, for each top-level key present in both `rehydratedState` and `state` (truthy in `state`), deep-merge the rehydrated value into the state, with arrays replaced by the rehydrated array (not concatenated), and return the merged state. Keys merged SHALL be deleted from `rehydratedState`; keys without a counterpart in `state` SHALL remain there for later (lazy) feature registration.

#### Scenario: Feature already registered
- **WHEN** `state` has key `a` and `rehydratedState` has `a` with new values
- **THEN** the result is `state` deep-merged with those values
- **AND** `a` is removed from `rehydratedState`

#### Scenario: Feature not yet loaded
- **WHEN** `rehydratedState` contains a key absent from `state`
- **THEN** that key is neither merged nor removed from `rehydratedState`

#### Scenario: Arrays
- **WHEN** both sides hold an array at the same path
- **THEN** the rehydrated array replaces the state array

#### Scenario: Nothing to rehydrate
- **WHEN** no keys overlap
- **THEN** `state` is returned unchanged

> Note (code-derived): the `action` argument is unused; `rehydratedState` is mutated as a side effect.

### Requirement: Nested key configuration helper
`createNestedKeyConfiguration(config)` SHALL accept an array of strings and/or `NestedKeyConfiguration` objects and return it unchanged, typed as `KeyConfiguration[]`. The module SHALL export the types `Options` (serialize, deserialize, reviver, replacer, encrypt, decrypt, filter, space), `KeyConfiguration` and `NestedKeyConfiguration`.

#### Scenario: Typed pass-through
- **WHEN** called with `['feature1', { feature2: ['key'] }]`
- **THEN** the same array contents are returned, typed as `KeyConfiguration[]`

> Note (code-derived): no runtime validation or transformation is performed; it exists only to reconcile types.
