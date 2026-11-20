# angular-webcomponents-connector Specification

## Purpose
`WebcomponentConnector` synchronizes a web component's Angular router with the shell's browser location and coordinates navigation guards across several web components on a page.

## Requirements

### Requirement: Connect and disconnect
`connect()` SHALL activate the `GuardsGatherer` and set up router subscriptions. `disconnect()` SHALL unsubscribe them, destroy the events topic and deactivate the gatherer.

#### Scenario: Disconnect
- **WHEN** `disconnect()` is called
- **THEN** guards gatherer is deactivated and `EventsTopic` destroyed

### Requirement: Missing dependencies
If no `Router` is injectable the connector SHALL do nothing (warn only when entrypoint type is `microfrontend`); if `AppStateService` is missing it SHALL warn and do nothing.

#### Scenario: No router
- **WHEN** no router exists
- **THEN** no subscriptions are created

### Requirement: Initial navigation
On connect the router SHALL navigate (with `replaceUrl`) to the current browser URL minus the deployment path, with state flags `IS_ROUTER_SYNC` and `IS_INITIAL_ROUTER_SYNC`.

#### Scenario: Initial sync
- **WHEN** connected
- **THEN** `navigateByUrl(<path-without-deployment-path>+search+hash, ...)` is called

### Requirement: Location sync
The router SHALL follow location changes: on each `currentLocation$` emission (or, when the shell lacks the `CURRENT_LOCATION_TOPIC` capability, each `navigated` event on `EventsTopic`) it SHALL navigate to the new URL with `replaceUrl` only if it differs from the last URL.

#### Scenario: Unchanged URL
- **WHEN** a location event arrives but the URL is unchanged
- **THEN** no navigation occurs

### Requirement: Guard wrapping
On `RoutesRecognized` the connector SHALL wrap the guards of every recognized route configuration (recursively over children) using `wrapGuards`; routes without `routeConfig` are skipped.

#### Scenario: Recognition
- **WHEN** routes are recognized
- **THEN** guards for each route config are wrapped

### Requirement: Guard gathering
On `GuardsCheckStart` with no current navigation nothing SHALL happen. In `NAVIGATION_REQUESTED` mode the connector SHALL gather guard results for the URL, combine them to a boolean and store the promise in the navigation state. In modes `INITIAL_ROUTER_SYNC`, `GUARD_CHECK` and `ROUTER_SYNC` it SHALL do nothing.

#### Scenario: Navigation requested
- **WHEN** a user navigation starts guard checks
- **THEN** the gathered result promise is placed on the navigation state

### Requirement: Guard check end
On `GuardsCheckEnd`: in `INITIAL_ROUTER_SYNC` mode, if the route must not activate, it SHALL warn and publish `{ type: 'revertNavigation' }` on `EventsTopic`. In `GUARD_CHECK` mode, if the route may activate, it SHALL resolve the pending request positively for the URL and re-navigate to the current URL with `skipLocationChange` and `IS_ROUTER_SYNC`. Other modes do nothing.

#### Scenario: Initial navigation rejected
- **WHEN** the initial sync lands on a guarded route that denies
- **THEN** `revertNavigation` is published

> Note (code-derived): the location-sync navigation uses state `{ isRouterSync: true }` while the initial one uses the `IS_ROUTER_SYNC` constant.
