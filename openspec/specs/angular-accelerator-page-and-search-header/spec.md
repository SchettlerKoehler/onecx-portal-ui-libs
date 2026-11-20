# angular-accelerator-page-and-search-header Specification

## Purpose
`PageHeaderComponent` (`ocx-page-header`) renders the standard page header (breadcrumbs, title, figure, actions, object details). `SearchHeaderComponent` (`ocx-search-header`) builds on it to provide a search form container with search/reset buttons, basic/advanced modes and search-config integration. Used by every OneCX application page.

## Requirements

### Requirement: Page header title and states
`ocx-page-header` SHALL render `header` as the page `h1` and `subheader` as a note, each only when non-empty. With `loading` = `true` it SHALL show skeleton placeholders instead of title, subheader and actions. Defaults: `loading` = `false`, `showFigure` = `true`, `showBreadcrumbs` = `true`, `manualBreadcrumbs` = `false`, `actions` = `[]`.

#### Scenario: Title and subheader
- **WHEN** `header` is "Orders" and `subheader` is "All orders"
- **THEN** an `h1` "Orders" and a subheader "All orders" (labelled `OCX_PAGE_HEADER.SUBHEADER`) are shown

#### Scenario: Loading
- **WHEN** `loading` is `true`
- **THEN** skeletons are shown and the title, subheader and actions are not rendered

#### Scenario: Empty title
- **WHEN** `header` is empty
- **THEN** no `h1` is rendered

### Requirement: Page header figure
When `showFigure` is `true` the header SHALL show a figure area. If `figureImage` is set and has not failed to load it SHALL display the image; a projected `[figureImage]` element SHALL be displayed in the figure area. When there is no projected/loaded image, or the image failed to load, a colored placeholder blob SHALL be shown. With `showFigure` = `false` no figure is rendered.

#### Scenario: Image load error
- **WHEN** the `figureImage` URL fails to load
- **THEN** the image is removed and the placeholder blob is shown

#### Scenario: Figure hidden
- **WHEN** `showFigure` is `false`
- **THEN** no figure area is rendered

> Note (code-derived): `figureBackground`, `disableDefaultActions` and the `save` output are retained but deprecated (documented as deprecated); `onAction('save')` emits `save`.

### Requirement: Page header actions
`actions` (`Action[]`) SHALL be split by `show`: `always` actions are rendered as buttons in the header and `asOverflow` actions as items of a "more actions" popup menu (button labelled `OCX_PAGE_HEADER.MORE_ACTIONS`) shown only if at least one overflow action remains. Actions with `conditional: true` SHALL only be shown when `showCondition` is truthy. Actions with a `permission` SHALL only be shown if the user has that permission, checked through the injected `HAS_PERMISSION_CHECKER` when provided, otherwise through `UserService`. Button label SHALL be `labelKey` (translated) else `label`; tooltip SHALL be the (translated) `titleKey` else `title`, or for disabled actions `disabledTooltipKey`/`disabledTooltip`; aria label SHALL be `ariaLabelKey`/`ariaLabel`, falling back to title and then label. `disabled` and `loading` SHALL be reflected on the button. The page header SHALL reflect changes to `actions`.

#### Scenario: Inline action
- **WHEN** an action `{ id:'edit', labelKey:'EDIT', show:'always' }` is provided
- **THEN** a button with the translated label is rendered

#### Scenario: Overflow action
- **WHEN** an action has `show: 'asOverflow'`
- **THEN** it is available in the overflow menu with translated label and tooltip, and is `disabled` when `disabled` is set

#### Scenario: Permission missing
- **WHEN** an action requires permission `X` and the user lacks it
- **THEN** the action is not shown

#### Scenario: Conditional action
- **WHEN** an action has `conditional: true` and `showCondition: false`
- **THEN** it is not shown

> Note (code-derived): An action without `show` set is shown neither inline nor in the overflow menu. `showCondition` is evaluated on the copy passed in; to update it the action object must be replaced.

### Requirement: Page header action execution
Clicking an inline action or choosing an overflow item SHALL execute the action through the shared action handler: if `routerLink` is set the router navigates there, and `actionCallback` is invoked when defined. Inline actions with a string `routerLink` that are not disabled SHALL be rendered as links.

#### Scenario: Callback action
- **WHEN** the user clicks an action with `actionCallback`
- **THEN** the callback is called

