# angular-accelerator-data-models-and-utils Specification

## Purpose
Public data models and helper functions shared by the data table, data list grid and data view: column and row typings, enums, action definitions, filter helpers, the abstract `DataOperationStrategy`, the action router and object/template helpers. Used by applications to configure these components and by library code.

## Requirements

### Requirement: Column definition model
`DataTableColumn` SHALL describe a column with required `id`, `nameKey` (translation key of the header) and `columnType` (`ColumnType`), and optional `tooltipKey`, `tooltip`, `sortable`, `filterable`, `filterType` (`FilterType`), `predefinedGroupKeys` (`string[]`) and `dateFormat`. `ColumnType` SHALL provide the values `STRING`, `NUMBER`, `DATE`, `RELATIVE_DATE`, `TRANSLATION_KEY`. Column values MUST be looked up on a row by `id`, where dots in the id address nested properties.

#### Scenario: Nested column id
- **WHEN** a column has id `address.city` and the row is `{ address: { city: 'X' } }`
- **THEN** the displayed value is `X`

### Requirement: Sort direction enum
`DataSortDirection` SHALL be a constant enum with the string values `ASCENDING`, `DESCENDING` and `NONE`.

#### Scenario: Values
- **WHEN** a consumer reads `DataSortDirection.NONE`
- **THEN** the value is the string `'NONE'`

### Requirement: Filter model
`FilterType` SHALL provide the values `endsWith`, `startsWith`, `contains`, `notContains`, `equals`, `notEquals`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `isEmpty`, `isNotEmpty`. A `FilterObject` has `columnId` and optional `filterType`; a `Filter` additionally has `value`. `ColumnFilterDataSelectOptions` has a boolean `reverse`.

> Note (code-derived): `FilterType` has `IS_EMPTY`/`IS_NOT_EMPTY` mapped to `'isEmpty'`/`'isNotEmpty'`, but the table and list grid (`DataSortBase`) only evaluate unset/`EQUALS` and the `IS_NOT_EMPTY` type; other types are treated as always matching in client-side filtering.

#### Scenario: Filter object
- **WHEN** a filter `{ columnId: 'status', value: 'open', filterType: FilterType.EQUALS }` is created
- **THEN** it matches the `Filter` type

### Requirement: Row and layout models
`Row` SHALL be an object with `id: string | number` and arbitrary other keys; `ListGridData` the same with optional `imagePath`; `RowListGridData` is their intersection (`ListGridData & Row`). `ViewLayout` SHALL be the union `'grid' | 'list' | 'table'`; `InteractiveExpandedRows` is `Row[] | string[] | number[]`. `DataTableRowGroupingConfig` has `columnId` and optional `groupKeyPath`; `DataTableGroupCellContext` has `groupKey`, `label`, `memberCount`, `rowObject`, `column`.

#### Scenario: Expanded rows by id
- **WHEN** `expandedRows` is `[1, 2]`
- **THEN** the rows with ids 1 and 2 are considered expanded

### Requirement: Data action model
`DataAction` SHALL define a per-row action with required `permission` (string or string array, all required) and optional `id`, `labelKey`, `icon`, `classes`, `disabled`, `actionVisibleField`, `actionEnabledField`, `showAsOverflow`, `callback(data)` and `routerLink`. `RouterLink` is a string, a function returning a string or a `Promise<string>`, or a `Promise<string>`.

#### Scenario: Permission array
- **WHEN** `permission` is `['A', 'B']`
- **THEN** the action is only usable by users holding both `A` and `B`

### Requirement: Action router
`resolveRouterLink(routerLink)` SHALL return the link as string: a string unchanged, a function result (awaited if it is a promise), or the awaited promise. `handleAction(router, action, data?)` SHALL, for an action (`DataAction` or page-header `Action`): navigate with `router.navigate([resolvedLink])` if `routerLink` is set (taking precedence); otherwise call `callback(data)` if it is a function (DataAction); otherwise call `actionCallback()` if it is a function (page-header Action); otherwise do nothing. `handleActionSync` SHALL start `handleAction` without returning its promise.

#### Scenario: Router link wins
- **WHEN** an action has both `routerLink` and `callback`
- **THEN** the router navigates and the callback is not called

#### Scenario: Async link
- **WHEN** `routerLink` is a function returning a `Promise<string>`
- **THEN** navigation happens with the resolved string

