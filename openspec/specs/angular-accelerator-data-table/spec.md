# angular-accelerator-data-table Specification

## Purpose
`DataTableComponent` (`ocx-data-table`) renders tabular data with client- or server-side sorting and filtering, pagination, row selection, row expansion, single-level row grouping, per-column cell/filter/header templates and per-row actions. It is used directly by applications or indirectly through `ocx-data-view` and `ocx-interactive-data-view`.

## Requirements

### Requirement: Shared view state
The component SHALL keep its state (columns, filters, sort column/direction, selected rows, expanded rows, active page, page size, additional actions, action-column configuration) in a `DataViewStateService`. If an ancestor provides a `DataViewStateService`, the table MUST reuse it; otherwise it MUST create its own instance. The setter inputs `columns`, `filters`, `sortColumn`, `sortDirection`, `selectedRows`, `expandedRows`, `page`, `pageSize`, `additionalActions`, `frozenActionColumn` and `actionColumnPosition` SHALL write into that state.

#### Scenario: Standalone table
- **WHEN** an `ocx-data-table` has no parent providing `DataViewStateService`
- **THEN** it uses its own state instance with defaults: no sorting (`''` / `DataSortDirection.NONE`), page `0`, no filters, action column on the right and not frozen

#### Scenario: Table inside a data view
- **WHEN** the table is placed inside `ocx-data-view` or `ocx-interactive-data-view`
- **THEN** it shares the parent's state service so that changes made in the table are visible to the parent

### Requirement: Display pipeline (filter, sort, flatten)
The component SHALL derive the displayed rows from `rows` by applying, in order, filtering, sorting and flattening of nested objects into dot-joined keys (e.g. `a.b`). The displayed rows MUST be recomputed whenever `rows`, filters, sort column, sort direction, columns, `clientSideFiltering` or `clientSideSorting` change. Filtering and sorting MUST follow the `DataSortBase` semantics (see the data-sort-base capability); `clientSideFiltering` and `clientSideSorting` both default to `true`, and when `false` the rows are left in the order and quantity supplied by the caller.

#### Scenario: Client-side sorting
- **WHEN** `sortColumn` is `name` and `sortDirection` is `ASCENDING` and `clientSideSorting` is `true`
- **THEN** the table shows rows ordered by `name` ascending

#### Scenario: Server-side operation
- **WHEN** `clientSideFiltering` and `clientSideSorting` are `false`
- **THEN** the table shows all supplied rows unchanged and relies on the `filtered`/`sorted` outputs for the parent to reload data

### Requirement: Column headers and sorting
The table SHALL render one `th scope="col"` per column using the translated `nameKey`. For columns with `tooltip` or `tooltipKey` the label MUST carry a tooltip (`tooltip` wins over the translated `tooltipKey`). Columns with `sortable` MUST render a sort button; columns with `filterable` MUST render a filter control.

Clicking a sort button SHALL set the sort column to that column. If the column is already the sort column, the direction MUST advance to the next entry of `sortStates` (cycling); otherwise it MUST become the first entry of `sortStates`. `sortStates` defaults to `[ASCENDING, DESCENDING]`. The button MUST expose an accessible label naming the column and the direction that would be applied next, and an icon that reflects the current direction (ascending, descending, or neutral for `NONE`/other column).

#### Scenario: First click on a column
- **WHEN** the user clicks the sort button of a column that is not the current sort column
- **THEN** the sort column becomes that column and the direction becomes `ASCENDING`

#### Scenario: Cycling
- **WHEN** the user clicks the sort button of the current sort column with direction `ASCENDING`
- **THEN** the direction becomes `DESCENDING`, and the next click wraps back to `ASCENDING`

#### Scenario: Custom sort states
- **WHEN** `sortStates` is `[ASCENDING, DESCENDING, NONE]`
- **THEN** the third click on the same column sets the direction to `NONE`

