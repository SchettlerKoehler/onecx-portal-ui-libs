# angular-accelerator-filter-view Specification

## Purpose
`FilterViewComponent` (`ocx-filter-view`) displays the active filters of a data view as chips or a manage button with popover, lets users add, remove and reset filters, and announces filter changes to assistive technology. It is used standalone or inside `InteractiveDataViewComponent`.

## Requirements

### Requirement: State source
The component SHALL use the `DataViewStateService` of a parent if one exists, otherwise its own instance. The inputs `filters` and `columns` write to that state. It SHALL emit `filtered` and `componentStateChanged({filters})` whenever the filters change, including the initial value.

#### Scenario: Standalone
- **WHEN** no parent state service exists and `filters` is set
- **THEN** the component renders those filters and emits `filtered`

### Requirement: Display modes
With `displayMode` `button` (default) the component SHALL show a manage-filters button whose badge displays the filter count and which opens a popover. With `chips` on desktop breakpoints it SHALL show a reset button, an "add filter" chip and one removable chip per selected filter; on other breakpoints it MUST fall back to the button mode.

#### Scenario: Button mode
- **WHEN** `displayMode` is `button` and 2 filters exist
- **THEN** the button badge shows `2`

#### Scenario: Chips on small screens
- **WHEN** `displayMode` is `chips` and the breakpoint is not desktop
- **THEN** the manage button is shown

### Requirement: Chip selection and overflow
In chips mode the displayed chips SHALL be computed by `selectDisplayedChips(filters, columns)`, default: the last three filters in reverse order. If fewer chips are selected than filters exist, a "+N" chip SHALL open the popover with the full filter table. Filters whose column does not exist are not rendered as chips. Custom templates `filterViewNoSelection`, `filterViewChipContent` and `filterViewShowMoreChip` SHALL replace the respective default content.

#### Scenario: More than three filters
- **WHEN** five filters exist in chips mode
- **THEN** three chips and a `+2` chip are shown

### Requirement: Chip value rendering
A chip shows the translated column name and the value. Filters with filter type `EQUALS` or none SHALL render the value with a column-type specific template; `IS_NOT_EMPTY` filters SHALL render a translated yes/no. Template lookup per column SHALL try the column-id-specific templates (`<id>IdFilterChip`, `<id>IdTableFilterCell`, `<id>IdTableCell`), then type templates (e.g. `stringFilterChipValue`, `stringTableFilterCell`, `stringTableCell`, then the built-in default), for chips; for the table the corresponding `FilterViewCell` names are tried first.

#### Scenario: Id-specific template
- **WHEN** a template `statusIdFilterChip` exists for column `status`
- **THEN** it renders the chip value for that column

### Requirement: Removing and resetting filters
Removing a chip SHALL remove all filters whose `value` equals the chip's value. Removing a row in the popover table SHALL remove only the filter matching both column id and value. The reset button SHALL set filters to an empty list and is disabled when no filters exist.

#### Scenario: Reset
- **WHEN** the user clicks reset with three filters
- **THEN** filters become `[]`

> Note (code-derived): `onChipRemove` compares only the value, not the column, so filters of other columns with the same value are also removed.

### Requirement: Filter popover table
The popover SHALL list filters in an `ocx-data-table` with columns column name, value and actions, sorted by the order of the available columns. Row ids are `<columnId>-<value>`. Filters of unknown columns are omitted. An empty list shows the translated "no filters" message. Closing the popover moves focus back to the opening trigger (the "+N" chip or the manage button).

#### Scenario: Sorted rows
- **WHEN** filters are added in a different order than the columns
- **THEN** the table lists them in column order

### Requirement: Add filter dialog
Clicking an add-filter control SHALL open the "Add filter" dialog through `PortalDialogService` for the filterable columns, with the current data, existing filters and optional preselected column; focus returns to the initiator on close. If there are no filterable columns the action MUST do nothing and the add controls are disabled with an explanatory tooltip. Filterable columns are `activeOrAllColumns` if provided, otherwise all available columns, restricted by `getFilterableColumns`. On confirm with a non-empty result `applyFilters` SHALL replace all existing filters of each column contained in the result and keep others. A cancelled dialog or an empty result changes nothing.

#### Scenario: Apply replaces per column
- **WHEN** filters `A=1`, `B=2` exist and the dialog returns `A=3`
- **THEN** the filters are `B=2`, `A=3`

#### Scenario: No filterable columns
- **WHEN** no column is filterable
- **THEN** `onAddFilter` opens no dialog