#### Scenario: Router link action
- **WHEN** an inline action has a string `routerLink` and is not disabled
- **THEN** it is rendered as a link to that route

### Requirement: Page header breadcrumbs
When `showBreadcrumbs` is `true`, the header SHALL show a breadcrumb with a home item that links to the workspace base URL (initially `/`) and displays the home icon, with home aria label `OCX_PAGE_HEADER.HOME_ARIA_LABEL` including the workspace name (or `OCX_PAGE_HEADER.HOME_DEFAULT_ARIA_LABEL` without name). The breadcrumb items SHALL come from `BreadcrumbService.generatedItemsSource` by default, or from `BreadcrumbService.itemsHandler` when `manualBreadcrumbs` is `true` (evaluated at initialization). Each breadcrumb link SHALL get an aria label built from `OCX_PAGE_HEADER.BREADCRUMB_ARIA_LABEL` and its text, and the last item SHALL get `aria-current="page"`.

#### Scenario: Automatic breadcrumbs
- **WHEN** `manualBreadcrumbs` is `false`
- **THEN** generated breadcrumbs are displayed

#### Scenario: Manual breadcrumbs
- **WHEN** `manualBreadcrumbs` is `true` and the app calls `BreadcrumbService.setItems`
- **THEN** those items are displayed

#### Scenario: Hidden breadcrumbs
- **WHEN** `showBreadcrumbs` is `false`
- **THEN** no breadcrumb is rendered

### Requirement: Page header object details
`objectDetails` (`ObjectDetailItem[]`) SHALL be rendered as label/value pairs. Each item shows `label` (optionally transformed by `labelPipe`) and, when `icon` or `value` is set, the value (optionally transformed by `valuePipe` with `valuePipeArgs`), an optional icon (`icon` with `iconStyleClass`), `valueCssClass`, and tooltips from `labelTooltipKey` and `valueTooltipKey` (a string or `{key, parameters}` translation key). If `actionItemIcon` and `actionItemCallback` are set, a button SHALL be shown that calls the callback, with aria label from `actionItemAriaLabelKey` (translated) else a generated text `button for <icon>`, and tooltip from `actionItemTooltipKey`. Without `objectDetails` nothing is rendered for the panel besides projected content.

#### Scenario: Detail item with value
- **WHEN** an item `{ label:'Status', value:'Open' }` is given
- **THEN** both label and value are rendered

#### Scenario: Action item
- **WHEN** an item defines `actionItemIcon` and `actionItemCallback`
- **THEN** a button is shown and clicking it calls the callback

#### Scenario: Value transformed by a pipe
- **WHEN** an item defines `valuePipe`
- **THEN** the value is transformed with that pipe

### Requirement: Page header layout
The object panel layout SHALL depend on `enableGridView`: `true` selects a grid layout (each item spanning 12/`gridLayoutDesktopColumns` of 12 columns on large screens, defaulting to 4 when not set), `false` selects a column layout, and unset selects the default responsive row/column layout. `gridLayoutDesktopColumns` SHALL accept 1, 2, 3, 4, 6 or 12. The header SHALL project content into the object panel (default slot), `[toolbarItems]` into the toolbar, and the templates named `additionalToolbarContent` and `additionalToolbarContentLeft` into the right and left of the action area.

#### Scenario: Grid view
- **WHEN** `enableGridView` is `true` and `gridLayoutDesktopColumns` is `3`
- **THEN** items use a grid layout with `lg:col-span-4`

#### Scenario: Column view
- **WHEN** `enableGridView` is `false`
- **THEN** items are laid out in a column layout

### Requirement: Search header basics
`ocx-search-header` SHALL render an `ocx-page-header` (with `header`, `subheader`, `manualBreadcrumbs`) containing the projected search criteria, a search button and, only when the `resetted` output is observed, a reset button. If `header` is empty the translated `OCX_SEARCH_HEADER.HEADER` SHALL be used. Defaults: `viewMode` = `basic`, `loading` = `false`, `manualBreadcrumbs` = `false`, `actions` = `[]`, `searchResultsCount` = `null`, `searchButtonDisabled` = `false`, `resetButtonDisabled` = `false`, labels/tooltips = `''`, `pageName` = application path of the current location. Page header `actions` SHALL be forwarded.