### Requirement: Column filters
For columns with `filterable` set, the table SHALL offer a multi-select filter in the header. If `filterType` is unset or `EQUALS`, the options MUST be the distinct, non-empty values of that column in `rows` (dates deduplicated by timestamp and formatted with `dateFormat`, default `medium`, as filter text; `TRANSLATION_KEY` columns show translated labels but store the key). Values of already selected filters MUST remain available as options even if no row has them. If `filterType` is `IS_NOT_EMPTY`, the options MUST be Yes (`true`) and No (`false`). Other filter types do not render a control.

Changing a selection SHALL replace all filters of that column with one `Filter` (`columnId`, `value`, `filterType`) per selected value, and the filter icon MUST indicate when at least one filter is active for the column. The new filters are applied to the state only if `clientSideFiltering` is `true`.

#### Scenario: Select two values
- **WHEN** the user selects values `A` and `B` in the filter of column `status`
- **THEN** the filters for `status` become two entries, the table shows rows matching either value, and `filtered` emits the new filter list

#### Scenario: Server-side filtering
- **WHEN** `clientSideFiltering` is `false` and the user changes a selection
- **THEN** the filter state is not updated by the table itself

> Note (code-derived): With `clientSideFiltering=false` the multi-select change handler does not update the state nor emit `filtered`, so server-side filtering must be driven by the parent via the `filters` input.

### Requirement: Page reset on data or filter change
The active page SHALL be reset to `0` when the filters change to a different value than before (deep comparison, and only if there were previous filters), and when the number of rows decreases compared to the previous rows (and there were previous rows).

#### Scenario: Filter change
- **WHEN** the user is on page 3 and the filters change from a non-empty list to a different list
- **THEN** the active page becomes `0`

#### Scenario: Fewer rows
- **WHEN** `rows` is replaced with a shorter array
- **THEN** the active page becomes `0`

### Requirement: Pagination
The table SHALL show a paginator when `paginator` is `true` (default). The page size MUST be the state's `pageSize` if defined, otherwise the first number in `pageSizes` (default `[10, 25, 50]`), otherwise `50`. The page-report text MUST use `currentPageShowingKey` (default `OCX_DATA_TABLE.SHOWING`), or `currentPageShowingWithTotalOnServerKey` (default `OCX_DATA_TABLE.SHOWING_WITH_TOTAL_ON_SERVER`) when `totalRecordsOnServer` is truthy, with `totalRecordsOnServer` available as a parameter.

When the user changes page or page size, the state's `activePage` (computed as `first / rows`) and `pageSize` MUST be updated, and `pageChanged` (page index) and `pageSizeChanged` (size, only when defined) SHALL emit.

#### Scenario: Page change
- **WHEN** the paginator reports `first=20` and `rows=10`
- **THEN** `activePage` becomes `2`, `pageSize` becomes `10`, and `pageChanged` emits `2`

### Requirement: Row selection
The table SHALL render a selection column (checkbox per row, plus a select-all header checkbox when `allowSelectAll` is `true`, default) only when `selectionChanged` has an observer (on the table or on a parent `DataViewComponent`). Selection MUST be tracked by row `id`. `selectedRows` input (rows or ids) sets the selection; `selectionChanged` SHALL emit the rows (from `rows`) whose ids are selected whenever the selection changes.

If `selectionEnabledField` is set, rows whose resolved value for that field is falsy MUST have a disabled checkbox. The selection state of disabled rows MUST NOT be changed by user actions (including select-all): previously selected disabled rows stay selected, previously unselected disabled rows stay unselected. Checkboxes MUST have an accessible label that contains the row id and a summary of the row's `key: value` pairs.

#### Scenario: No observer
- **WHEN** nobody subscribes to `selectionChanged`
- **THEN** no selection column is rendered

#### Scenario: Disabled rows and select all
- **WHEN** `selectionEnabledField` is `selectable`, row 2 has `selectable=false` and is not selected, and the user clicks select-all
- **THEN** all selectable rows become selected and row 2 stays unselected

