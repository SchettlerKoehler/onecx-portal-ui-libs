# angular-accelerator-directives Specification

## Purpose
Utility directives of `@onecx/angular-accelerator` for layout, content cards, secure image loading, named templates, responsive rendering, loading indicators and search-header view modes. Tooltips and permissions are covered in separate specs.

## Requirements

### Requirement: Content card
`OcxContentDirective` (`[ocxContent]`) SHALL add the CSS class `ocx-card` to its host. If `ocxContent` (string, default `''`) is non-empty, a `<p class="font-medium text-lg">` title with that text SHALL be prepended to the host; when the value changes the title text is updated; when it becomes empty the title is removed. The title id is `ocx_content_title_element`, suffixed with a counter (`0`, `1`, ...) if that id already exists in the document.

#### Scenario: Title given
- **WHEN** `ocxContent="My title"`
- **THEN** the host has `ocx-card` and its first child is the title paragraph

#### Scenario: Title cleared
- **WHEN** the value becomes empty
- **THEN** the title element is removed

### Requirement: Content container layout
`OcxContentContainerDirective` (`[ocxContentContainer]`) SHALL lay out host children as a flex container with `flex`, `gap-3` and `flex-col` by default. Input `layout` (`'horizontal' | 'vertical'`, default `'horizontal'`) and `breakpoint` (`'sm' | 'md' | 'lg' | 'xl'`, default `'md'`) SHALL add `<breakpoint>:flex-row` for horizontal layout and none for vertical. Previously added `*:flex-row` responsive classes SHALL be removed when inputs change. Existing host classes win: a `gap-*` other than `gap-3` removes `gap-3`; `flex-row`, `flex-row-reverse` or `flex-col-reverse` removes `flex-col`. An `ngClass` input (string) exists.

#### Scenario: Default
- **WHEN** no inputs are set
- **THEN** the host has `flex gap-3 flex-col md:flex-row`

#### Scenario: Breakpoint changed
- **WHEN** `breakpoint` changes from `md` to `lg`
- **THEN** `md:flex-row` is replaced with `lg:flex-row`

#### Scenario: Vertical
- **WHEN** `layout="vertical"`
- **THEN** no responsive `flex-row` class is present

> Note (code-derived): the `ngClass` input only triggers re-layout and is not itself applied as classes.

### Requirement: Authenticated image source
`SrcDirective` (`[ocxSrc]`) SHALL hide its host (`visibility: hidden`) on creation. For a defined `ocxSrc` and a non-empty page hostname: if the URL's host equals the page's host, the directive SHALL fetch it via `HttpClient` as a blob (so interceptors apply); on status 200 it sets the host `src` to an object URL (revoked after the host `load` event); on status 204 or an HTTP error it emits the `error` output; on completion the host visibility is set to `initial`. For other hosts, or when the URL cannot be parsed (error logged), the raw URL is set as `src` and the host is made visible. Undefined/empty `ocxSrc` does nothing.

#### Scenario: Same-origin image
- **WHEN** `ocxSrc` points to the same host and the response is 200
- **THEN** `src` is a blob object URL and the host becomes visible

#### Scenario: No content
- **WHEN** the response is 204
- **THEN** `error` is emitted

#### Scenario: Cross-origin
- **WHEN** `ocxSrc` points to another host
- **THEN** no HTTP call is made and `src` is the given URL

> Note (code-derived): a same-origin response with a status other than 200/204 sets no `src` and emits nothing, though visibility is still set on completion.

### Requirement: Named template marker
`TemplateDirective` (`[ocxTemplate]`) SHALL expose the host `TemplateRef` as `template` and the required string input `ocxTemplate` via `getType()`, so parent components can look templates up by name.

#### Scenario: Lookup
- **WHEN** `<ng-template ocxTemplate="cell">` is used
- **THEN** `getType()` returns `'cell'`

### Requirement: Breakpoint-based rendering
`IfBreakpointDirective` (`[ocxIfBreakpoint]`, value `'mobile' | 'desktop'`) SHALL render its template when the current viewport matches, determined by `window.matchMedia('(max-width: <CSS var --mobile-break-point>)')`: matching means mobile, otherwise desktop. Optional `ocxIfBreakpointElseTemplate` SHALL be rendered when it does not match. It SHALL re-evaluate on init and on `window:resize`, only replacing the view when the mobile/desktop state changed.

#### Scenario: Desktop only
- **WHEN** `ocxIfBreakpoint="desktop"` and the viewport is wider than the breakpoint
- **THEN** the template is rendered

#### Scenario: Else template
- **WHEN** it does not match and an else template is given
- **THEN** the else template is rendered

> Note (code-derived): with no else template, a previously rendered view is not cleared when the state flips to non-matching.

### Requirement: Loading indicator
`LoadingIndicatorDirective` (`[ocxLoadingIndicator]`, boolean, default `false`) SHALL, while true, show a loading indicator: with `overlayFullPage` (default `false`) a `LoadingIndicatorComponent` is created in the view container; otherwise the host gets class `element-overlay` and a child `div.loader` (with `loader-small` if `isLoaderSmall`, default `false`) is appended. When false, the indicator is removed and `element-overlay` is removed.