#### Scenario: Default header
- **WHEN** `header` is not set
- **THEN** the translated `OCX_SEARCH_HEADER.HEADER` is displayed

#### Scenario: Reset button only when observed
- **WHEN** no handler is bound to `resetted`
- **THEN** no reset button is shown

### Requirement: Search and reset buttons
The search button (`id` `searchButton`) SHALL emit `searched` when clicked and SHALL be disabled when `searchButtonDisabled` is `true` or the projected reactive form is invalid. The reset button (`id` `resetButton`) SHALL emit `resetted` when clicked and be disabled when `resetButtonDisabled` is `true`. Labels, aria labels and tooltips SHALL default to the translations `OCX_SEARCH_HEADER.SEARCH_BUTTON.*` / `RESET_BUTTON.*` (`TEXT`, `ARIA_LABEL`, `DETAIL`) and be overridable by `searchButtonLabel`, `searchButtonAriaLabel`, `searchButtonTooltip`, `resetButtonLabel`, `resetButtonAriaLabel` and `resetButtonTooltip`. The button order SHALL depend on the configuration property `ONECX_PORTAL_SEARCH_BUTTONS_REVERSED`: when `'true'` the order is search, reset; otherwise reset, search. No buttons are rendered until this configuration value is resolved.

#### Scenario: Search click
- **WHEN** the search button is clicked
- **THEN** `searched` is emitted

#### Scenario: Invalid form
- **WHEN** the projected `FormGroup` is invalid
- **THEN** the search button is disabled

#### Scenario: Reversed buttons
- **WHEN** the configuration property is `'true'`
- **THEN** the search button appears before the reset button

### Requirement: Search on Enter
Pressing Enter (including numpad Enter) inside an `INPUT` of the search criteria SHALL trigger a single search, via one delegated listener on the criteria container. It SHALL be ignored when the event was already default-prevented, during IME composition, for targets other than `INPUT`, for inputs with `aria-expanded="true"`, and for inputs inside an element with `role="listbox"` or `role="dialog"`.

#### Scenario: Enter in text input
- **WHEN** the user presses Enter in a plain input
- **THEN** `searched` is emitted once

#### Scenario: Enter in textarea
- **WHEN** Enter is pressed in a textarea or button
- **THEN** no search is triggered

#### Scenario: Open combobox
- **WHEN** Enter is pressed in an input with `aria-expanded="true"`
- **THEN** no search is triggered

### Requirement: Basic and advanced view mode
`viewMode` SHALL be a two-way bindable value `basic` or `advanced`. Elements marked with `*ocxAdvanced` SHALL be rendered only in `advanced` mode. Using `*ocxAdvanced` inside the search header SHALL cause a toggle action (id `simpleAdvancedButton`, shown always) to be added to the header actions, before the user-provided actions; its label and title SHALL be `OCX_SEARCH_HEADER.TOGGLE_BUTTON.ADVANCED.TEXT`/`.DETAIL` in basic mode and `...SIMPLE...` in advanced mode. Toggling SHALL switch the mode. On every `viewMode` change (including the initial value) the component SHALL emit `viewModeChanged` and `componentStateChanged` with `{ activeViewMode }`.

#### Scenario: Toggle
- **WHEN** an `*ocxAdvanced` field exists and the user clicks the toggle in basic mode
- **THEN** `viewMode` becomes `advanced`, the advanced fields appear and `viewModeChanged` emits `advanced`

#### Scenario: No advanced fields
- **WHEN** no `*ocxAdvanced` directive is used
- **THEN** no toggle action is added

#### Scenario: Directive outside search header
- **WHEN** `*ocxAdvanced` is used outside an `ocx-search-header`
- **THEN** an error "Advanced directive can only be used inside search header component" is thrown

> Note (code-derived): The docs also describe a `*ocxBasic` directive (visible in basic mode only); it is outside this component's scope.