### Requirement: Row expansion
When `expandable` is `true` and an expansion template (a `pTemplate="expansion"` in content, view or parent templates) exists, the table SHALL render an expansion column with a toggle button per row; with `frozenExpandColumn` the column is frozen on the left. Expanded rows are identified by row id; the `expandedRows` input accepts `Row[]`, `string[]` or `number[]`. Toggling MUST add/remove the row in the state and emit `rowExpanded` or `rowCollapsed` with the row. The expansion template MUST be rendered in an extra row (`id="ocx-expanded-row-<id>"`) with the context `{ rowObject }`, spanning all columns. The toggle button SHALL expose `aria-expanded`, and `aria-controls` only while the expanded row exists.

#### Scenario: Expand
- **WHEN** the user clicks the toggle of a collapsed row
- **THEN** the row is added to the expanded rows, `rowExpanded` emits the row, and the expansion template renders under it

#### Scenario: No expansion template
- **WHEN** `expandable` is `true` but no expansion template is provided
- **THEN** no expansion column or header is rendered

### Requirement: Row grouping
When `rowGrouping` (a `DataTableRowGroupingConfig`) references a column that exists in the columns, the table SHALL group the displayed rows by the value of the row property `groupKeyPath` (default: `columnId`) using `planRowGroups`: rows with a string or non-NaN number key form groups in order of first appearance; rows with other keys (null, undefined, objects, NaN) are placed first, ungrouped, before all grouped rows. Each group's first displayed row MUST be preceded by a header row (`tr.ocx-data-table-group-row`) containing a single `th scope="rowgroup"` whose `colspan` equals the number of rendered columns (data columns, plus selection, expansion and action columns when present) and a `data-group-key` attribute.

If the config references an unknown column, no grouping occurs. With pagination, the header MUST appear for the first row of each group on the current page, so a group continuing across a page boundary gets a header again on the next page.

The header content SHALL be the `groupCellTemplate` input, else the content template `#groupCell`, else the normal cell template of the grouping column rendered for the group's first row. The custom template context MUST be `{ groupKey, label, memberCount, rowObject, column }` (`DataTableGroupCellContext`); `label` is the string form of the key and `memberCount` the number of displayed rows in the group.

#### Scenario: Group headers
- **WHEN** rows have `status` values `open, closed, open` and `rowGrouping` is `{ columnId: 'status' }`
- **THEN** rows are displayed as `open, open, closed` with a group header before each group and `memberCount` 2 and 1

#### Scenario: Numeric versus string keys
- **WHEN** one row has key `1` and another `'1'`
- **THEN** they form two distinct groups with the same label

#### Scenario: Unknown grouping column
- **WHEN** `rowGrouping.columnId` matches no column
- **THEN** the table renders without group headers and in the displayed order

### Requirement: Cell, filter-cell and header templates
For each column, the table SHALL resolve templates in this order of precedence. Cell: a template named `<columnId>IdTableCell` or `<columnId>IdCell`; then the type-specific input (`stringCellTemplate`, `numberCellTemplate`, `dateCellTemplate`, `relativeDateCellTemplate`, `translationKeyCellTemplate`) or content template of the same name without `Template` suffix; then named templates (e.g. `stringTableCell`, `defaultStringCell`); unknown column types behave as `STRING`. Filter cell: `<columnId>IdTableFilterCell`, `<columnId>IdFilterCell`, then the cell id names, then type-specific filter cell templates, falling back to the cell templates. Header: `columnHeaderTemplate` input or `#columnHeaderTemplate` content template, else `pTemplate` named `columnHeader`; when provided it replaces the default header and receives `{ column, labelTemplate, sortTemplate, filterTemplate }`. Templates MAY be supplied by the table's own content, its view, or by a parent via `parentTemplates`.

The generic `cellTemplate` input (or `#cell` content) MUST override per-column templates when rendering a cell. Default cell rendering: `STRING` raw value; `NUMBER` through the number formatter; `DATE` through the date formatter using `dateFormat` (default `medium`); `RELATIVE_DATE` as "edited" prefix plus a relative time; `TRANSLATION_KEY` translated. Cell context is `{ rowObject, column }`; values are resolved with `ObjectUtils.resolveFieldData` (dot paths supported). Cells MUST be lazily rendered (a skeleton placeholder until visible in the viewport).

#### Scenario: Column-specific template wins
- **WHEN** a template named `statusIdCell` and a `stringCellTemplate` both exist and column `status` has type `STRING`
- **THEN** the `statusIdCell` template renders the cells of `status`

