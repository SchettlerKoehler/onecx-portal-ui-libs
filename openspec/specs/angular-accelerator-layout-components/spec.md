# angular-accelerator-layout-components Specification

## Purpose
Small presentational and utility components of the accelerator library: content card (`ocx-content`), content container (`ocx-content-container`), lifecycle timeline (`ocx-lifecycle`), consent gate (`ocx-consent`), loading overlay (`ocx-loading-indicator`) and the global error page (`ocx-error`). Used by application developers to structure pages and handle common cross-cutting UI concerns.

## Requirements

### Requirement: Content card
`ocx-content` SHALL wrap its projected content in a card (CSS class `ocx-card`). If `title` (default `''`) is non-empty, a title paragraph SHALL be prepended inside the card; when `title` becomes empty the title element SHALL be removed. `styleClass` (default `undefined`) SHALL be applied as additional CSS classes to the card.

#### Scenario: With title
- **WHEN** `title` is "Details"
- **THEN** the card shows "Details" as first element above the projected content

#### Scenario: Title removed
- **WHEN** `title` changes from "Details" to `''`
- **THEN** the title element is removed

#### Scenario: Style class
- **WHEN** `styleClass` is `p-4`
- **THEN** the card element has the class `p-4`

### Requirement: Content container
`ocx-content-container` SHALL lay out its projected children as a flex container with gap. `layout` (`horizontal` default, or `vertical`) controls direction; with `horizontal` the layout SHALL be a row from the `breakpoint` (`sm`, `md` default, `lg`, `xl`) upward and a column below it, with `vertical` always a column. `styleClass` SHALL be added as extra classes; custom `gap-*` classes replace the default `gap-3`, and custom flex direction classes (`flex-row`, `flex-row-reverse`, `flex-col-reverse`) take precedence over the default `flex-col`. Changing `layout` or `breakpoint` SHALL replace previously applied responsive row classes.

#### Scenario: Default
- **WHEN** no inputs are set
- **THEN** the container is a column below `md` and a row from `md`

#### Scenario: Vertical
- **WHEN** `layout` is `vertical`
- **THEN** no responsive `*:flex-row` class is applied

#### Scenario: Breakpoint change
- **WHEN** `breakpoint` changes from `md` to `lg`
- **THEN** `md:flex-row` is removed and `lg:flex-row` is applied

#### Scenario: Custom gap
- **WHEN** `styleClass` contains `gap-6`
- **THEN** `gap-3` is not applied

### Requirement: Lifecycle timeline
`ocx-lifecycle` SHALL render the `steps` (`LifecycleStep`: `id`, `title`, optional `details`; default `[]`) as a timeline in the given order, showing each `title` and, when present, its `details`. The step whose `id` equals `activeStepId` SHALL be visually highlighted (marker and card); with no or unmatched `activeStepId` no step is highlighted.

#### Scenario: Active step
- **WHEN** `activeStepId` is `'review'` and a step has id `review`
- **THEN** that step's marker and card are highlighted and others are not

#### Scenario: Details
- **WHEN** a step has no `details`
- **THEN** only its title is shown

### Requirement: Consent gate
`ocx-consent` SHALL show a consent prompt instead of its projected content until the user has consented for `url` (required input) and optional `purpose`. The prompt SHALL show the translated title (`titleKey`, default `OCX_CONSENT.TITLE`), the message (`messageKey`, default `OCX_CONSENT.MESSAGE`, with parameter `url` = the normalized URL), projected `[ocx-consent-info]` content and an agree button (`agreeKey`, default `OCX_CONSENT.AGREE`). Once consent is present, the projected content SHALL be rendered and the prompt hidden. The component SHALL use OnPush change detection.

#### Scenario: No consent
- **WHEN** no stored consent matches `url`
- **THEN** the prompt is shown and the projected content is not rendered

#### Scenario: Consent granted
- **WHEN** the user clicks the agree button
- **THEN** the projected content is rendered
- **AND** `consentChanged` emits `{ url: <normalized>, hasConsent: true, purpose }`

#### Scenario: Already consented
- **WHEN** consent for the URL (and purpose) is already stored
- **THEN** the content is rendered immediately and `consentChanged` is not emitted on grant

### Requirement: Consent persistence and matching
Consent SHALL be stored in `localStorage` under the key `onecx-consent` as a JSON array of strings, each being `<normalizedUrl>` (no purpose) or `<normalizedUrl>::<purpose>`. URLs SHALL be normalized by trimming, removing hash and query string, lowercasing the host and removing a trailing slash; invalid URLs only have trimming and trailing-slash removal applied. A stored entry matches when the normalized URLs are equal and, if `purpose` is set, the purposes are equal; if `purpose` is not set any entry for the URL matches. Invalid or non-array stored data SHALL be treated as no consent. An empty/blank `url` SHALL never have consent and giving or resetting consent for it SHALL do nothing.

