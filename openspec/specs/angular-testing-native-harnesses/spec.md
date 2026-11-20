# angular-testing-native-harnesses Specification

## Purpose
`@onecx/angular-testing` provides Angular CDK component harnesses for plain HTML elements (button, div, input, li, a, p, span, th, tr) used when testing OneCX components and building the PrimeNG/Optimus harnesses. It also re-exports `@angular/cdk/testing` and `@angular/cdk/testing/testbed`.

## Requirements

### Requirement: CDK testing re-exports
The library SHALL re-export everything from `@angular/cdk/testing` and `@angular/cdk/testing/testbed`, so consumers can import `TestbedHarnessEnvironment`, `HarnessLoader`, `TestKey` etc. from `@onecx/angular-testing`.

#### Scenario: Import CDK symbols
- **WHEN** a test imports `TestbedHarnessEnvironment` from `@onecx/angular-testing`
- **THEN** it is the CDK testbed environment

### Requirement: ButtonHarness
`ButtonHarness` (host selector `button`) SHALL provide `ButtonHarness.with({ id, icon, class })` filters, `getId()`, `getIcon()` (value of the `icon` attribute), `getByClass(c)` (returns `c` when the host has that class, else an empty string), `isDisabled()` and `click()`. `click()` SHALL click the host only when not disabled; for a disabled button it SHALL log a console warning `Button cannot be clicked, because it is disabled!` and not click. It SHALL then wait for tasks outside Angular.

#### Scenario: Click enabled button
- **WHEN** `click()` is called on an enabled button
- **THEN** the host is clicked and the harness waits for outside-Angular tasks

#### Scenario: Click disabled button
- **WHEN** `click()` is called on a disabled button
- **THEN** a warning is logged and no click happens

#### Scenario: Filter by class
- **WHEN** a harness is requested with `ButtonHarness.with({ class: 'sortButton' })`
- **THEN** only buttons having that class match

### Requirement: DivHarness
`DivHarness` (host `div`) SHALL provide `with({ id, class })`, `getId()`, `getByClass(c)`, `checkHasClass(value)`, `getText()`, `getClassList()` (the `class` attribute split on spaces, trimmed; empty array when no class attribute) and `click()`.

#### Scenario: Class list
- **WHEN** the div has `class="a b"`
- **THEN** `getClassList()` returns `['a', 'b']`; without a class attribute it returns `[]`

### Requirement: PHarness
`PHarness` (host `p`) SHALL provide `with({ class, id })`, `getByClass(c)`, `hasId(id)` (returns `id` when the host matches `#<id>`, else an empty string), `checkHasClass`, `getText` and `getClassList` with the same semantics as `DivHarness`.

#### Scenario: Filter by id
- **WHEN** `PHarness.with({ id: 'x' })` is used
- **THEN** paragraphs with id `x` match

### Requirement: SpanHarness
`SpanHarness` (host `span`) SHALL provide `with({ id, class })`, the static `without({ classes })` predicate matching spans having NONE of the listed classes, `getId()`, `getByClass(c)`, `checkHasClass(value)`, `hasAnyClass(classes)` (returns the STRING `'true'` or `'false'`) and `getText()`.

#### Scenario: Exclude by classes
- **WHEN** `SpanHarness.without({ classes: ['a', 'b'] })` is used
- **THEN** only spans having neither `a` nor `b` match

> Note (code-derived): `hasAnyClass` returns a string, not a boolean; `SpanHarnessFilters.classes` is only honoured by `without`.

### Requirement: InputHarness
`InputHarness` (host `input`) SHALL provide `with({ id })`, `getId()`, `getValue()`, `getChecked()`, `getTestElement()` and `click()`. `setValue(value)` SHALL, for a `Date`, set the input value to the locale date (2-digit month/day, numeric year) and time (2-digit hour/minute) string; for a string it SHALL clear the input, send the keys when the value is non-empty and then set the input value.

#### Scenario: Set text value
- **WHEN** `setValue('abc')` is called
- **THEN** the input is cleared, keys are sent and its value is `abc`

#### Scenario: Set empty value
- **WHEN** `setValue('')` is called
- **THEN** the input is cleared and no keys are sent

### Requirement: ListItemHarness
`ListItemHarness` (host `li`) SHALL provide `with({ text })`, `getText()`, `getLinkAriaLabel()` (aria-label of the nested `a`, or null), `isSelected()` (true when `aria-selected` is `'true'`) and `selectItem()` (click).

#### Scenario: Selected state
- **WHEN** the `li` has `aria-selected="true"`
- **THEN** `isSelected()` resolves `true`, otherwise `false`

> Note (code-derived): when no nested link exists `getLinkAriaLabel()` resolves to `null` via optional chaining.

### Requirement: MenuItemHarness and MenuItemWithIconHarness
`MenuItemHarness` (host selector `li>div>a`) SHALL provide `with({ text })`, `getText()`, `selectItem()` and `getLink()` (the `href` attribute). `MenuItemWithIconHarness` SHALL extend it with `hasIcon(icon)`, which checks whether the class attribute of the nested `<i>` contains the given string and returns `undefined` when there is no `<i>`.

#### Scenario: Icon check
- **WHEN** the item contains `<i class="pi pi-home">`
- **THEN** `hasIcon('pi-home')` is `true`

### Requirement: TableHeaderColumnHarness
`TableHeaderColumnHarness` (host `th`) SHALL provide `getText()`, `getSortButton` (a `ButtonHarness` with class `sortButton`) and `getFilterMultiSelect` (a `PMultiSelectHarness` with class `filterMultiSelect`).

#### Scenario: Sort button
- **WHEN** the header contains a button with class `sortButton`
- **THEN** `getSortButton()` resolves that button harness

### Requirement: TableRowHarness
`TableRowHarness` (host `tbody > tr`) SHALL provide `getAllActionButtons` (all `button` elements), optional `getViewButton`, `getEditButton`, `getDeleteButton` (buttons with classes `viewTableRowButton`, `editTableRowButton`, `deleteTableRowButton`) and `getData()`. `getData()` SHALL first wait for deferred views to be rendered and then return the texts of all `td` cells except those with class `actions`.

#### Scenario: Row data without actions
- **WHEN** a row has cells `A`, `B` and a `td.actions`
- **THEN** `getData()` resolves `['A', 'B']`
