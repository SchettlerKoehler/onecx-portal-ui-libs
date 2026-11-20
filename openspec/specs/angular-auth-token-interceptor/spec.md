# angular-auth-token-interceptor Specification

## Purpose
Lets Angular microfrontends call APIs with the shell's authentication by attaching auth headers to outgoing HTTP requests through the shell-provided auth proxy on `window.onecxAuth`.

## Requirements

### Requirement: Auth proxy header values
`AuthProxyService.getHeaderValues()` SHALL return the result of `globalThis.onecxAuth.authServiceProxy.v1.getHeaderValues()` and SHALL return `{}` when `onecxAuth`, `authServiceProxy` or `v1` is missing.

#### Scenario: Proxy present
- **WHEN** the shell registered the v1 proxy
- **THEN** its header record (e.g. `Authorization`, `apm-principal-token`) is returned

#### Scenario: Proxy missing
- **WHEN** `window.onecxAuth` is undefined or lacks `authServiceProxy` or `v1`
- **THEN** `{}` is returned

### Requirement: Auth proxy token refresh
`AuthProxyService.updateTokenIfNeeded()` SHALL delegate to the proxy and resolve with its boolean result. When the proxy is missing it SHALL reject with `Error('No authServiceWrapper provided. Please update to the latest shell version to use the new auth mechanism.')`. When the proxy rejects, the error SHALL be logged and re-thrown.

#### Scenario: Delegation
- **WHEN** the proxy resolves `true`
- **THEN** the method resolves `true`

#### Scenario: Missing proxy
- **WHEN** `window.onecxAuth` is undefined, or `authServiceProxy` / `v1` is missing
- **THEN** the promise rejects with the "No authServiceWrapper provided" error

> Note (code-derived): the proxy member is created by `ensureProperty` with a default, so the missing-proxy error comes from the default function; the global object is mutated as a side effect.

### Requirement: Token interceptor
`TokenInterceptor` SHALL, for every request whose URL does not contain `assets`, wait until `AppStateService.isAuthenticated$` is initialised, call `AuthProxyService.updateTokenIfNeeded()`, then clone the request with every header from `getHeaderValues()` set (overwriting existing headers of the same name) and forward it. Requests whose URL contains `assets` SHALL be forwarded unchanged.

#### Scenario: Wait for authentication
- **WHEN** a request is made before `isAuthenticated$` published
- **THEN** it is not sent until publication, then sent with `Authorization` and `apm-principal-token` headers and the token refresh was invoked

#### Scenario: Asset request
- **WHEN** the URL is `/assets/config.json`
- **THEN** it is sent immediately without auth headers

> Note (code-derived): the whitelist is a substring match, so any URL containing `assets` anywhere is skipped. If `updateTokenIfNeeded` rejects, the request errors.

### Requirement: Provider registration
`provideTokenInterceptor()` SHALL return providers for `AuthProxyService` and `TokenInterceptor` registered as a multi `HTTP_INTERCEPTORS`; `AngularAuthModule` SHALL include these providers.

#### Scenario: Module import
- **WHEN** `AngularAuthModule` is imported
- **THEN** HTTP requests via DI-based interceptors pass through `TokenInterceptor`