#### Scenario: Default date
- **WHEN** a `DATE` column has `dateFormat` `'short'` and no custom template
- **THEN** its cells are formatted with the `short` format

### Requirement: Row actions
The table SHALL render an action column (header text `OCX_DATA_TABLE.ACTIONS_COLUMN_NAME`) only if at least one of `viewTableRow`, `editTableRow`, `deleteTableRow` has an observer (on the table or the parent data view/interactive data view) or `additionalActions` is non-empty. It MUST be placed left or right according to `actionColumnPosition` (default `right`) and MAY be frozen via `frozenActionColumn`.

View, edit and delete buttons SHALL be shown for a row only when the respective output is observed, the respective `*ActionVisibleField` is unset or truthy for the row, and the user has the respective `viewPermission`/`editPermission`/`deletePermission` (`PermissionInput`, via the `ocxIfPermission` directive). They MUST be disabled when the respective `*ActionEnabledField` is set and falsy for the row. Clicking emits `viewTableRow`, `editTableRow` or `deleteTableRow` with the row. Buttons have ids `<rowId>-viewButton`, `-editButton`, `-deleteButton`, translated titles and aria labels.

#### Scenario: Hidden by field
- **WHEN** `viewActionVisibleField` is `canView` and the row has `canView=false`
- **THEN** no view button is rendered for that row

#### Scenario: Disabled by field
- **WHEN** `editActionEnabledField` is `canEdit` and the row has `canEdit=false`
- **THEN** the edit button is rendered but disabled

### Requirement: Additional actions
`additionalActions` (`DataAction[]`) SHALL be rendered per row. Actions without `showAsOverflow` MUST be inline buttons; with `showAsOverflow` they MUST be items of a popup menu opened by a "more actions" button, which is only shown if at least one permitted overflow action is visible for the row. Actions whose `permission` (string or all-of array) is not fully contained in the user's permissions MUST be hidden; permissions come from the `HAS_PERMISSION_CHECKER` if provided, otherwise from `UserService.getPermissions()`. An action is hidden for a row if `actionVisibleField` is set and falsy, and disabled if `disabled` is true or `actionEnabledField` is set and falsy. An inline action with a string `routerLink` that is enabled MUST render as a router link; otherwise clicking executes the action via the action router (`routerLink` navigation takes precedence over `callback`; the callback receives the row). Inline actions have id `<rowId>-<action.id>ActionButton` (or `inlineActionButton`). Overflow menu items carry translated `labelKey`, `icon`, and `classes`.

#### Scenario: Missing permission
- **WHEN** an action requires `['A','B']` and the user only has `A`
- **THEN** the action is not rendered

#### Scenario: Overflow action with callback
- **WHEN** the user picks an overflow action having a `callback`
- **THEN** the callback is called with the row the menu was opened for

### Requirement: Empty and caption states
When there are no displayed rows, the table SHALL show `emptyResultsMessage` if set, otherwise the translated `OCX_DATA_TABLE.EMPTY_RESULT`, in a cell spanning all columns. If `captionTemplate` is provided it MUST be rendered as the table caption.

#### Scenario: Custom empty message
- **WHEN** `emptyResultsMessage` is `"Nothing here"` and there are no rows
- **THEN** that text is displayed

### Requirement: Accessible table name and structure
The `table` element SHALL always have an accessible name: `tableAriaLabel` if set, otherwise the translation of `OCX_DATA_TABLE.TABLE_ARIA_LABEL`. The expansion, selection and action columns without a visible label MUST have a screen-reader-only header text. The element id MUST be `dataTable_<name>`; `name` defaults on init to the current router URL with its first non-alphanumeric character replaced by `_` when empty.

#### Scenario: Default label
- **WHEN** `tableAriaLabel` is not set
- **THEN** the table's `aria-label` is the translation of `OCX_DATA_TABLE.TABLE_ARIA_LABEL`