### Requirement: Add filter dialog content
`AddFilterDialogComponent` SHALL let the user choose one column (preselected column if present, otherwise the first) and multi-select its values. For `EQUALS`/unset columns the options SHALL be the distinct non-empty cell values of the data plus existing filter values missing from the data; dates are formatted with the column's `dateFormat` (default `medium`) and translation-key values are translated. For `IS_NOT_EMPTY` columns the options SHALL be translated Yes (`true`) and No (`false`). Changing the column re-seeds the selection from the existing filters of that column and filter type; a selected column that still exists is kept when inputs update. The dialog result SHALL be one `Filter` per selected value with the column's filter type (default `equals`), and the confirm button SHALL be enabled only if at least one value is selected.

#### Scenario: Confirm disabled
- **WHEN** no value is selected
- **THEN** the primary button is disabled and the result is empty

#### Scenario: Yes/No column
- **WHEN** the column has filter type `isNotEmpty`
- **THEN** the options are Yes and No

### Requirement: Filter count announcement
After the initial filters, when the component is standalone (no parent state service) every filter change SHALL be announced through `LiveAnnouncer`: `OCX_FILTER_VIEW.NO_FILTERS` for none, otherwise `OCX_FILTER_VIEW.SELECTED_FILTERS_COUNT` with the count as `results`. Inside a data view no filter count is announced because the data component announces the filtered result count.

#### Scenario: Standalone change
- **WHEN** a standalone filter view's filters change from 0 to 2
- **THEN** the selected-filters-count message with 2 is announced

#### Scenario: Within data view
- **WHEN** a parent state service exists and filters change
- **THEN** the filter view announces nothing

### Requirement: Filter view Template and appearance - structure and hooks
The `ocx-filter-view` template (`filter-view.component.html`, `styleUrls: ['./filter-view.component.scss']`, default emulated encapsulation) SHALL render nothing until both `stateService.availableColumns()` and `stateService.filters()` are truthy, and then a single root `div.flex.flex-wrap.items-center.gap-2`. In `displayMode() === 'chips'` and on a desktop breakpoint (`*ocxIfBreakpoint="'desktop'; elseTemplate: noChipsContent"`) the root SHALL contain, in order: (1) `p-button#ocxFilterViewReset` (`icon="pi pi-eraser"`, `[disabled]="filters.length === 0"`, `ariaLabel` `OCX_FILTER_VIEW.RESET_FILTERS_BUTTON.ARIA_LABEL`, `ocxTooltip` = `OCX_FILTER_VIEW.RESET_FILTERS_BUTTON.DETAIL` when filters exist else `OCX_FILTER_VIEW.NO_FILTERS`, `tooltipPosition="top"`, `tooltipEvent="hover"`); (2) `p-chip#ocxFilterViewAddFilterChip` with `tabindex="0"`, `role="button"`, `class="filter-view-focusable ocx-filter-view-add-filter-chip"`, `[attr.aria-label]` `OCX_FILTER_VIEW.ADD_FILTER.ARIA_LABEL`, `cursor-pointer` only while `filterableColumns().length > 0`, class `ocx-filter-view-add-filter-chip-disabled` and tooltip `OCX_FILTER_VIEW.ADD_FILTER.NO_FILTERABLE_COLUMNS` while there are none, activated by click, `keydown.enter` and `keydown.space` (space calls `preventDefault()`), containing `span.p-chip-text.flex.flex-nowrap.items-center.gap-1` with text `OCX_FILTER_VIEW.ADD_FILTER.BUTTON` followed by `<i class="pi pi-plus" aria-hidden="true">`; (3) when `filters.length <= 0` the projected `filterViewNoSelection` template (if given); (4) one `p-chip [removable]="true" [styleClass]="chipStyleClass()"` per displayed filter; (5) when `selectedFilters.length < filters.length`, `p-chip#ocxFilterViewShowMore` (`tabindex="0"`, `role="button"`, `class="cursor-pointer filter-view-focusable"`, opened by click/Enter/Space) showing `+{{filters.length - selectedFilters.length}}` in `span.p-chip-text.flex.flex-nowrap` unless a `filterViewShowMoreChip` template (context `$implicit` = hidden count) is given. In any other mode or on mobile the root SHALL contain only the `noChipsContent` template: `p-button#ocxFilterViewManage` (`tabindex="0"`, `icon="pi pi-sliders-h"`, label `OCX_FILTER_VIEW.MANAGE_FILTERS_BUTTON.LABEL`, `[badge]="filters.length.toString()"`, tooltip `...MANAGE_FILTERS_BUTTON.DETAIL`, ariaLabel `...MANAGE_FILTERS_BUTTON.ARIA_LABEL`).

