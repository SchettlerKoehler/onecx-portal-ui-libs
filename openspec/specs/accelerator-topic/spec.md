# accelerator-topic Specification

## Purpose
`Topic` provides a cross-application publish/subscribe channel on top of browser-level messaging (BroadcastChannel or `window.postMessage`), so that independently built OneCX UI apps loaded in one page or browser can share state. It is used by library and app authors; `FakeTopic` and `BroadcastChannelMock` support testing.

## Requirements

### Requirement: Topic identity
A `Topic` and a `TopicPublisher` SHALL be constructed with a `name` and a numeric `version`. Two instances communicate only when both name and version are equal.

#### Scenario: Different name or version is ignored
- **WHEN** a message for topic `a` version 1 is received by a `Topic` named `b` or with version 2
- **THEN** the `Topic` SHALL NOT emit a value for it

### Requirement: Publishing a value
`publish(value)` SHALL send a `TopicNext` message carrying the value, followed by a `TopicResolve` message referencing the message id, and SHALL return a `Promise<void>`.

#### Scenario: Promise resolves after receipt
- **WHEN** a `Topic` calls `publish` and a `Topic` instance with the same name and version receives the resolve message
- **THEN** the returned promise SHALL resolve
- **AND** the resolver for that message id SHALL be removed

#### Scenario: Awaited publish gives all instances the value
- **WHEN** `publish` is awaited on one instance
- **THEN** all instances with the same name and version in the same context SHALL have received the value

#### Scenario: Unawaited publish
- **WHEN** `publish` is called without awaiting
- **THEN** other instances MAY not yet have the value (delivery is asynchronous when BroadcastChannel is used)

> Note (code-derived): the promise resolves only when some `Topic` instance (not a bare `TopicPublisher`) with that name and version handles the resolve message; a resolve handler that throws is logged and the promise remains pending.

### Requirement: Subscription semantics
`Topic` SHALL implement the rxjs `Subscribable` interface with `subscribe`, `pipe` and `asObservable`. It SHALL emit nothing until initialized, then emit the current value to each new subscriber and every later value.

#### Scenario: Late subscriber receives latest value
- **WHEN** a subscriber subscribes after a value has been received
- **THEN** it SHALL immediately receive the latest value only

#### Scenario: No emission before init
- **WHEN** no value has been received yet
- **THEN** subscribers SHALL receive nothing

#### Scenario: Pipe
- **WHEN** `pipe(map(v => v.length))` is used
- **THEN** the resulting observable SHALL emit the mapped latest value

### Requirement: Initialization
`Topic.isInitialized` SHALL be a promise that resolves when the first value has been received.

#### Scenario: First value resolves isInitialized
- **WHEN** the first `TopicNext` message for the topic is accepted
- **THEN** `isInitialized` SHALL resolve

### Requirement: Deprecated rxjs compatibility members
`Topic` SHALL expose `source`, `operator`, `lift`, `forEach` and `toPromise` (all deprecated) delegating to its observable.

#### Scenario: forEach
- **WHEN** `forEach` is called
- **THEN** it SHALL invoke the callback for emitted values

### Requirement: Late-join state request
Unless the constructor argument `sendGetMessage` is `false` (default `true`), a new `Topic` SHALL send a `TopicGet` message so that an existing initialized instance answers with its current value.

#### Scenario: Existing instance answers
- **WHEN** a new `Topic` is created while another initialized instance holds a value
- **THEN** the existing instance SHALL re-send its current data message
- **AND** the new instance SHALL end up with the same value

#### Scenario: Get answered only when initialized
- **WHEN** an instance with no value receives `TopicGet`
- **THEN** it SHALL NOT respond

#### Scenario: Delayed get during startup
- **WHEN** the topic is created within 2000 ms of the accelerator state's `initDate`
- **THEN** the `TopicGet` message SHALL be sent after 100 ms
- **AND** it SHALL NOT be sent if the topic was initialized in the meantime

#### Scenario: Get disabled
- **WHEN** `sendGetMessage` is `false`
- **THEN** no `TopicGet` SHALL be sent

> Note (code-derived): the answering instance stops propagation of the `TopicGet` event, so only one responder replies on the window path.

### Requirement: Message ordering and conflict resolution
A received `TopicNext` message SHALL be accepted when the topic has no value yet; otherwise, once initialized, when its `id` is greater than the current id (both ids defined) or its `timestamp` is greater than the current timestamp. Other messages SHALL be dropped.

#### Scenario: Newer id accepted
- **WHEN** an incoming message has a greater id than the current value
- **THEN** it SHALL replace the value

#### Scenario: Older-version message with newer timestamp
- **WHEN** messages lack ids (old library versions) and the timestamp is greater
- **THEN** it SHALL be accepted

#### Scenario: Equal timestamp with mixed id presence
- **WHEN** timestamps are equal and exactly one of the two messages has an id
- **THEN** the incoming message SHALL be dropped
- **AND** a warning SHALL be logged recommending upgrade of all libraries

#### Scenario: Equal timestamp, both with ids, smaller id
- **WHEN** timestamps are equal and the incoming id is not greater
- **THEN** the message SHALL be dropped without a warning

> Note (code-derived): a message with equal timestamp and neither id present is dropped silently.

