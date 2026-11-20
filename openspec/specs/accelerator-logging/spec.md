# accelerator-logging Specification

## Purpose
Provides a factory for namespaced `debug`-based loggers so OneCX libraries and applications can emit diagnostics that are off by default and selectively enabled (e.g. via `localStorage.debug`).

## Requirements

### Requirement: Logger factory creation
`createLoggerFactory(libOrAppName)` SHALL return a `CreateLogger` function bound to the given library/application name. The name MUST be trimmed, and the system MUST throw an `Error` with message `createLoggerFactory(libOrAppName): libOrAppName must be a non-empty string.` when the trimmed name is empty.

#### Scenario: Valid name
- **WHEN** `createLoggerFactory("  accelerator  ")` is called
- **THEN** a function is returned and loggers it creates use the prefix `accelerator`

#### Scenario: Blank name
- **WHEN** `createLoggerFactory("  ")` is called
- **THEN** an `Error` with the message above is thrown immediately

### Requirement: Component logger namespaces
`CreateLogger(location)` SHALL return a `ComponentLogger` with `debug`, `info`, `warn` and `error` members, each a `debug` instance whose namespace is `<libName>:<location>:<level>`. The location MUST be trimmed and MUST NOT be empty; otherwise an `Error` with message `createLogger(location): location must be a non-empty string.` SHALL be thrown.

#### Scenario: Namespace format
- **WHEN** `createLoggerFactory("my-lib")("MyComponent")` is called
- **THEN** the namespaces `my-lib:MyComponent:debug`, `:info`, `:warn` and `:error` are created

#### Scenario: Location is trimmed
- **WHEN** a logger is created with location `"  Topic  "` for prefix `accelerator`
- **THEN** the namespace is `accelerator:Topic:info` for the info level

#### Scenario: Blank location
- **WHEN** a logger is created with location `"\n\t "`
- **THEN** the location error is thrown

### Requirement: Console output
Log output SHALL be written through `console.log` (the `debug` output function is bound to `console.log`), and logging SHALL be disabled unless the namespace is enabled via `debug` configuration (see docs "Browser Logging").

#### Scenario: Not enabled
- **WHEN** no `debug` namespace matching the logger is enabled
- **THEN** calls to the logger produce no output

> Note (code-derived): binding `debug.log` is a module-level side effect that applies to all `debug` users in the same bundle once this module is imported.

### Requirement: Internal accelerator logger
The accelerator library SHALL use an internal logger factory with prefix `@onecx/accelerator`. This internal `createLogger` (in `logger.utils.ts`) MUST NOT be exported from the public `index.ts`.

#### Scenario: Namespace of accelerator logs
- **WHEN** the `Gatherer` logs for gatherer `foo`
- **THEN** the namespace is `@onecx/accelerator:Gatherer:foo:<level>`
