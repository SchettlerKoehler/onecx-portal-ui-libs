# angular-testing-optimus-harnesses Specification

## Purpose
`@onecx/angular-testing` provides CDK component harnesses for the PrimeNG-style Optimus UI (`@openng/optimus-ui`) components (`p-*` elements), allowing OneCX tests to interact with them without relying on DOM details.

## Requirements

### Requirement: OptimusIcon type
The library SHALL export the type `OptimusIcon`, the union of the values of `OpenngIcons` from `@openng/optimus-ui/api`.

#### Scenario: Typed icon
- **WHEN** a consumer types an icon as `OptimusIcon`
- **THEN** only icon values defined by `OpenngIcons` are accepted

### Requirement: PButtonHarness
`PButtonHarness` (host `p-button`) SHALL provide `with({ id, name, label, icon })`, `getId()`, `getName()`, `getLabel()` (text of the `p-button-label` span or null), `getIcon()`, `getBadgeValue()`, `getLoadingIcon()` (element `.p-button-loading-icon` or null), the locators `getLabelSpan`, `getIconSpan`, `getBadge` and `click()` (clicks the inner `button`).

`getIcon()` SHALL return the host `icon` attribute when present, else the first `pi pi-<name>` pair found in the class attribute of the `p-button-icon` span, else `null`. `getBadgeValue()` SHALL return the host `badge` attribute, else the trimmed text of `p-badge`, else null.

#### Scenario: Static icon attribute
- **WHEN** the host has `icon="pi pi-check"`
- **THEN** `getIcon()` returns `pi pi-check`

#### Scenario: Dynamic icon class
- **WHEN** the icon span has classes `p-button-icon pi pi-check`
- **THEN** `getIcon()` returns `pi pi-check`

#### Scenario: No icon
- **WHEN** neither attribute nor icon span class exist
- **THEN** `getIcon()` returns `null`

### Requirement: PButtonDirectiveHarness
`PButtonDirectiveHarness` (host `button[pButton]`) SHALL provide `with({ id })`, `getId()`, `click()`, `getLabel()` (host text), `getDisabled()`, `getIcon()` and `getSeverity()`. `getIcon()` SHALL return `pi <icon-class>` for the first class beginning with `pi-` on the `.p-button-icon` element, or `null` when there is no such element or class. `getSeverity()` SHALL map the host class `p-button-<severity>` to one of `primary`, `secondary`, `success`, `info`, `warn`, `help`, `danger`, `contrast`, and return `undefined` when none is present. The type `PButtonSeverity` SHALL be exported.

#### Scenario: Severity
- **WHEN** the host has class `p-button-danger`
- **THEN** `getSeverity()` returns `'danger'`

#### Scenario: No severity class
- **WHEN** none of the severity classes is present
- **THEN** `getSeverity()` returns `undefined`

### Requirement: PCheckboxHarness and PTableCheckboxHarness
`PCheckboxHarness` (host `p-checkbox`) SHALL provide `with({ inputid })` (matching the host attribute `inputId`), `getId()`, `isChecked()` (the `checked` property of the inner input), `isHidden()` (true when the `hidden` attribute is set), `click()` (clicks the `p-checkbox-box` div if present) and `getCheckBoxDiv`. `PTableCheckboxHarness` (host `p-tablecheckbox`) SHALL provide `with({ isSelected })`, `isChecked()` (true when exactly one `.p-checkbox-box .p-icon` exists) and `checkBox()` (clicks `.p-checkbox-input`).

#### Scenario: Filter selected table checkboxes
- **WHEN** `PTableCheckboxHarness.with({ isSelected: true })` is used
- **THEN** only checked table checkboxes match

### Requirement: PChipHarness
`PChipHarness` (host `p-chip`) SHALL provide `getContent()` (text), `click()`, `clickRemove()` (clicks `.p-chip-remove-icon` if present) and the locator `getRemoveButton`.

#### Scenario: Remove chip
- **WHEN** `clickRemove()` is called on a removable chip
- **THEN** the remove icon is clicked; without a remove icon nothing happens

