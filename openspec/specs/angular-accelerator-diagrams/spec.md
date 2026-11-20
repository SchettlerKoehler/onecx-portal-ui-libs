# angular-accelerator-diagrams Specification

## Purpose
Provides chart components for visualising label/value data as pie, horizontal bar or vertical bar diagrams (`DiagramComponent`, `ocx-diagram`) and for counting occurrences of a field in a list of objects and charting the result (`GroupByCountDiagramComponent`, `ocx-group-by-count-diagram`). Used by application developers and by the interactive data view.

## Requirements

### Requirement: Diagram data model and types
The system SHALL export `DiagramType` with the values `PIE`, `VERTICAL_BAR` and `HORIZONTAL_BAR`, and `DiagramColumn` as an object of `columnType` (`ColumnType`) and `id` (string). Diagram data items SHALL consist of `label` (string), `value` (number) and an optional `backgroundColor` (string).

#### Scenario: Diagram types
- **WHEN** a consumer imports `DiagramType`
- **THEN** exactly `PIE`, `VERTICAL_BAR` and `HORIZONTAL_BAR` are available

> Note (code-derived): The `DiagramData` type is not exported from the library index (the export is commented out), although `DiagramComponent.data` is typed with it.

### Requirement: Diagram rendering and defaults
`ocx-diagram` SHALL render a chart for the list in `data`. Defaults: `diagramType` = `PIE`, `sumKey` = `OCX_DIAGRAM.SUM`, `fullHeight` = `false`, `chartTitleKey` = `''`, `chartDescriptionKey` = `''`, `customLegends` = `false`, `fillMissingColors` = `true`, `supportedDiagramTypes` = `[]`. The chart type SHALL be `pie` for `PIE`, and `bar` for `HORIZONTAL_BAR` and `VERTICAL_BAR`. Chart labels SHALL be the item labels and chart values the item values.

#### Scenario: Pie diagram
- **WHEN** `data` is `[{label:'A', value:2}, {label:'B', value:3}]` and `diagramType` is `PIE`
- **THEN** a pie chart with labels A and B and values 2 and 3 is rendered
- **AND** the sum shown below the chart is 5, labelled with the translated `sumKey`

#### Scenario: Horizontal bar
- **WHEN** `diagramType` is `HORIZONTAL_BAR`
- **THEN** a bar chart is rendered with the index axis set to `y`
- **AND** the value axis ticks use precision 0 (integers only)

#### Scenario: Vertical bar
- **WHEN** `diagramType` is `VERTICAL_BAR`
- **THEN** a bar chart is rendered with integer value-axis ticks

#### Scenario: No data
- **WHEN** `data` is `undefined`
- **THEN** no chart is generated and an info message with the translated key `OCX_DIAGRAM.NO_DATA` is shown

#### Scenario: Title and description
- **WHEN** `chartTitleKey` and/or `chartDescriptionKey` are non-empty
- **THEN** the translated title is shown as a header and the translated description as a paragraph above the chart

### Requirement: Diagram colors
The diagram SHALL use `backgroundColor` of an item when set. If every item has a color, the provided colors SHALL be used as is. If some items lack a color and `fillMissingColors` is `true`, only the missing colors SHALL be generated from an interpolated palette (sized to the number of items) and the provided ones kept. If some items lack a color and `fillMissingColors` is `false`, all colors SHALL be generated and the provided ones ignored.

#### Scenario: Partial colors with fill enabled
- **WHEN** two of three items define `backgroundColor` and `fillMissingColors` is `true`
- **THEN** the two defined colors are kept and one color is generated for the third

#### Scenario: Partial colors with fill disabled
- **WHEN** two of three items define `backgroundColor` and `fillMissingColors` is `false`
- **THEN** all three colors are generated

### Requirement: Diagram type switching
When more than one diagram type from `supportedDiagramTypes` is available, the diagram SHALL show a select button (aria label `OCX_DIAGRAM.SELECT_BUTTON.ARIA_LABEL`) offering the supported types (pie, horizontal bar, vertical bar), with empty selection not allowed. Selecting a type SHALL update `diagramType`, emit `diagramTypeChanged` with the new `DiagramType` and emit `componentStateChanged` with `{ activeDiagramType }`. With one or no supported type the select button SHALL NOT be shown.

