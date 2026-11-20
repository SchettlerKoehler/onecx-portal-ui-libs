# react-utils-guards-gatherer Specification

## Purpose
`GuardsGatherer` lets one app ask other apps (via an accelerator `Gatherer` topic) whether navigation to a URL is allowed, by triggering a guard check through React Router navigation state. Used by shells/microfrontends coordinating guards across routers.

## Requirements

### Requirement: Activation lifecycle
`activate()` SHALL create a `Gatherer` named `GuardGatherer` (`GUARDS_GATHERER_NAME`) with version 1 and an internal map of pending checks. `deactivate()` SHALL destroy the gatherer and discard the pending-check map; it MUST NOT throw when called before `activate()`. `destroy()` SHALL destroy the underlying gatherer if any.

#### Scenario: Deactivate before activate
- **WHEN** `deactivate()` is called on a never-activated instance
- **THEN** no error is thrown

### Requirement: Gather requires activation
`gather(request)` SHALL throw `Error('Guards gatherer is not active')` when the gatherer is not active. When active it SHALL normalize `request.url` (mutating the request) and delegate to the underlying `Gatherer.gather`.

#### Scenario: Not active
- **WHEN** `gather` is called before `activate`
- **THEN** it throws `Guards gatherer is not active`

#### Scenario: URL normalization
- **WHEN** `gather({ url: 'a/b/' })` is called while active
- **THEN** the request URL becomes `/a/b` (leading slash added, one trailing slash removed unless the URL is just `/`)

### Requirement: Guard check execution
When the gatherer receives a request it SHALL navigate (React Router `navigate`) to the normalized URL with `replace: true` and state created by `createGuardCheckState(undefined, key)`, where `key` is an incrementing counter string starting at `'1'`. It SHALL return a Promise that resolves when `resolveRoute` is called for that URL.

#### Scenario: Navigation triggered
- **WHEN** a gather callback runs for `/x`
- **THEN** `navigate('/x', { state: { guardCheck: true, guardCheckKey: '1' }, replace: true })` is invoked

### Requirement: Resolving a route
`resolveRoute(routeUrl, response)` SHALL throw `Guards gatherer is not active` when not active. Otherwise it SHALL resolve the pending promise registered for the normalized URL with `response` (if any) and remove the entry. An unknown URL MUST NOT throw.

#### Scenario: Pending check resolved
- **WHEN** a check is pending for `/x` and `resolveRoute('/x', false)` is called
- **THEN** the promise resolves `false` and the entry is removed

#### Scenario: Unknown URL
- **WHEN** `resolveRoute` is called for a URL without a pending check
- **THEN** nothing happens and no error is thrown

> Note (code-derived): pending checks are keyed by URL only, so two concurrent checks for the same URL overwrite each other.
