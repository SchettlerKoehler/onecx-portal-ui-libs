# angular-utils-guards-wrappers Specification

## Purpose
Entry point `@onecx/angular-utils/guards` (wrapping part). Wraps route guards (`canActivate`, `canDeactivate`, `canActivateChild`) so they run correctly when several routers are active, according to the navigation mode (router sync, guard check, real navigation).

## Requirements

### Requirement: wrapGuards replaces route guards with wrappers
`wrapGuards(route)` SHALL save the route's original `canActivate`, `canDeactivate` and `canActivateChild` functions/classes into `OnecxRoute.canActivateGuardList`, `canDeactivateGuardList` and `canActivateChildGuardList`, replace each guard array with a single wrapper function tagged with `WRAPPED_GUARD_TAG`, set `runGuardsAndResolvers` to `'always'`, and recurse into `route.children`.

#### Scenario: Wrap a route
- **WHEN** `wrapGuards` is called on a route with `canActivate: [guardA]`
- **THEN** `route.canActivate` contains exactly one tagged wrapper and `canActivateGuardList` contains `guardA`
- **AND** `runGuardsAndResolvers` is `'always'`
- **AND** child routes are wrapped the same way

#### Scenario: Idempotence and dynamic guards
- **WHEN** `wrapGuards` is called again on an already wrapped route
- **THEN** a single already-wrapped guard is not wrapped again and guards are not duplicated in the saved list
- **AND** guards added to the route after the first wrap are appended to the saved list and re-wrapped

#### Scenario: Non-function guards
- **WHEN** a guard entry is not a function (e.g. deprecated string guard) or is itself a wrapper
- **THEN** it is not added to the saved list

> Note (code-derived): A route without any guards also receives a wrapper (wrapping is required whenever the array is not exactly one wrapper), with an empty saved list.

### Requirement: Activate wrapper by navigation mode
`ActivateGuardsWrapper.canActivate(route, state, guards)` SHALL read the navigation state from `router.getCurrentNavigation()?.extras.state` (default empty) and act by mode: in `INITIAL_ROUTER_SYNC` run all guards and return the combined boolean; in `ROUTER_SYNC` run all guards but always return `true`; in `GUARD_CHECK` run all guards, and if the result is `false` call `GuardsGatherer.resolveRoute(futureUrl, false)`, returning the result; in `NAVIGATION_REQUESTED` await the `GUARD_CHECK_PROMISE` first.

#### Scenario: Navigation requested and external check fails
- **WHEN** mode is `NAVIGATION_REQUESTED` and the guard check promise resolves `false`
- **THEN** a warning is logged, guards are not executed and `false` is returned

#### Scenario: Navigation requested and external check passes
- **WHEN** the promise resolves `true`
- **THEN** guards are executed and combined with `combineToGuardResult` (so `UrlTree`/`RedirectCommand` results are preserved)

#### Scenario: Missing promise
- **WHEN** no guard check promise is in the state
- **THEN** a warning is logged and the check is treated as `true`

### Requirement: Guard execution details
Guards SHALL be executed concurrently (`Promise.all`). Class-based guards (type whose prototype has `canActivate`/`canDeactivate`) SHALL be instantiated via the injector; function guards are called directly. Results of any `MaybeAsync` form SHALL be resolved to promises. If the route has no `routeConfig` the wrapper SHALL resolve `true` without running guards. If a guard throws synchronously (e.g. class without the method) a warning is logged and it counts as `true`.

#### Scenario: No route configuration
- **WHEN** the activated route snapshot has no `routeConfig`
- **THEN** `true` is returned and guards are not run

#### Scenario: Class not implementing the interface
- **WHEN** a guard class lacks `canActivate`
- **THEN** it is treated as passing (`true`) with a warning

### Requirement: Deactivate wrapper
`DeactivateGuardsWrapper.canDeactivate(component, currentRoute, currentState, nextState, guards)` SHALL follow the same mode rules as the activate wrapper, using `nextState.url` as future URL for `resolveRoute`, and checking `currentRoute.routeConfig` for existence.

#### Scenario: Guard check failing deactivation
- **WHEN** mode is `GUARD_CHECK` and a deactivate guard returns `false`
- **THEN** `GuardsGatherer.resolveRoute(nextState.url, false)` is called and `false` returned

### Requirement: Guard result helpers
`combineToGuardResult(results)` SHALL return `false` if any result is `false`, else the first `UrlTree` or `RedirectCommand` found, else `true`. `combineToBoolean(results)` SHALL return `false` if any result is `false`, else `true`. `resolveToPromise` SHALL convert a promise, an observable (last value) or a plain value into a promise. `getUrlFromSnapshot(route)` SHALL join the URL segment paths from the root to the route with `/` (empty string when there are no segments). `executeRouterSyncGuard()` SHALL log and return `true`.

#### Scenario: Combining results
- **WHEN** results contain `true`, a `UrlTree` and a `RedirectCommand`
- **THEN** `combineToGuardResult` returns the first of those redirect objects
- **AND** `combineToBoolean` returns `true`

#### Scenario: Observable guard result
- **WHEN** a guard returns an observable
- **THEN** `resolveToPromise` resolves with its last emitted value