#### Scenario: User switches type
- **WHEN** the user selects the vertical-bar option
- **THEN** `diagramType` becomes `VERTICAL_BAR`
- **AND** `diagramTypeChanged` emits `VERTICAL_BAR`
- **AND** `componentStateChanged` emits `{ activeDiagramType: 'VERTICAL_BAR' }`

#### Scenario: Single supported type
- **WHEN** `supportedDiagramTypes` contains only one type
- **THEN** no type select button is displayed

### Requirement: Diagram legend and layout options
The diagram SHALL show the chart.js legend at the bottom unless `customLegends` is `true`. When `customLegends` is `true` and the chart type is pie, a custom legend table with colored boxes and labels, arranged in two columns, SHALL be shown instead. `fullHeight` SHALL take effect (full height and responsive chart) only for `PIE`.

#### Scenario: Custom legends
- **WHEN** `customLegends` is `true` and `diagramType` is `PIE`
- **THEN** the built-in legend is hidden and the custom legend is rendered

#### Scenario: Full height only for pie
- **WHEN** `fullHeight` is `true` and `diagramType` is `VERTICAL_BAR`
- **THEN** the full-height behavior is not applied

### Requirement: Diagram accessibility and high contrast
The diagram SHALL provide a screen-reader-only table with columns color, label and count (headers `OCX_DIAGRAM.TABLE.COLOR/LABEL/COUNT`) including a total row, an accessible chart label (`OCX_DIAGRAM.ARIA_LABEL` with total and a `label:value` list, or `OCX_DIAGRAM.EMPTY_ARIA_LABEL` without data), and per-instance unique element ids. Label and tick colors SHALL follow the high-contrast mode and be refreshed when it changes; the listener SHALL be removed on destroy.

#### Scenario: Screen reader table
- **WHEN** data is present
- **THEN** a visually hidden table lists each item's color, label and count and a final row with the total

#### Scenario: High contrast change
- **WHEN** the high-contrast setting changes
- **THEN** the chart is regenerated with the matching label color

### Requirement: Diagram data selection output
`ocx-diagram` SHALL provide the output `dataSelected`, which is emitted when the user selects data in the chart.

#### Scenario: Chart selection
- **WHEN** the chart reports a data selection
- **THEN** `dataSelected` emits a value

> Note (code-derived): `dataClicked` emits `event.length` (the length of the chart event array) rather than the event itself.

### Requirement: Group-by-count aggregation
`ocx-group-by-count-diagram` SHALL count occurrences of the value found at `columnField` (resolved with nested path support) in each object of `data` and chart each distinct value with its count. Defaults: `diagramType` = `PIE`, `sumKey` = `SEARCH.SUMMARY_TITLE`, `data` = `[]`, `columnType` = `STRING`, `columnField` = `''`, `colors` = `{}`, `allLabelKeys` = `[]`, `showAllLabels` = `false`, `fillMissingColors` = `true`, `supportedDiagramTypes` = `[]`, `fullHeight` = `false`, `customLegends` = `false`. The diagram data SHALL be recomputed whenever `data`, `columnField`, `columnType`, `colors`, `allLabelKeys` or `showAllLabels` change.

#### Scenario: Counting
- **WHEN** `data` is `[{s:'a'},{s:'b'},{s:'a'}]` and `columnField` is `s`
- **THEN** the diagram receives `a` with value 2 and `b` with value 1

#### Scenario: Colors by label
- **WHEN** `colors` is `{ a: '#f00' }`
- **THEN** the item with label `a` gets `backgroundColor` `#f00`

### Requirement: Group-by-count show all labels
When `showAllLabels` is `true` and `allLabelKeys` is non-empty, the diagram SHALL list every label in `allLabelKeys` (with count 0 if absent from the data) in that order, followed by any data values not in `allLabelKeys`.

