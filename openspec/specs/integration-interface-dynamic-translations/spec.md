# integration-interface-dynamic-translations Specification

## Purpose
Allows microfrontends to request translation bundles ("contexts") for a locale from the shell via `DynamicTranslationsTopic`, with a shared global cache and semantic-version matching. Provided by `DynamicTranslationService`.

## Requirements

### Requirement: Dynamic translations topic messages
`DynamicTranslationsTopic` SHALL be registered as `dynamicTranslations` version 1 without retained state. Messages SHALL be `TranslationsRequested` (`type: REQUESTED`, `locale`, `contexts: {name, version?}[]`) or `TranslationsReceived` (`type: RECEIVED`). `DynamicTranslationsMessageType` MUST have `REQUESTED` and `RECEIVED`.

#### Scenario: Publish and receive
- **WHEN** a `REQUESTED` message with several versioned contexts, or with an empty `contexts` array, is published
- **THEN** a subscriber receives an equal message

### Requirement: Shared cache
`getDynamicTranslationsCache()` SHALL return a cache stored on `globalThis['@onecx/integration-interface'].dynamicTranslationsCache`, organized as locale -> context name -> version -> translations. A cache value of `undefined` SHALL mean requested but not yet received, and `null` SHALL mean no translations exist. The key `UNVERSIONED_KEY` (`'undefined'`) SHALL be used for contexts without version.

#### Scenario: Cache created on demand
- **WHEN** `getDynamicTranslationsCache()` is called and nothing exists yet
- **THEN** an empty object is created and returned; later calls return the same object

### Requirement: Shell capability gate
`getTranslations(locale, contexts)` SHALL return an observable emitting a record keyed by context key. If the shell capability `ShellCapability.DYNAMIC_TRANSLATIONS_TOPIC` is not registered (including when capabilities are undefined), it SHALL emit a record with an empty object per context and SHALL NOT publish a request.

#### Scenario: Unsupported shell
- **WHEN** the capability is not present
- **THEN** the result is `{ [contextKey]: {} }` for each context

### Requirement: Context key naming
The result key of a context SHALL be `name@version` when a version is given and `name` otherwise.

#### Scenario: Versioned key
- **WHEN** context `{name:'common', version:'^1.0.0'}` is resolved
- **THEN** the result key is `common@^1.0.0`

### Requirement: Request missing translations
For contexts absent from the cache, the service SHALL mark them as requested (`undefined` value under the requested version or `UNVERSIONED_KEY`) and publish one `REQUESTED` message with locale and the missing contexts (name and version only). Contexts already requested or cached SHALL NOT be requested again.

#### Scenario: Missing context
- **WHEN** a context is not cached
- **THEN** one `REQUESTED` message with that context is published

### Requirement: Wait for pending translations
If any context is missing or pending, the returned observable SHALL wait for `RECEIVED` messages (ignoring other messages), re-collect from cache after each, and emit once when all contexts are complete, then complete.

#### Scenario: Response arrives
- **WHEN** the cache is filled and a `RECEIVED` message is published
- **THEN** the observable emits the collected translations and completes

#### Scenario: Partial availability
- **WHEN** a `RECEIVED` message arrives but a context is still pending
- **THEN** nothing is emitted until all are available

### Requirement: Immediate result from cache
If all contexts are cached, `getTranslations` SHALL emit immediately via `of(...)`. An empty `contexts` array SHALL yield an empty record. Contexts whose cached value is `null` SHALL be omitted from the result.

#### Scenario: Null cached
- **WHEN** a context is cached as `null`
- **THEN** it is skipped and does not block completion

### Requirement: Version matching
For a context without version (or `'undefined'`), the first cached version key SHALL be used. For a requested version, the service SHALL prefer an exact key match, otherwise the highest cached version (descending semver order) that satisfies the requested semver range (supporting `^`, `~`, `>=`, `>`, `<=`, `<`, `=`, `||`, space-separated AND ranges and hyphen ranges, prereleases included). Cached keys that are not valid semver SHALL be ignored for range matching, and invalid requested ranges SHALL match nothing. If no version matches but some cached version for the context is `null`, the context SHALL be treated as having no translations; otherwise it is treated as missing.

#### Scenario: Highest satisfying version
- **WHEN** versions `1.0.0`, `1.2.0`, `2.0.0` are cached and `^1.0.0` is requested
- **THEN** the `1.2.0` translations are returned

#### Scenario: Invalid range
- **WHEN** the requested range is unparseable
- **THEN** no version matches and the context is requested as missing

### Requirement: Prototype-pollution protection
Contexts whose `name` or `version`, and locales, equal `__proto__`, `prototype` or `constructor` SHALL be rejected: unsafe contexts are filtered out before processing, and an unsafe locale yields an empty record per safe context without cache access or requests.

#### Scenario: Unsafe locale
- **WHEN** locale is `__proto__`
- **THEN** an empty record per context is emitted and nothing is published

### Requirement: Topic override and cleanup
`dynamicTranslationsTopic$` SHALL be lazily created and replaceable via its setter. `destroy()` SHALL destroy the topic.

#### Scenario: Destroy
- **WHEN** `destroy()` is called
- **THEN** the underlying topic is destroyed
