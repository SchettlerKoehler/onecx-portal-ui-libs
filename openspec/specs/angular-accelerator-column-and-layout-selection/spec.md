# angular-accelerator-column-and-layout-selection Specification

## Purpose
Covers the toolbar components of the interactive data view that choose the layout (`DataLayoutSelectionComponent`), a predefined column group (`ColumnGroupSelectionComponent`) and a custom set of columns plus action column settings (`CustomGroupColumnSelectorComponent`). They share state through `DataViewStateService`.

## Requirements

### Requirement: Layout selection options
`ocx-data-layout-selection` SHALL offer the layouts `list`, `grid` and `table` that are contained in `supportedViewLayouts` (default: none). The layout toggle MUST only be rendered when more than one layout is supported. The currently selected layout is `stateService.layout()`.

#### Scenario: Single layout
- **WHEN** `supportedViewLayouts` is `['table']`
- **THEN** no toggle is rendered

#### Scenario: Two layouts
- **WHEN** `supportedViewLayouts` is `['grid','table']`
- **THEN** two options are rendered with accessible labels

### Requirement: Layout selection events
On init the component SHALL emit `componentStateChanged({layout})`. When the user selects a layout it SHALL set the state layout and emit `dataViewLayoutChange` and `componentStateChanged`. The `layout` input writes to the state service.

#### Scenario: User selects list
- **WHEN** the user selects `list`
- **THEN** `stateService.layout()` is `list` and `dataViewLayoutChange` emits `list`

### Requirement: Column group options
`ocx-column-group-selection` SHALL list as options the distinct, non-empty union of all `predefinedGroupKeys` of the columns, `defaultGroupKey` and the active group key. The dropdown and its label MUST only render if at least one option exists. Options are translated; `placeholderKey` is the placeholder. `selectedGroupKey` and `columns` inputs write to the state service.

#### Scenario: Union of keys
- **WHEN** columns have group keys `A`, `B` and the default is `C`
- **THEN** options are `A`, `B`, `C`

#### Scenario: No keys
- **WHEN** no group keys exist
- **THEN** no dropdown is rendered

### Requirement: Column group change
When the user selects a group other than `customGroupKey`, the component SHALL set the active group key, and emit `groupSelectionChanged` with the groups' active columns (columns whose `predefinedGroupKeys` include the key) and the key, plus `componentStateChanged` with the same data. Selecting `customGroupKey` MUST be ignored.

#### Scenario: Select group
- **WHEN** the user selects `A`
- **THEN** `groupSelectionChanged` emits the columns of group `A` and key `A`

#### Scenario: Select custom key
- **WHEN** the selected value equals `customGroupKey`
- **THEN** nothing is emitted

### Requirement: Column group initial state
On init and when the active key equals `customGroupKey` the component SHALL emit `componentStateChanged` with `activeColumnGroupKey`. On init with another key it SHALL also emit `displayedColumns` for the key (the active key, else `defaultGroupKey`).

#### Scenario: Init with default
- **WHEN** no key is active and `defaultGroupKey` is `A`
- **THEN** state is emitted with the columns of group `A`

### Requirement: Column picker dialog
`ocx-custom-group-column-selector` SHALL render an open button; clicking it SHALL open a modal dialog containing a pick list of active columns (source) and inactive columns (target) and selectors for frozen action column (Yes/No) and action column position (left/right). On open it SHALL copy `displayedColumns` into the active list, put all other available columns into the inactive list, copy the action column settings from the state service, and clear any stale pick-list selection. Dialog title, button, label and aria-label texts SHALL come from the plain input or the corresponding `*Key` translation input, falling back to built-in translation keys. Dragging and resizing are controlled by `draggableColumnGroupSelectorDialog` and `resizableColumnGroupSelectorDialog` (both default `true`).

#### Scenario: Open dialog
- **WHEN** the user opens the dialog with columns A, B, C and displayed A
- **THEN** active contains A and inactive contains B and C

#### Scenario: Custom title
- **WHEN** `dialogTitle` is set
- **THEN** it overrides the translated default

> Note (code-derived): the save button aria-label evaluates `saveButtonAriaLabelKey()` twice and ignores `saveButtonAriaLabel()`.

### Requirement: Column order restore
With `restoreColumnGroupSelectorOrder` enabled, after transfers between the lists both lists SHALL be rebuilt in the order of the available columns (columns unknown to the available list are appended). With it disabled, the pick list's native order is kept. Reordering the active list MUST NOT restore the main order.

#### Scenario: Restore enabled
- **WHEN** column A (first in main order) is moved back to the active list that holds C
- **THEN** the active list is A, C

### Requirement: Save conditions
The save button SHALL be enabled only if at least one column is active and either the active columns (membership or order) or the action settings (frozen, position) differ from the committed values. Item highlighting alone is not a change. `onSaveClick` MUST do nothing when saving is not allowed.

#### Scenario: No columns
- **WHEN** the active list is empty
- **THEN** save is disabled