#### Scenario: Nothing to do
- **WHEN** an action has neither a `routerLink` nor a callback function
- **THEN** nothing happens

### Requirement: ObjectUtils field resolution
`ObjectUtils.resolveFieldData(data, field)` SHALL return `data[field]` for a field without a dot, walk the properties of a dotted path (returning `null` as soon as an intermediate value is `null`/`undefined`), call `field(data)` if `field` is a function, and return `null` if `data` or `field` is falsy. `ObjectUtils.isFunction` reports whether a value is callable.

#### Scenario: Missing intermediate
- **WHEN** resolving `a.b.c` on `{ a: null }`
- **THEN** the result is `null`

#### Scenario: Function field
- **WHEN** `field` is a function
- **THEN** its result for `data` is returned

### Requirement: flattenObject
`flattenObject(obj)` SHALL return a new object in which nested plain objects are flattened into dot-joined keys (`{ a: { b: 1 } }` becomes `{ 'a.b': 1 }`), while arrays, `Date` values and non-object values are kept as is. Only own properties are considered. `null` values are kept as values.

#### Scenario: Nested object
- **WHEN** flattening `{ a: { b: 1 }, d: new Date(), l: [1] }`
- **THEN** the result has keys `a.b`, `d` (the same Date) and `l` (the same array)

### Requirement: Filter option helpers
The following functions of `filter.utils` SHALL behave as stated. `limit(filters, amount, { reverse })` returns the first `amount` filters, or, when `reverse`, the last `amount` filters in reversed order. `isSupportedFilterType(type)` is true for `undefined`, `EQUALS` and `IS_NOT_EMPTY`. `getFilterableColumns(columns)` returns columns that are `filterable` and have a supported filter type. `getExistingFilterValues(column, filters)` returns the values of the filters of that column whose filter type (default `EQUALS`) equals the column's filter type (default `EQUALS`). `getFilterOptionValues(column, data, filters)` returns the distinct non-null, non-undefined, non-empty-string cell values of the column in first-appearance order (compared by string representation), followed by existing filter values not already present. `formatFilterValueLabel(column, value, locale)` formats date columns with `dateFormat` (default `medium`) and stringifies other values. `buildColumnFilters(column, values)` returns one `{ columnId, value, filterType }` per value with `filterType` defaulting to `EQUALS`.

#### Scenario: Options with leftover filter
- **WHEN** data has values `a, b, a` and an existing filter has value `c`
- **THEN** the options are `a, b, c`

#### Scenario: String comparison
- **WHEN** the data contains `1` (number) and an existing filter has value `'1'`
- **THEN** only one option for `1` results

### Requirement: DataOperationStrategy base class
`DataOperationStrategy` SHALL be an abstract base class for type-specific filter/compare logic. Its operations `endsWith`, `startsWith`, `contains`, `notContains`, `equals`, `notEquals`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `isEmpty`, `isNotEmpty` and `compare` MUST by default log an error that the method is not implemented and return `true` (`0` for `compare`); subclasses override them.

`filter(hayStack, filter, columns)` SHALL return the hay stack unchanged (with a warning) if the filter has no `filterType` or its `columnId` matches no column; otherwise it MUST keep the items for which the operation named by `filterType` returns true for the item's value (resolved by `columnId` via `ObjectUtils.resolveFieldData`) and the filter `value`. `filterOptions(hayStack, filterObject, columns)` SHALL map each item to its value and, if the column exists, remove duplicates using `compare(...) === 0` (keeping first occurrences); if the column does not exist it MUST return all values (with a warning). `mapHaystackItemToValue(item, filter)` resolves the item's field by `filter.columnId`.

#### Scenario: Missing filter type
- **WHEN** `filter` is called with a filter without `filterType`
- **THEN** all items are returned

#### Scenario: Unique options
- **WHEN** a subclass compares numbers and the hay stack values are `1, 2, 1`
- **THEN** `filterOptions` returns `1, 2`

#### Scenario: Unimplemented operation
- **WHEN** a subclass does not override `equals` and `filter` is called with `equals`
- **THEN** an error is logged and all items pass

### Requirement: Template lookup helper
`findTemplate(templates, names)` SHALL return the first `PrimeTemplate` found by iterating the `names` in order and matching `template.name`, or `undefined` if none matches.

#### Scenario: Priority by name order
- **WHEN** templates named `b` and `a` exist and `names` is `['a', 'b']`
- **THEN** the template named `a` is returned
