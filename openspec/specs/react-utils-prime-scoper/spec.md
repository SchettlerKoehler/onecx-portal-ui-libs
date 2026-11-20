# react-utils-prime-scoper Specification

## Purpose
Scopes PrimeReact runtime-injected styles to a single app or remote component using CSS `@scope`, so multiple microfrontends sharing PrimeReact do not leak styles into each other. Provides `attachPrimeReactScoper` and the app/remote style provider components.

## Requirements

### Requirement: Scoped style element
`attachPrimeReactScoper(options)` SHALL create a `<style type="text/css" data-<dataPrimereactStyleName>-primereact-style="<id>">` element (default name `app`, i.e. `data-app-primereact-style`) appended to `target` (default `document.head`), and SHALL return a disposer that disconnects the observer but does not remove the style element.

#### Scenario: Remote attribute name
- **WHEN** `dataPrimereactStyleName: 'remote'` is used
- **THEN** the element has `data-remote-primereact-style="<id>"`

#### Scenario: Dispose
- **WHEN** the disposer is called
- **THEN** no further style mutations are processed and the style element remains

### Requirement: Observing PrimeReact styles
The scoper SHALL observe `document.head` (child list, subtree, character data) and process added/changed `<style>` elements that have `data-primereact-style-id` or an id starting with `primereact_` and no `data-app-primereact-style` attribute (including text-node changes in them). Style elements whose parent has `data-app-styles` equal to the scoper id or the `PRODUCT_NAME|PRODUCT_NAME` prefix, or whose id starts with that prefix, SHALL also be processed (unless already marked `data-app-prime-scoped`).

#### Scenario: New PrimeReact style
- **WHEN** a `style[data-primereact-style-id="button"]` is added to the head
- **THEN** a scoped copy is written into the app style element

#### Scenario: Own style elements ignored
- **WHEN** a `data-app-primereact-style` element changes
- **THEN** it is not processed as a PrimeReact source style

### Requirement: Bootstrapping existing styles
When `bootstrapExisting` is true (default) the scoper SHALL immediately process existing theme style elements (`style[data-app-styles]` matching the id or product prefix, or with id starting with the product prefix) and all existing `style[data-primereact-style-id]` elements.

#### Scenario: Existing styles captured
- **WHEN** styles exist before attach and `bootstrapExisting` is true
- **THEN** they are written in the scoped style element

### Requirement: CSS scoping and chunks
For each captured style the scoper SHALL write a chunk prefixed with a banner comment `/* ==== app:<id> | primereact:<styleId> ==== */`. The CSS SHALL be wrapped as `@scope(<scopeRootSelector>) to (<scopeLimitSelector>)` (limit default `[data-style-isolation]`) with `:root` replaced by `:scope`; CSS already containing `@scope` MUST NOT be wrapped again. In mode `replace-per-styleId` (default) one chunk per style id is replaced on change; in mode `append` a new chunk is appended each time. Empty CSS is ignored.

#### Scenario: Wrapping
- **WHEN** CSS `:root{--a:1}` is captured with root selector `[data-style-id="p|p"]`
- **THEN** the output is `@scope([data-style-id="p|p"]) to ([data-style-isolation]){ :scope{--a:1} }`

#### Scenario: Already scoped CSS
- **WHEN** the CSS contains `@scope`
- **THEN** it is written unchanged

### Requirement: Change detection and filtering
Unchanged CSS (same hash after optional comment-stripping/whitespace-collapsing normalization, `normalizeBeforeHash` default true) SHALL NOT be rewritten. If `prefixFilter` is set, a style SHALL only be included if its id is in `alwaysIncludeStyleIds` (default `base`, `global`, `common`) or its CSS contains `--<prefixFilter>-`. Updates SHALL only be accepted within `captureWindowMs` after attach (default unlimited).

#### Scenario: Prefix filter
- **WHEN** `prefixFilter: 'main'` and a non-always-included style lacks `--main-`
- **THEN** it is skipped

#### Scenario: Capture window elapsed
- **WHEN** more than `captureWindowMs` has passed
- **THEN** new changes are ignored

### Requirement: Locks and freezing
With `blockFurtherUpdatesForCapturedIds` true, once a style id was written, later updates for it SHALL be ignored. With `enableThemeCaptureOnce` (default true) and `themeStyleId` set, the theme style id is captured only once. With `freezeAfterFirstUpdate` true, the observer SHALL disconnect after the first written chunk.

#### Scenario: Block updates
- **WHEN** a captured style id changes again and blocking is enabled
- **THEN** the scoped chunk keeps its first content

### Requirement: Source style rewriting
With `scopePrimeReactSourceStyles` true, the original `data-primereact-style-id` style elements SHALL be rewritten in place with scoped CSS and marked `data-app-prime-scoped="true"`.

#### Scenario: Source rewritten
- **WHEN** the option is enabled and a PrimeReact style is processed
- **THEN** the source element content is the scoped CSS

### Requirement: Theme style re-targeting
CSS captured from theme style elements (`data-app-styles` / prefixed id) SHALL have the `data-style-id` inside existing `@scope([data-style-id="..."]` replaced with the scoper `id`.

#### Scenario: Scope id adjusted
- **WHEN** theme CSS has `@scope([data-style-id="other|other"]`
- **THEN** it is written with the current scoper id

### Requirement: App PrimeReactStyleProvider
`AppPrimeReactStyleProvider` SHALL, using `PRODUCT_NAME` from app globals, render a `<div style="display: contents" data-style-id="<P>|<P>" data-style-isolation data-no-portal-layout-styles>` around its children and attach a scoper on mount (`bootstrapExisting: true`, `blockFurtherUpdatesForCapturedIds: false`, root selector `[data-style-id="<P>|<P>"]`, `productName` = `PRODUCT_NAME`), detaching on unmount.

#### Scenario: Wrapper and scoper
- **WHEN** rendered with `PRODUCT_NAME` `app`
- **THEN** the wrapper has `data-style-id="app|app"` and a scoper is attached with that id

### Requirement: Remotes PrimeReactStyleProvider
`RemotesPrimeReactStyleProvider` SHALL behave like the app provider but attach the scoper with `blockFurtherUpdatesForCapturedIds: true`, `freezeAfterFirstUpdate: true` and `dataPrimereactStyleName: 'remote'`, and SHALL render nothing until the scoper has been attached (first effect).

#### Scenario: Deferred render
- **WHEN** the provider first renders
- **THEN** children appear only after the scoper is attached
