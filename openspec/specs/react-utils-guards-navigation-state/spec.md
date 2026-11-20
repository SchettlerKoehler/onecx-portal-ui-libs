# react-utils-guards-navigation-state Specification

## Purpose
Defines the router navigation-state flags and the `GuardsNavigationStateController` used to coordinate route-guard execution between routers/apps in React microfrontends. Used by the guard wrappers and the guards gatherer.

## Requirements

### Requirement: Navigation state keys and types
The system SHALL export the string constants `IS_ROUTER_SYNC` (`'isRouterSync'`), `IS_INITIAL_ROUTER_SYNC` (`'isInitialRouterSync'`), `GUARD_CHECK` (`'guardCheck'`), `GUARD_CHECK_KEY` (`'guardCheckKey'`) and `GUARD_CHECK_PROMISE` (`'guardCheckPromise'`), the `GuardsNavigationState` interface keyed by them, and `GuardCheckPromise` (a `Promise<boolean>`).

#### Scenario: Keys are usable as navigation state
- **WHEN** a consumer builds a `GuardsNavigationState` using these constants as keys
- **THEN** it type-checks and is understood by `GuardsNavigationStateController`

### Requirement: Guard mode constants
The system SHALL export `GUARD_MODE` with the values `INITIAL_ROUTER_SYNC` (`'initialRouterSync'`), `ROUTER_SYNC` (`'routerSync'`), `GUARD_CHECK` (`'guardCheck'`) and `NAVIGATION_REQUESTED` (`'navigationRequested'`), and the derived type `GuardMode`. The system SHALL also export `GuardResultRequest` (`{ url: string }`), `GuardResultResponse` (boolean) and `GUARDS_GATHERER_NAME` (`'GuardGatherer'`).

#### Scenario: Mode values
- **WHEN** `GUARD_MODE` is read
- **THEN** it contains exactly the four modes listed above

### Requirement: Mode detection
`GuardsNavigationStateController.getMode(state)` SHALL return `INITIAL_ROUTER_SYNC` if `isInitialRouterSync` is truthy, else `ROUTER_SYNC` if `isRouterSync` is truthy, else `GUARD_CHECK` if `guardCheck` is truthy, else `NAVIGATION_REQUESTED`.

#### Scenario: Precedence
- **WHEN** a state has both `isInitialRouterSync` and `guardCheck` set
- **THEN** `getMode` returns `GUARD_MODE.INITIAL_ROUTER_SYNC`

#### Scenario: Empty state
- **WHEN** the state is `{}`
- **THEN** `getMode` returns `GUARD_MODE.NAVIGATION_REQUESTED`

### Requirement: Initial router sync state creation
`createInitialRouterSyncState(state?)` SHALL set `isRouterSync` and `isInitialRouterSync` to `true`. If a state object is passed it MUST be mutated and returned; otherwise a new object is returned.

#### Scenario: New state
- **WHEN** called without arguments
- **THEN** it returns `{ isRouterSync: true, isInitialRouterSync: true }`

#### Scenario: Existing state is mutated
- **WHEN** called with an existing state object
- **THEN** the same object is returned with both flags set

### Requirement: Guard check state creation
`createGuardCheckState(state?, key?)` SHALL set `guardCheck: true` and, only when a non-empty `key` is given, `guardCheckKey: key`. An existing state MUST be mutated and returned; otherwise a new object is returned.

#### Scenario: With key
- **WHEN** called with no state and key `'1'`
- **THEN** it returns `{ guardCheck: true, guardCheckKey: '1' }`

#### Scenario: Without key
- **WHEN** called with no state and no key
- **THEN** it returns `{ guardCheck: true }` without a `guardCheckKey` property

### Requirement: Navigation requested state
`createNavigationRequestedState(promise, state?)` SHALL store the promise under `guardCheckPromise`, mutating and returning an existing state or creating a new object. `getGuardCheckPromise(state)` SHALL return the stored promise or `undefined`.

#### Scenario: Round trip
- **WHEN** a state is created with a promise and `getGuardCheckPromise` is called on it
- **THEN** the same promise is returned