### Requirement: Search config integration
When the `selectedSearchConfigChanged` output is observed and `pageName` is truthy, the search header SHALL render, in the left toolbar area and subject to `searchConfigPermission`, the slot `onecx-search-config` with the inputs `pageName`, `currentFieldValues` and `viewMode` and the output `searchConfigSelected`. `currentFieldValues` SHALL be the projected form's current value (initially and on change, debounced 100 ms) with values of fields not currently rendered (not matching a visible `FormControlName`) and falsy values set to `undefined`. A selected config SHALL be re-emitted via `selectedSearchConfigChanged` (`SearchConfigData` with `name`, `fieldValues`, `displayedColumnsIds`, `viewMode`) and `componentStateChanged` with `{ selectedSearchConfig }` (the config name, or `null` when none). A `skeleton` placeholder is shown while the slot loads. Templates named `additionalToolbarContentLeft` and `additionalToolbarContent` SHALL be projected into the toolbar.

#### Scenario: Config selected
- **WHEN** the slot emits a search config named "My search"
- **THEN** `selectedSearchConfigChanged` emits it and `componentStateChanged` emits `{ selectedSearchConfig: 'My search' }`

#### Scenario: No observer
- **WHEN** nobody listens to `selectedSearchConfigChanged`
- **THEN** the search config slot is not rendered

#### Scenario: Config cleared
- **WHEN** the slot emits `undefined`
- **THEN** `componentStateChanged` emits `{ selectedSearchConfig: null }`

### Requirement: Search result announcements
After each search (button click or Enter), the search header SHALL announce the result to screen readers politely, exactly once. If `searchResultsCount` is non-null, the announcement SHALL be made when `loading` is `false`: `OCX_SEARCH_HEADER.ANNOUNCEMENTS.RESULTS_FOUND` with `count` when the count is non-zero, otherwise `OCX_SEARCH_HEADER.ANNOUNCEMENTS.NO_RESULTS`. If `searchResultsCount` is `null`, the component SHALL instead request an announcement of the next new data from the data table or list grid via `ResultsAnnouncementService`. Nothing SHALL be announced at page load.

#### Scenario: Results with count
- **WHEN** a search is performed and `searchResultsCount` is 5 with `loading` false
- **THEN** the translated results-found message is announced once

#### Scenario: Asynchronous search
- **WHEN** `loading` is `true` after the search
- **THEN** the announcement is made once `loading` becomes `false`

#### Scenario: No count
- **WHEN** `searchResultsCount` is `null`
- **THEN** the announcement is delegated to the data component

### Requirement: Page header Template and appearance - structure
`ocx-page-header` (`ViewEncapsulation.None`, `page-header.component.scss`) SHALL render a root `div.onecx-page-header.mb-4[name="ocx-page-header-wrapper"]` containing in order: (1) when `showBreadcrumbs()` and `breadcrumbs$` emit, `p-breadcrumb#pageHeaderBreadcrumb` (`[model]=items`, `[home]` = `(home$|async).menuItem ?? {}`, `[attr.manual]="manualBreadcrumbs()"`, `homeAriaLabel` = `OCX_PAGE_HEADER.HOME_ARIA_LABEL` with `{page}` when the home item has a page else `OCX_PAGE_HEADER.HOME_DEFAULT_ARIA_LABEL`); (2) `div.title-bar.flex.flex-row.md:justify-between.items-center.p-3` with `div.title-wrap` and `div.action-items-wrap.mt-2.md:mt-0`; (3) `div.object-panel` with `[ngClass]="objectPanelLayoutClasses()"`.

`div.title-wrap` SHALL contain, when `showFigure()`, `div.mr-2.figure.relative.flex.h-[2rem].w-[2rem].md:h-[3rem].md:w-[3rem]` with `div.figure-image.absolute.top-0.left-0.right-0.bottom-0` (holding `<ng-content select="[figureImage]">` and, when `figureImage()` is set and no load error, `img[ocxSrc][alt="Figure Image"].w-full.rounded-sm` with `(error)` handler) and, when that wrapper has no children or the image failed, `div.colorblob.flex-1.rounded-border`. Then, when not `loading()`, `div.header` with `h1#page-header` (only if `header()`) and `div#page-subheader[role="note"]` (only if `subheader()`, `aria-label` = `OCX_PAGE_HEADER.SUBHEADER`); while `loading()` it SHALL render `div.header.justify-evenly` with two `p-skeleton width="10rem"`.

#### Scenario: Populated header
- **WHEN** rendered with header `H` and subheader `S`
- **THEN** the DOM has `.onecx-page-header .title-bar .title-wrap .header > h1#page-header` text `H` and `#page-subheader[role=note]` text `S`