### Requirement: Outputs and state emission
The table SHALL emit `filtered` (current filters, also initially), `sorted` (`Sort` with `sortColumn`, `sortDirection`), `pageChanged`, `pageSizeChanged`, `selectionChanged`, `rowExpanded`, `rowCollapsed`, `viewTableRow`, `editTableRow`, `deleteTableRow`, and `componentStateChanged` (`DataTableComponentState`: filters, sorting, pageSize (displayed), activePage, selectedRows and expandedRows restricted to existing rows). `componentStateChanged` MUST be emitted whenever any contained signal changes.

#### Scenario: Sorting emission
- **WHEN** the sort state changes
- **THEN** `sorted` emits `{ sortColumn, sortDirection }` and `componentStateChanged` emits the new state

> Note (code-derived): `sorted` is emitted on initialization as well, with an empty `sortColumn` and `NONE` unless set.

### Requirement: Screen-reader announcement of results
The table SHALL announce, via a live region, the displayed row count after a filter or sort change that was applied on the client (immediately), or, for changes delegated to the server, once new rows arrive. New rows (changed `rows` array) MUST be announced if `announceResults` is `true`, or if it is unset and no search header has registered with `ResultsAnnouncementService` (see the data-view-state-and-announcements capability), or if a search-results announcement was requested. A count of 0 uses the "no results" message (`OCX_DATA_TABLE.NO_SEARCH_RESULTS_FOUND`), otherwise `OCX_DATA_TABLE.SEARCH_RESULTS_FOUND` with `results`. Nothing is announced on the first render, and several changes in one turn yield a single announcement of the final count.

#### Scenario: Initial load
- **WHEN** the table renders for the first time
- **THEN** nothing is announced

#### Scenario: Search header owns announcements
- **WHEN** a search header is registered and `announceResults` is unset and new rows arrive without a pending request
- **THEN** the table does not announce them

### Requirement: Template and appearance - table skeleton
`ocx-data-table` (non-standalone, `ChangeDetectionStrategy.Eager`, `styleUrls: data-table.component.scss`, default emulated encapsulation) SHALL render, only when `displayedPageSize()` and both `columnTemplates$` and `columnHeaderTemplates$` have emitted, a single `<p-table>` with: `[value]="groupedRows()"`, `[paginator]="paginator()"`, `[first]="stateService.activePage() * displayedPageSize"`, `[rows]="displayedPageSize"`, `[showCurrentPageReport]="true"`, `[rowsPerPageOptions]="pageSizes()"`, `[id]="'dataTable_' + name()"`, `dataKey="id"`, `[rowTrackBy]`, `[selection]="selectedFilteredRows()"`, `[scrollable]="true"`, `scrollHeight="flex"`, `[style]="tableStyle()"`, `paginatorDropdownAppendTo="body"`, `[rowSelectable]`, `tableStyleClass="h-full"`, `[expandedRowKeys]`, and `[pt]="{ table: { 'aria-label': tableAriaLabel() || ('OCX_DATA_TABLE.TABLE_ARIA_LABEL' | translate) } }"`. The page report text is `OCX_DATA_TABLE.SHOWING` (`{{first}} - {{last}} of {{totalRecords}}`) or, when `totalRecordsOnServer()` is truthy, `OCX_DATA_TABLE.SHOWING_WITH_TOTAL_ON_SERVER` (`... ({{totalRecordsOnServer}})`), each overridable via `currentPageShowingKey` / `currentPageShowingWithTotalOnServerKey`, translated with `params()`.

#### Scenario: Default table name
- **WHEN** rendered with `name = 'users'` and no `tableAriaLabel`
- **THEN** the DOM contains `p-table#dataTable_users` whose inner `<table>` has `aria-label="Data table"` (en)

#### Scenario: Caption slot
- **WHEN** `captionTemplate()` is set
- **THEN** a `pTemplate="caption"` is rendered above the header containing that template; without it no caption exists

