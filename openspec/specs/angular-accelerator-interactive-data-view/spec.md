# angular-accelerator-interactive-data-view Specification

## Purpose
`InteractiveDataViewComponent` (`ocx-interactive-data-view`) composes layout selection, filter view, column group selection, column picker, sorting controls and an `ocx-data-view` into one component that shows data as grid, list or table. Application developers use it to get a complete, state-synchronised data view from a small set of inputs and outputs.

## Requirements

### Requirement: Shared state service
The component SHALL provide a `DataViewStateService` to its child components. If an ancestor already provides a `DataViewStateService`, the component MUST reuse it instead of creating a new one. Setter inputs (`columns`, `filters`, `sortField`, `sortDirection`, `page`, `pageSize`, `layout`, `additionalActions`, `listGridPaginator`, `tablePaginator`, `selectedRows`, `selectedGroupKey`, `data`, `frozenActionColumn`, `actionColumnPosition`, `expandedRows`) SHALL write to that service.

#### Scenario: Input is written to state
- **WHEN** the host sets `layout` to `table`
- **THEN** `stateService.layout()` is `table` and the table is rendered

#### Scenario: Parent state service is reused
- **WHEN** an ancestor provides a `DataViewStateService`
- **THEN** the component and its children use that instance

### Requirement: Input defaults
The component SHALL use these defaults: `supportedViewLayouts` = `['grid','list','table']`; `sortStates` = ascending, descending, none; `pageSizes` = `[10,25,50]`; `clientSideSorting` and `clientSideFiltering` = `true`; `name` = `Data`; `fallbackImage` = `placeholder.png`; `defaultGroupKey` = empty; `customGroupKey` = `OCX_INTERACTIVE_DATA_VIEW.CUSTOM_GROUP`; `groupSelectionNoGroupSelectedKey` = `OCX_INTERACTIVE_DATA_VIEW.NO_GROUP_SELECTED`; `currentPageShowingKey` = `OCX_DATA_TABLE.SHOWING`; `currentPageShowingWithTotalOnServerKey` = `OCX_DATA_TABLE.SHOWING_WITH_TOTAL_ON_SERVER`; `tableAllowSelectAll` = `true`; `expandable` and `frozenExpandColumn` = `false`; `draggableColumnGroupSelectorDialog` and `resizableColumnGroupSelectorDialog` = `true`; `restoreColumnGroupSelectorOrder` = `false`; `filterViewDisplayMode` = `button`; `filterViewTableStyle` = `max-height: 50vh`; `filterViewPanelStyle` = `max-width: 90%`.

#### Scenario: Defaults apply
- **WHEN** only `columns` and `data` are provided
- **THEN** grid, list and table layouts are offered and paging offers 10, 25 and 50 rows

### Requirement: Filter view is disabled by default
The filter view MUST only be rendered when `disableFilterView` is `false`; its default is `true`. When rendered it SHALL receive the state filters, available columns, `activeOrAllColumns`, the content templates, `filterViewDisplayMode`, `selectDisplayedChips`, `filterViewChipStyleClass`, `filterViewTableStyle` and `filterViewPanelStyle`. The default `selectDisplayedChips` shows the last three filters in reverse order.

#### Scenario: Filter view hidden
- **WHEN** `disableFilterView` is not set
- **THEN** no `ocx-filter-view` is rendered

#### Scenario: Filter view shown
- **WHEN** `disableFilterView` is `false`
- **THEN** `ocx-filter-view` is rendered with the current filters

### Requirement: Displayed columns
`displayedColumnKeys` SHALL be a writable signal initialised from the `displayedColumnKeys` input. `displayedColumns` SHALL map the keys, in key order, to the available columns and drop keys without a matching column. `activeOrAllColumns` SHALL be the displayed columns if an active column group key (or `defaultGroupKey`) is set, otherwise all available columns.

#### Scenario: Unknown key dropped
- **WHEN** `displayedColumnKeys` contains an id not present in `columns`
- **THEN** `displayedColumns()` omits it

#### Scenario: No group active
- **WHEN** neither an active group key nor a `defaultGroupKey` exists
- **THEN** `activeOrAllColumns()` returns all available columns

### Requirement: Empty displayed columns warning
The component SHALL log a warning when the displayed columns change from non-empty to empty. It MUST NOT warn while the columns have never been non-empty.

#### Scenario: Initial empty state
- **WHEN** the component starts with no displayed columns
- **THEN** no warning is logged

#### Scenario: Columns removed
- **WHEN** displayed columns become empty after having been non-empty
- **THEN** a warning about an empty sort dropdown is logged

### Requirement: Initial column group
On init the component SHALL set the active column group key to `defaultGroupKey`. If `defaultGroupKey` is non-empty and differs from `customGroupKey`, `displayedColumnKeys` SHALL be set to the ids of available columns whose `predefinedGroupKeys` include it.

