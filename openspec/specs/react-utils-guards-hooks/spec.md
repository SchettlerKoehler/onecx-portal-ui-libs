# react-utils-guards-hooks Specification

## Purpose
React hooks that wire the guard wrappers into React Router: building wrapped guards for current matches, running guard checks on location change, running deactivation checks, and managing a `GuardsGatherer` lifecycle.

## Requirements

### Requirement: useWrappedGuards
`useWrappedGuards({ guardsNavigationState?, guardsGatherer? })` SHALL return `WrappedGuards` built with `wrapGuards` from the current `useMatches()` and `useLocation()`. The result MUST be memoized and recomputed only when matches, location, state or gatherer change.

#### Scenario: Options forwarded
- **WHEN** the hook is used with a state and a gatherer
- **THEN** `wrapGuards` is called with current matches, location, state and gatherer

### Requirement: useGuardCheck
`useGuardCheck(options)` SHALL, unless `enabled` is `false` (default `true`), on mount and whenever the location key changes run `canMatch`, then `canActivateChild` only if the previous result was true, then `canActivate` only if the previous result was true; a `false` result short-circuits the chain to `false`. The final result SHALL be stored in state, passed to `onGuardCheck` if provided, and the hook SHALL return `{ wrapped, lastResult }` where `lastResult` is `null` until the first check completes.

#### Scenario: All guards pass
- **WHEN** all three guard groups resolve `true`
- **THEN** `onGuardCheck(true)` is called and `lastResult` becomes `true`

#### Scenario: Short-circuit
- **WHEN** `canMatch` resolves `false`
- **THEN** `canActivateChild` and `canActivate` are not run and the result is `false`

#### Scenario: Disabled
- **WHEN** `enabled` is `false`
- **THEN** no guard is executed

### Requirement: useGuardDeactivation
`useGuardDeactivation(nextLocation, options)` SHALL, unless `enabled` is `false`, run `canDeactivate(nextLocation)` of the wrapped guards on mount and when the location key, `nextLocation` or callback changes, store the result, call `onGuardCheck` and return `{ wrapped, lastResult }`.

#### Scenario: Result reported
- **WHEN** deactivation guards resolve
- **THEN** `onGuardCheck` receives the result

#### Scenario: Disabled
- **WHEN** `enabled` is `false`
- **THEN** `canDeactivate` is not called

### Requirement: useGuardsGatherer
`useGuardsGatherer({ activate = true })` SHALL return a `GuardsGatherer` memoized on the router `navigate` function. When `activate` is true it SHALL call `activate()` on mount and `deactivate()` on unmount; when false it MUST NOT activate it.

#### Scenario: Auto activation
- **WHEN** the hook mounts with defaults and later unmounts
- **THEN** the gatherer is activated on mount and deactivated on unmount

#### Scenario: Activation disabled
- **WHEN** `activate` is `false`
- **THEN** `activate()` is never called