#### Scenario: Element overlay
- **WHEN** the input is true and `overlayFullPage` is false
- **THEN** the host has `element-overlay` and a `.loader` child

#### Scenario: Full page
- **WHEN** the input is true and `overlayFullPage` is true
- **THEN** a `LoadingIndicatorComponent` is created, and destroyed when the input turns false

> Note (code-derived): the directive does not guard against repeated true evaluations, so a changed `overlayFullPage`/`isLoaderSmall` while loading may add a second indicator.

### Requirement: Search header view-mode directives
`BasicDirective` (`[ocxBasic]`) and `AdvancedDirective` (`[ocxAdvanced]`) SHALL only be used inside a `SearchHeaderComponent`; otherwise they MUST throw (`Basic directive can only be used inside search header component` / `Advanced directive can only be used inside search header component`). They render their template only while the header's `viewMode()` is `'basic'` / `'advanced'` respectively and clear it otherwise. `AdvancedDirective` also sets the header's `hasAdvanced` to true.

#### Scenario: Wrong mode
- **WHEN** the header is in advanced mode
- **THEN** `ocxBasic` content is removed and `ocxAdvanced` content is rendered

#### Scenario: Outside search header
- **WHEN** `ocxBasic` is used outside a search header
- **THEN** an error is thrown

### Requirement: Directives Template and appearance - content styles
The global stylesheet `assets/styles.scss` SHALL import, in order, `./tailwind` (the compiled Tailwind v4 build of `tailwind.css`, imported without `.css` so Sass inlines it; layers `theme, base, optimus, components, utilities`), `../src/lib/directives/loading-indicator.directive` and `../src/lib/directives/content.directive`. `.ocx-card` (added by `[ocxContent]`) SHALL be styled `background-color: var(--content-bg-color, #ffffff); padding:1rem; margin-bottom:2rem; border-radius: var(--border-radius, 6px); box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12)`, with `p:first-child { margin-top:0 }` and `p:last-child { margin-bottom:0 }`. The title paragraph created by the directive has classes `font-medium text-lg`.

#### Scenario: Card styling
- **WHEN** an element has `[ocxContent]="'T'"`
- **THEN** it has class `ocx-card` and first child `p#ocx_content_title_element.font-medium.text-lg` with text `T`

### Requirement: Directives Template and appearance - loading indicator styles
Element mode of `[ocxLoadingIndicator]` SHALL add class `element-overlay` to the host (`position:relative; cursor:default; pointer-events:none`, plus `::before { content:''; position:absolute; inset 0 (top/left 0, 100% size); background-color:rgba(0,0,0,0.5); z-index:1 }`) and append `div.loader` (or `div.loader.loader-small` when `isLoaderSmall()`) as the last child; removal restores the host by removing both. Full-page mode (`overlayFullPage()`) SHALL create `ocx-loading-indicator` in the view container instead. The spinner is `.loader` (28px, `border:3px solid var(--primary-color)`, `border-bottom-color: transparent`, `border-radius:50%`, `box-sizing:border-box`, `animation: rotation 1s linear infinite` with keyframes 0deg to 360deg, `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:2`), `.loader-small` is 20px at `top:20%; left:45%`.

#### Scenario: Small loader
- **WHEN** `[ocxLoadingIndicator]="true" [isLoaderSmall]="true"`
- **THEN** the host has `element-overlay` and a child `div.loader.loader-small`

### Requirement: Directives Template and appearance - tooltip and overflow directives
`[ocxTooltip]` (standalone, extends the Optimus `Tooltip`) SHALL force `tooltipEvent='both'` (hover and focus), set `aria-describedby` on the host to a tooltip id (existing option id, else generated `ocx-tooltip-<time36>-<random36>`), apply the same id to the tooltip container, close it on Escape keydown, and set the host inline `cursor` (`pointer` by default or `ocxTooltipCursor` value; `null` leaves styling alone; the previous inline cursor is restored when the text is cleared) only while tooltip content is set. `[ocxTooltipOnOverflow]` SHALL set inline `text-overflow: ellipsis; overflow: hidden; white-space: nowrap` on the host and enable the tooltip only when `scrollWidth > offsetWidth`, re-evaluated by a `MutationObserver` (subtree, characterData, childList). `[ocxSrc]` SHALL set the host `visibility: hidden` initially and `visibility: initial` once the image source is applied or the request completes. `[ocxIfBreakpoint]` SHALL decide mobile vs desktop with `window.matchMedia('(max-width: <--mobile-break-point>)')` where the value is read from the `--mobile-break-point` CSS variable on `:root`, re-evaluated on `window:resize`.

#### Scenario: Truncated text
- **WHEN** an `[ocxTooltipOnOverflow]` host's text is wider than the host
- **THEN** the text is cut with an ellipsis and the tooltip is enabled

> Note (code-derived): `[ocxContentContainer]` and `[ocxContent]` are applied by the layout components; their selectors, classes and responsive class removal (`\w+:flex-row` removed and re-added as `<breakpoint>:flex-row`) are specified in the layout-components spec. Visual output of Tailwind classes cannot be verified without a browser.
