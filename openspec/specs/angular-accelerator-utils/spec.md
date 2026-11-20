# angular-accelerator-utils Specification

## Purpose
General-purpose utilities of `@onecx/angular-accelerator` that are independent of data table and filter handling: color interpolation, date formatting, object field access, dropdown options, logo URLs, observable outputs, template lookup, URL string helpers, action routing, search criteria building and Optimus patches. Used by component authors and OneCX applications.

## Requirements

### Requirement: Color interpolation
`ColorUtils.interpolateColors(dataLength, colorScale, colorRangeInfo)` SHALL return an array of `dataLength` colors obtained by calling `colorScale` with evenly spaced points between `colorStart` and `colorEnd`.

#### Scenario: Forward range
- **WHEN** `useEndAsStart` is falsy
- **THEN** point `i` is `colorStart + i * (colorEnd - colorStart) / dataLength`

#### Scenario: Reversed range
- **WHEN** `useEndAsStart` is truthy
- **THEN** point `i` is `colorEnd - i * intervalSize` (`ColorUtils.calculatePoint`)

#### Scenario: No data
- **WHEN** `dataLength` is 0
- **THEN** an empty array is returned

### Requirement: Localized date formatting
`DateUtils` (root-provided service) SHALL format dates with `localizedDate(date)` using `Intl.DateTimeFormat` with the injected `LOCALE_ID` and the `options` property (default: short month, 2-digit day, numeric year, numeric hour, 2-digit minute and second).

#### Scenario: Valid input
- **WHEN** a `Date`, ISO string or timestamp is passed
- **THEN** the localized string is returned

#### Scenario: Empty input
- **WHEN** the value is undefined, empty or `0`
- **THEN** an empty string is returned

### Requirement: Object field resolution
`ObjectUtils.resolveFieldData(data, field)` SHALL read a value from `data` using a field name, a dotted path, or a function.

#### Scenario: Simple and nested paths
- **WHEN** `field` is `a` or `a.b.c`
- **THEN** the value at that path is returned

#### Scenario: Function field
- **WHEN** `field` is a function
- **THEN** it is called with `data` and its result returned (`ObjectUtils.isFunction` detects this)

#### Scenario: Missing data
- **WHEN** `data` or `field` is falsy, or an intermediate path segment is null/undefined
- **THEN** `null` is returned

### Requirement: Enum to dropdown options
`enumToDropdownOptions(translateService, enumType, translationKeyPrefix)` SHALL return an observable of `{ label, value }` entries, one per `Object.values(enumType)`, with the label being the translation of `prefix + value`.

#### Scenario: Translated options
- **WHEN** translations are available
- **THEN** each option has the translated label and the enum value

> Note (code-derived): For numeric TypeScript enums `Object.values` also contains the reverse-mapping names, yielding extra entries.

### Requirement: Logo URL creation
`ImageLogoUrlUtils.createLogoUrl(apiPrefix, url?)` SHALL prefix backend-relative URLs.

#### Scenario: Backend URL
- **WHEN** `url` is non-empty and does not start with `http` or `https`
- **THEN** `apiPrefix + url` is returned

#### Scenario: Absolute or missing URL
- **WHEN** `url` starts with `http`/`https`, or is undefined/empty
- **THEN** `url` is returned unchanged

### Requirement: Observable output
`observableOutput<T>()` SHALL create an output emitter (`ObservableOutputEmitterRef`) that exposes an `observed` signal telling whether it has listeners.

#### Scenario: Listener tracking
- **WHEN** a listener subscribes or unsubscribes
- **THEN** `observed()` is true while at least one listener exists, false otherwise

#### Scenario: Injection context
- **WHEN** called outside an injection context in dev mode
- **THEN** an assertion error is thrown

> Note (code-derived): Relies on the internal `listeners` field of Angular's `OutputEmitterRef`.

### Requirement: Template lookup
`findTemplate(templates, names)` SHALL return the first template matching the names in priority order.

#### Scenario: Priority
- **WHEN** several names are given
- **THEN** the template for the earliest name in `names` that exists is returned
- **AND** `undefined` if none matches

### Requirement: URL and string array helpers
The helpers `findEntryWithKeyword`, `removeKeyword` and `searchPrefixWithSpecialChars` SHALL operate on route strings.

#### Scenario: findEntryWithKeyword
- **WHEN** an entry contains the keyword
- **THEN** the first such entry is returned; otherwise (or for an undefined array) `null`