#### Scenario: Default group selects columns
- **WHEN** `defaultGroupKey` is `A` and two columns list `A` in `predefinedGroupKeys`
- **THEN** only those two columns are displayed

### Requirement: Layout-dependent toolbar
The toolbar SHALL always show the layout selection. For `grid` and `list` layouts it SHALL show `ocx-data-list-grid-sorting`; for `table` it SHALL show the column group selection and the custom group column selector (with state frozen/position of the action column and the dialog options). In non-table layouts the column group slot is rendered but hidden and absolutely positioned.

#### Scenario: Table layout
- **WHEN** the layout is `table`
- **THEN** column group selection and column picker are visible and sorting controls are not

#### Scenario: Grid layout
- **WHEN** the layout is `grid`
- **THEN** the sorting controls are visible and the column picker is not rendered

### Requirement: Column group selection slot
The component SHALL render the slot `onecx-column-group-selection` instead of the built-in column group selection while a component is registered for the slot (the signal starts as `true` until the slot service answers) and, if `searchConfigPermission` is set, the user holds that permission; otherwise it MUST render the built-in `ocx-column-group-selection` (table layout only). The slot receives `placeholderKey`, `defaultGroupKey`, `customGroupKey`, `columns`, `selectedGroupKey`, `layout` and `displayedColumnsIds`, and its `groupSelectionChanged` output is handled by `triggerGroupSelectionChanged`.

#### Scenario: Slot used
- **WHEN** a remote component is defined for the slot and the permission check passes
- **THEN** the slot is rendered and the built-in selection is not

#### Scenario: No remote component
- **WHEN** no component is defined for the slot
- **THEN** the built-in `ocx-column-group-selection` is rendered

### Requirement: Group selection handling
`triggerGroupSelectionChanged(event)` SHALL set `displayedColumnKeys` to the ids of `event.activeColumns`, set the active group key to `event.groupKey` and emit `groupSelectionChangedSlotEmitter`. If `event` is undefined it SHALL use the current displayed columns and the active group key (falling back to `defaultGroupKey`). Selection from the built-in selector and from the column picker SHALL update displayed keys and group key; a picker selection MUST set the group key to `customGroupKey`.

#### Scenario: Undefined event
- **WHEN** `triggerGroupSelectionChanged(undefined)` is called
- **THEN** the current displayed columns and group key are re-emitted

#### Scenario: Picker selection
- **WHEN** the column picker emits `columnSelectionChanged`
- **THEN** displayed keys follow the selection and the active group key is `customGroupKey`

### Requirement: Group key reset on layout change
When the layout changes and a column group component is defined, the component SHALL reset the active group key to `undefined` unless some available column's `nameKey` equals it or it equals `customGroupKey`.

#### Scenario: Unknown group
- **WHEN** the layout changes while the active group key matches neither a column `nameKey` nor `customGroupKey`
- **THEN** the active group key becomes undefined

> Note (code-derived): the comparison is against column `nameKey` rather than `predefinedGroupKeys`, so a regular predefined group key is usually reset by this rule.

### Requirement: State outputs
The component SHALL emit `filtered`, `sorted` (`{sortColumn, sortDirection}`), `dataViewLayoutChange`, `pageChanged`, `displayedColumnKeysChange` whenever the corresponding state changes, including the initial value. `pageSizeChanged` MUST NOT emit while the page size is falsy. `componentStateChanged` SHALL emit the combined state (`activeColumnGroupKey`, `displayedColumns`, `actionColumnConfig`, `layout`, `sorting`, `filters`, `activePage`, `pageSize`, `selectedRows`) whenever any part changes.

#### Scenario: Sorting changes
- **WHEN** the user changes the sort column
- **THEN** `sorted` and `componentStateChanged` emit the new sort

#### Scenario: Undefined page size
- **WHEN** the page size is unset
- **THEN** `pageSizeChanged` does not emit

### Requirement: Item action outputs
`deleteItem`, `viewItem`, `editItem`, `selectionChanged`, `rowExpanded` and `rowCollapsed` SHALL be observable outputs. The component SHALL forward the matching event of the inner data view only if the host has subscribed to the output. Action visibility depends on the corresponding permission and `*ActionVisibleField`/`*ActionEnabledField` inputs, which are passed to the data view.

#### Scenario: Unsubscribed output
- **WHEN** the host has not subscribed to `editItem`
- **THEN** the component does not forward edit events

### Requirement: Template resolution
For each content template (cell, filter cell, list value, grid/list item, column header, `topCenter`, subtitle lines, `groupCell`) the component SHALL prefer a template provided through `pTemplate` of the matching type over a content child with the matching template reference name. For `groupCell` the order SHALL be the `groupCellTemplate` input, then `pTemplate`, then the content child.

#### Scenario: Both provided
- **WHEN** both a `pTemplate="stringTableCell"` and a `#stringTableCell` child exist
- **THEN** the `pTemplate` is used

