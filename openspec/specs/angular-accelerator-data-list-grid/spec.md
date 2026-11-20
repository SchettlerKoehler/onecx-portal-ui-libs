# angular-accelerator-data-list-grid Specification

## Purpose
`DataListGridComponent` (`ocx-data-list-grid`) displays items as cards (grid) or as a list with filtering, sorting, pagination and per-item actions. `DataListGridSortingComponent` (`ocx-data-list-grid-sorting`) provides the sort-column dropdown and direction button used with list and grid layouts. Both are used directly or via `ocx-data-view` / `ocx-interactive-data-view`.

## Requirements

### Requirement: Shared view state and inputs
`DataListGridComponent` SHALL store `data`, `columns`, `filters`, `sortDirection`, `sortField` (sort column), `page`, `pageSize`, `layout` and `additionalActions` in a `DataViewStateService` (the parent's instance if one is provided, otherwise its own). `layout` accepts `'grid'` or `'list'`; the default state layout is `grid`. Items are `ListGridData` (`id`, optional `imagePath`, arbitrary column keys); `clientSideSorting` and `clientSideFiltering` default to `true`.

#### Scenario: Default layout
- **WHEN** no layout is set on a standalone component
- **THEN** items render as grid cards

#### Scenario: List layout
- **WHEN** `layout` is `'list'`
- **THEN** items render using the list item template

### Requirement: Displayed items
The displayed items SHALL be the supplied `data` after client-side filtering and sorting using `DataSortBase` semantics (see data-sort-base capability); nested values are resolved by dot paths. Nothing is flattened. With `clientSideFiltering`/`clientSideSorting` set to `false` the data is shown as supplied.

#### Scenario: Filter applied
- **WHEN** `filters` contains `{ columnId: 'status', value: 'open' }`
- **THEN** only items with `status` `open` are displayed

### Requirement: Pagination
The component SHALL show a paginator when `paginator` is `true` (default). The page size MUST be the state's `pageSize` if defined, else the first entry of `pageSizes` (default `[10, 25, 50]`), else `50`. The page report text uses `currentPageShowingKey` (default `OCX_DATA_TABLE.SHOWING`) or, when `totalRecordsOnServer` is not `undefined`, `currentPageShowingWithTotalOnServerKey`. A page change MUST update `activePage` (`first / rows`) and `pageSize`, and emit `pageChanged`, `pageSizeChanged` and `componentStateChanged` (`DataListGridComponentState`: `activePage`, `pageSize`).

The active page SHALL be reset to `0` when `data` changes to a deeply different value (and previous data was non-empty), or when filters change to a deeply different value (and previous filters were non-empty).

#### Scenario: New data
- **WHEN** the data array is replaced by different content while on page 2
- **THEN** the active page becomes `0`

> Note (code-derived): Unlike `ocx-data-table`, the list grid resets the page whenever the data content differs, not only when it shrinks.

> Note (code-derived): The page-report uses `totalRecordsOnServer !== undefined` here, while `ocx-data-table` uses a truthiness check, so `0` selects the "with total" text only in the list grid.

### Requirement: Grid item rendering
In grid layout, each item SHALL render in an element with `role="listitem"` inside a `role="list"` container, showing an image (`imagePath` or the fallback image, with alt text = title), the title and subtitle lines. The title is the value of `titleLineId`; subtitle lines are the values of `subtitleLineIds`, in order. When the image fails to load, `imagePath` MUST be cleared on the item so the fallback is used. The fallback image path is `<remoteBaseUrl>/onecx-portal-lib/assets/images/<fallbackImage>` for the current MFE if it has a `remoteBaseUrl`, else `./onecx-portal-lib/assets/images/<fallbackImage>`; `fallbackImage` defaults to `placeholder.png`.

The title MUST be rendered as a `button[name="data-grid-item-title-button"]` only if the title is non-empty, `viewItem` is observed and the user has `viewPermission`; clicking emits `viewItem`. Otherwise it MUST be plain text.

#### Scenario: Title as button
- **WHEN** `viewItem` has an observer, the user has the view permission and the title is `"Foo"`
- **THEN** the title is a button that emits `viewItem` with the item when clicked

#### Scenario: Title without observer
- **WHEN** `viewItem` has no observer
- **THEN** the title is plain text in a `span`

#### Scenario: Broken image
- **WHEN** the image `error` event fires
- **THEN** `imagePath` of that item is set to `''` and the fallback image is shown

> Note (code-derived): The fallback path uses `this.fallbackImage` (the input function) inside a template string instead of its value, so the resulting URL contains the function's source text rather than the file name.

### Requirement: Grid item menu
In the default grid item the component SHALL render a "more actions" button that opens a menu. The menu MUST contain, in this order: View, Edit and Delete entries, each only if its output (`viewItem`, `editItem`, `deleteItem`) is observed and the user has the required permission (`viewPermission`, `editPermission`, `deletePermission`, a string or array that must be fully granted); then all `additionalActions` the user is permitted to use. Entry labels use `viewMenuItemKey`, `editMenuItemKey`, `deleteMenuItemKey` (defaults `OCX_DATA_LIST_GRID.MENU.VIEW|EDIT|DELETE`). For the selected item, an entry MUST be disabled if the respective `*ActionEnabledField` is set and falsy, and hidden if the respective `*ActionVisibleField` is set and falsy. Selecting an entry emits the output with the selected item (or runs the action). Additional actions follow the same visible/enabled/permission/router-link/callback rules as in the data table.

#### Scenario: No outputs observed
- **WHEN** none of `viewItem`, `editItem`, `deleteItem` is observed and there are no additional actions
- **THEN** no menu button is shown

#### Scenario: Delete disabled
- **WHEN** `deleteActionEnabledField` is `canDelete` and the selected item has `canDelete=false`
- **THEN** the Delete entry is disabled

### Requirement: List item rendering
In list layout each item SHALL render with `role="listitem"` in a `role="list"` container with the title, optional subtitle lines, inline action buttons and a description list (`dl`) with one `dt` (translated column name) and `dd` (value) per column, excluding the columns used as title (`titleLineId`) and subtitle lines. Values MUST be rendered lazily (skeleton until in viewport); the list item itself is deferred with a placeholder hidden from assistive technology (`aria-hidden="true"`). Values on overflow carry a tooltip.

View, edit and delete buttons (`viewListItemButton`, `editListItemButton`, `deleteListItemButton`) SHALL appear only if the respective output is observed, the `*ActionVisibleField` is unset or truthy, and the permission is granted; they are disabled when `*ActionEnabledField` is set and falsy and emit the output with the item. Inline `additionalActions` and an overflow menu for `showAsOverflow` actions follow the rules of the data table.

#### Scenario: Title column excluded
- **WHEN** `titleLineId` is `name` and `subtitleLineIds` is `['desc']`
- **THEN** the `dl` lists all other columns but not `name` or `desc`

### Requirement: List value and item templates
The list layout SHALL resolve the value template per column: `<columnId>IdListValue`; then the type-specific input or content template (`stringListValueTemplate`, `numberListValueTemplate`, `dateListValueTemplate`, `relativeDateListValueTemplate`, `translationKeyListValueTemplate`) or `pTemplate` names (`stringListValue`, `defaultStringListValue`, etc.); unknown types behave as `STRING`. The generic `listValueTemplate` (`#listValue`) overrides all per-column templates. Whole items may be replaced by `listItemTemplate` (`#listItem`, context `$implicit`/`item`, `first`, `columnTemplates`) and `gridItemTemplate` (`#gridItem`, context `$implicit`); subtitle blocks by `listItemSubtitleLinesTemplate` and `gridItemSubtitleLinesTemplate`. Defaults: `NUMBER` via number format, `DATE` via date format with `dateFormat` (default `medium`), `RELATIVE_DATE` as "edited" plus relative time, `TRANSLATION_KEY` translated. Templates can be provided via the component, its view, or `parentTemplates`.

#### Scenario: Per-column override
- **WHEN** a template named `statusIdListValue` exists
- **THEN** it is used for the `status` column regardless of its column type

### Requirement: Empty state
When no items are displayed the component SHALL show `emptyResultsMessage` if set, otherwise the translated `OCX_DATA_LIST_GRID.EMPTY_RESULT`.

#### Scenario: Default empty text
- **WHEN** the data is empty and `emptyResultsMessage` is unset
- **THEN** the translated `OCX_DATA_LIST_GRID.EMPTY_RESULT` is displayed

### Requirement: Result announcements
The list grid SHALL announce displayed item counts to assistive technology with the same rules as the data table (filter and sort changes always, new data depending on `announceResults` and `ResultsAnnouncementService`), using `OCX_DATA_LIST_GRID.SEARCH_RESULTS_FOUND` and `OCX_DATA_LIST_GRID.NO_SEARCH_RESULTS_FOUND`.

#### Scenario: Filter change
- **WHEN** a client-side filter changes
- **THEN** the new displayed count is announced

### Requirement: List grid sorting component
`DataListGridSortingComponent` SHALL store `columns`, `sortField` and `sortDirection` in the shared `DataViewStateService`. It MUST offer a select whose options are the sortable columns (`{ columnId, columnName: nameKey }`, labels translated) and a direction button. The selected option MUST be the one matching the current sort column. The select MUST NOT autofocus.

Choosing an option SHALL set the sort column in state and emit `sortChange` with the column id. Pressing the button (mouse, Enter or Space, exactly one step per activation) SHALL advance the direction to the next entry of `sortStates` (default `[ASCENDING, DESCENDING]`, cycling; if the current direction is not in the list the first entry is used) and emit `sortDirectionChange`. The button icon MUST be `pi-sort-amount-up` for `ASCENDING`, `pi-sort-amount-down` for `DESCENDING` and `pi-sort-alt` otherwise, and its tooltip describes the next direction (`OCX_LIST_GRID_SORT.TOGGLE_BUTTON.ASCENDING_TOOLTIP|DESCENDING_TOOLTIP|DEFAULT_TOOLTIP`). `componentStateChanged` (`DataListGridSortingComponentState`) SHALL emit the current sorting whenever it changes.

#### Scenario: Direction cycling
- **WHEN** direction is `ASCENDING` and the button is pressed
- **THEN** direction becomes `DESCENDING` and `sortDirectionChange` emits `DESCENDING`

#### Scenario: Only sortable columns
- **WHEN** columns `a` (sortable) and `b` (not sortable) are set
- **THEN** the dropdown options contain only `a`

> Note (code-derived): `columnsChange` is declared as an output but never emitted. `sortStates` for the data list grid component itself defaults to `[]`, whereas the sorting component defaults to ascending/descending.

### Requirement: Template and appearance - data view container
`ocx-data-list-grid` (`styleUrls: data-list-grid.component.scss`) SHALL render, once `columnTemplates$` has emitted, a `<p-dataView>` with `[value]="displayedItems$ | async ?? []"`, `[paginator]="paginator()"`, `[first]="stateService.activePage() * displayedPageSize()"`, `[rows]="displayedPageSize()"`, `[layout]="stateService.layout() === 'grid' ? 'grid' : 'list'"`, `[showCurrentPageReport]="true"`, `[rowsPerPageOptions]="pageSizes() ?? []"`, `[id]="'dataListGrid_' + name()"`, `paginatorDropdownAppendTo="body"`. The page report is `OCX_DATA_TABLE.SHOWING` or (`totalRecordsOnServer() !== undefined`) `SHOWING_WITH_TOTAL_ON_SERVER`, or the `currentPageShowing*Key` inputs, translated with `params()`. The `#grid` template is `div.grid.grid-cols-12.gap-4.w-full[role=list]` iterating items into `gridItem ?? defaultGridItem` (context `$implicit`); the `#list` template is `div.grid.grid-cols-1[role=list]` iterating items inside `@defer (on viewport; on idle)` into `listItem ?? defaultListItem` (context `$implicit, item, first, columnTemplates`) with `@placeholder { <div role="presentation" aria-hidden="true" style="width: 100%; height: 80px"> }`. The empty state is `<span class="ocx-data-list-grid-empty-message">` with `emptyResultsMessage() || ('OCX_DATA_LIST_GRID.EMPTY_RESULT' | translate)` ("No data found.").

#### Scenario: Grid layout
- **WHEN** `layout` is `grid`
- **THEN** items render inside `div.grid.grid-cols-12[role=list]` as `[role=listitem]` children

### Requirement: Template and appearance - default grid item
The default grid item SHALL be `div.col-span-12.lg:col-span-6.xl:col-span-4.p-1.flex.justify-center.grid-border-divider[role=listitem]` > `div.data-grid-item.card.flex.flex-col.justify-between.w-full.lg:w-11/12.mb-4.mt-4.self-stretch`, containing: an image block `div.flex.justify-center.mb-3 > img.image` (`src = item.imagePath || (fallbackImagePath$ | async)`, `alt` = title value or `''`, `(error)="imgError(item)"`); then `div.flex.flex-row.justify-between.items-center` with `div.data-grid-items.flex-row` holding `div.item-name.font-medium.mr-3.text-2xl` and the subtitle lines, and (only if `gridMenuItems$` emits a truthy value) a `div` with `<p-menu [popup]="true" appendTo="body">` and `button[pButton].more-actions-menu-button.menu-btn` (`icon pi pi-ellipsis-v`, `aria-label` `OCX_DATA_LIST_GRID.MORE_ACTIONS_ARIA_LABEL`, `ocxTooltip` `OCX_DATA_LIST_GRID.MORE_ACTIONS_TOOLTIP`, top, `name="data-grid-item-menu-button"`, click `setSelectedItem(item); menu.toggle($event)`). The title is a `button.item-name-link.p-0.border-0.bg-transparent.text-left.cursor-pointer.underline.text-primary[type=button][name=data-grid-item-title-button]` when the title is non-empty, `viewItemObserved` and `hasViewPermission$` is true; otherwise `<span>`. Subtitle lines (`gridItemSubtitleLines ?? defaultGridItemSubtitleLines`) are `div.subtitleLine.edit-time.text-xl.my-3` per `subtitleLineIds()`.

#### Scenario: Title without view permission
- **WHEN** the user lacks view permission
- **THEN** the title renders as a plain `span` instead of `button.item-name-link`

### Requirement: Template and appearance - default list item
The default list item (rendered only when `columnTemplates` is truthy) SHALL be `div.col-span-full[role=listitem] > div.data-list-items.p-1` with `list-border-divider` on every item but the first. It contains `div.item-name-row.flex.flex-row.justify-between` with `div.item-name.mr-3.text-2xl.font-medium.content-center > span` (title, only if `titleLineId()`) and `div.flex.flex-row` with action buttons; then `div.text-base.font-light.my-1` with subtitle lines (`div.subtitleLine.text-xl.my-3`); then `<dl class="flex flex-wrap m-0">` with, per `filteredColumns()`, `div.w-[12rem].my-2.mr-2 > dt.font-bold` (`ocxTooltipOnOverflow` of `col.nameKey | translate`) and `dd.m-0` (`ocxTooltipOnOverflow` of the value, translated for `TRANSLATION_KEY` columns) whose content is deferred (`@defer (on viewport)` with `@placeholder { <p-skeleton width="5rem" /> }`) and rendered via `listValue ?? defaultListValue`.

List action buttons (all `type="button"`, `pButton`, `p-button-rounded p-button-text mb-1 mr-2`, `ocxTooltip` top, `name="data-list-action-button"`): view `#<id>-viewButton.viewListItemButton` `pi pi-eye` with key `viewMenuItemKey() || 'OCX_DATA_LIST_GRID.MENU.VIEW'`; edit `.editListItemButton` `pi pi-pencil` (`MENU.EDIT`); delete `.p-button-danger.deleteListItemButton` `pi pi-trash` (`MENU.DELETE`); inline actions as `a` (router link, `data-testid="data-list-action-button"`, `no-underline`) or `button` with ids `<id>-<action.id>ActionButton` or `-inlineActionButton`; overflow `button` `pi pi-ellipsis-v` with `aria-label` `OCX_DATA_LIST_GRID.MORE_ACTIONS_ARIA_LABEL`, `ocxTooltip` `MORE_ACTIONS_TOOLTIP`, `name="data-list-overflow-item-menu-button"`. The tooltip is disabled (`tooltipOptions.disabled`) while the action is disabled via its `*ActionEnabledField`.

Default list value templates: `defaultStringListValue`, `defaultNumberListValue` (`| number`), `defaultDateListValue` (`| date: column.dateFormat ?? 'medium'`), `defaultRelativeDateListValue` (`OCX_DATA_TABLE.EDITED` + `| timeago`), `defaultTranslationKeyListValue` (`| translate`).

#### Scenario: Second list item
- **WHEN** the list has 2+ items
- **THEN** the first `.data-list-items` has no `list-border-divider` and subsequent ones do

### Requirement: Template and appearance - data list grid styles
`data-list-grid.component.scss` SHALL define: `.image { width: 100%; height: 100% }`; `.menu-btn { cursor: pointer; min-width: 4rem }`; `.list-border-divider { border-top: 0.0625rem solid; border-color: var(--p-surface-200) }`; `.grid-border-divider { border: 0.0625rem solid; border-color: var(--p-surface-200) }`. Responsive grid columns: 1 column per row < `lg` (`col-span-12`), 2 at `lg` (`col-span-6`), 3 at `xl` (`col-span-4`), card width `w-full` -> `lg:w-11/12`.

#### Scenario: Grid breakpoints
- **WHEN** viewport is at `xl` width
- **THEN** each grid item spans 4 of 12 columns (three per row)

### Requirement: Template and appearance - sorting control
`ocx-data-list-grid-sorting` (`styleUrls`: `.pi { border-radius: var(--border-radius); border-width: thin; background: none; cursor: pointer }`, `:host ::ng-deep .p-select { min-width: 12rem }`) SHALL render `div.flex.items-center.gap-2` with `<p-floatLabel variant="on">` wrapping `<p-select id="dataListGridSortingDropdown" inputId="dataListGridSortingDropdownInput" optionLabel="columnName" autofocus="false">` (ariaLabel `OCX_LIST_GRID_SORT.DROPDOWN.ARIA_LABEL` "Sort by"; item and selectedItem templates `span[aria-label]` showing `item.columnName | translate`, empty if none) and `<label for="dataListGridSortingDropdownInput">` `OCX_LIST_GRID_SORT.DROPDOWN.LABEL` ("Sort by"); followed by `<p-button id="dataListGridSortingButton" type="button" icon="pi {{sortIcon()}}" styleClass="p-button-outlined">` with `ocxTooltip` `sortIconTitle() | translate` (top; keys `OCX_LIST_GRID_SORT.TOGGLE_BUTTON.ASCENDING_TOOLTIP|DESCENDING_TOOLTIP|DEFAULT_TOOLTIP`) and `ariaLabel` `OCX_LIST_GRID_SORT.SORTING_BUTTON_ARIA_LABEL` with `{ currentDirection, nextDirection }`.

#### Scenario: Sorting toolbar
- **WHEN** the sorting component renders
- **THEN** a floating-label select `#dataListGridSortingDropdown` (min-width 12rem) sits left of the outlined button `#dataListGridSortingButton`, 0.5rem apart

> Note (code-derived): `OCX_LIST_GRID_SORT.DROPDOWN.PLACEHOLDER` exists in en.json but is not referenced by the template.
