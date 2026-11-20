# accelerator-gatherer Specification

## Purpose
`Gatherer` implements the Scatter-Gather pattern across all instances (e.g. micro-frontends) sharing the same global accelerator state: one instance publishes a request and collects responses from all other instances listening on the same name and version.

## Requirements

### Requirement: Scatter request and gather responses
`Gatherer<Request, Response>.gather(request)` SHALL publish the request on an internal `Topic` named by the gatherer's `name` and `version` and resolve with an array of `Response` values, one from each other live `Gatherer` instance with the same name/version whose callback resolved.

#### Scenario: Multiple responders
- **WHEN** three gatherers share a name and one calls `gather(req)`
- **THEN** the promise resolves with the responses of the other instances' callbacks

#### Scenario: No responders
- **WHEN** no other instance exists
- **THEN** `gather` resolves with an empty array

### Requirement: Own requests are not answered
A `Gatherer` SHALL NOT invoke its own callback for requests it published itself.

#### Scenario: Self request
- **WHEN** a gatherer calls `gather`
- **THEN** its own callback is not called and its response is not in the result

### Requirement: Responder callback
When a request from another instance arrives, the gatherer SHALL register a pending promise for the request id and invoke the constructor `callback(request)`; the promise SHALL resolve with the callback's result.

#### Scenario: Callback result
- **WHEN** a foreign request arrives and the callback resolves with `"x"`
- **THEN** the gather result of the requester contains `"x"`

> Note (code-derived): a rejecting callback is not handled; the pending promise never resolves, so `gather` would not settle.

### Requirement: Uninitialized state
`gather` SHALL reject with `Error('Gatherer is not initialized')` when the shared gatherer promises registry is missing. When a request id has no registry entry on the responder side, the responder MUST log a warning and ignore the request.

#### Scenario: Missing registry
- **WHEN** the global gatherer promises registry is absent and `gather` is called
- **THEN** it rejects with `Gatherer is not initialized`

#### Scenario: Unknown request id
- **WHEN** a request arrives whose id is not in the registry
- **THEN** a warning is logged and the callback is not invoked

### Requirement: Destroy
`destroy()` SHALL unsubscribe from the topic, destroy the topic, and remove registry entries for ids it still owns. A destroyed gatherer SHALL no longer contribute responses.

#### Scenario: Destroyed responder
- **WHEN** a responder is destroyed and another instance calls `gather`
- **THEN** the destroyed instance's callback is not called

### Requirement: Debug logging
The gatherer SHALL log creation, received requests, answers, completion and destruction at debug level under namespace `@onecx/accelerator:Gatherer:<name>`.

#### Scenario: Debug enabled
- **WHEN** debug logging is enabled and a request is answered
- **THEN** received and answered messages are logged

> Note (code-derived): request ids come from a shared counter in global state (`gatherer.id`), so ids are unique across library copies. The internal topic is created with the third constructor argument `false`.