#### Scenario: Loading
- **WHEN** `loading()` is true
- **THEN** two 10rem skeletons replace the title text and two circular 2rem skeletons (`shape="circle" size="2rem"`, classes `mr-2` / `mb-2`) replace the action buttons

### Requirement: Page header Template and appearance - actions area
`div.action-items-wrap` SHALL project in order: the `additionalToolbarContentLeft` template, then (when not loading and inline actions exist) `div.toolbar.flex.flex-wrap.gap-1.sm:gap-2` with one `span` per inline action carrying `ocxTooltip` (disabled: `disabledTooltipKey`/`disabledTooltip`; else `titleKey`/`title`), `tooltipPosition="top"`, `tooltipEvent="hover"`. An action with a string `routerLink` and not disabled SHALL render `a[pButton].action-button.no-underline` (`[id]=action.id`, `[routerLink]`, `[ngClass]=action.btnClass`, `data-testid="ocx-page-header-inline-action-icon-button"` when `icon` is set else `ocx-page-header-inline-action-button`, label text from `labelKey`/`label`); any other action SHALL render `p-button.action-button[type=button]` (`[loading]`, `[disabled]`, `[icon]`, `[iconPos]` default `left`, `[attr.name]` `ocx-page-header-inline-action-icon-button` / `ocx-page-header-inline-action-button`, label and `ariaLabel` from `ariaLabelKey` > `ariaLabel` > `titleKey` > `title` > `labelKey` > `label`). Then `<ng-content select="[toolbarItems]">`, then, when overflow actions exist, `div > button#pageHeaderMenuButton[pButton].more-actions-menu-button.action-button.ml-2` (`icon="pi pi-ellipsis-v"`, `name="ocx-page-header-overflow-action-button"`, `aria-label` and tooltip `OCX_PAGE_HEADER.MORE_ACTIONS`) plus `p-menu[popup=true][appendTo=body]`; finally the `additionalToolbarContent` template.

#### Scenario: Icon-only inline button
- **WHEN** an inline action has `icon` and no label
- **THEN** its element has `name="ocx-page-header-inline-action-icon-button"` (or `data-testid` for the router-link variant) and an accessible name from title/label

### Requirement: Page header Template and appearance - object panel
Each object detail item SHALL render `div.object-info` with `[ngClass]="objectInfoLayoutClasses()"` containing `span.flex.font-medium.text-surface-600.object-info-grid-label[name=object-detail-label]` (tooltip from `labelTooltipKey`, text `item.label | dynamicPipe:item.labelPipe`) and, when `icon` or `value` exists, `span.object-info-grid-value > span.object-detail-value.flex.text-surface-900.items-center.gap-2[name=object-detail-value]` (extra classes from `generateItemStyle`: `gap-1 items-center` when an icon exists plus `valueCssClass`), wrapping `span.flex.items-center.gap-2` (tooltip from `valueTooltipKey`) with optional `i[name=object-detail-icon][aria-hidden=true]` (`class = icon + ' ' + iconStyleClass`) and the value via `dynamicPipe:valuePipe:valuePipeArgs`. An action item (`actionItemIcon` and `actionItemCallback`) adds `p-button` with `styleClass="p-button-text p-0 w-full"`, ariaLabel from `actionItemAriaLabelKey` (default `button for <icon>`) and tooltip from `actionItemTooltipKey`. Default `<ng-content>` is projected last inside `.object-panel`.

Layout classes SHALL be: panel `grid grid-cols-12 gap-y-2 m-0` and item `col-span-12 flex gap-4 md:col-span-6 items-center p-0 lg:col-span-<12/gridLayoutDesktopColumns, default 4>` when `enableGridView` is true; panel `flex flex-row justify-between overflow-x-auto` and item `flex flex-col items-center gap-2 min-w-[120px]` when it is false; panel `flex flex-col gap-y-2 md:flex-row md:justify-between` and item `flex flex-row md:flex-col md:items-center md:gap-2` when unset.

#### Scenario: Grid view
- **WHEN** `enableGridView=true` and `gridLayoutDesktopColumns=3`
- **THEN** `.object-panel` has `grid grid-cols-12` and each `.object-info` has `lg:col-span-4`