### Requirement: Pass-through to data view
The component SHALL pass columns, layout, sorting, filters, data, paging, permissions, action fields, row grouping, expansion, `announceResults`, `tableAriaLabel`, `totalRecordsOnServer`, `emptyResultsMessage` and templates to `ocx-data-view`, and SHALL write sort, filter, page and page-size events from it back to the state.

#### Scenario: Page change
- **WHEN** the data view emits `pageChanged`
- **THEN** `stateService.activePage` is updated and `pageChanged` is emitted

### Requirement: Template and appearance - header and content shells
`ocx-interactive-data-view` (no stylesheet, `ChangeDetectionStrategy.Eager`) SHALL render two sibling blocks: `<div class="p-3 border-b border-surface" [ngClass]="headerStyleClass()" id="interactiveDataViewHeader">` and `<div class="p-3" [ngClass]="contentStyleClass()" id="interactiveDataViewContent">` containing a single `<ocx-data-view>` that receives all state, permission, template and paging bindings (page changes and sorts re-emitted via `onPageChange`, `onPageSizeChange`, `sorting`, `filtering`, `rowExpanded`, `rowCollapsed`). A closing `<ng-template #defaultColumnGroupSelectionComponent>` renders `<ocx-column-group-selection>` only when the layout is `table`.

#### Scenario: Style class inputs
- **WHEN** `headerStyleClass="bg-red"` is set
- **THEN** `#interactiveDataViewHeader` has classes `p-3 border-b border-surface bg-red`

### Requirement: Template and appearance - toolbar layout
Inside the header the toolbar SHALL be `div.flex.flex-wrap.justify-between.items-center.py-1.gap-2` with three regions:
1. left `div.flex.flex-wrap.justify-start.items-center.gap-2` holding `<ocx-data-layout-selection>` and, unless `disableFilterView()`, `<ocx-filter-view>` (bound to `filters`, `availableColumns`, `activeOrAllColumns`, `templates`, `displayMode`, `selectDisplayedChips`, `chipStyleClass`, `tableStyle`, `panelStyle`);
2. optional center `<div>` with the `_topCenter()` template via `ngTemplateOutlet`;
3. when layout is not `table`, `div.flex.items-center.gap-2` with `<ocx-data-list-grid-sorting>` (columns = `displayedColumns()`);
4. right `div.flex.flex-wrap.justify-between.items-center.gap-2`, which gets `[ngStyle]="{ position: 'absolute' }"` when layout is not `table`, holding the column group selection and, only when layout is `table`, `<ocx-custom-group-column-selector>` (bound to columns, displayed columns, `customGroupKey`, frozen/position config, `draggableColumnGroupSelectorDialog`, `resizableColumnGroupSelectorDialog`, `restoreColumnGroupSelectorOrder`).

#### Scenario: Table layout toolbar
- **WHEN** layout is `table`
- **THEN** the header shows layout buttons, filter view, then the column group dropdown and the cog button (`#customGroupColumnSelectorButton`) on the right; no sorting dropdown

#### Scenario: List layout toolbar
- **WHEN** layout is `list` or `grid`
- **THEN** the sorting dropdown/button appears, the cog selector is absent and the right region is absolutely positioned

### Requirement: Template and appearance - column group selection slot
When `isColumnGroupSelectionComponentDefined() ?? true`, the right region SHALL render `<ocx-slot name="onecx-column-group-selection" *ocxIfPermission="searchConfigPermission(); elseTemplate: defaultColumnGroupSelectionComponent">` with `[inputs]="{ placeholderKey: groupSelectionNoGroupSelectedKey(), defaultGroupKey, customGroupKey, columns: availableColumns(), selectedGroupKey, layout, displayedColumnsIds: displayedColumnKeys() }"`, `[outputs]="{ groupSelectionChanged: slotGroupSelectionChangeListener }"`, `[ngStyle]="{ display: 'none' }"` when layout is not `table`, and a `#skeleton` template `div.flex > p-skeleton[width=18rem][height=3rem]`. Otherwise (no slot component registered) the `defaultColumnGroupSelectionComponent` template is rendered directly. In `defaultColumnGroupSelectionComponent`, `defaultGroupKey` is passed as `''` when equal to `customGroupKey()`.

#### Scenario: Slot loading
- **WHEN** a slot component is registered but not loaded yet
- **THEN** an 18rem x 3rem `p-skeleton` is shown

> Note (code-derived): the translated texts shown in this toolbar come from the child components (see column-and-layout-selection, filter-view and list-grid sorting specs); the interactive-data-view's own keys are `OCX_INTERACTIVE_DATA_VIEW.DEFAULT_GROUP` "Default group", `CUSTOM_GROUP` "Custom group", `NO_GROUP_SELECTED` "No group selected" (used as placeholder/group keys).
