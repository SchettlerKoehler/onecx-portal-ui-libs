# angular-accelerator-data-view Specification

## Purpose
`DataViewComponent` (`ocx-data-view`) is a thin switch that renders either `ocx-data-list-grid` (layouts `grid`, `list`) or `ocx-data-table` (layout `table`) from one shared state, forwarding inputs, templates and events. It is the building block of `ocx-interactive-data-view`.

## Requirements

### Requirement: Layout selection
The component SHALL render `ocx-data-table` when the layout in its `DataViewStateService` is `'table'`, and otherwise `ocx-data-list-grid` with layout `'list'` for `'list'` and `'grid'` for any other value. The `layout` input (`ViewLayout` = `'grid' | 'list' | 'table'`) writes into the state; the default is `'grid'`. Only one of the two child components is rendered at a time.

#### Scenario: Table layout
- **WHEN** `layout` is `'table'`
- **THEN** only `ocx-data-table` is rendered

#### Scenario: Grid layout
- **WHEN** `layout` is `'grid'`
- **THEN** only `ocx-data-list-grid` is rendered with layout `'grid'`

### Requirement: Shared state and input forwarding
The component SHALL provide (or reuse from an ancestor) a `DataViewStateService` and write the inputs `data`, `columns`, `filters`, `sortField`, `sortDirection`, `page`, `pageSize`, `selectedRow`, `expandedRows`, `frozenActionColumn`, `actionColumnPosition`, `additionalActions` into it. `paginator` MUST set both `listGridPaginator` and `tablePaginator`, which can be set individually. It SHALL forward to the active child: `name`, `emptyResultsMessage`, `clientSideSorting`, `clientSideFiltering`, `announceResults`, `sortStates`, `pageSizes`, `totalRecordsOnServer`, permissions (`viewPermission`, `editPermission`, `deletePermission`) and the `*ActionVisibleField`/`*ActionEnabledField` inputs, and the pagination state. List/grid-only inputs (`titleLineId`, `subtitleLineIds`, `fallbackImage`-related) go to the list grid; table-only inputs (`tableSelectionEnabledField`, `tableAllowSelectAll`, `tableAriaLabel`, `expandable`, `frozenExpandColumn`, `currentPageShowingKey`, `currentPageShowingWithTotalOnServerKey`, `rowGrouping`) go to the table. `pageSizes` defaults to `[10, 25, 50]`, `sortStates` to `[]`.

#### Scenario: Paginator for both layouts
- **WHEN** `paginator` is set to `false`
- **THEN** neither the list grid nor the table shows a paginator

#### Scenario: Table-only input
- **WHEN** `tableSelectionEnabledField` is `canSelect` in table layout
- **THEN** the table receives it as `selectionEnabledField`

> Note (code-derived): `fallbackImage` is declared as an input but is not bound to `ocx-data-list-grid`. The list grid is also bound with `clientSideSorting` twice (the `clientSideSorting()` input and a literal `true`); the literal is what the list grid receives last.

### Requirement: Template pass-through
The component SHALL accept templates by input or by content child, input taking precedence, and pass them to the active child with their context unchanged (`rowObject`, `column` for cells and list values; `$implicit` for items and subtitle lines). Table templates: `stringTableCellTemplate`, `numberTableCellTemplate`, `dateTableCellTemplate`, `relativeDateTableCellTemplate`, `translationKeyTableCellTemplate`, `tableCellTemplate`, `stringTableFilterCellTemplate`, `numberTableFilterCellTemplate`, `dateTableFilterCellTemplate`, `relativeDateTableFilterCellTemplate`, `translationKeyTableFilterCellTemplate`, `tableFilterCellTemplate`, `columnHeaderTemplate` and `groupCellTemplate`. List/grid templates: `listItemTemplate`, `gridItemTemplate`, `listItemSubtitleLinesTemplate`, `gridItemSubtitleLinesTemplate`, `listValueTemplate`, `stringListValueTemplate`, `numberListValueTemplate`, `dateListValueTemplate`, `relativeDateListValueTemplate`, `translationKeyListValueTemplate`. Content `PrimeTemplate`s of the data view and its own `parentTemplates` input MUST be passed to the child as `parentTemplates`, so that column-specific templates (e.g. `<columnId>IdTableCell`, `<columnId>IdListValue`) and `expansion` templates are found.

#### Scenario: Cell template forwarded
- **WHEN** `stringTableCellTemplate` is provided in table layout
- **THEN** the table renders string cells with that template

#### Scenario: Column templates from parent
- **WHEN** a `pTemplate` named `statusIdTableCell` is given to the data view
- **THEN** the table uses it for the `status` column

### Requirement: Event forwarding
The component SHALL expose outputs `viewItem`, `editItem`, `deleteItem`, `selectionChanged`, `rowExpanded`, `rowCollapsed`, `filtered`, `sorted`, `pageChanged`, `pageSizeChanged` and `componentStateChanged`. `viewItem`, `editItem` and `deleteItem` MUST be forwarded from whichever child is active (list-grid `viewItem`/`editItem`/`deleteItem`, or table `viewTableRow`/`editTableRow`/`deleteTableRow`) and `selectionChanged`, `rowExpanded`, `rowCollapsed` from the table. A child subscription MUST be added only if the data view's output has an observer, so children only show action buttons for observed outputs. The `*Observed` state is also true if an enclosing `InteractiveDataViewComponent` has an observer for the same output.

