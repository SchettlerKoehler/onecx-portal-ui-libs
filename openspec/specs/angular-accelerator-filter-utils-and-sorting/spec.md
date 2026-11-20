# angular-accelerator-filter-utils-and-sorting Specification

## Purpose
Defines the `Filter` model, helper functions in `filter.utils` (exported) and the internal `DataSortBase` logic used by data table and data list grid for client-side filtering, sorting and translation-key resolution.

## Requirements

### Requirement: Filter model
A `Filter` SHALL consist of `columnId`, `value` and an optional `filterType`. `FilterType` SHALL define `endsWith`, `startsWith`, `contains`, `notContains`, `equals`, `notEquals`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `isEmpty` and `isNotEmpty`.

#### Scenario: Optional type
- **WHEN** a filter has no `filterType`
- **THEN** it is treated as `equals` by filter-view helpers

### Requirement: Limiting filters
`limit(filters, amount, {reverse})` SHALL return the first `amount` filters, or, with `reverse`, the last `amount` filters in reversed order.

#### Scenario: Reverse
- **WHEN** `limit([a,b,c,d], 3, {reverse:true})` is called
- **THEN** the result is `[d,c,b]`

### Requirement: Filterable columns
`isSupportedFilterType` SHALL be true only for undefined, `equals` and `isNotEmpty`. `getFilterableColumns` SHALL return columns with `filterable` set and a supported filter type.

#### Scenario: Unsupported type
- **WHEN** a filterable column has filter type `contains`
- **THEN** it is not returned

### Requirement: Existing filter values
`getExistingFilterValues(column, filters)` SHALL return the values of filters for the column whose type (default `equals`) equals the column's filter type (default `equals`).

#### Scenario: Other type ignored
- **WHEN** a filter for the column has another filter type
- **THEN** its value is not returned

### Requirement: Filter option values
`getFilterOptionValues(column, data, filters)` SHALL return distinct non-null, non-undefined, non-empty-string cell values in first-appearance order (compared by string representation), followed by existing filter values absent from the data.

#### Scenario: Missing value kept
- **WHEN** an existing filter value does not occur in the rows
- **THEN** it is appended

### Requirement: Value labels and filter building
`formatFilterValueLabel` SHALL format `DATE` columns with the column `dateFormat` (default `medium`) in the given locale and otherwise return `String(value)`. `buildColumnFilters` SHALL create one filter per value with the column's id and filter type (default `equals`).

#### Scenario: Build
- **WHEN** values `[1,2]` are built for column `c` without filter type
- **THEN** two `equals` filters for `c` are returned

### Requirement: Client-side filtering
`DataSortBase.filterItems` SHALL return items unchanged when client-side filtering is disabled. Otherwise an item MUST satisfy every filtered column (AND across columns) and any filter of that column (OR within a column). `equals`/unset compares the string form of the cell with the string of the filter value; `isNotEmpty` with truthy value requires a non-empty cell, with falsy value requires an empty cell; other filter types always match.

#### Scenario: OR within column
- **WHEN** two `equals` filters exist for column `a`
- **THEN** items matching either value are kept

#### Scenario: Unsupported type
- **WHEN** a filter has type `contains`
- **THEN** it matches every item

### Requirement: Client-side sorting
`DataSortBase.sortItems` SHALL return items unchanged if client-side sorting is disabled or the sort column is empty; otherwise it SHALL return a sorted copy. `NONE` direction keeps the order, ascending sorts ascending and descending reverses. Strings are compared with `localeCompare` using locales `[locale,'en','de']` and numeric ordering; null values sort before non-null ones. Translation-key columns sort by translated values; date columns by date value.

#### Scenario: Null first
- **WHEN** sorting ascending with a null value
- **THEN** the null item comes first

#### Scenario: Numeric strings
- **WHEN** strings `item2` and `item10` are sorted ascending
- **THEN** `item2` comes first

> Note (code-derived): `sortItems` builds its value lookup from the string form of the cell, while `createCompareFunction` looks values up by the raw cell value, so non-string values rely on key coercion.

### Requirement: Translation of items
`translateItems` SHALL, if client-side filtering or sorting is enabled and there are non-empty values in `TRANSLATION_KEY` columns, return a per-column map from key to translation obtained from `TranslateService`. Otherwise it SHALL return an empty object.

#### Scenario: Not needed
- **WHEN** both client-side flags are false
- **THEN** `{}` is returned without translating

### Requirement: Flattening
`flattenItems` SHALL return each item flattened to a single-level object.

#### Scenario: Nested item
- **WHEN** an item has a nested object
- **THEN** it is flattened with dotted keys

> Note (code-derived): `DataSortBase` is not exported from the library's `index.ts`; it is internal.
