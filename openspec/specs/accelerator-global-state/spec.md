# accelerator-global-state Specification

## Purpose
Defines the shared, `globalThis`-anchored state under the key `@onecx/accelerator` (internal `acceleratorState` in `declarations.ts`), which lets multiple bundled copies of the library cooperate. Consumers see this state through `Topic`, `Gatherer` and `ensureProperty`.

## Requirements

### Requirement: Default shared state
Importing the library SHALL ensure `globalThis['@onecx/accelerator']` contains: `gatherer.promises` (default `{}`), `gatherer.id` (default `0`), `topic.useBroadcastChannel` (default `'V2'`), `topic.initDate` (default `Date.now()` at first init) and `topic.tabId` (default `Math.ceil(performance.now())`, or `0` when `performance` is unavailable).

#### Scenario: First import
- **WHEN** the module is loaded and no state exists
- **THEN** the defaults above are created on `globalThis`

#### Scenario: Existing state
- **WHEN** a value already exists (not null/undefined)
- **THEN** it is preserved and not overwritten

### Requirement: Internal only
`acceleratorState` is not exported from the public `index.ts`; it SHALL be accessed by other library modules only.

#### Scenario: Public API
- **WHEN** a consumer imports from the package entry point
- **THEN** `acceleratorState` is not available

### Requirement: Topic statistics
`isStatsEnabled()` SHALL return `true` only if `topic.statsEnabled === true` (initialised to `false` when absent). `increaseMessageCount(topicName, type)` and `increaseInstanceCount(topicName)` (internal, `logs.utils.ts`) SHALL count only when stats are enabled: message counts per topic and per `TopicMessageType` (`TopicNext`, `TopicGet`, `TopicResolve`, initialised to 0) and instances per topic.

#### Scenario: Stats disabled
- **WHEN** `statsEnabled` is not `true`
- **THEN** counters are not incremented

#### Scenario: Stats enabled
- **WHEN** `statsEnabled` is `true` and `increaseMessageCount('t','TopicNext')` is called twice
- **THEN** `messagesPublished.t.TopicNext` is `2`

> Note (code-derived): `increaseInstanceCount` initialises `instancesCreated` on `globalThis` directly rather than on `acceleratorState`, which is the same object in practice.