### Requirement: PDialogHarness
`PDialogHarness` (host `p-dialog`, a content container) SHALL provide `getMaskElement`, `getHeader`, `getFooter` locators, `getDialogTitle()` (header text), `isVisible()` (true when the `p-dialog-mask` exists), `getAccessibleName()` and `getAriaDescribedByText()`, and `close()`. `getAccessibleName()` SHALL return the `aria-label` of the `[role="dialog"]` element, else the whitespace-joined texts of the elements (looked up from the document root by id) referenced by `aria-labelledby`, else `undefined`. `getAriaDescribedByText()` SHALL return the text of the element referenced by `aria-describedby`, or `undefined`. `close()` SHALL send the Escape key to the host when visible, otherwise log a warning that the dialog is not open.

#### Scenario: Labelled by
- **WHEN** the dialog has `aria-labelledby="a b"`
- **THEN** the accessible name is the text of both referenced elements joined by a space

#### Scenario: Close closed dialog
- **WHEN** `close()` is called while no mask exists
- **THEN** a console warning is emitted and no key is sent

> Note (code-derived): the warning text refers to `CustomGroupColumnSelectionDialog`, a leftover from another component.

### Requirement: PSelectHarness
`PSelectHarness` (host `p-select`, content container) SHALL provide `with({ id, inputId })`, `getId()`, `getInputId()`, `getAriaLabel()` and `getDefaultText()` (from `span.p-placeholder`), `getSelectedText()` (from `span.p-select-label`), `isOpen()` (host class `p-select-open`), `open()`, `close()`, `getSelectItems()`, `getSelectItem(text)`, `selectedSelectItem(position)`, `selectedSelectItemText(position)`, `hasClearOption()` and `clear()`. `open()`/`close()` SHALL click the inner `div` when state differs and otherwise log a warning (`Unable to open p-select, because it is already open.` / `...not open.`). `getSelectItems()` SHALL open the select and return `ListItemHarness` instances from the `.p-select-list` overlay. `clear()` SHALL click `.p-select-clear-icon` when the select is clearable (`p-select-clearable` on the inner div), otherwise log a warning.

#### Scenario: Open an already open select
- **WHEN** `open()` is called while `p-select-open` is set
- **THEN** a warning is logged and nothing is clicked

#### Scenario: Read selected items
- **WHEN** `selectedSelectItem(0)` is called
- **THEN** the first list item with `aria-selected="true"` is returned

> Note (code-derived): `getSelectItem(text)` searches inside the host, not in the overlay, so it finds nothing for items rendered in the overlay; `getSelectItems()` opens the select without closing it.

### Requirement: PMultiSelectHarness and PMultiSelectListItemHarness
`PMultiSelectHarness` (host `p-multiselect`) SHALL provide `with({ id, class })`, `getId()`, `getByClass(c)`, `isOpen()` (overlay `.p-multiselect-overlay` exists in the document), `open()`, `close()`, `getAllOptions()`, `isHighlighted(item)` (attribute `data-p-highlight` equals `true`), `getSelectedOptions()` and `getHarnessLoaderForPMultiSelectPanel()`. `getAllOptions()` SHALL open the panel when closed and throw `Unable to access multiselect panel after opening.` when the panel cannot be found. `open()`/`close()` SHALL click the inner `div` or log a warning when already in the target state. `getSelectedOptions()` SHALL return the texts of highlighted options. `PMultiSelectListItemHarness` (host `li`) SHALL provide `getTestElement()`, `click()` and `getText()`.

#### Scenario: Selected options
- **WHEN** two options have `data-p-highlight="true"`
- **THEN** `getSelectedOptions()` returns their texts

### Requirement: PMenuHarness, PMenuItemHarness, PMenuBarHarness
`PMenuHarness` (host `p-menu`) SHALL provide `isOpen()` (overlay `.p-menu-overlay` exists), `getAllMenuItems()` and `getMenuItem(text)`. When the menu is closed these SHALL log `Cannot get menu items because menu is closed.` and return `[]` and `undefined` respectively. `PMenuItemHarness` (host `li.p-menuitem`) SHALL provide `getText()`, `hasIcon(icon)` (class of `.p-menuitem-icon` contains icon), `click()`, `getLink()` (href), `getChildren` and `getAnchor`. `PMenuBarHarness` (host `p-menubar`) SHALL provide `getAllMenuItems` returning all `PMenuItemHarness` instances.

#### Scenario: Closed menu
- **WHEN** `getAllMenuItems()` is called on a closed `p-menu`
- **THEN** a warning is logged and `[]` is returned