#### Scenario: Normalization
- **WHEN** consent was granted for `https://Tile.Example.com/?a=1#x`
- **THEN** it matches `https://tile.example.com`

#### Scenario: Purpose scoping
- **WHEN** consent is stored for the URL with purpose `maps` and the component has purpose `analytics`
- **THEN** the component shows the prompt

#### Scenario: Corrupt storage
- **WHEN** `onecx-consent` contains invalid JSON
- **THEN** it is treated as empty

### Requirement: Consent withdrawal
When `showWithdraw` is `true` (default) and consent is present, a withdraw link (`withdrawKey`, default `OCX_CONSENT.WITHDRAW`) SHALL be shown below the content. Activating it SHALL remove the stored entries for the URL (only the entries with the same purpose when `purpose` is set, all purposes when not), emit `consentChanged` with `hasConsent: false`, and show the prompt again. With `showWithdraw` `false` no withdraw link is rendered.

#### Scenario: Withdraw
- **WHEN** the user activates the withdraw link
- **THEN** the stored consent is removed
- **AND** `consentChanged` emits `{ url, hasConsent: false, purpose }`
- **AND** the consent prompt is shown

> Note (code-derived): `resetConsent` emits `hasConsent: false` even if no consent was stored. `giveConsent` emits nothing if the URL is already consented.

### Requirement: Loading indicator component
`ocx-loading-indicator` SHALL render a full-page overlay with a spinner. It has no inputs or outputs. It is rendered by the `ocxLoadingIndicator` directive with `overlayFullPage`.

#### Scenario: Rendering
- **WHEN** the component is created
- **THEN** an overlay with a loader element is displayed

### Requirement: Loading indicator directive
The `ocxLoadingIndicator` directive (input `ocxLoadingIndicator`, default `false`, plus `overlayFullPage` and `isLoaderSmall`, default `false`) SHALL show a loader when its value is `true` and remove it when `false`. With `overlayFullPage` the `LoadingIndicatorComponent` overlay SHALL be created; otherwise the host element receives the class `element-overlay` and a `loader` child element (additional class `loader-small` when `isLoaderSmall`).

#### Scenario: Element loader
- **WHEN** `ocxLoadingIndicator` becomes `true` without `overlayFullPage`
- **THEN** the host gets `element-overlay` and a `.loader` child is appended

#### Scenario: Full page
- **WHEN** `ocxLoadingIndicator` and `overlayFullPage` are `true`
- **THEN** the full page overlay component is created

#### Scenario: Loading finished
- **WHEN** `ocxLoadingIndicator` becomes `false`
- **THEN** the overlay or loader is removed

### Requirement: Global error page
`ocx-error` (`GlobalErrorComponent`) SHALL display an error page with the heading "ERROR", an image, the error code and a "Try Again" button that reloads the browser window. On creation it SHALL set `errCode` from the query parameter `err`, defaulting to `E1001_FAILED_START`, and `backUrl` from the query parameter `return`, defaulting to `/`. `onGoBack()` SHALL navigate to `backUrl` with the router.

#### Scenario: Error code from query
- **WHEN** the route has query `?err=E42`
- **THEN** `E42` is displayed

#### Scenario: Default code
- **WHEN** no `err` query parameter exists
- **THEN** `E1001_FAILED_START` is displayed

#### Scenario: Retry
- **WHEN** the user clicks "Try Again"
- **THEN** the page is reloaded

> Note (code-derived): The texts "ERROR" and "Try Again" and the image are not translated, and no button in the template calls `onGoBack()`.

### Requirement: Content and content container Template and appearance
`ocx-content` SHALL render `div[ocxContent]="title()" [ngClass]="styleClass()"` projecting `<ng-content>`; the directive adds class `ocx-card` and, when a title is set, prepends `p#ocx_content_title_element[.font-medium.text-lg]` (id suffixed with a counter `0,1,...` when taken). `ocx-content-container` SHALL render `div[ocxContentContainer][layout][breakpoint][ngClass]=styleClass()` projecting content; the directive sets `flex gap-3 flex-col` plus `<breakpoint>:flex-row` (default `md`) for horizontal layout. Neither component has its own stylesheet; `.ocx-card` comes from `content.directive.scss` (see directives spec).

