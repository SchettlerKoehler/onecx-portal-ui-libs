# angular-utils-style Specification

## Purpose
Entry point `@onecx/angular-utils/style`. Manages application-specific CSS `<style>` elements in `document.head` for microfrontends (MFE) and remote components (RC): fetching an application's `styles.css`, scoping it, creating the style element and tracking which MFE/RC uses it so unused styles are removed. Used mainly by the OneCX shell.

## Requirements

### Requirement: Style marker attributes
The entry point SHALL export the dataset keys and attribute names `dataAppStylesKey`/`dataAppStylesAttribute` (`appStyles`/`data-app-styles`), `dataMfeStylesKey`/`dataMfeStylesAttribute` (`mfeStyles`/`data-mfe-styles`), `dataShellStylesKey`/`dataShellStylesAttribute` (`shellStyles`/`data-shell-styles`), `dataRcStylesStart` (`slot`), and functions `dataRcStylesKey(slotName)` (`slot<CapitalizedSlotName>Styles`) and `dataRcStylesAttribute(slotName)` (`data-slot-<slotName>-styles`).

#### Scenario: RC keys
- **WHEN** `dataRcStylesKey('menu')` and `dataRcStylesAttribute('menu')` are called
- **THEN** they return `slotMenuStyles` and `data-slot-menu-styles`

### Requirement: Fetching application CSS
`fetchAppCss(http, appUrl)` SHALL request `<appUrl>/styles.css` (joined with a slash) with header `Accept: text/css`, observing the full text response, and resolve with the body. If the response `Content-Type` does not include `text/css`, or the request fails, it SHALL log an error and resolve `undefined`. `createCssRequestHeaders()` and `isResponseValidCss(response)` SHALL be exported.

#### Scenario: Wrong content type
- **WHEN** the server answers with `text/html`
- **THEN** an error is logged and `undefined` is returned

### Requirement: Usage tracking
Usage of a style element SHALL be tracked in its dataset: `useStyleForMfe` sets the MFE key; `useStyleForRc(el, slot)` sets the slot key; `removeMfeUsageFromStyle`/`removeRcUsageFromStyle` delete them. `isStyleUsedByMfe`, `getStyleUsageCountForRc` (count of dataset keys starting with `slot`) and `getStyleUsageCount` (MFE counts 1 plus RC count) SHALL report usage. `slotNameToPropertyName` SHALL convert `-x` to `X` (kebab to camel case). `getAllStylesUsedByKey(attribute)` SHALL return all `<style>` elements in the head having the attribute.

#### Scenario: Count usages
- **WHEN** a style is used by the MFE and by two RC slots
- **THEN** `getStyleUsageCount` returns 3

### Requirement: Style DOM helpers
`addStyleToHead(content, datasetAttributes?)` SHALL append a new `<style>` with the text and dataset attributes to `document.head` and return it. `replaceStyleContent(selectorOrElement, content)` SHALL set the text of the element (or the head element matching the selector) and return it, or `null` if the selector matches nothing. `createStyleUsedByMfeRc(scopeId, options)` SHALL create an empty style with `data-app-styles=<scopeId>` registered for the MFE or for the RC slot. `getAppStyleByScope(scopeId)` SHALL return the head style with `data-app-styles` equal to the scope id or `null`.

#### Scenario: Selector without match
- **WHEN** `replaceStyleContent('style[foo]', 'x')` finds no element
- **THEN** `null` is returned

### Requirement: Scoping application CSS
`createApplicationScopedCss(css, scopeId)` SHALL wrap the CSS in `@scope([data-style-id="<scopeId>"]:is([data-no-portal-layout-styles], [data-mfe-element])) to ([data-style-isolation])` when `CSSScopeRule` is supported, otherwise in an `@supports (@scope(...))` block so a polyfill can process it. Inside, `html` and `:root` selectors SHALL be replaced by `:scope` (`replaceRootAndHtmlWithScope`; `replaceRootWithScope` replaces only `:root`).

#### Scenario: Root replacement
- **WHEN** css contains `:root { --a: 1 }` and `html { color: red }`
- **THEN** the scoped css contains `:scope` in both places

> Note (code-derived): `replaceAll('html', ':scope')` is a plain text replacement and also changes any other occurrence of the text `html` (e.g. in class names or URLs).

### Requirement: Updating styles on MFE change
`updateStylesForMfeChange(productName, appId, httpClient, mfeUrl)` SHALL compute the scope id (`<productName>|<appId>`), remove MFE usage from all style elements of other scopes (removing elements left with no users), and then: if a style for the scope exists, register the MFE for it and stop; otherwise create the style immediately registered for the MFE, fetch the CSS, store the unscoped CSS on the element as `onecxOriginalCss`, and fill it with the scoped CSS. If the CSS could not be fetched or is empty, the MFE usage SHALL be removed and the element deleted when it has no other users.

#### Scenario: Existing style
- **WHEN** a style for the scope already exists
- **THEN** no request is made and the MFE is registered as user

#### Scenario: Failed CSS load
- **WHEN** `fetchAppCss` yields `undefined`
- **THEN** the newly created style element is removed if unused

### Requirement: Updating styles on RC creation and removal
`updateStylesForRcCreation(productName, appId, httpClient, rcUrl, slotName)` SHALL behave like the MFE variant but registers the RC for its slot and does not remove other usages. `removeAllMfeUsagesFromStyles(scopeId)` and `removeAllRcUsagesFromStyles(scopeId, slotName)` SHALL remove the MFE or slot usage from all style elements whose `data-app-styles` differs from the scope id and delete elements left with zero usages.

#### Scenario: Remove RC usages
- **WHEN** `removeAllRcUsagesFromStyles(scopeA, 'slot')` is called
- **THEN** the slot usage is removed from styles of other scopes and unused ones are deleted

> Note (code-derived): `updateStylesForMfeChange`/`updateStylesForRcCreation` do not return the internal promise, so callers cannot await completion. This lib has no spec tests.

### Requirement: Reading style data from DOM and injector
`getStyleDataOrIntermediateStyleData(node)` SHALL find the closest ancestor (or self) `HTMLElement` carrying `data-style-id` or `data-intermediate-style-id` and return `StyleData` (`styleId`, `noPortalLayoutStyles`, `mfeElement`), preferring the regular value over the intermediate one; it returns `null` if none. `findElementWithStyleDataOrIntermediateStyleData(node)` returns that element. `getStyleDataFromInjector(object)` SHALL obtain the injector via `getInjector`, read `APP_ID.appElementName`, find the first element with that tag name and return its style data, or `null` at any missing step.

#### Scenario: No injector
- **WHEN** the object exposes no injector
- **THEN** `getStyleDataFromInjector` returns `null`
