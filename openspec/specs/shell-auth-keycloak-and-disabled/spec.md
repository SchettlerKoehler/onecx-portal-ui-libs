# shell-auth-keycloak-and-disabled Specification

## Purpose
Built-in `AuthService` implementations of the shell: `KeycloakAuthService` (OIDC login with token persistence and refresh) and `DisabledAuthService` (no authentication, for local development).

## Requirements

### Requirement: Keycloak configuration
`KeycloakAuthService.init(config?)` SHALL build the Keycloak configuration from `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_REALM` and `KEYCLOAK_URL` (URL default `''`) overlaid with `config`. A missing client id or realm SHALL throw `Invalid KC config, missing clientId` / `missing realm`. If the merged config lacks `clientId`, `realm` or `url`, it SHALL fall back to `./assets/keycloak.json`.

#### Scenario: Missing realm
- **WHEN** `KEYCLOAK_REALM` is not configured
- **THEN** init rejects with `Invalid KC config, missing realm`

#### Scenario: Empty URL
- **WHEN** `KEYCLOAK_URL` is unset
- **THEN** `./assets/keycloak.json` is used

> Note (code-derived): the missing-clientId/realm errors occur before the keycloak.json fallback can apply.

### Requirement: Stored token reuse
`init` SHALL read tokens from localStorage keys `onecx_kc_token`, `onecx_kc_idToken` and `onecx_kc_refreshToken`. If a token and refresh token exist and the refresh token's `exp` is in the past, all three SHALL be cleared and not used; otherwise they SHALL be passed to Keycloak.

#### Scenario: Expired refresh token
- **WHEN** the stored refresh token has expired
- **THEN** stored tokens are removed and a fresh login is required

### Requirement: Keycloak init and login
`init` SHALL initialise keycloak-js with `onLoad: 'check-sso'`, `checkLoginIframe: false`, optional `timeSkew` from `KEYCLOAK_TIME_SKEW` (integer, ignored if not numeric) and, when `KEYCLOAK_ENABLE_SILENT_SSO` is `'true'`, a silent-check-sso URL under `<base href>/assets/silent-check-sso.html`. If init rejects or reports not authenticated, it SHALL call `login(config)`. On success it SHALL resolve `true`; other errors are logged and re-thrown. Failure to load keycloak-js SHALL throw an error that keycloak-js could not be loaded.

#### Scenario: Unauthenticated
- **WHEN** check-sso finds no session
- **THEN** the user is redirected to login

### Requirement: Token persistence and events
The service SHALL mirror token, id token and refresh token to localStorage on auth error, refresh success/error, auth success, token expired, action update and ready, removing keys whose value is absent. On `onAuthLogout` it SHALL clear stored tokens and call `login`. On `onAuthRefreshError` it SHALL log in again only if `KEYCLOAK_ON_AUTH_REFRESH_ERROR_ENABLED` is `'true'`. On `onTokenExpired` it SHALL call `updateToken()` (serialised by a semaphore) only if `KEYCLOAK_ON_TOKEN_EXPIRED_ENABLED` is `'true'`.

#### Scenario: Token expired, proactive refresh off
- **WHEN** the token expires and the flag is not `'true'`
- **THEN** only a log is written; refresh happens on the next `updateTokenIfNeeded`

### Requirement: Token update
`updateTokenIfNeeded()` SHALL run serialised; if keycloak is not authenticated it SHALL trigger `login` and resolve `false` (rejecting `'Keycloak not initialized!'` if keycloak was never created); otherwise it SHALL call `updateToken(minValidity)` with `KEYCLOAK_UPDATE_TOKEN_MIN_VALIDITY` (undefined if unset or non-numeric) and resolve whether the token was refreshed.

#### Scenario: Refresh not needed
- **WHEN** the token is still valid
- **THEN** `false` is returned

### Requirement: Keycloak headers, tokens and logout
`getHeaderValues()` SHALL return `{ 'apm-principal-token': <idToken or ''>, Authorization: 'Bearer <token>' }`. `getIdToken()`/`getAccessToken()` SHALL return the token or `null`. `logout()` SHALL call keycloak `logout`. `getAuthProviderName()` SHALL return `'keycloak-auth'`.

#### Scenario: No access token
- **WHEN** keycloak has no token
- **THEN** the Authorization header is the literal `Bearer null`

> Note (code-derived): `hasRole` always returns `false` and `getUserRoles` returns `[]`.

### Requirement: Disabled auth service
`DisabledAuthService` SHALL resolve `init()` and `updateTokenIfNeeded()` with `true`, return `{}` from `getHeaderValues()`, return `''` from `getIdToken()` and `getAccessToken()`, and on `logout()` navigate to `https://github.com/onecx/`.

#### Scenario: Disabled init
- **WHEN** `init()` is called
- **THEN** it resolves `true`, so the wrapper publishes authenticated