### Requirement: Page header Template and appearance - styles
`page-header.component.scss` (global because of `ViewEncapsulation.None`) SHALL style `.onecx-page-header` as `display:flex; flex-flow:column; border-radius:0.25rem; overflow:hidden; background:#fff; box-shadow:0 2px 2px 0 rgb(0 0 0 / 10%); border:1px solid #cdd0d3`; `.title-bar` with `background-color:#f8f9fa` and inherited top radii; `.figure .figure-image img` centred with `position:absolute; top/left:50%; transform:translate(-50%,-50%)`; `.colorblob` `background-color: var(--primary-color)` filling the figure absolutely; `.title-wrap` `display:flex; flex-flow:row; align-items:center; gap:0.25rem`, its `.header` a column (`align-items:flex-start; justify-content:center`), `h1` `font-size:1em; font-weight:700; margin:0; padding:0` and `h2` `font-weight:400`; `.action-items-wrap` `display:flex; height:fit-content; gap:0.5rem; align-items:center; justify-content:space-between`; `.object-panel` `border-top:1px solid #cdd0d3; padding:1rem` and `&:empty { display:none !important }`. Unscoped helpers: `.object-info { max-width:100%; overflow-wrap:anywhere }`, `.object-info-grid-label { flex:1 }`, `.object-info-grid-value { flex:3; min-width:0; max-width:100% }`, `.object-detail-value { width:fit-content; max-width:100% }`, `.badge-container`, `.scale { transform: scale(2) }`, and a workaround that keeps disabled `p-menu` items hoverable for tooltips (`.p-menu .p-menu-item.p-disabled { pointer-events:auto }`, `> .p-menu-item-content { pointer-events:none }`). On mobile the title bar stacks (no `md:justify-between`) and the action area gets `mt-2`; the figure is 2rem square, 3rem from `md`.

#### Scenario: Empty object panel
- **WHEN** no object details and no projected content exist
- **THEN** `.object-panel` is `display:none`

> Note (code-derived): `:host(.p-button-label)` and the `h2` rule have no effect with `ViewEncapsulation.None` and the template has no `h2`. Colours `#fff`, `#f8f9fa`, `#cdd0d3` are hard-coded and not theme tokens.

### Requirement: Search header Template and appearance
`ocx-search-header` (no styles file, no encapsulation override) SHALL render a single `ocx-page-header` with `[header]="header() || ('OCX_SEARCH_HEADER.HEADER' | translate)"`, `[subheader]`, `[manualBreadcrumbs]`, `[actions]="headerActions()"` and two template slots: `#additionalToolbarContentLeft` (an `ocx-slot[name="onecx-search-config"]` guarded by `*ocxIfPermission="searchConfigPermission()"` only when `searchConfigChangeObserved() && pageName()`, inputs `{pageName, currentFieldValues, viewMode}`, output `searchConfigSelected`, with a skeleton `div.flex > p-skeleton width="18rem" height="3rem"`; then the projected left template) and `#additionalToolbarContent`. The body SHALL be `div.flex.gap-y-3.gap-x-6.flex-wrap.items-center` containing `section[aria-label="Search Criteria"]` (Enter key handler, wraps default `<ng-content>`) and `section.flex.flex-wrap.gap-2.flex-row[aria-label=OCX_SEARCH_HEADER.CONTROLS.ARIA_LABEL]` holding the buttons. Buttons: `p-button#searchButton` (`icon="pi pi-search"`, label/ariaLabel/tooltip from input overrides else `OCX_SEARCH_HEADER.SEARCH_BUTTON.TEXT|ARIA_LABEL|DETAIL`, disabled when `searchButtonDisabled()` or form invalid) and `p-button#resetButton` (`icon="pi pi-eraser"`, `OCX_SEARCH_HEADER.RESET_BUTTON.*`, rendered only when `resetted.observed()`), tooltips `top`/`hover`. Order is reset-then-search unless `searchButtonsReversed$` emits true; nothing is rendered until it emits a non-null value.

#### Scenario: Default controls
- **WHEN** `(resetted)` is observed and buttons are not reversed
- **THEN** the controls section contains `#resetButton` followed by `#searchButton`

> Note (code-derived): the `'Search Criteria'` aria-label is a hard-coded English literal, not translated; `OCX_SEARCH_HEADER.TOGGLE_BUTTON.*`, `EXPORT` and `OCX_SEARCH_CONFIG.DROPDOWN_DEFAULT` keys exist in assets but are not used by this template.