#### Scenario: Reorder only
- **WHEN** the active columns are reordered
- **THEN** save is enabled

### Requirement: Save behaviour
On save the dialog SHALL close. If columns changed it SHALL emit `columnSelectionChanged({activeColumns})` and `componentStateChanged({displayedColumns})`. If action settings changed it SHALL emit `actionColumnConfigChanged({frozenActionColumn, actionColumnPosition})` and `componentStateChanged` with columns, action config and `activeColumnGroupKey` = `customGroupKey`, then update the state service's frozen, position and active group key. Both checks SHALL be evaluated before any emission. Cancel closes the dialog without emission.

#### Scenario: Columns and settings changed
- **WHEN** both change and the user saves
- **THEN** both events are emitted

#### Scenario: Cancel
- **WHEN** the user cancels
- **THEN** the dialog closes and nothing is emitted

> Note (code-derived): when only columns change, the selector does not itself set the active group key in the state service; the host (`InteractiveDataViewComponent`) does.

### Requirement: Column picker state emission
The selector SHALL emit `componentStateChanged` on init and whenever the action column config in state or `displayedColumns` changes, with `actionColumnConfig` and `displayedColumns`.

#### Scenario: Frozen changes externally
- **WHEN** `actionColumnConfigFrozen` in the state service changes
- **THEN** a new state with the updated config is emitted

### Requirement: Template and appearance - layout selection buttons
`ocx-data-layout-selection` SHALL render `div.flex.flex-wrap.justify-between.items-center.py-1.gap-2` containing, only if `viewingLayouts().length > 1`, a `<p-selectbutton optionLabel="id" autofocus="false" [options]="viewingLayouts()" [ngModel]="selectedViewLayout()" [ariaLabel]="'OCX_DATA_LAYOUT_SELECTION.SELECT_BUTTON.ARIA_LABEL' | translate">` ("Select layout"). Each option item is `<i [class]="item.icon" [ocxTooltip]="item.tooltipKey | translate" tooltipPosition="top" aria-hidden="true">` plus `<span class="sr-only" id="<item.id>">item.labelKey | translate</span>`. Options: ids `ocx-data-layout-selection-list` (icon `OpenngIcons.LIST`), `-grid` (`OpenngIcons.TH_LARGE`), `-table` (`OpenngIcons.TABLE`); tooltip and label keys `OCX_DATA_LAYOUT_SELECTION.LAYOUT.LIST|GRID|TABLE` ("List", "Grid", "Table"). Styles: `::ng-deep { .p-buttonset .p-button { min-width: auto } .p-buttonset { display: flex } }` and an `.sr-only` rule (absolute, 1px, margin -1px, overflow hidden, `clip-path: inset(50%)`, `white-space: nowrap`, border-width 0).

#### Scenario: Single layout
- **WHEN** only one layout is supported
- **THEN** the wrapper `div` is rendered empty (no select button)

#### Scenario: Icon-only buttons
- **WHEN** three layouts are available
- **THEN** each button shows only an icon with a tooltip; the text label is visually hidden but exposed to screen readers

### Requirement: Template and appearance - column group dropdown
`ocx-column-group-selection` (`styleUrls`: `:host ::ng-deep .p-select { min-width: 12rem }`) SHALL render `<p-floatlabel variant="on">` containing, only if `allGroupKeys().length`, `<p-select class="p-inputwrapper-filled" inputId="columnGroupSelectionDropdown" id="columnGroupSelectionDropdownElement" autofocus="false" [options]="allGroupKeys()" [placeholder]="placeholderKey() | translate" [(ngModel)]="selectedGroupKey" [ariaLabel]="'OCX_CUSTOM_GROUP_COLUMN_SELECTOR.ARIA_LABEL' | translate">` (item and selectedItem templates show `item | translate`, empty when falsy) and a `<label for="columnGroupSelectionDropdown">` with `OCX_CUSTOM_GROUP_COLUMN_SELECTOR.DROPDOWN_LABEL` ("Column group"). With no group keys nothing but the empty float label wrapper is rendered. `class="p-inputwrapper-filled"` keeps the label floated even when empty.

#### Scenario: No groups
- **WHEN** `allGroupKeys()` is empty
- **THEN** neither the select nor its label is rendered

> Note (code-derived): the label's `for` is `columnGroupSelectionDropdown` (the select's `inputId`) while the element `id` is `columnGroupSelectionDropdownElement`.