### Requirement: Template and appearance - header row
The header (`<tr style="vertical-align: top">`) SHALL contain, in order: (1) the expansion header `<th pFrozenColumn name="expansion-column-header" style="width: 4rem" scope="col">` with `<span class="sr-only">OCX_DATA_TABLE.EXPAND_COLLAPSE_COLUMN</span>`, only if `expandable() && expansionTemplate()`; (2) if `selectionChangedObserved`, `<th style="width: 4rem" scope="col">` holding `<p-tableHeaderCheckbox autofocus="false">` (only if `allowSelectAll()`; `ocxTooltip` `OCX_DATA_TABLE.SELECT_ALL_TOOLTIP`, `ariaLabel` `OCX_DATA_TABLE.SELECT_ALL_ARIA_LABEL`) plus `<span class="sr-only">OCX_DATA_TABLE.SELECTION_COLUMN</span>`; (3) the action header `<th scope="col" pFrozenColumn>` with text `OCX_DATA_TABLE.ACTIONS_COLUMN_NAME` and `name="action-column-header-left"` or `"action-column-header-right"`, placed first when `actionColumnConfigPosition() === 'left'` and last when `'right'`, only if `actionColumnVisible`; (4) one `<th scope="col">` per `stateService.columns()`.

Column header shapes: a custom header template for the column id renders `<th scope="col" role="columnheader">` with the template and context `{ column, labelTemplate, sortTemplate, filterTemplate }`; else for `sortable || filterable` columns `<th scope="col" role="columnheader"> > div.table-header-wrapper.flex.flex-col.justify-between.items-start[style="height:100%"] > span.flex#<column.id>-header-name` (label) plus `span.flex.icon-button-header-wrapper` (sort button then filter); else a plain `<th scope="col">` with the label only.

#### Scenario: Sortable and filterable column
- **WHEN** a column has `sortable: true` and `filterable: true`
- **THEN** its `th` contains `.table-header-wrapper` with the label span `#<id>-header-name` and `.icon-button-header-wrapper` containing `button.sortButton` and `p-multiselect.filterMultiSelect`

### Requirement: Template and appearance - column header label, sort and filter controls
The label template SHALL render `column.nameKey | translate`; when `column.tooltip || column.tooltipKey` it wraps the text in `<span [ocxTooltip]="column.tooltip || (column.tooltipKey | translate)" ocxTooltipCursor="default" tooltipPosition="top">`. The sort button (only if `column.sortable`) SHALL be `<button class="pi sortButton pl-0">` with the icon class `pi-sort-alt` (column is not the sort column, or direction `NONE`), `pi-sort-amount-up` (sort column and `ASCENDING`) or `pi-sort-amount-down` (sort column and `DESCENDING`), `(click)="onSortColumnClick(column.id)"`, `ocxTooltip` = `sortIconTitle(column.id) | translate` at `tooltipPosition="bottom"` (`OCX_DATA_TABLE.TOGGLE_BUTTON.ASCENDING_TITLE` "Sort Ascending" / `DESCENDING_TITLE` "Sort Descending" / `DEFAULT_TITLE` "Default Sort") and `aria-label` `OCX_DATA_TABLE.TOGGLE_BUTTON.ARIA_LABEL` ("Toggle {{column}} sorting direction to {{direction}}", direction = translated title of the next direction).

The filter control SHALL be a `<p-multiselect class="filterMultiSelect" placeholder=" " appendTo="body" [showToggleAll]="true" [displaySelectedLabel]="false" [resetFilterOnHide]="true">` with `ocxTooltip` `OCX_DATA_TABLE.FILTER_TITLE` (top), `ariaLabel` `OCX_DATA_TABLE.COLUMN_FILTER_ARIA_LABEL`, `ariaFilterLabel` `OCX_DATA_TABLE.FILTER_ARIA_LABEL` with `{ column }`, `emptyFilterMessage` `OCX_DATA_TABLE.EMPTY_FILTER_MESSAGE`. For `filterable` columns with no `filterType` or `FilterType.EQUALS` it uses `filterBy="toFilterBy"`, `filterPlaceHolder` `OCX_DATA_TABLE.COLUMN_FILTER_PLACEHOLDER`, options only for the column currently chosen (`onFocus` -> `onFilterChosen(column)`), and item templates from `columnFilterTemplates$`. For `FilterType.IS_NOT_EMPTY` it offers two fixed options with keys `OCX_DATA_TABLE.FILTER_YES` (true) and `OCX_DATA_TABLE.FILTER_NO` (false), translated in the item template. The trigger content is `<div class="pi pi-filter">` when `filterAmounts()[column.id]` is falsy, else `pi pi-filter-fill`.

