# angular-testing-utilities Specification

## Purpose
`@onecx/angular-testing` exposes test helpers for OneCX Angular tests: jest mocks for browser APIs missing in jsdom, a helper to wait for `@defer` blocks, and an ngx-translate testing provider.

## Requirements

### Requirement: IntersectionObserverMock
`IntersectionObserverMock` SHALL emulate `IntersectionObserver` such that every observed target is immediately treated as fully intersecting. On `observe(target)` it SHALL record an entry (`boundingClientRect`, `intersectionRatio: 1`, `isIntersecting: true`, `target`) and invoke the observer callback asynchronously (via `setTimeout`) with all recorded entries and the observer. `takeRecords()` SHALL return the entries, `unobserve(target)` SHALL remove the entries of that target and `disconnect()` SHALL clear all entries.

#### Scenario: Observing triggers callback
- **WHEN** `observe(element)` is called
- **THEN** the callback is invoked in a later task with an entry whose `isIntersecting` is `true`

#### Scenario: Unobserve
- **WHEN** `unobserve(element)` is called
- **THEN** `takeRecords()` no longer contains entries for that element

### Requirement: ensureIntersectionObserverMockExists
`ensureIntersectionObserverMockExists()` SHALL set `global.IntersectionObserver` to `IntersectionObserverMock` when it is missing or is a different constructor.

#### Scenario: Install mock
- **WHEN** the function is called in a jsdom test
- **THEN** `global.IntersectionObserver` is `IntersectionObserverMock`

### Requirement: ensureOriginMockExists
`ensureOriginMockExists()` SHALL set `global.origin` to an empty string when it is falsy and leave an existing value unchanged.

#### Scenario: Origin missing
- **WHEN** `global.origin` is undefined
- **THEN** it becomes `''`

### Requirement: waitForDeferredViewsToBeRendered
`waitForDeferredViewsToBeRendered(harness)` SHALL return a promise that resolves after the harness has waited for tasks outside Angular and one additional `setTimeout` tick (so that the intersection mock has fired callbacks for `@defer` blocks). If the waiting has not finished within 2000 ms, it SHALL force stabilization of the harness and resolve anyway (no warning is logged).

#### Scenario: Deferred view rendered
- **WHEN** a component contains `@defer (on viewport)` blocks and the mock is installed
- **THEN** the promise resolves after the deferred content was rendered

#### Scenario: Timeout
- **WHEN** waiting takes longer than 2 seconds
- **THEN** the promise still resolves after `forceStabilize` completes

> Note (code-derived): relies on non-public `forceStabilize` and `waitForTasksOutsideAngular` members of the harness.

### Requirement: Translate testing provider
`provideTranslateTestingService(translates)` SHALL return ngx-translate providers (`provideTranslateService`) configured with a `FakeTranslateLoader` built from `translates` (a record language to translation object). `FakeTranslateLoader.getTranslation(lang)` SHALL return an observable of the translations for the language or an empty object when the language is unknown. It replaces `ngx-translate-testing` which is incompatible with ngx-translate v17.

#### Scenario: Known language
- **WHEN** the provider is created with `{ en: { HELLO: 'Hello' } }` and language `en` is used
- **THEN** the key `HELLO` resolves to `Hello`

#### Scenario: Unknown language
- **WHEN** a language without translations is requested
- **THEN** an empty translation object is emitted

### Requirement: Public API surface
The library SHALL export the above helpers, all harnesses and `FakeTranslateLoader`, and SHALL NOT export its internal logger factory (`createLogger`).

#### Scenario: Internal logger hidden
- **WHEN** a consumer imports from `@onecx/angular-testing`
- **THEN** `createLogger` is not available