### Requirement: Template and appearance - custom group column selector dialog
`ocx-custom-group-column-selector` SHALL render, in order: `<p-button id="customGroupColumnSelectorButton" type="button" icon="pi pi-cog" styleClass="p-button">` with `ocxTooltip` (top) = `openButtonTitle() || (openButtonTitleKey() | translate) || 'OCX_CUSTOM_GROUP_COLUMN_SELECTOR.OPEN_BUTTON_DETAIL'`, aria-label = `openButtonAriaLabelKey` translated, else `openButtonAriaLabel()`, else `openButtonTitle()`, else `OPEN_BUTTON_DETAIL` ("Open custom group selection dialog"), `aria-controls="customGroupColumnSelectorDialog"` and `aria-expanded="true"` only while `visible()`; and `<p-dialog id="customGroupColumnSelectorDialog" [modal]="true" [style]="{ width: '70%' }" [(visible)]="visible" [draggable]="draggableColumnGroupSelectorDialog()" [resizable]="resizableColumnGroupSelectorDialog()" [closeAriaLabel]="OCX_CUSTOM_GROUP_COLUMN_SELECTOR.ARIA_LABELS.CLOSE">`.

Dialog header: `span.text-xl.font-bold` with `id = dialog.computedAriaLabelledBy()` and text `dialogTitle() || dialogTitleKey()-translated || 'OCX_CUSTOM_GROUP_COLUMN_SELECTOR.DIALOG_TITLE'` ("Custom group column selection"). Body: `<p-pickList [dragdrop]="true" [responsive]="false" [sourceStyle]="{ height: '300px' }" [targetStyle]="{ height: '300px' }">` with source = `displayedColumnsModel()` (header/aria-label `activeColumnsLabel()` -> key -> `ACTIVE_COLUMNS_LABEL` "Active columns"), target = `hiddenColumnsModel()` (`INACTIVE_COLUMNS_LABEL` "Inactive columns"), item template `<div>{{ item.nameKey | translate }}</div>`, and button aria-labels `ARIA_LABELS.UP|TOP|DOWN|BOTTOM|RIGHT|ALL_RIGHT|LEFT|ALL_LEFT` ("Move column up", "Move column to the top", "Move column down", "Move column to the bottom", "Set column as inactive", "Set all columns as inactive", "Set column as active", "Set all columns as active"). Move events call `syncColumnModels(restoreColumnGroupSelectorOrder())`, source reorder calls `syncColumnModels(false)`.

Below the list: `div.pt-4` with `p.text-xl.font-bold` `CONFIGURE_ACTION_COLUMN.TITLE` ("Configure action column") and `div.flex.gap-6.px-3` with two blocks, each `p.mb-1` label + `<p-selectbutton optionLabel="label" optionValue="value" autofocus="false" [allowEmpty]="false">`: (a) `p#frozenActionColumnLabel` `CONFIGURE_ACTION_COLUMN.FREEZE` ("Always show action column"), `#frozenActionColumn`, `name="frozen-action-column-select-button"`, options `YES` (true) / `NO` (false); (b) `p#actionColumnPositionLabel` `CONFIGURE_ACTION_COLUMN.POSITION` ("Position of action column"), `#actionColumnPosition`, `name="action-column-position-select-button"`, options `LEFT` ("Left") / `RIGHT` ("Right"); both with `ariaLabelledBy` pointing to their label id.

Footer: `p-button#cancelButton` (label `cancelButtonLabel()` -> key -> `CANCEL_BUTTON_LABEL` "Cancel", `styleClass="p-button"`) and `p-button#saveButton` (label `saveButtonLabel()` -> key -> `SAVE_BUTTON_LABEL` "Save", `[disabled]="!canSave()"`).

#### Scenario: Dialog open
- **WHEN** the cog button is clicked
- **THEN** a modal dialog 70% wide opens with two 300px-high lists, the action column controls and Cancel/Save buttons; the cog button has `aria-expanded="true"`

#### Scenario: Save disabled
- **WHEN** `canSave()` is false
- **THEN** `#saveButton` is disabled

> Note (code-derived): the Save button `ariaLabel` is `saveButtonAriaLabelKey() || (saveButtonAriaLabelKey() | translate) || 'OCX_CUSTOM_GROUP_COLUMN_SELECTOR.SAVE_BUTTON_ARIA_LABEL'`, i.e. a provided key is used untranslated (looks like a copy bug); Cancel uses `cancelButtonLabel() || CANCEL_BUTTON_ARIA_LABEL` (the label input, not a key).

### Requirement: Template and appearance - column selector styles
`custom-group-column-selector.component.scss` SHALL define global (`::ng-deep`) rules: `.p-buttonset .p-button { min-width: auto }`, `.p-buttonset { display: flex }`, `.p-picklist-item.cdk-drag-preview { z-index: 2000 !important }` (drag ghost stays above the dialog) and, for the three `.p-picklist > div.p-picklist-controls.p-picklist-{transfer,source,target}-controls > button.p-button-secondary` groups, `background-color: var(--p-primary-color); color: var(--p-primary-contrast-color)` with `:not(:disabled):hover` `background-color: var(--p-primary-hover-color)`; plus the non-deep `.p-button { height: 100% }`.

#### Scenario: Picklist controls colour
- **WHEN** the dialog is open
- **THEN** picklist control buttons use the primary colour and primary contrast text, and the primary hover colour on hover (when enabled)

> Note (code-derived): the `::ng-deep` block is not wrapped in `:host`, so these rules leak globally once the component is loaded.