#### Scenario: Horizontal container
- **WHEN** layout is horizontal and breakpoint `lg`
- **THEN** the inner div has classes `flex gap-3 lg:flex-row` (and `flex-col` is removed if `flex-row`/`flex-row-reverse`/`flex-col-reverse` is supplied via styleClass)

### Requirement: Lifecycle Template and appearance
`ocx-lifecycle` SHALL render `p-timeline [value]="steps()"` with `pTemplate="marker"`: `span.p-timeline-event-marker` plus class `bg-primary` when `activeStepId() === step.id`; and `pTemplate="content"`: `div.pb-4.h-full > div.card.h-full` (plus `bg-primary` for the active step) holding `p.font-bold.text-xl` (`step.title`, plus `mb-2` when details exist) and, if `step.details`, a `p` with class `text-color-secondary` unless active. Title and details are rendered untranslated.

#### Scenario: Active step
- **WHEN** `activeStepId` equals a step id
- **THEN** that step's marker and card have `bg-primary` and its details lack `text-color-secondary`

### Requirement: Consent Template and appearance
`ocx-consent` (`consent.component.scss`, OnPush) SHALL, when `hasConsent()`, render the projected content followed (only if `showWithdraw()`) by `div.w-full.flex.justify-center.mt-1 > a.cursor-pointer.text-primary.underline` (`aria-label` and text = `withdrawKey() | translate`, default `OCX_CONSENT.WITHDRAW`, click calls `resetConsent()`). Otherwise it SHALL render `section.flex.w-full.h-full.items-center.justify-center.p-3.ocx-consent` with `aria-labelledby=ocx-consent-title-<n>` and `aria-describedby=ocx-consent-message-<n>` containing `div.flex.flex-col.gap-4.items-center.justify-center.text-center.ocx-consent__content` with `p.m-0.text-xl.font-semibold[id=titleId]` (`OCX_CONSENT.TITLE`), `p.m-0[id=messageId][aria-live=polite]` (`OCX_CONSENT.MESSAGE` with `{url: normalizedUrl()}`), the `[ocx-consent-info]` projection slot, and `button[pButton][pRipple][type=button]` (`aria-label` and text `agreeKey()`, default `OCX_CONSENT.AGREE`) calling `giveConsent()`. Style: `.ocx-consent__content { max-width:48rem }`.

#### Scenario: No consent
- **WHEN** consent is absent
- **THEN** the content is not projected and the section with title, message and agree button appears

### Requirement: Loading indicator and error page Template and appearance
`ocx-loading-indicator` SHALL render `div.full-overlay > div.overlay > span.loader`. `.full-overlay` is `position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999`; `.overlay` is `position:absolute` filling the parent with `background-color: rgba(0,0,0,0.5)`, flex centring and `z-index:99999`. `.loader` is not in the component stylesheet but in the global `loading-indicator.directive.scss` (28px spinner, `3px solid var(--primary-color)` with transparent bottom border, `border-radius:50%`, `animation: rotation 1s linear infinite`, centred at 50%/50% via `transform: translate(-50%,-50%)`, `z-index:2`; `.loader-small` 20px at top 20% / left 45%), so the global stylesheet must be loaded.

`ocx-error` SHALL render `div.pages-body.error-page.flex.flex-col > div.self-center.mt-auto.mb-auto > div.pages-panel.card.flex.flex-col` containing `div.pages-header.px-3.py-1 > h2` ("ERROR", hard-coded), `div.card.mt-3.px-6 > img[src="assets/images/error.png"][alt=""]`, `div.pages-detail.pb-6` (`errCode()`), and `button[pButton][pRipple][type=button][label="Try Again"].p-button-text` calling `reload()`. Styles: `.pages-body { height:100vh }`; `.error-page { background-color: var(--primary-color); background-size: cover }` with header background `#d81b60`; `.pages-panel { text-align:center; z-index:200 }`, `.card` border `1.5px solid var(--divider-color)`, radius `6px`, image `width:100%`, nested `.card` background `var(--content-alt-bg-color)`; `.pages-header` `margin-top:-3rem`, colour `var(--primary-color-text)`, 4px radius, auto side margins, `h2 { margin:0 }`; `.pages-detail { color: var(--text-secondary-color) }`. Unused variants exist for `.notfound-page` (`#455a64`), `.accessdenied-page` (`#fb8c00`), `.topbar` (`#1565c0`) and a `max-width:768px` `.contact-page` rule.

#### Scenario: Error page
- **WHEN** navigated with `?err=E42`
- **THEN** the panel shows ERROR, the image, `E42` and a "Try Again" text button

> Note (code-derived): `assets/images/error.png` is not shipped in the library assets (only `placeholder.png`), so the host app must provide it; "ERROR" and "Try Again" are not translated.