#### Scenario: removeKeyword
- **WHEN** the input contains `/<keyword>`
- **THEN** that segment and everything after it are removed, and one trailing `/` is stripped
- **AND** input without the keyword is returned unchanged

#### Scenario: searchPrefixWithSpecialChars
- **WHEN** strings start with the prefix followed by `?` or `#`
- **THEN** the last matching string in the array is returned, else `null`

> Note (code-derived): `removeKeyword` builds a RegExp from the keyword without escaping.

### Requirement: Action routing
`resolveRouterLink`, `handleAction` and `handleActionSync` SHALL execute actions of type `Action` or `DataAction`.

#### Scenario: Router link resolution
- **WHEN** `routerLink` is a string, a function returning a string/Promise, or a Promise
- **THEN** `resolveRouterLink` resolves to the string

#### Scenario: Navigation
- **WHEN** the action has a `routerLink`
- **THEN** `router.navigate([link])` is called and no callback is invoked

#### Scenario: Callbacks
- **WHEN** there is no `routerLink` and the action has a function `callback`
- **THEN** it is called with `data`
- **AND** otherwise a function `actionCallback` is called without arguments

#### Scenario: Sync wrapper
- **WHEN** `handleActionSync` is used
- **THEN** it starts `handleAction` without awaiting and returns void

### Requirement: Search criteria building
`buildSearchCriteria(formRawValue, datePickers, { removeNullValues })` SHALL build a criteria object from form values.

#### Scenario: Null removal
- **WHEN** `removeNullValues` is true and a value is null/undefined
- **THEN** the entry is omitted; otherwise it is kept

#### Scenario: Date normalization
- **WHEN** a value is a valid date and the date picker named like the key does not have `showTime` true
- **THEN** it is converted with `getUTCDateWithoutTimezoneIssues`
- **AND** date-times (picker with `showTime`) are kept unchanged

### Requirement: Optimus autofocus patch
`patchOptimusAutoFocus()` SHALL patch the Optimus `AutoFocus` directive once so only `autofocus === true` sets the `autofocus` attribute.

#### Scenario: Patched behavior
- **WHEN** the patch is applied and `autofocus` is not true
- **THEN** the attribute is removed from the host element
- **AND** focus is still applied when not yet focused

#### Scenario: Idempotent and safe
- **WHEN** called repeatedly
- **THEN** the patch is applied only once
- **AND** if the original hook is missing, a warning is logged and nothing is changed; errors are logged, not thrown

### Requirement: Optimus icon type
`OptimusIcon` SHALL be a type covering the values of `OpenngIcons`.

#### Scenario: Typing
- **WHEN** an icon from `OpenngIcons` is assigned to `OptimusIcon`
- **THEN** it type-checks

### Requirement: High contrast helpers
The internal `diagram-contrast-utils` (not exported from `index.ts`) SHALL expose `hasHighContrast`, `getLabelColor`, `addHighContrastListener`, `removeHighContrastListener`.

#### Scenario: Label color
- **WHEN** high contrast is active
- **THEN** `getLabelColor` returns `#ffffff`
- **AND** otherwise the trimmed `--text-color` CSS variable of the document root

#### Scenario: Listeners
- **WHEN** a handler is added or removed
- **THEN** it is (un)registered for changes of the `(forced-colors: active)` media query

### Requirement: Timestamp ordering helpers
The internal `rxjs-utils` (not exported) SHALL provide `orderValuesByTimestamp` and `orderAndMergeValuesByTimestamp`.

#### Scenario: Ordering
- **WHEN** `orderValuesByTimestamp` gets timestamped values
- **THEN** it returns the values sorted newest first

#### Scenario: Merging
- **WHEN** `orderAndMergeValuesByTimestamp` gets timestamped objects
- **THEN** they are merged oldest to newest so newer properties win

> Note (code-derived): Both sort the input array in place; merging an empty array throws (reduce without initial value).

### Requirement: Deprecated dynamic locale id
`DynamicLocaleId` (file `dynamic-locale-id.ts`, not exported from `index.ts`, deprecated in favor of `@onecx/angular-utils`) SHALL behave like a string whose value is the current `UserService.lang$` value.

#### Scenario: Value
- **WHEN** `valueOf()` is called
- **THEN** the current language is returned, and string methods are delegated to it

### Requirement: Internal logger
The internal `createLogger` (not exported) SHALL create loggers namespaced to `@onecx/angular-accelerator`.

#### Scenario: Creation
- **WHEN** `createLogger(name)` is called
- **THEN** a logger from `createLoggerFactory('@onecx/angular-accelerator')` is returned