### Requirement: PPanelMenuHarness and PanelMenuItemHarness
`PPanelMenuHarness` (host `p-panelmenu`) SHALL provide `getAllPanels` returning `PanelMenuItemHarness` instances (host `div.p-panelmenu-panel`), which provide `getText()`, `hasIcon(icon)`, `click()`, `getLink()`, `getChildren` (`PMenuItemHarness`) and `getAnchor`.

#### Scenario: Panel text
- **WHEN** `getText()` is called on a panel
- **THEN** the text of its first anchor is returned

### Requirement: PAccordionHarness and PAccordionTabHarness
`PAccordionHarness` (host `p-accordion`) SHALL provide `getAllAccordionTabs`. `PAccordionTabHarness` (host `p-accordiontab`) SHALL provide `getButton` (`a.p-accordion-header-link`) and `expand()` which clicks the header link.

#### Scenario: Expand a tab
- **WHEN** `expand()` is called
- **THEN** the header link is clicked (it does not check the current state, so it toggles)

### Requirement: PBreadcrumbHarness
`PBreadcrumbHarness` (host `p-breadcrumb`) SHALL provide `getBreadcrumbItems` (all `ListItemHarness`) and `getBreadcrumbItem(text)` returning the item with the given text or null.

#### Scenario: Missing item
- **WHEN** no breadcrumb item has the given text
- **THEN** `null` is returned

### Requirement: PChartHarness
`PChartHarness` (host `p-chart`) SHALL provide `getType()` and `getOptions()` reading the attributes `data-automation-type` and `data-automation-options`.

#### Scenario: Chart type
- **WHEN** the chart host has `data-automation-type="bar"`
- **THEN** `getType()` returns `bar`

### Requirement: PPaginatorHarness
`PPaginatorHarness` (host `p-paginator`) SHALL provide `getCurrentPageReport`, `getCurrentPageReportText()`, `getRowsPerPageOptions` (a `PSelectHarness`), `getNextPageButton` (button with class `p-paginator-next`) and `clickNextPage()`.

#### Scenario: Report text
- **WHEN** the paginator shows a page report
- **THEN** `getCurrentPageReportText()` returns the text of the `p-paginator-current` span

> Note (code-derived): `clickNextPage()` does not await the click.

### Requirement: PPasswordHarness
`PPasswordHarness` (host `p-password`) SHALL provide `with({ id })`, `getId()`, `getValue()`, `setValue(value)` (delegating to the inner `InputHarness`) and attribute getters `getPromptLabel()`, `getWeakLabel()`, `getMediumLabel()`, `getStrongLabel()` (attributes `promptlabel`, `weaklabel`, `mediumlabel`, `stronglabel`).

#### Scenario: Set password
- **WHEN** `setValue('secret')` is called
- **THEN** the inner input receives the value

### Requirement: PPicklistHarness
`PPicklistHarness` (host `p-picklist`) SHALL provide `getSourceControlsButtons()`, `getTransferControlsButtons()`, `getTargetControlsButtons()` (buttons of the controls with classes `p-picklist-source-controls`, `p-picklist-transfer-controls`, `p-picklist-target-controls`), `getSourceHeader()`, `getTargetHeader()` (text of the `p-picklist-header`) and `getSourceListItems()`, `getTargetListItems()` (`ListItemHarness`). Helper harnesses `PPicklistControlsButtonsHarness` and `PPicklistListWrapperHarness` with `with({ class })` SHALL be exported.

#### Scenario: Source items
- **WHEN** `getSourceListItems()` is called
- **THEN** list items of the source list container are returned

### Requirement: PSelectButtonHarness and PToggleButtonHarness
`PSelectButtonHarness` (host `p-selectbutton`) SHALL provide `getAllButtons` (all `p-togglebutton` elements). `PToggleButtonHarness` (host `p-togglebutton`) SHALL provide `with({ onLabel, checked })`, `getOnLabel()` (`onlabel` attribute, else id of the `.sr-only` element, else null), `isChecked()` (class `p-togglebutton-checked`) and `click()`.

#### Scenario: Filter checked toggle
- **WHEN** `PToggleButtonHarness.with({ checked: true })` is used
- **THEN** only toggle buttons with `p-togglebutton-checked` match