#### Scenario: Active filter indicator
- **WHEN** a column has 2 selected filter values
- **THEN** its multiselect shows `div.pi.pi-filter-fill` instead of `div.pi.pi-filter`

### Requirement: Template and appearance - body rows, selection and cells
Each body row SHALL be `<tr id="ocx-data-row-<rowObject.id>">` containing in order: expansion cell, optional selection `<td>`, optional left action cell, one `<td>` per column, optional right action cell. The selection cell holds `<p-tableCheckbox autofocus="false" [value]="rowObject" [disabled]="isRowSelectionDisabled(rowObject)">`, or (when the row is selection-disabled AND selected) a disabled checked `<p-checkbox [binary]="true">`; both use `ariaLabel` `OCX_DATA_TABLE.SELECT_ARIA_LABEL` with `{ key: rowObject.id, rowSummary: getRowSummary(rowObject) }`. Each cell `<td>` wraps its content in `@defer (on viewport)` with `@placeholder { <p-skeleton width="3rem" /> }`; the content is `cell() ?? columnTemplates[column.id]` with context `{ rowObject, column }`.

Default cell templates (`pTemplate`): `defaultStringCell` (raw value), `defaultNumberCell` (`| number`), `defaultDateCell` (`| date: column.dateFormat ?? 'medium'`), `defaultRelativeDateCell` (`OCX_DATA_TABLE.EDITED` + ` ` + `| timeago`), `defaultTranslationKeyCell` (`| translate`).

#### Scenario: Cells not yet in viewport
- **WHEN** a row is rendered but its cell is outside the viewport
- **THEN** the `td` contains `p-skeleton` of width `3rem` until it enters the viewport

### Requirement: Template and appearance - action column
The action cell SHALL be `<td class="actions" pFrozenColumn [frozen]="stateService.actionColumnConfigFrozen()" [alignFrozen]="actionColumnConfigPosition()" name="action-column-left|action-column-right">` with `ngClass` `border-right-1` when frozen and left, `border-left-1` when frozen and right, none otherwise (same classes on the header `th`). It contains `div.icon-button-row-wrapper` with, in order, only for observed outputs and when the `*ActionVisibleField` is absent/truthy and permitted via `*ocxIfPermission`:
- view `button#<rowId>-viewButton.p-button-rounded.p-button-text.viewTableRowButton`, `icon="pi pi-eye"`, title and aria-label `OCX_DATA_TABLE.ACTIONS.VIEW`, `name="data-table-action-button"`;
- edit `button#<rowId>-editButton....editTableRowButton`, `pi pi-pencil`, `OCX_DATA_TABLE.ACTIONS.EDIT`;
- delete `button#<rowId>-deleteButton.p-button-rounded.p-button-text.p-button-danger.deleteTableRowButton`, `pi pi-trash`, `OCX_DATA_TABLE.ACTIONS.DELETE`;
- each inline action: `<a pButton class="p-button-rounded p-button-text no-underline" [routerLink] data-testid="data-table-action-button">` when `routerLink` is a string and the action is enabled, else `<button pButton class="p-button-rounded p-button-text" name="data-table-action-button">`; id `<rowId>-<action.id>ActionButton` (fallback `<rowId>-inlineActionButton`), extra `action.classes`, `icon`, title/aria-label from `action.labelKey`;
- the overflow menu: `<p-menu [popup]="true" appendTo="body">` and a trigger `button.p-button-rounded.p-button-text` with `icon pi pi-ellipsis-v`, title and aria-label `OCX_DATA_TABLE.MORE_ACTIONS`, `name="data-table-overflow-action-button"`, rendered only if `hasVisibleOverflowMenuItems(rowObject)`.
Disabled state: `[disabled]` when the `*ActionEnabledField` is set and falsy for the row (inline actions also when `action.disabled`).

