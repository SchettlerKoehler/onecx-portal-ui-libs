# angular-accelerator-data-export Specification

## Purpose
`ExportDataService` exports tabular data as CSV or Excel (`.xlsx`) files and triggers a browser download. Used by the data table / interactive data view and directly by applications.

## Requirements

### Requirement: Column and data resolution
The service SHALL be provided with `providedIn: 'any'`. For both export formats, each column (`id`, `nameKey`, `columnType`) SHALL be resolved from each data row using nested field-path resolution on `id`. Columns of type `TRANSLATION_KEY` SHALL have their cell values translated via `TranslateService`. Columns of type `DATE` or `RELATIVE_DATE` SHALL be written as localized dates (an empty/undefined value yields the localized representation of `undefined`). Header names SHALL be the translation of each column's `nameKey`.

#### Scenario: Nested field
- **WHEN** a column has id `owner.name`
- **THEN** the value of `row.owner.name` is exported

#### Scenario: Translation key column
- **WHEN** a column has type `TRANSLATION_KEY` and the value `STATUS.OPEN`
- **THEN** the exported cell contains the translation of `STATUS.OPEN`

#### Scenario: Date column
- **WHEN** a column has type `DATE`
- **THEN** the exported cell contains the date formatted for the current locale

### Requirement: CSV export
`exportCsv(columns, data, fileName)` SHALL create a CSV file with a header row of translated column names followed by one row per data item, with columns in the order given, rows separated by `\r\n`, a UTF-8 byte order mark prefixed and MIME type `text/csv;charset=utf-8;`. The delimiter SHALL be `;` when the injected locale starts with `de`, otherwise `,`. The file SHALL be downloaded under `fileName` as given. If `columns` is empty, nothing SHALL be exported.

#### Scenario: English locale
- **WHEN** the locale is `en`
- **THEN** values are separated by `,`

#### Scenario: German locale
- **WHEN** the locale is `de`
- **THEN** values are separated by `;`

#### Scenario: No columns
- **WHEN** `columns` is `[]`
- **THEN** no file is created or downloaded

### Requirement: CSV escaping
In CSV output, double quotes in a value or header SHALL be doubled; a value or header containing the delimiter, `\n` or `\r` SHALL be wrapped in double quotes. A `null` or `undefined` value SHALL be written as an empty cell.

#### Scenario: Quotes
- **WHEN** a value is `a"b`
- **THEN** it is written as `a""b` (not wrapped unless it also contains the delimiter or a line break)

#### Scenario: Delimiter in value
- **WHEN** a value contains the delimiter
- **THEN** it is wrapped in double quotes

#### Scenario: Line break in value
- **WHEN** a value contains `\n` or `\r`
- **THEN** it is wrapped in double quotes

#### Scenario: Plain value
- **WHEN** a value needs no escaping
- **THEN** it is written unchanged

### Requirement: Excel export
`exportToExcel(columns, data, fileName)` SHALL create a workbook with one worksheet that contains a table anchored at cell `A1`, with a header row, row stripes, no totals row, filter buttons on every column and one row per data item. The file SHALL have MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. If `columns` is empty, nothing SHALL be exported. A column whose translated name is empty SHALL use its `id` as header.

#### Scenario: Excel file
- **WHEN** `exportToExcel` is called with columns and data
- **THEN** an `.xlsx` file is downloaded with a header row of translated names and the data rows

#### Scenario: Empty data
- **WHEN** `data` is `[]` and columns are given
- **THEN** a workbook with only the header row is exported

#### Scenario: Header fallback
- **WHEN** a column's `nameKey` translates to an empty string
- **THEN** the column `id` is used as header

### Requirement: Excel file, sheet and table naming
The Excel file name SHALL be normalised: a trailing `.xlsx` (case-insensitive) SHALL be removed and every character that is not a Unicode letter, digit or underscore SHALL be replaced by `_`. The downloaded file SHALL be the normalised name plus `.xlsx`. The worksheet name SHALL be the translation of `OCX_DATA_EXPORT.EXCEL_SHEET_NAME` with parameter `fileName` (normalised name). The table name SHALL be the translation of `OCX_DATA_EXPORT.EXCEL_TABLE_NAME` with parameter `fileName`, where this value has all non-word characters replaced by `_` and leading digits removed.

#### Scenario: Extension stripped
- **WHEN** `fileName` is `report.xlsx`
- **THEN** the downloaded file is `report.xlsx` and the sheet/table names are based on `report`

#### Scenario: Special characters
- **WHEN** `fileName` is `my report-2024`
- **THEN** the downloaded file is `my_report_2024.xlsx`

#### Scenario: Leading digit in table name
- **WHEN** `fileName` is `2024data`
- **THEN** the table name parameter is `data` (leading digits removed)

### Requirement: File download mechanism
The service SHALL trigger the download by creating a temporary anchor element with a `download` attribute and a Blob object URL, clicking it, and revoking the URL asynchronously afterwards.

#### Scenario: Download link
- **WHEN** an export completes
- **THEN** a link with `href` set to an object URL and `download` set to the file name is clicked
