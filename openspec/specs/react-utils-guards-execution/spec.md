# react-utils-guards-execution Specification

## Purpose
Provides guard types, route-handle based guard registration, and the wrappers that execute `canMatch`/`canActivate`/`canActivateChild`/`canDeactivate` guards of React Router matches according to the navigation mode. Used by microfrontends that need Angular-like guards in React Router.

## Requirements

### Requirement: Guard types
The system SHALL export `GuardResult` (boolean), `MaybePromise<T>`, `GuardExecutionContext` (`location`, `params`, `matches`), `GuardDeactivationContext` (adds `nextLocation`), and guard function types `CanActivateGuard`, `CanMatchGuard`, `CanActivateChildGuard` and `CanDeactivateGuard`. Guards MAY return a boolean or a Promise of a boolean.

#### Scenario: Sync and async guards
- **WHEN** guards return `true` or `Promise<false>`
- **THEN** both satisfy the guard types

### Requirement: Collect guards from route handles
`getGuardsFromMatches(matches)` SHALL read each match's `handle` (`GuardsHandle`) and concatenate the `canMatch`, `canActivate`, `canActivateChild` and `canDeactivate` arrays across all matches in match order. It MUST always return all four arrays (empty when absent).

#### Scenario: Aggregation
- **WHEN** two matches define `canActivate` guards
- **THEN** the result contains both, in order

#### Scenario: No handles
- **WHEN** matches have no handle or empty arrays
- **THEN** all four arrays are empty

### Requirement: Utility functions
The system SHALL export `combineToBoolean` (false if any result is `false`, otherwise true), `resolveToPromise` (wraps non-Promises, passes Promises through), `executeRouterSyncGuard` (always `true`) and `logGuardsDebug` (writes a debug log prefixed with `Guards:`).

#### Scenario: Combine
- **WHEN** results are `[true, false]`
- **THEN** `combineToBoolean` returns `false`

### Requirement: ActivateGuardsWrapper behavior per mode
`ActivateGuardsWrapper.canActivate(context, guards, state = {})` SHALL return `true` immediately when `guards` is empty. Otherwise it SHALL determine the mode with `GuardsNavigationStateController` and run all guards in parallel (`Promise.all`), combining with `combineToBoolean`:
- `INITIAL_ROUTER_SYNC`: return the combined result.
- `ROUTER_SYNC`: run the guards but always return `true`.
- `GUARD_CHECK`: return the combined result; when it is `false`, call `guardsGatherer.resolveRoute(context.location.pathname, false)` if a gatherer was supplied.
- `NAVIGATION_REQUESTED`: await the `guardCheckPromise` from state (a missing promise logs a warning and is treated as `true`); if it resolved `false`, return `false` without running guards; otherwise run the guards and return the combined result.

#### Scenario: Guard check denied
- **WHEN** mode is `GUARD_CHECK` and a guard returns `false`
- **THEN** the result is `false` and `resolveRoute(pathname, false)` is called

#### Scenario: Guard check allowed
- **WHEN** mode is `GUARD_CHECK` and all guards return `true`
- **THEN** the result is `true` and `resolveRoute` is not called

#### Scenario: Navigation blocked by earlier check
- **WHEN** mode is `NAVIGATION_REQUESTED` and the guard check promise resolves `false`
- **THEN** the result is `false` and the guards are not executed

#### Scenario: Missing promise
- **WHEN** mode is `NAVIGATION_REQUESTED` and no promise is in state
- **THEN** a warning is logged and the guards are executed as if the check passed

### Requirement: Guard errors are treated as allow
When a guard throws synchronously, the wrappers SHALL log a warning and treat that guard's result as `true`.

> Note (code-derived): only synchronous throws are caught; a rejected Promise returned by a guard is not caught by the `try/catch` and would reject the wrapper call.

#### Scenario: Throwing guard
- **WHEN** a guard throws while executed
- **THEN** the combined result is not affected negatively by that guard (it counts as `true`)

### Requirement: DeactivateGuardsWrapper behavior per mode
`DeactivateGuardsWrapper.canDeactivate(context, guards, state = {})` SHALL behave exactly like `ActivateGuardsWrapper.canActivate` (same modes, same empty-guards shortcut, same error handling), except that the context is a `GuardDeactivationContext` and the URL reported to `guardsGatherer.resolveRoute` is `context.nextLocation.pathname`.

#### Scenario: Deactivation denied during guard check
- **WHEN** mode is `GUARD_CHECK` and a `canDeactivate` guard returns `false`
- **THEN** `resolveRoute(nextLocation.pathname, false)` is called and the result is `false`

#### Scenario: Router sync
- **WHEN** mode is `ROUTER_SYNC`
- **THEN** the guards run but `true` is returned

### Requirement: wrapGuards
`wrapGuards({ matches, location, guardsNavigationState?, guardsGatherer?, guardsNavigationStateController? })` SHALL return `WrappedGuards` with `guards` (collected via `getGuardsFromMatches`) and async functions `canMatch`, `canActivateChild`, `canActivate` and `canDeactivate(nextLocation)` that run the respective guard group through the activate/deactivate wrapper. The guard context SHALL contain `location`, `matches` and `params` of the last match (or `{}` when there are no matches).

#### Scenario: Params from last match
- **WHEN** matches are given
- **THEN** guards receive the `params` of the last match

#### Scenario: Empty matches
- **WHEN** `matches` is empty
- **THEN** guards receive `params: {}`

#### Scenario: Denied guard
- **WHEN** a guard resolves `false`
- **THEN** the corresponding wrapped function resolves `false`
