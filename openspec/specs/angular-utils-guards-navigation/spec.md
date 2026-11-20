# angular-utils-guards-navigation Specification

## Purpose
Entry point `@onecx/angular-utils/guards` (navigation part). Models the router navigation state used to coordinate guard execution across several routers (shell and microfrontends), and offers `GuardsGatherer` to request guard results from the application without actually navigating.

## Requirements

### Requirement: Guard navigation state keys and mode detection
The library SHALL export the state keys `IS_ROUTER_SYNC` (`'isRouterSync'`), `IS_INITIAL_ROUTER_SYNC` (`'isInitialRouterSync'`), `GUARD_CHECK` (`'guardCheck'`), `GUARD_CHECK_PROMISE` (`'guardCheckPromise'`) and the enum `GUARD_MODE` (`initialRouterSync`, `routerSync`, `guardCheck`, `navigationRequested`). `GuardsNavigationStateController.getMode(state)` SHALL return the mode by precedence: initial router sync, router sync, guard check, otherwise navigation requested.

#### Scenario: Mode precedence
- **WHEN** the state has `IS_INITIAL_ROUTER_SYNC` true
- **THEN** `getMode` returns `INITIAL_ROUTER_SYNC`, even if other flags are set
- **AND** with only `IS_ROUTER_SYNC` it returns `ROUTER_SYNC`, with only `GUARD_CHECK` it returns `GUARD_CHECK`, and with none it returns `NAVIGATION_REQUESTED`

### Requirement: Creating navigation states
`GuardsNavigationStateController` (`providedIn: 'any'`) SHALL provide `createInitialRouterSyncState`, `createGuardCheckState` and `createNavigationRequestedState(promise)`. Each SHALL return a new state object containing the relevant flags (initial sync sets both `IS_ROUTER_SYNC` and `IS_INITIAL_ROUTER_SYNC`; guard check sets `GUARD_CHECK`; navigation requested sets `GUARD_CHECK_PROMISE`), or, when an existing state is passed, mutate and return that state.

#### Scenario: Modify an existing state
- **WHEN** `createInitialRouterSyncState(existing)` is called with an existing state object
- **THEN** the same object is returned with `IS_ROUTER_SYNC` and `IS_INITIAL_ROUTER_SYNC` set to true

### Requirement: Reading the guard check promise
`getGuardCheckPromise(state)` SHALL return the `GUARD_CHECK_PROMISE` stored in the state, or `undefined` if there is none.

#### Scenario: No promise
- **WHEN** the state has no `GUARD_CHECK_PROMISE`
- **THEN** `getGuardCheckPromise` returns `undefined`

### Requirement: GuardsGatherer lifecycle
`GuardsGatherer` (root service) SHALL be inactive until `activate()` is called, which creates an internal `Gatherer` named `GuardGatherer` (version 1) and a map of pending checks. `deactivate()` SHALL destroy the gatherer and clear the pending checks; `ngOnDestroy` SHALL destroy the gatherer.

#### Scenario: Use before activation
- **WHEN** `gather` or `resolveRoute` is called before `activate()` (or after `deactivate()`)
- **THEN** an error `Guards gatherer is not active` is thrown

### Requirement: Gathering guard results by fake navigation
`gather(request)` SHALL normalize `request.url` (ensure a leading `/`, remove a single trailing `/`) and schedule the request on the gatherer. For each request the gatherer callback SHALL call `router.navigateByUrl(url, { state: <guard check state>, onSameUrlNavigation: 'reload' })` to force guards to run, and return a promise that resolves when `resolveRoute` is called for that URL.

#### Scenario: Gather
- **WHEN** `gather({ url: 'a/b/' })` is called on an active gatherer
- **THEN** the router navigates to `/a/b` with the guard check state and forced reload
- **AND** the returned promise resolves with the response passed to `resolveRoute('/a/b', response)`

### Requirement: Resolving a route
`resolveRoute(url, response)` SHALL normalize the URL, resolve the pending promise registered for it (if any) with `response`, and remove the entry. If no entry exists it SHALL do nothing.

#### Scenario: Resolve unknown route
- **WHEN** `resolveRoute` is called for a URL with no pending check
- **THEN** nothing happens and no error is thrown

> Note (code-derived): Only one pending check per normalized URL is tracked; a second concurrent `gather` for the same URL overwrites the first resolver.

### Requirement: Guards debug logging and test mock
`logGuardsDebug(...args)` SHALL log a debug message with prefix `Guards:` via the `guards-utils` logger. The `@onecx/angular-utils/mocks` entry point SHALL export `provideGuardsGathererMock()` and `GuardsGathererMock`, which replaces `GuardsGatherer`; its `gather()` resolves to a configurable result (default `true`, set via `setGatherResult`), and `resolveRoute`, `activate`, `deactivate` are no-ops.

#### Scenario: Mock result
- **WHEN** `setGatherResult(false)` is called and `gather()` is awaited
- **THEN** it resolves to `false`

> Note (code-derived): The module `declarations` also initializes `window['@onecx/angular-utils'].guards` (a `debug` flag type exists) but `logGuardsDebug` does not consult it and always logs through the logger.
