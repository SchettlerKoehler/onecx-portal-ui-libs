# angular-webcomponents-bootstrap Specification

## Purpose
Utilities to bootstrap OneCX microfrontends and remote components as Angular modules or custom elements that share one Angular platform and zone with the shell.

## Requirements

### Requirement: bootstrapModule
`bootstrapModule(module, appType, production)` SHALL replace or add an `APP_ID` provider wrapping the id in `DynamicAppId`, add dynamic-container providers, bootstrap the module on the cached platform using the shared `NgZone` (if any) and resolve the `NgModuleRef`. For `appType === 'shell'` it SHALL store the module's `NgZone` as the shared zone.

#### Scenario: Shell bootstrap
- **WHEN** `bootstrapModule(M, 'shell', true)` completes
- **THEN** the shell's `NgZone` is saved in window state for later microfrontends

### Requirement: bootstrapRemoteComponent
`bootstrapRemoteComponent(component, elementName, production, providers, options?)` SHALL apply the `APP_ID` and dynamic-container providers, create an application (using the shared `NgZone` when available), cache the platform, ensure a `**` fallback route exists, and register the component as custom element `elementName`.

#### Scenario: Fallback route
- **WHEN** the router has no `**` route
- **THEN** an empty `**` route with no children is appended

### Requirement: createAppEntrypoint
`createAppEntrypoint(component, elementName, injector, options?)` SHALL register the component as a custom element for a microfrontend entrypoint (`entrypointType 'microfrontend'`).

#### Scenario: Register
- **WHEN** called
- **THEN** `customElements.define(elementName, ...)` is performed

### Requirement: Entrypoint behavior
The created custom element SHALL set `data-no-portal-layout-styles` on connect; the component's `ngOnInit` SHALL first call `WebcomponentConnector.connect()`, and `ngOnDestroy` SHALL call `disconnect()`, remove the dynamic container `<onecx-dynamic-container-prefix>-<elementName>`, and then call the original hooks. The `DynamicAppId.appElementName` SHALL be set to `elementName`, and `DYNAMIC_CONTAINER` SHALL return the existing or newly created dynamic container for the element.

#### Scenario: Destroy cleans container
- **WHEN** the component is destroyed
- **THEN** its dynamic container is removed from the DOM

### Requirement: APP_ID handling
If an existing `APP_ID` provider with a string `useValue` is found (searching nested providers), its value SHALL be reused as the base of `DynamicAppId`; non-`useValue` providers fall back to `'ng'` with a warning; if none exists, a `DynamicAppId('ng')` is added.

#### Scenario: Non-value provider
- **WHEN** `APP_ID` is provided by factory
- **THEN** a warning is logged and `'ng'` is used

### Requirement: Platform caching and shared state
`cachePlatform(production)` SHALL return one platform per Angular `VERSION`, reusing `getPlatform()` or `platformBrowser()`, and call `enableProdMode()` when creating it with `production = true`. `getWindowState()` SHALL return the object under `window['@onecx/angular-webcomponents']`, creating it if needed; `getNgZone()` returns the shared zone.

#### Scenario: Same version
- **WHEN** called twice with the same Angular version
- **THEN** the same platform instance is returned

> Note (code-derived): `AppOptions.usePortalLayoutStyles` is deprecated and ignored. If the zone cannot be read from the shell module, a warning is logged and no zone is shared.
