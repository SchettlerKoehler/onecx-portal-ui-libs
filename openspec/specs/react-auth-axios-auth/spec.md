# react-auth-axios-auth Specification

## Purpose
Gives React microfrontends an axios factory that authenticates BFF calls by delegating to the shell-provided auth service proxy on the global object.

## Requirements

### Requirement: Auth service proxy header values
`authServiceProxy.getHeaderValues()` SHALL return the header map from `globalThis.onecxAuth.authServiceProxy.v1.getHeaderValues()`; if the path is missing it SHALL be created with a function returning `{}`.

#### Scenario: Shell provides proxy
- **WHEN** the shell has registered the v1 proxy
- **THEN** its header map is returned

#### Scenario: No proxy
- **WHEN** the proxy is absent
- **THEN** `{}` is returned

### Requirement: Token refresh
`authServiceProxy.updateTokenIfNeeded()` SHALL call the proxy's `updateTokenIfNeeded` and resolve its boolean. If the proxy is missing it SHALL reject with `MISSING_PROXY_ERROR` ("No authServiceWrapper provided. Please update to the latest shell version to use the new auth mechanism."). Failures from the proxy SHALL be logged and rethrown.

#### Scenario: Missing proxy
- **WHEN** no proxy exists
- **THEN** the promise rejects with `MISSING_PROXY_ERROR`

#### Scenario: Refresh fails
- **WHEN** the proxy rejects
- **THEN** the error is logged and propagated

### Requirement: Authenticated axios factory
`axiosFactory(baseURL?)` SHALL return an axios instance (optionally with `baseURL`) extended with `tokens` initialized to `{ sessionExpired: false }`, with a request interceptor that, before each request, awaits `updateTokenIfNeeded()` and sets every non-empty header returned by `getHeaderValues()` on the request.

#### Scenario: Headers attached
- **WHEN** a request is made and the proxy returns `{ Authorization: 'Bearer x' }`
- **THEN** the request carries that header
- **AND** headers with falsy values are not set

#### Scenario: Missing proxy tolerated
- **WHEN** `updateTokenIfNeeded` fails with `MISSING_PROXY_ERROR`
- **THEN** the request proceeds without error
- **AND** any other refresh error aborts the request by rejecting

### Requirement: Asset URL bypass
Requests whose URL contains `/assets/` SHALL be sent without token refresh and without auth headers.

#### Scenario: Asset request
- **WHEN** the URL is `/assets/env.json`
- **THEN** the interceptor returns the config unchanged

> Note (code-derived): the `tokens` field is not updated by the library. Types for `window.onecxAuth` are declared globally. No spec files exist for this lib.
