# integration-interface-utils Specification

## Purpose
Framework-agnostic helper functions exported by `@onecx/integration-interface` for shell capabilities, workspace URL construction, language resolution, parameter lookup, configuration loading and portal message building. Angular wrappers delegate to them.

## Requirements

### Requirement: Shell capabilities
`ShellCapability` MUST contain `CURRENT_LOCATION_TOPIC`, `PARAMETERS_TOPIC`, `ACTIVENESS_AWARE_MENUS` and `DYNAMIC_TRANSLATIONS_TOPIC`. `setShellCapabilities(list)` SHALL store the list on `globalThis['onecx-shell-capabilities']`, `getShellCapabilities()` SHALL return it (or `undefined`), and `hasShellCapability(c)` SHALL return `true` only if the list exists and includes `c`.

#### Scenario: Not registered
- **WHEN** no capabilities were set
- **THEN** `hasShellCapability(x)` is `false`

### Requirement: Parameter lookup
`findParameterValue(payload, key, productName, appId)` SHALL return the value of `key` from the first entry whose `productName` and `appId` both match, or `undefined` if there is no such entry or key.

#### Scenario: Match
- **WHEN** an entry for the product/app has `key`
- **THEN** its value is returned

### Requirement: Configuration resolution
`getInlinedConfig()` SHALL return `globalThis.APP_CONFIG`. `resolveConfig(options)` SHALL, in order: return `{config: APP_CONFIG, source: 'inlined'}` if inlined config exists; return `{config: defaultConfig ?? {}, source: 'default'}` if `skipRemoteConfigLoad`; else call `loadRemoteConfig(remoteConfigURL || 'assets/env.json')` and return `{config: {...defaultConfig, ...remote}, source: 'remote'}`. `resolveConfigPayload` SHALL behave the same except that the remote result is returned without merging defaults (`remote ?? {}`).

#### Scenario: Inlined wins
- **WHEN** `APP_CONFIG` is defined
- **THEN** no remote load happens and source is `inlined`

#### Scenario: Remote with defaults
- **WHEN** no inline config and skip is false
- **THEN** `resolveConfig` merges remote values over defaults; `resolveConfigPayload` returns remote only

### Requirement: Browser language determination
`determineBrowserLanguage()` SHALL return the first of `navigator.languages` (falling back to `navigator.language`) reduced to the part before `-` or `_`, or `undefined` when no window/navigator or language exists.

#### Scenario: Regional tag
- **WHEN** the browser language is `de-DE`
- **THEN** `de` is returned

### Requirement: Profile language resolution
`resolveLegacyLanguage(profile, defaultLang, determine?)` SHALL return `accountSettings.localeAndTimeSettings.locale`, else the browser language, else `defaultLang`. `resolveProfileLanguage(profile, defaultLang, getNormalizedLocales, determine?)` SHALL use `settings.locales` when defined: an empty list is replaced by `getNormalizedLocales()`, and the first entry of length exactly 2 is returned, else `defaultLang`. When `settings.locales` is undefined it SHALL fall back to the legacy resolution.

#### Scenario: Locale list
- **WHEN** `settings.locales` is `['de-DE','en']`
- **THEN** `en` is returned

#### Scenario: Legacy fallback
- **WHEN** `settings.locales` is undefined
- **THEN** the account-settings locale, browser language or default is used in that order

### Requirement: Workspace URL construction
`constructRouteUrl(workspace, appId, productName, endpointName?, endpointParameters?, warn = console.warn)` SHALL start with `workspace.baseUrl` (empty string plus a warning if undefined), find the route with matching `appId` and `productName` (warning and using the first when several match), return the base URL with a warning if no route exists, replace the URL by `route.baseUrl` when non-empty, return it when no endpoint name is given, and otherwise append the resolved endpoint path joined with exactly one `/`. If the endpoint path resolves to empty, the URL without endpoint is returned.

#### Scenario: Endpoint with params
- **WHEN** the endpoint path is `/items/{id}` and parameters `{id: 5}`
- **THEN** the result is `<routeBase>/items/5`

#### Scenario: Unknown route
- **WHEN** no route matches
- **THEN** a warning is emitted and the workspace base URL is returned

### Requirement: Endpoint resolution
`dissolveEndpoint(name, endpoints)` SHALL find the endpoint by name and, while its path contains `[[`, follow the alias between `[[` and the last `]]` to another endpoint; it SHALL return `undefined` if an endpoint or alias is missing or the alias markers are malformed. `fillParamsForPath(path, params, warn)` SHALL replace each `{name}` with the string form of the parameter (`null`/`undefined` become empty) and return `''` with a warning when a value is empty or absent. `getStringFromUnknown` SHALL stringify values. `constructEndpointUrl` SHALL return `''` (warning when the endpoint or path is missing) when it cannot resolve.

#### Scenario: Alias
- **WHEN** endpoint `a` has path `[[b]]`
- **THEN** endpoint `b` is used

#### Scenario: Missing param
- **WHEN** a required `{id}` has no value
- **THEN** `''` is returned and a warning logged

### Requirement: URL existence check
`doesUrlExistForWorkspace(workspace, productName, appId, endpointName?, warn?)` SHALL return `false` when the workspace has no routes. Without endpoint name it SHALL return whether the matching route has a non-empty `baseUrl`; with a non-empty endpoint name it SHALL return whether that endpoint exists on the route with a non-empty path. `filterRouteFromList` SHALL return `undefined` for missing routes or no match.

#### Scenario: Endpoint check
- **WHEN** the route has endpoint `list` with a path
- **THEN** the check for `list` is `true`

### Requirement: Portal message building
`resolveTranslation(translate, key?, params?)` SHALL return `undefined` without key, the key itself without a translate function, else the translate result. `buildTranslatedMessage(severity, message, translate?)` SHALL resolve `summaryKey`/`detailKey` in parallel and return `buildPortalMessagePayload(severity, message, summary, detail)`, which SHALL spread the `PortalMessage` and add `severity`, `summary`, `detail`.

#### Scenario: No translate function
- **WHEN** `summaryKey: 'X'` and no translator
- **THEN** `summary` is `'X'`

> Note (code-derived): the original `summaryKey`/`detailKey`/parameters properties remain on the returned payload.