#### Scenario: Zero-count labels
- **WHEN** `allLabelKeys` is `['a','b','c']`, `showAllLabels` is `true` and data contains only `a`
- **THEN** `b` and `c` are shown with value 0

### Requirement: Group-by-count translation of labels
When `columnType` is `TRANSLATION_KEY` and there is at least one occurrence, the system SHALL translate each label through `TranslateService` before charting, keeping counts and colors.

#### Scenario: Translation key column
- **WHEN** `columnType` is `TRANSLATION_KEY` and a value is `STATUS.OPEN`
- **THEN** the chart label is the translation of `STATUS.OPEN`

### Requirement: Group-by-count column input
When `column` (a `DiagramColumn`) is set, the component SHALL set `columnType` to `column.columnType` and `columnField` to `column.id`.

#### Scenario: Column provided
- **WHEN** `column` is `{ columnType: ColumnType.TRANSLATION_KEY, id: 'status' }`
- **THEN** `columnType` is `TRANSLATION_KEY` and `columnField` is `status`

### Requirement: Group-by-count outputs
The component SHALL forward diagram type changes: on a type change it SHALL set `diagramType`, emit `diagramTypeChanged` and emit `componentStateChanged` with `{ activeDiagramType }`. It SHALL provide `dataSelected`, emitted with the event passed to its handler.

#### Scenario: Type change
- **WHEN** the inner diagram reports `HORIZONTAL_BAR`
- **THEN** `diagramType` is `HORIZONTAL_BAR` and `diagramTypeChanged` and `componentStateChanged` are emitted

> Note (code-derived): The template listens to `(onDataSelect)` on `ocx-diagram`, whereas `DiagramComponent` exposes `dataSelected`; data selection from the chart therefore does not reach `dataSelected` of the group-by-count component in practice. Also, `customLegends` is an input but is not forwarded to the inner diagram, and the custom legend items never carry a `value` (the screen-reader count text is empty).

### Requirement: Diagram Template and appearance - structure
`ocx-diagram` (`diagram.component.scss`, emulated encapsulation plus a `::ng-deep` block) SHALL render, in order: (1) when a title or description key is set, `header.diagram-title.w-full.flex.justify-center#ocx-<uid>-title` and/or `p.diagram-description.w-full.flex.justify-center#ocx-<uid>-description` (translated `chartTitleKey` / `chartDescriptionKey`); (2) when `data()` is truthy and more than one type is shown, `div.flex.justify-center.pb-2 > p-selectbutton[name=diagram-type-select-button]` (`[allowEmpty]=false`, `optionLabel="id"`, ariaLabel `OCX_DIAGRAM.SELECT_BUTTON.ARIA_LABEL`) whose item template is `i[class=item.icon][ocxTooltip=item.tooltipKey|translate]` plus `span.sr-only#ocx-<uid>-<item.id>`; (3) `div.w-full.flex.justify-center` (plus `h-full` when `useFullHeight()`) holding `p-chart#ocx-<uid>-chart` (`tabindex="0"`, `[attr.aria-describedby]="ocx-<uid>-sr-only-table"`, `data-automation-type` = chart type, `data-automation-options`, `[responsive]="useFullHeight()"`, `ariaLabel` `OCX_DIAGRAM.ARIA_LABEL` with `{total, valueString}` or `OCX_DIAGRAM.EMPTY_ARIA_LABEL`) and the screen-reader table template; (4) for `customLegends()` and pie type the custom legend table; (5) `div.w-full.flex.justify-center.mt-2.sumKey[aria-hidden=true] > p.text-base.font-medium.text-surface-700` with `span[name=sumLabel]` (`sumKey | translate`), ` : ` and `span[name=amountOfData]`. When `data()` is falsy the diagram SHALL instead render `div.w-full.flex.justify-center > p-message[severity=info][text=OCX_DIAGRAM.NO_DATA]`. Type icons/tooltips: pie `OpenngIcons.CHART_PIE` / `OCX_DIAGRAM.SWITCH_DIAGRAM_TYPE.PIE`; horizontal bar `OpenngIcons.BARS` / `...HORIZONTAL_BAR`; vertical bar `OpenngIcons.CHART_BAR` / `...VERTICAL_BAR`.