#### Scenario: Observed output enables button
- **WHEN** the data view's `editItem` has an observer in table layout
- **THEN** the table shows edit buttons, and clicking one emits `editItem` with the row

#### Scenario: Unobserved output
- **WHEN** `deleteItem` has no observer
- **THEN** no delete button or menu entry is shown

### Requirement: State outputs
The component SHALL emit `filtered` with the filters whenever the state's filters are truthy; `sorted` with `{ sortColumn, sortDirection }` only when both are truthy (non-empty); `pageChanged` with the active page when defined; `pageSizeChanged` with the page size when defined; and `componentStateChanged` (`DataViewComponentState` = list-grid state & table state) with filters, sorting, selected rows, active page and page size on every state change. Page and page-size outputs of the children MUST be written back into the state.

#### Scenario: No sort column
- **WHEN** the sort column is `''`
- **THEN** `sorted` does not emit

> Note (code-derived): Because `DataSortDirection.NONE` is the non-empty string `'NONE'`, `sorted` does emit with direction `NONE` as soon as a sort column is set.

### Requirement: Public handlers and child access
The component SHALL expose its child instances via `dataListGridComponent` and `dataTableComponent` view queries (defined only while the respective layout is active), and the handlers `filtering(event)` (sets filters from `event.filters`), `sorting(event)` (sets sort direction and column), `onPageChange`, `onPageSizeChange`, `deletingElement`, `viewingElement`, `editingElement` and `onRowSelectionChange`. On init it MUST record the id of the first column as `firstColumnId` when columns exist.

#### Scenario: First column
- **WHEN** columns `[a, b]` are set before initialization
- **THEN** `firstColumnId` is `'a'`

### Requirement: Template and appearance - layout switch structure
`ocx-data-view` (selector `ocx-data-view`, no stylesheet) SHALL render, when `stateService.layout() !== 'table'`, a wrapper `<div>` containing one `<ocx-data-list-grid #ocxdatalistgrid>` and, when `stateService.layout() === 'table'`, a wrapper `<div>` containing one `<ocx-data-table #ocxdatatable>`; never both. The list-grid receives `[layout]="stateService.layout() === 'grid' ? 'grid' : 'list'"`, `[paginator]="stateService.listGridPaginator()"`, `[parentTemplates]="templatesForChildren()"`; the table receives `[paginator]="stateService.tablePaginator()"`, `[frozenActionColumn]`, `[actionColumnPosition]`, `[selectedRows]`, `[expandedRows]`, `[allowSelectAll]="tableAllowSelectAll()"`, `[selectionEnabledField]`, `[tableAriaLabel]`, `[expandable]`, `[frozenExpandColumn]`, `[rowGrouping]`, `[groupCellTemplate]` and all `*CellTemplate`/`*FilterCellTemplate`/`columnHeaderTemplate` inputs.

#### Scenario: Layout `table`
- **WHEN** layout is `table`
- **THEN** the DOM contains `ocx-data-view > div > ocx-data-table` and no `ocx-data-list-grid`

#### Scenario: Layout `grid` or `list`
- **WHEN** layout is `grid` or `list`
- **THEN** the DOM contains `ocx-data-view > div > ocx-data-list-grid`, and no `ocx-data-table`

### Requirement: Template and appearance - forwarding ng-templates
Inside each wrapper the component SHALL declare one `<ng-template #xxxTemplate>` per pass-through slot, each guarded by `@if (<templateRef>)` and rendering that template via `ngTemplateOutlet`. List-grid side: `listItemSubtitleLinesTemplate`, `gridItemSubtitleLinesTemplate`, `gridItemTemplate`, `listItemTemplate` (context `{ $implicit: item }`), `listValueTemplate`, `translationKeyListValueTemplate`, `numberListValueTemplate`, `relativeDateListValueTemplate`, `stringListValueTemplate`, `dateListValueTemplate` (context `{ rowObject, column }`). Table side: `stringCellTemplate`, `numberCellTemplate`, `dateCellTemplate`, `relativeDateCellTemplate`, `cellTemplate`, `translationKeyCellTemplate`, `stringFilterCellTemplate`, `filterCellTemplate`, `dateFilterCellTemplate`, `numberFilterCellTemplate`, `relativeDateFilterCellTemplate`, `translationKeyFilterCellTemplate` (context `{ rowObject, column }`), and `columnHeaderTemplate` (let-column, labelTemplate, sortTemplate, filterTemplate).

#### Scenario: Missing template
- **WHEN** a pass-through template is not provided
- **THEN** its wrapper ng-template renders nothing and the child component's default template is used

> Note (code-derived): the list-grid is always passed `[clientSideSorting]="true"` in addition to `[clientSideSorting]="clientSideSorting()"` (duplicate binding in the template; the latter is the one Angular applies last).