### Requirement: Message model
`Message` SHALL carry a `type`, a `timestamp` and a unique, increasing `id` taken from a process-global counter (`globalThis.onecxMessageId`, starting at 1). The timestamp SHALL be `performance.now()` when available, else `Date.now()`. `TopicMessage` adds `name` and `version`; `TopicDataMessage` adds `data`; `TopicResolveMessage` adds `resolveId`. Message types are `TopicNext`, `TopicGet`, `TopicResolve`.

#### Scenario: Timestamp fallback
- **WHEN** `performance.now` is unavailable
- **THEN** the message timestamp SHALL come from `Date.now()`

#### Scenario: Unique ids
- **WHEN** two messages are created
- **THEN** the second SHALL have a larger id

> Note (code-derived): when stats are enabled, creating a `TopicMessage` increments a message counter per topic name and type; `Topic` construction increments an instance counter.

### Requirement: Transport selection
Messages SHALL be sent through BroadcastChannel when `acceleratorState['@onecx/accelerator'].topic.useBroadcastChannel` is truthy, and otherwise through `globalThis.postMessage(message, '*')`. The default value SHALL be `'V2'`. With `'V2'`, messages use a per-tab channel `TopicV2-<name>|<version>-<tabId>`; with `true`, the legacy channel `Topic-<name>|<version>`.

#### Scenario: V2 per-tab isolation
- **WHEN** two topics with the same name are created under different `tabId` values and one publishes
- **THEN** only the topic with the same `tabId` SHALL receive the value

#### Scenario: BroadcastChannel unsupported
- **WHEN** `BroadcastChannel` is undefined
- **THEN** the setting SHALL be set to `false` and an info message logged
- **AND** messages SHALL use `window.postMessage`

#### Scenario: No postMessage available
- **WHEN** BroadcastChannel is disabled and `postMessage` is not a function
- **THEN** sending SHALL throw a `TypeError`

#### Scenario: Channels created lazily
- **WHEN** a publisher first sends a message
- **THEN** the publish channels SHALL be created if not yet existing

### Requirement: Automatic downgrade of transport
A `Topic` SHALL downgrade the transport when it observes traffic from older libraries.

#### Scenario: Window message received
- **WHEN** a `TopicNext`, `TopicGet` or `TopicResolve` message arrives via `window` `message` events
- **THEN** `useBroadcastChannel` SHALL be set to `false`

#### Scenario: Legacy channel message under V2
- **WHEN** a message arrives on the legacy channel
- **THEN** `useBroadcastChannel` SHALL be set to `true`
- **AND** the message SHALL be handled as usual

> Note (code-derived): `disableBroadcastChannelV2` assigns `true` unconditionally, even when the value was not `'V2'` (only the log is conditional). Also, `TopicResolve` window messages are handled without checking name and version of the message; matching relies on `resolveId`.

### Requirement: Destroy
`destroy()` SHALL remove the window message listener (when `removeEventListener` is available) and close all read and publish channels.

#### Scenario: Destroyed topic stops receiving
- **WHEN** `destroy` is called
- **THEN** the window listener SHALL be removed
- **AND** the BroadcastChannels SHALL be closed

#### Scenario: Missing listener APIs
- **WHEN** `globalThis.addEventListener`/`removeEventListener` is not a function
- **THEN** construction and destroy SHALL skip the respective call without error

### Requirement: SyncableTopic (deprecated)
`SyncableTopic<T>` SHALL extend `Topic` and provide `getValue()` returning the current value synchronously, or `undefined` until initialized.

#### Scenario: Value after init
- **WHEN** the topic is initialized
- **THEN** `getValue()` SHALL return the latest value

#### Scenario: No read-after-write
- **WHEN** `getValue()` is called immediately after an unawaited `publish`
- **THEN** it MAY return the previous value or `undefined`

### Requirement: TopicPublisher
`TopicPublisher<T>` SHALL offer `publish` and message sending without subscription capability, with the same name/version and transport rules as `Topic`.

#### Scenario: V2 publisher
- **WHEN** the setting is `'V2'`
- **THEN** the publisher SHALL post on its V2 channel

### Requirement: FakeTopic test double
`FakeTopic<T>` SHALL replace a `Topic` in tests without messaging. With an initial value it SHALL behave like a `BehaviorSubject`; without one, like a `ReplaySubject(1)`. `publish` SHALL emit synchronously and return a resolved promise, `isInitialized` SHALL resolve immediately, `destroy` SHALL complete the stream, and `FakeTopic.create(initial?)` SHALL return an instance typed as `Topic<T>`.

#### Scenario: getValue with initial value
- **WHEN** created with an initial value
- **THEN** `getValue()` SHALL return the latest value

#### Scenario: getValue without initial value
- **WHEN** created without one
- **THEN** `getValue()` SHALL throw `Error('Only possible for FakeTopic with initial value')`

> Note (code-derived): an explicit initial value of `undefined` is treated as no initial value.

### Requirement: BroadcastChannelMock
`BroadcastChannelMock` SHALL simulate BroadcastChannel in tests by delivering `postMessage` payloads to all listeners registered under the same channel name, synchronously, or via `setTimeout(0)` when static `asyncCalls` is true. `close` SHALL remove the channel's listener.

#### Scenario: Delivery to same-name channels
- **WHEN** a message is posted on a mock channel
- **THEN** all listeners for that name SHALL receive an event with `data` and no-op `stopPropagation`/`stopImmediatePropagation`

> Note (code-derived): the mock also delivers to the posting channel's own listeners, unlike real BroadcastChannel; each channel remembers only its last listener for `close`.