#### Scenario: Frozen right action column
- **WHEN** `frozenActionColumn` is true and `actionColumnPosition` is `'right'`
- **THEN** the header `th[name=action-column-header-right]` and each `td.actions[name=action-column-right]` carry `border-left-1` and `alignFrozen="right"`

> Note (code-derived): the view button uses `id="{{...}}-viewButton"` interpolation and `name`/`data-testid` differ between buttons (`name="data-table-action-button"`) and router-link anchors (`data-testid="data-table-action-button"`).

### Requirement: Template and appearance - expansion, grouping and empty row
The expansion cell SHALL be `<td pFrozenColumn [frozen]="frozenExpandColumn()" alignFrozen="left" name="expansion-column">` holding `button[type=button][pButton][pRipple].p-button-rounded.p-button-text` with `icon` `pi pi-chevron-down` (expanded) or `pi pi-chevron-right`, `aria-expanded`, `aria-controls="ocx-expanded-row-<id>"` (only when expanded, else absent), and aria-label/title `OCX_DATA_TABLE.EXPANDED_ROW` / `OCX_DATA_TABLE.COLLAPSED_ROW`. The expanded row SHALL be `<tr id="ocx-expanded-row-<id>"><td [attr.colspan]="getRowColspan(true)">` with the expansion template (context `{ rowObject }`).

When a grouping column exists, a group-start row `<tr class="ocx-data-table-group-row"><th scope="rowgroup" [attr.colspan]="getGroupColspan()" data-group-key="<key>">` SHALL precede the first row of each group, containing `groupCell()` (context `getGroupContext(row)`) or else the cell template for the group column with `{ rowObject: group.firstRow, column }`.

The empty state SHALL be `<tr><td [colSpan]="getRowColspan(!!expansionTemplate())">` with `emptyResultsMessage() || ('OCX_DATA_TABLE.EMPTY_RESULT' | translate)` ("No data found.").

#### Scenario: Group row
- **WHEN** rows are grouped by a column
- **THEN** before each group's first row there is `tr.ocx-data-table-group-row > th[scope=rowgroup][data-group-key]` spanning all columns

### Requirement: Template and appearance - component styles
`data-table.component.scss` SHALL define (colors as SCSS constants `$clr-neutral-100: #f7f7f7`, `$clr-neutral-500: #979797`, `$clr-neutral-700: #262626`): 
- `:host ::ng-deep .p-multiselect { padding: 0; background: #f7f7f7; border: none }` with `.p-multiselect-container { height: 20px; width: 20px }`, `.p-multiselect-trigger` and `.p-multiselect-dropdown` `display: none`, `.p-multiselect-label.p-placeholder { color: #262626; font-size: 0.9rem; font-family: Bold, sans-serif; font-weight: 700; padding: 0 }`, and `&:focus-within { box-shadow: none; background: #979797 }` (a 20x20 icon-only filter trigger);
- `:host ::ng-deep .filterMultiSelect:has(:focus-visible):not(.p-multiselect-open) { outline: 2px solid #262626; outline-offset: 1px }` (keyboard focus ring);
- `.pi { border: none; background: none; cursor: pointer }`;
- `.sr-only` visually hidden (`position: absolute; 1px x 1px; padding 0; margin -1px; overflow hidden; clip-path: inset(50%); border 0`);
- `.ocx-data-table-group-row th[scope='rowgroup'] { background: #f7f7f7; color: #262626; font-weight: 700; text-align: left }`;
- `:host ::ng-deep .p-datatable-table-container { position: relative; z-index: 0 }`.
Layout otherwise relies on global utility classes (`flex`, `flex-col`, `justify-between`, `items-start`, `h-full`, `pl-0`, `no-underline`, `border-left-1`, `border-right-1`).

#### Scenario: Header filter button
- **WHEN** a filterable column header renders
- **THEN** its multiselect shows no dropdown arrow, is 20px wide/high on a `#f7f7f7` background and darkens to `#979797` while focused within

> Note (code-derived): `.pi` and `.sr-only` are not `::ng-deep`, so they apply (emulated encapsulation) only to elements declared in this component's template, including its `ng-template`s.
