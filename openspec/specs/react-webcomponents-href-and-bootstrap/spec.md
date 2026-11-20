# react-webcomponents-href-and-bootstrap Specification

## Purpose
Helpers for React microfrontends delivered as web components: computing application hrefs and registering a React component as a OneCX MFE custom element (Vite builds).

## Requirements

### Requirement: Trailing slash removal
`removeTrailingSlash(url)` SHALL remove all trailing `/` characters and return the input unchanged when there are none.

#### Scenario: Cases
- **WHEN** called with `/app/`
- **THEN** it returns `/app`
- **AND** `/app` is returned unchanged

### Requirement: Href normalisation
`normalizeHref(appBaseHref, baseHref)` SHALL join the app base href (without trailing slash) and the MFE base href (without one leading slash) with `/` and strip trailing slashes from the result.

#### Scenario: Cases
- **WHEN** both are empty
- **THEN** the result is `''`
- **AND** `('/app/', '/mfe')` yields `/app/mfe`
- **AND** `('/app', '')` yields `/app`

> Note (code-derived): these utilities are not exported from the package entry point.

### Requirement: App href hook
`useAppHref()` SHALL return `{ baseUrl, appBaseHref, href }`, where `baseUrl` is the first `currentWorkspace$` value's `baseUrl`, `appBaseHref` is `config.APP_BASE_HREF` without trailing slash, and `href` is `normalizeHref(APP_BASE_HREF, currentMfe$.baseHref)`. Missing values SHALL be empty strings, and values are re-read when topics or config change. It MUST be used under `AppStateProvider` and `ConfigurationProvider`.

#### Scenario: Before resolution
- **WHEN** the topics have not yet emitted
- **THEN** all values are empty strings

#### Scenario: Resolved
- **WHEN** MFE baseHref is `/mfe` and APP_BASE_HREF is `/app/`
- **THEN** `href` is `/app/mfe` and `appBaseHref` is `/app`

### Requirement: Web component bootstrap
`createViteAppWebComponent(component, elementName, classNames = [])` SHALL wrap `component` as a custom element (no attribute-mapped props) and register it with `customElements.define(elementName, ...)`. On connection the element SHALL get the dataset attributes `mfeElement` and `noPortalLayoutStyles` (empty values), add each of `classNames`, and then run the original connected behaviour.

#### Scenario: Connect
- **WHEN** the element is attached to the DOM
- **THEN** `data-mfe-element` and `data-no-portal-layout-styles` are present
- **AND** the given CSS classes are added

> Note (code-derived): defining an already registered `elementName` throws via the browser API; no spec file covers this.
