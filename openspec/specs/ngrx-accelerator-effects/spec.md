# ngrx-accelerator-effects Specification

## Purpose
Helpers for NgRx effects in OneCX apps that keep state in sync with URL parameters (query string or fragment) and that filter `RouterNavigatedAction` streams. Used by generated and hand-written feature effects.

> Note (code-derived): the fragment helpers `createFragmentParamsEffect`, `filterOutFragmentParamsHaveNotChanged` and `filterOutOnlyFragmentParamsChanged` exist in the source but are NOT re-exported from the package `src/index.ts`. The query-param helpers, which are deprecated, and `filterForNavigatedTo` are exported.

## Requirements

### Requirement: Query params effect
`createQueryParamsEffect(actions$, actionType, router, activatedRoute, reducer)` SHALL return a non-dispatching effect that, for every action of `actionType`, calls `reducer` with the current `activatedRoute.queryParams` and the action, and navigates with the returned object as `queryParams`. The navigation SHALL be relative to `activatedRoute`, to the current route (`[]`), with `replaceUrl: true` and `onSameUrlNavigation: 'reload'`. The helper is deprecated in favour of `createFragmentParamsEffect`.

#### Scenario: Action triggers navigation
- **WHEN** an action of the given type is emitted
- **THEN** the reducer is called with the latest query params and the action
- **AND** `router.navigate([], { relativeTo, queryParams: <reducer result>, replaceUrl: true, onSameUrlNavigation: 'reload' })` is called

#### Scenario: Other actions ignored
- **WHEN** an action of a different type is emitted
- **THEN** no navigation occurs

### Requirement: Fragment params effect
`createFragmentParamsEffect(actions$, actionType, router, activatedRoute, reducer)` SHALL return a non-dispatching effect that treats the URL fragment as `<prefix>?<key=value&...>`. For each action of `actionType` with a non-empty fragment it SHALL call `reducer` with a `URLSearchParams` parsed from the fragment and the action, and navigate to the same fragment prefix followed by the serialized reducer result, with `replaceUrl: true`, `onSameUrlNavigation: 'reload'`, relative to `activatedRoute`.

#### Scenario: No fragment
- **WHEN** the action is emitted and the current fragment is empty or undefined
- **THEN** the reducer is not called and no navigation occurs

#### Scenario: Fragment present
- **WHEN** the fragment is `hash?param=1&test=key` and the reducer returns `{ new: 'value', test: ['key'], another: null }`
- **THEN** navigation uses fragment `hash?new=value&test=key&another=`
- **AND** `replaceUrl` is `true` and `onSameUrlNavigation` is `'reload'`

#### Scenario: Serialization of values
- **WHEN** the reducer result contains array values
- **THEN** the key is repeated once per element, each stringified
- **AND** `null` or `undefined` scalar values serialize as an empty string

> Note (code-derived): the fragment prefix is everything before the first `?`; a fragment without `?` yields prefix `<fragment>?`. The reducer receives the whole fragment string parsed as `URLSearchParams` (including the prefix text as a key), not only the part after `?`.

### Requirement: Filter for navigation to a component
`filterForNavigatedTo(router, component)` SHALL return an operator that passes an action only if the current router state tree (root and all descendants, depth-first) contains a route whose `component` is the given component, and drops it otherwise.

#### Scenario: Component active
- **WHEN** a navigated action arrives and a route in `router.routerState.root` or any nested child has `component === component`
- **THEN** the action is emitted

#### Scenario: Component not active
- **WHEN** no route in the tree has that component
- **THEN** the action is dropped

### Requirement: Filter for changed query params
`filterOutQueryParamsHaveNotChanged(router, queryParamsTypeDef, allowEmptyQueryParamsList = false)` SHALL return an operator that passes a `RouterNavigatedAction` only if its target query params differ from the query params of the router state at the most recent `RoutesRecognized` event, after both are parsed with the zod schema. It is deprecated in favour of `filterOutFragmentParamsHaveNotChanged`. It SHALL drop the action when either side fails schema validation. When `allowEmptyQueryParamsList` is `false` and the action has no query params, it SHALL drop the action. When it is `true` and both parsed results are empty objects, it SHALL pass the action.

#### Scenario: Params changed
- **WHEN** both parse successfully and parsed values are not deeply equal
- **THEN** the action is emitted

#### Scenario: Params unchanged
- **WHEN** both parse successfully and are deeply equal
- **THEN** the action is dropped

#### Scenario: Empty params
- **WHEN** the action has no query params and `allowEmptyQueryParamsList` is `false`
- **THEN** the action is dropped
- **AND** with `true` and both sides empty after parsing the action is emitted

#### Scenario: Validation failure
- **WHEN** the schema rejects either the action's or the previous params
- **THEN** the action is dropped

> Note (code-derived): the operator uses `withLatestFrom` on `RoutesRecognized` events, so nothing is emitted until at least one such event has occurred. Docs migration for v8 renamed `filterForQueryParamsChanged` to this name.

### Requirement: Filter for changed fragment params
`filterOutFragmentParamsHaveNotChanged(router, fragmentParamsTypeDef, allowEmptyFragmentParamsList = false)` SHALL behave like the query-param variant, but params are read from the part of the router-state fragment after the first `?` (empty object if the fragment or the part is missing), parsed as URL search params into a string record. The previous state is the router state at the latest `RoutesRecognized` event.

#### Scenario: Params changed
- **WHEN** previous fragment is `page?param1=1`, the action fragment is `page?param1=2` and the schema accepts both
- **THEN** the action is emitted

#### Scenario: Params unchanged
- **WHEN** both parsed values are deeply equal
- **THEN** the action is dropped

#### Scenario: Empty action params
- **WHEN** the action fragment has no params (e.g. `''` or `page?`) and `allowEmptyFragmentParamsList` is `false`
- **THEN** the action is dropped
- **AND** with `true`, if both parsed results are empty objects, the action is emitted

#### Scenario: Validation fails
- **WHEN** the schema rejects either parameter set
- **THEN** the action is dropped

### Requirement: Filter out path-unchanged navigations (query)
`filterOutOnlyQueryParamsChanged(router)` SHALL return an operator that passes a `RouterNavigatedAction` only if the URL path before `?` of the previous router state snapshot differs from that of `payload.event.urlAfterRedirects`. It is deprecated in favour of `filterOutOnlyFragmentParamsChanged`.

#### Scenario: Only query changed
- **WHEN** previous url is `/a?x=1` and new `urlAfterRedirects` is `/a?x=2`
- **THEN** the action is dropped

#### Scenario: Path changed
- **WHEN** the part before `?` differs
- **THEN** the action is emitted

> Note (code-derived): the v8 migration docs name this operator as the replacement for `filterForOnlyQueryParamsChanged`.

### Requirement: Filter out path-unchanged navigations (fragment)
`filterOutOnlyFragmentParamsChanged(router)` SHALL return an operator that passes a `RouterNavigatedAction` only if the URL part before `#` of the previous router state snapshot differs from that of `payload.event.urlAfterRedirects`.

#### Scenario: Only fragment changed
- **WHEN** previous url is `http://abc/#page?param1=1` and the new one has the same part before `#`
- **THEN** the action is dropped

#### Scenario: Path changed
- **WHEN** the parts before `#` differ
- **THEN** the action is emitted

> Note (code-derived): the existing test compares `http://abc/` with `http://cde/` and expects emission because the paths differ.