#### Scenario: Desktop chips layout
- **WHEN** rendered with `displayMode='chips'`, desktop width, 5 filters and `selectDisplayedChips` returning 3
- **THEN** the root `div.flex.flex-wrap.items-center.gap-2` contains `#ocxFilterViewReset`, `#ocxFilterViewAddFilterChip`, 3 removable `p-chip` and `#ocxFilterViewShowMore` reading `+2`

#### Scenario: Mobile or button mode
- **WHEN** rendered on a mobile breakpoint or with `displayMode='button'`
- **THEN** only `#ocxFilterViewManage` (icon `pi pi-sliders-h`, badge = filter count) is shown and no chips exist

#### Scenario: No filterable columns
- **WHEN** `filterableColumns()` is empty
- **THEN** `#ocxFilterViewAddFilterChip` has class `ocx-filter-view-add-filter-chip-disabled`, no `cursor-pointer` and the tooltip `OCX_FILTER_VIEW.ADD_FILTER.NO_FILTERABLE_COLUMNS`

> Note (code-derived): the chip's `[disabled]` binding does not block `(click)`; `onAddFilter` itself returns early when there are no filterable columns.

### Requirement: Filter view Template and appearance - chip content and templates
A default chip SHALL render `span.p-chip-text.flex.flex-nowrap` with inline `style="white-space: nowrap"` containing `{{ column.nameKey | translate }}:` followed by the value. For `filter.filterType === EQUALS` (or unset) the value SHALL come from `chipTemplate`, which outlets the per-column template `templates[column.id]` with context `{ rowObject: getRowObjectFromFiterData(filter), column }`; for `IS_NOT_EMPTY` it SHALL come from `truthyTemplate` (context `{ value }`) rendering `OCX_FILTER_VIEW.FILTER_YES` or `OCX_FILTER_VIEW.FILTER_NO`. A projected `filterViewChipContent` template SHALL replace the default span, with context `{ filter, column, filterValueTemplates, truthyTemplate, filterValueTemplate }`. The component SHALL declare default value templates by name via `pTemplate`: `defaultStringValue` (raw field), `defaultNumberValue` (`| number`), `defaultDateValue` (`| date: column.dateFormat ?? 'medium'`), `defaultRelativeDateValue` (`OCX_DATA_TABLE.EDITED` + `| timeago`), `defaultTranslationKeyValue` (`| translate`) and an empty `defaultCustomValue`.

#### Scenario: Default chip
- **WHEN** a filter on a column with `nameKey='X'` and value `A` is displayed
- **THEN** the chip contains `span.p-chip-text` with text `<translated X>:` and the value template output

### Requirement: Filter view Template and appearance - filter panel
The panel (`ng-template #filterTablePanel`, rendered after both the add chip/show-more chip and the manage button) SHALL be a `p-popover` with `[style]="panelStyle()"` (default `{ 'max-width': '90%' }`) whose `pTemplate="content"` contains `div[pFocusTrap]` with a header row `div.flex.justify-between.items-center.mb-2`. The left group `div.flex.items-center.gap-3` SHALL contain `span.text-2xl.font-medium` (`OCX_FILTER_VIEW.PANEL_TITLE`) and `p-button#ocxFilterViewAddFilter` (`pAutoFocus [autofocus]="filters.length === 0"`, `icon="pi pi-plus"`, `iconPos="left"`, `styleClass="p-button-text p-button-secondary"`, label `OCX_FILTER_VIEW.ADD_FILTER.BUTTON`, tooltip `...ADD_FILTER.DETAIL` or `...NO_FILTERABLE_COLUMNS`, ariaLabel `...ADD_FILTER.ARIA_LABEL`). The right group SHALL hold `p-button#ocxFilterViewOverlayReset` (`pAutoFocus [autofocus]="filters.length > 0"`, `icon="pi pi-eraser"`, disabled without filters). Below SHALL be `ocx-data-table#ocxFilterViewDataTable` with `[paginator]="false"`, `[tableStyle]="tableStyle()"` (default `{ 'max-height': '50vh' }`), `[emptyResultsMessage]="'OCX_FILTER_VIEW.NO_FILTERS' | translate"` and three columns `columnId` (TRANSLATION_KEY, `OCX_FILTER_VIEW.TABLE.COLUMN_NAME`), `value` (STRING, `...TABLE.VALUE`), `actions` (STRING, `...TABLE.ACTIONS`) whose cells are projected as `pTemplate` `columnIdCell`, `valueIdCell`, `actionsIdCell`. The actions cell SHALL contain `div > button[pButton].p-button-rounded.p-button-danger.p-button-text` with `icon="pi pi-trash"`, `title` `OCX_FILTER_VIEW.TABLE.REMOVE_FILTER_TITLE` and `aria-label` `OCX_FILTER_VIEW.TABLE.REMOVE_FILTER_ARIA_LABEL`. On hide, focus returns to the trigger (`focusTrigger()`).

