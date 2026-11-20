# accelerator-utils Specification

## Purpose
General-purpose helpers exported by `@onecx/accelerator`: dates, location paths, test detection, locale normalization and safe nested property initialisation.

## Requirements

### Requirement: Date validity check
`isValidDate(value)` SHALL return `true` only if `value` is a `Date` instance that is not "Invalid Date", and act as a type guard.

#### Scenario: Valid and invalid values
- **WHEN** called with `new Date()`
- **THEN** it returns `true`
- **AND** it returns `false` for `new Date('not-a-date')`, a date string, `null` and `undefined`

### Requirement: UTC date without timezone issues
`getUTCDateWithoutTimezoneIssues(date)` SHALL return a new `Date` at 00:00:00 UTC of the calendar day (year, month, day) as seen in the local timezone of the input.

#### Scenario: Time stripped
- **WHEN** called with local `2020-06-15 23:59:59`
- **THEN** the result has UTC year 2020, month June, day 15, and hours/minutes/seconds 0

### Requirement: Location with deployment and application path
`getLocation()` SHALL return the browser `location` object enriched with `deploymentPath` (the path of the `<base>` href relative to the origin, or `/` when there is no `<base>` tag) and `applicationPath` (the remainder of the URL after the base path, starting with `/`). It MUST throw `Error('getLocation() is only available in browser environments')` when `document` or `location` is unavailable.

#### Scenario: No base tag
- **WHEN** the URL path is `/app/workspace` and no `<base>` exists
- **THEN** `deploymentPath` is `/` and `applicationPath` is `/app/workspace`

#### Scenario: With base href
- **WHEN** `<base href="<origin>/deploy/">` and the path is `/deploy/workspace/app`
- **THEN** `deploymentPath` is `/deploy/` and `applicationPath` is `/workspace/app`

#### Scenario: Non-browser
- **WHEN** called in Node without `document`/`location`
- **THEN** the error above is thrown

> Note (code-derived): the properties are assigned onto the live `window.location` object (mutation), not a copy.

### Requirement: Test environment detection
`isTest()` SHALL return `true` when a global `jasmine` is defined or when `process.env.JEST_WORKER_ID` is defined, otherwise `false`.

#### Scenario: Jasmine
- **WHEN** `globalThis.jasmine` is defined
- **THEN** `isTest()` is `true`

#### Scenario: Jest
- **WHEN** `JEST_WORKER_ID` is set
- **THEN** `isTest()` is `true`

#### Scenario: Neither
- **WHEN** neither is present
- **THEN** it returns `false`

### Requirement: Locale normalization
`normalizeLocales(locales)` SHALL return `[]` for `undefined` or an empty array. Otherwise it SHALL return the input locales in order without duplicates, each followed by its language part (split at `-` or `_`) when that language is neither already in the output nor present in the input list.

#### Scenario: Expansion
- **WHEN** input is `['en-US','fr-FR']`
- **THEN** the result is `['en-US','en','fr-FR','fr']`

#### Scenario: Underscore separator
- **WHEN** input is `['en_US','fr-FR']`
- **THEN** the result is `['en_US','en','fr-FR','fr']`

#### Scenario: Language already listed
- **WHEN** input is `['en-US','de-DE','en-GB','en']`
- **THEN** the result is `['en-US','de-DE','de','en-GB','en']`

> Note (code-derived): a language present later in the input keeps its input position and is not inserted after its first regional variant.

### Requirement: Normalized browser locales
`getNormalizedBrowserLocales()` SHALL return `['en']` when `navigator` is unavailable; otherwise it SHALL pass `navigator.languages` (or `[navigator.language]` if `languages` is missing), with falsy entries removed, to `normalizeLocales` and return the result.

#### Scenario: No navigator
- **WHEN** `navigator` is undefined
- **THEN** `['en']` is returned

#### Scenario: Languages list
- **WHEN** `navigator.languages` is `['en-US','fr-FR']`
- **THEN** the result is `['en-US','en','fr-FR','fr']`

#### Scenario: Single language
- **WHEN** only `navigator.language` is `de-DE`
- **THEN** the result is `['de-DE','de']`

### Requirement: ensureProperty initialises nested paths
`ensureProperty(obj, path, initialValue)` SHALL walk `path` (strings or numbers), creating an empty object for every intermediate segment that is null, undefined or not an object (non-object values such as strings, numbers, booleans are overwritten), and set the final key to `initialValue` only if its current value is `null` or `undefined`. It SHALL return the same `obj` instance, typed to include the new path. Existing values, including `0`, `false` and `''`, MUST NOT be overwritten, and the `path` array MUST NOT be mutated. Special-character keys (e.g. `@onecx/accelerator`), numeric keys and empty-string keys SHALL be supported.

#### Scenario: Create nested path
- **WHEN** `ensureProperty({}, ['a','b','c'], 1)` is called
- **THEN** the result is the same object with `a.b.c === 1`

#### Scenario: Keep existing value
- **WHEN** the target holds `'John'` and the initial value is `'Jane'`
- **THEN** the value stays `'John'`

#### Scenario: Replace null or undefined
- **WHEN** the target is `null` or `undefined`
- **THEN** it is set to the initial value

#### Scenario: Falsy values kept
- **WHEN** the target is `0`, `false` or `''`
- **THEN** it is not overwritten

#### Scenario: Non-object intermediate
- **WHEN** an intermediate segment holds a string
- **THEN** it is replaced by an object

#### Scenario: Arrays
- **WHEN** an intermediate or the parent is an array
- **THEN** it is retained and the property is added to it

#### Scenario: Empty path
- **WHEN** `path` is `[]`
- **THEN** the object is returned unchanged

#### Scenario: globalThis
- **WHEN** called with `globalThis` and `['@myapp','x']`
- **THEN** the return value gives typed access and `globalThis['@myapp'].x` is set