#### Scenario: Populated pie with switcher
- **WHEN** three supported types and data are given
- **THEN** the select button with three icon items, the canvas chart, the hidden sum line `Total : <n>` appear in that order

#### Scenario: Empty
- **WHEN** `data()` is undefined
- **THEN** only the info message "There is no data available" is shown (after any title/description)

### Requirement: Diagram Template and appearance - screen reader table and legends
The screen-reader block SHALL be `div.w-full.flex.justify-center.sr-only#ocx-<uid>-sr-only-diagram-details > table#ocx-<uid>-sr-only-table` with `caption#ocx-<uid>-table-caption` (translated title), a header row of `th[scope=col]` `OCX_DIAGRAM.TABLE.COLOR` / `.LABEL` / `.COUNT`, one row per datum (`backgroundColor || ' '`, `label`, `value`) and a final row `td[colspan=2]` (`sumKey`) + `td` (`amountOfData`). The custom legend SHALL be `div.custom-legends-container[aria-hidden=true] > div.custom-legends-content-container > table.legends-table` with `.sr-only` header rows (`LEGEND COLUMN 1`, `LEGEND COLUMN 2`, hard-coded) and one `tr` per pair of items; each `td` holds `span.box` with inline `background-color`, the label, and `span.sr-only` `<label>, <OCX_DIAGRAM.TABLE.COUNT>: <value>`.

#### Scenario: Two-column legend
- **WHEN** five legend items exist
- **THEN** the table has three data rows with 2, 2 and 1 cells

### Requirement: Diagram Template and appearance - styles and chart options
Styles SHALL be: `::ng-deep .p-buttonset .p-button { min-width:auto }` and `::ng-deep .p-buttonset { display:flex }`; `.sr-only` visually hidden (`position:absolute; width/height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); border:0`); `.diagram-title, .diagram-description { text-align:center }`; `.custom-legends-container { display:flex; justify-content:center }` with `.custom-legends-content-container { max-height:250px; overflow-y:auto }`, `.legends-table { margin:10px auto 0; border-collapse:collapse; text-align:left }`, `.legends-table td { padding:0.25rem 1rem; vertical-align:middle; font-family:var(--font-family); font-size:var(--font-size) }` and `.box { width:36px; height:12px; display:inline-block; vertical-align:middle }`. Chart.js options SHALL be `plugins.legend = { display: !customLegends(), position:'bottom', labels:{color: labelColor} }`, `maintainAspectRatio:false`; vertical bars add `scales.y.ticks.precision:0` and label-colour ticks; horizontal bars set `indexAxis:'y'` with `scales.x.ticks.precision:0`. `labelColor` comes from `getLabelColor(highContrast())`. Generated colours use `d3.interpolateCool` over range 0..1.

#### Scenario: Horizontal bar
- **WHEN** type is horizontal bar
- **THEN** chart options contain `indexAxis: 'y'` and integer ticks on the x axis

### Requirement: Group-by-count diagram Template and appearance
`ocx-group-by-count-diagram` SHALL render only `<ocx-diagram>` with `[data]="(diagramData$ | async) || []"`, passing `fillMissingColors`, `sumKey`, `fullHeight`, `diagramType`, `chartTitleKey`, `chartDescriptionKey`, `supportedDiagramTypes`, wiring `(onDataSelect)` to `dataClicked($event)` and `(diagramTypeChanged)` to `onDiagramTypeChanged($event)`. It has no styles.

#### Scenario: Empty source
- **WHEN** the source data is empty
- **THEN** the inner diagram receives `[]` (a truthy value) and renders the zero-sum chart, not the NO_DATA message

> Note (code-derived): translation keys used are `OCX_DIAGRAM.*` (see assets/i18n/en.json); the default `sumKey` is `OCX_DIAGRAM.SUM` ("Total"). Canvas rendering itself cannot be asserted statically.