#### Scenario: Panel without filters
- **WHEN** the panel opens with zero filters
- **THEN** `#ocxFilterViewAddFilter` is auto-focused, `#ocxFilterViewOverlayReset` is disabled and the table shows `OCX_FILTER_VIEW.NO_FILTERS`

#### Scenario: Panel with filters
- **WHEN** the panel opens with filters
- **THEN** `#ocxFilterViewOverlayReset` is auto-focused and each row has a danger text trash button

### Requirement: Filter view Template and appearance - styles
`filter-view.component.scss` SHALL define: `.filter-view-focusable:focus { outline: 1px solid var(--primary-color); outline-offset: 2px; box-shadow: none; border-radius: var(--chip-border-radius); }`; `.ocx-filter-view-add-filter-chip { border: 1px dashed var(--primary-color, #3b82f6); border-radius: var(--chip-border-radius, 2rem); }`; `.ocx-filter-view-add-filter-chip-disabled { border-color: var(--surface-border, #d1d5db); color: var(--text-color-secondary, #9ca3af); }`; and a visually-hidden `.sr-only` (`position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); border:0`). Layout utilities (`flex`, `gap-2`, `text-2xl`, ...) come from the library's Tailwind stylesheet.

#### Scenario: Add chip appearance
- **WHEN** the add-filter chip is enabled
- **THEN** it has a dashed 1px primary-colour border, pill radius and `cursor-pointer`; when disabled the border uses `--surface-border` and text `--text-color-secondary`

### Requirement: Add filter dialog Template and appearance
`ocx-add-filter-dialog` (standalone; no styles file) SHALL render, only when `column()` is set, `div.flex.flex-col.gap-3` containing `label.block.text-sm.font-medium[for=ocxAddFilterColumnInput]` (`OCX_FILTER_VIEW.ADD_FILTER.DIALOG.COLUMN_LABEL`) and `p-select#ocxAddFilterColumnSelect` (`inputId="ocxAddFilterColumnInput"`, `[autofocus]="true"`, `optionLabel="label"`, `optionValue="value"`, `[showClear]="false"`, `appendTo="body"`, `class="w-full"`, placeholder `...DIALOG.COLUMN_PLACEHOLDER`, ariaLabel `...DIALOG.COLUMN_ARIA_LABEL`). When value options exist it SHALL add `label[for=ocxAddFilterValueInput]` (`...DIALOG.VALUE_LABEL`) and `p-multiSelect#ocxAddFilterValueSelect` (`inputId="ocxAddFilterValueInput"`, `autofocus="false"`, `[filter]="true"`, `filterBy="toFilterBy"`, `[showClear]="true"`, `[maxSelectedLabels]="3"`, `[resetFilterOnHide]="true"`, `appendTo="body"`, `[style]="{ 'min-width': '100%' }"`, `class="w-full"`, placeholder `...VALUE_PLACEHOLDER`, filter placeholder `...VALUE_FILTER_PLACEHOLDER`, empty message `...VALUE_EMPTY_MESSAGE`, `ariaFilterLabel` `...VALUE_FILTER_ARIA_LABEL`) with a `pTemplate="header"` of `div.p-3.border-b.border-surface` (`...VALUE_SELECTION_HEADER`). The surrounding dialog opened by the filter view SHALL use title `...DIALOG.TITLE`, buttons `...CONFIRM_BUTTON`/`...CANCEL_BUTTON`, `closeAriaLabel` `...DIALOG.ARIA_CLOSE_LABEL`, `width: 'min(350px, 90vw)'`, `onCloseFocus: 'initiator'`.

#### Scenario: Column chosen
- **WHEN** a column with selectable values is selected
- **THEN** the value label and `#ocxAddFilterValueSelect` multiselect appear below the column select

> Note (code-derived): all translation keys listed in this capability are present in `libs/angular-accelerator/assets/i18n/en.json` (and `de.json`) under `OCX_FILTER_VIEW`; `MANAGE_FILTERS_BUTTON.DISABLED_DETAIL` and `SELECTED_FILTERS_COUNT` exist there but are not used in the template.
