# angular-webcomponents-router-and-utils Specification

## Purpose
Router helpers and small utilities for microfrontends running as web components inside the shell.

## Requirements

### Requirement: initializeRouter
`initializeRouter(router, appStateService)` SHALL return an initializer that waits for the first `currentMfe$` value, then for every configured route sets `data.mfeInfo`, prefixes string `redirectTo` values with the MFE `baseHref` (joined by `Location.joinWithSlash`), appends a `**` route with no children and resets the router config.

#### Scenario: Redirect rewritten
- **WHEN** a route has `redirectTo: 'home'` and baseHref `/app/`
- **THEN** it becomes `/app/home`

### Requirement: startsWith matcher
`startsWith(prefix)` SHALL return a `UrlMatcher` that matches when the URL begins with the route's `mfeInfo.baseHref` and the remainder begins with `prefix`; it consumes the base-href segments plus the prefix's segments. Otherwise it returns `null`.

#### Scenario: Match
- **WHEN** baseHref is `/app/`, prefix `details` and URL `/app/details/1`
- **THEN** `app` and `details` segments are consumed

> Note (code-derived): `getBaseHrefOfRoute` logs a warning if `mfeInfo` is missing and returns `undefined`; `sliceBaseHref` would then throw.

### Requirement: Base href helpers
`getBaseHrefOfRoute(route)`, `sliceBaseHref(route, url)` (drops the base-href segments) and `baseHrefSegmentAmount(url, urlWithoutBaseHref)` SHALL be exported.

#### Scenario: Slice
- **WHEN** baseHref has two segments
- **THEN** the first two URL segments are removed

### Requirement: DynamicAppId
`DynamicAppId` SHALL behave like a string (delegating `String.prototype` methods, `valueOf`, `length`) whose value defaults to `'ng'`, can be changed through `setValue`, and carries `appElementName` (default `''`).

#### Scenario: Set value
- **WHEN** `setValue('x')` is called
- **THEN** `valueOf()` returns `'x'`

### Requirement: Dynamic containers
`getDynamicContainer(tag, appElementName)` SHALL return the existing element matching `tag` or create one via `document.createOnecxDynamicContainer`; `removeDynamicContainer(tag)` SHALL remove it if present. `DYNAMIC_CONTAINER_PROXY` and `DynamicContainerProxy` are exported.

#### Scenario: Existing container
- **WHEN** an element matches the tag
- **THEN** it is returned without creating another
