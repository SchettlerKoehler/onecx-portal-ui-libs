# integration-interface-icons Specification

## Purpose
Coordinates icon loading between microfrontends and the shell. Consumers request icons by name through `IconService`; the shell loads them and answers with `IconsReceived`. A shared global cache `globalThis.onecxIcons` holds results.

## Requirements

### Requirement: Icon topic and models
`IconTopic` SHALL be registered as `icon` version 1 without retained state and carry `Icon` messages: `IconRequested` (`type: 'IconRequested'`, `name`, the real icon name such as `mdi:xxx`) or `IconsReceived` (`type: 'IconsReceived'`). `IconCache` SHALL have `name`, `type`, `body` and optional `parent`. `IconClassType` SHALL be `'svg' | 'background' | 'background-before'`.

#### Scenario: Request message
- **WHEN** an icon is requested
- **THEN** the message is `{ type: 'IconRequested', name }`

### Requirement: Icon cache initialization
`ensureIconCache()` SHALL create `globalThis.onecxIcons` as `{}` when missing and SHALL NOT overwrite an existing cache. `new IconService()` SHALL call it. In the cache `undefined` means requested but not loaded, `null` means not found, and `IconCache` means available.

#### Scenario: Existing cache
- **WHEN** `ensureIconCache()` is called with an existing cache
- **THEN** existing entries are kept

### Requirement: Class name generation
`normalizeIconName(name)` SHALL replace every run of characters outside `[a-zA-Z0-9_-]` with a single `-`. `generateClassName(name, classType)` SHALL return `onecx-theme-icon-<classType>-<normalizedName>`.

#### Scenario: MDI icon
- **WHEN** `generateClassName('mdi:home', 'svg')` is called
- **THEN** the result is `onecx-theme-icon-svg-mdi-home`

### Requirement: Synchronous icon request
`IconService.requestIcon(name, classType = 'background-before')` SHALL return the generated class name immediately. If `name` is not yet a key in the cache, it SHALL register the name with value `undefined` and publish `IconRequested`; if the name is already a key (value object, `null` or `undefined`), it SHALL NOT publish again.

#### Scenario: First request
- **WHEN** an unknown icon is requested
- **THEN** the class name is returned and one `IconRequested` is published

#### Scenario: Repeated request
- **WHEN** the same icon is requested again
- **THEN** no further message is published

### Requirement: Asynchronous icon request
`requestIconAsync(name, classType?, fallbackClass?)` SHALL issue `requestIcon` and then: return `fallbackClass ?? null` if the cache holds `null`; return the class name if the cache holds an icon; otherwise wait for an `IconsReceived` message after which the cache entry for `name` is no longer `undefined`, and return the class name if an icon was loaded or `fallbackClass ?? null` if not found.

#### Scenario: Icon arrives later
- **WHEN** the icon is pending and the shell fills the cache and publishes `IconsReceived`
- **THEN** the promise resolves with the class name

#### Scenario: Icon not found
- **WHEN** the cache entry becomes `null` after `IconsReceived`
- **THEN** the promise resolves with the fallback class, or `null` if none given

### Requirement: Topic override and cleanup
`iconTopic` SHALL be lazily created once and replaceable via setter; `destroy()` SHALL destroy it.

#### Scenario: Same instance
- **WHEN** `iconTopic` is read twice
- **THEN** the same instance is returned
