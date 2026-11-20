# angular-accelerator-pipes Specification

## Purpose
Angular pipes exported by `@onecx/angular-accelerator` for rendering values: choosing a pipe dynamically at runtime (`DynamicPipe`), auto-refreshing human-readable "time ago" text (`OcxTimeAgoPipe`) and locale-aware relative dates (`RelativeDatePipe`). Used by application and data-display components.

## Requirements

### Requirement: Dynamic pipe selection by type
`DynamicPipe` (template name `dynamicPipe`) SHALL apply a pipe class given at runtime to a value, using `transform(value, requiredPipe?, pipeArgs?)`.

#### Scenario: No pipe given
- **WHEN** `requiredPipe` is undefined/falsy
- **THEN** the value is returned unchanged

#### Scenario: Pipe class given
- **WHEN** `requiredPipe` is a pipe class
- **THEN** the pipe is instantiated through a child injector of the current injector (so its own dependencies are resolved)
- **AND** the result of `pipe.transform(value, pipeArgs)` is returned (`pipeArgs` is passed as a single argument)

### Requirement: Dynamic pipe selection by name
`DynamicPipe.transform2(value, pipeToken, ...pipeArgs)` SHALL support the built-in pipes `currency`, `decimal` and `date`, created with the current `LOCALE_ID`.

#### Scenario: Known pipe name
- **WHEN** `pipeToken` is `currency`, `decimal` or `date`
- **THEN** the matching pipe's `transform(value, ...pipeArgs)` result is returned

#### Scenario: Unknown or missing token
- **WHEN** `pipeToken` is falsy or not one of the known names
- **THEN** the value is returned unchanged

### Requirement: Time-ago text
`OcxTimeAgoPipe` (name `timeago`) SHALL convert a date string into a translated text using the translation key `OCX_TIMEAGO.<KEY>`, passing the interpolation parameters `minutes`, `hours`, `days`, `months`, `years` (each the rounded absolute distance from now in that unit).

#### Scenario: Key selection by distance
- **WHEN** the absolute distance from now is computed
- **THEN** the key is chosen as: up to 45 s `A_FEW_SECONDS_AGO`; up to 90 s `A_MINUTE_AGO`; up to 45 min `MINUTES_AGO`; up to 90 min `AN_HOUR_AGO`; up to 22 h `HOURS_AGO`; up to 36 h `A_DAY_AGO`; up to 25 days `DAYS_AGO`; up to 45 days `A_MONTH_AGO`; up to 345 days `MONTHS_AGO`; up to 545 days `A_YEAR_AGO`; otherwise `YEARS_AGO`

#### Scenario: Invalid date
- **WHEN** the value cannot be parsed as a date
- **THEN** the key `NAN` is used

> Note (code-derived): The distance is absolute, so future dates produce the same "ago" texts as past dates.

### Requirement: Time-ago auto refresh
`OcxTimeAgoPipe` SHALL schedule a re-check of the view (outside the Angular zone, then marking the view for check) and replace any previously scheduled timer on each transform.

#### Scenario: Refresh interval
- **WHEN** the distance is under 1 minute, under 1 hour, under 1 day, or more
- **THEN** the next refresh is after 2 s, 30 s, 300 s, or 3600 s respectively
- **AND** for an invalid date the refresh is after 1 s

#### Scenario: Destroy
- **WHEN** the pipe is destroyed
- **THEN** the pending timer is cleared

### Requirement: Relative date formatting
`RelativeDatePipe` (name `relativeDate`) SHALL format a date as a long-style relative time using `Intl.RelativeTimeFormat` with the `TranslateService`'s current language.

#### Scenario: Unit selection
- **WHEN** a date string or `Date` is passed
- **THEN** the difference to now in seconds is scaled through seconds (60), minutes (60), hours (24), days (7), weeks (4.34524), months (12) and years, and the first unit whose scaled absolute value is below its limit is used with the rounded value
- **AND** past dates yield negative values ("ago"), future dates positive ("in")

#### Scenario: Non string/object input
- **WHEN** the value is neither a string nor an object (e.g. a number or undefined)
- **THEN** the current time is used as the date

> Note (code-derived): The formatter is created once in the constructor with the language at that time; later language changes are not reflected. A `null` value (typeof object) would fail.
