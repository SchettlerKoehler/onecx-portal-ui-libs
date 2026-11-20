# ngrx-linter-rules Specification

## Purpose
`@onecx/ngrx-linter-rules` is an ESLint plugin with opinionated NgRx rules that keep side effects in effects and HTTP access out of components. It is consumed by OneCX application developers via ESLint configuration.

## Requirements

### Requirement: Plugin exports
The plugin SHALL export `rules`, `configs` and `plugin` (`{ rules, configs }`) and the type `NgrxLinterRulesPlugin`.

#### Scenario: Register as flat-config plugin
- **WHEN** a consumer registers `plugin` under `@onecx/ngrx-linter-rules`
- **THEN** the rules `no-store-dispatch-in-effect` and `http-calls-only-in-effects` are available

### Requirement: Recommended config
The `configs.recommended` config SHALL list `@onecx/ngrx-linter-rules` in `plugins` and enable every exported rule as `@onecx/ngrx-linter-rules/<rule-name>` with severity `warn`, generated from the exported `rules`.

#### Scenario: Recommended rule map
- **WHEN** a consumer spreads `configs.recommended.rules`
- **THEN** both rules are enabled with severity `warn` and can be overridden afterwards

### Requirement: Rule no-store-dispatch-in-effect
The rule `no-store-dispatch-in-effect` (type `problem`, no options, no autofix) SHALL report, with message id `noStoreDispatchInEffect`, every `<obj>.dispatch(...)` call located inside an effect class. A class is an effect class when its source text contains a `createEffect(` call (regardless of class name or decorators). Calls inside nested constructs (constructor, methods, RxJS operators such as `tap`/`map`) are reported.

When type information is available, the receiver's type symbol must be named `Store` to be reported; receivers without a resolvable symbol are reported. Without type information (or program) every `.dispatch` call is reported.

#### Scenario: Dispatch in effect class
- **WHEN** a class with `effect = createEffect(...)` calls `this.store.dispatch(...)` in its constructor, a method or an operator callback
- **THEN** each call is reported

#### Scenario: Dispatch outside effect classes
- **WHEN** a class without `createEffect(` or a plain function calls `store.dispatch(...)`
- **THEN** nothing is reported

#### Scenario: Test files are exempt
- **WHEN** the file name matches `.spec.ts`, `.test.ts`, `/testing/` or `/mocks/`
- **THEN** the rule reports nothing

> Note (code-derived): the rule requests parser services with type information optional (`getParserServices(context, true)`). With `super.dispatch` receivers are ignored. Only plain `ClassDeclaration` nodes are considered (not class expressions).

### Requirement: Rule http-calls-only-in-effects
The rule `http-calls-only-in-effects` (type `problem`, no options, no autofix) SHALL report, with message id `httpCallsOnlyInEffects`, HTTP calls made inside Angular components (classes decorated with `@Component(...)`) that are not in an effect class. The rule applies per class and ignores calls in classes that also contain `createEffect(`.

A call is considered an HTTP call when it is a member call and one of the following holds:
- the method is `get`, `post`, `put`, `patch` or `delete` and the receiver is an injected property of the class (`inject(...)` property initializer, or a constructor parameter property whose type name ends in `ApiService`, `ControllerService`, `Service` or `Api`) used as `this.x` or `x`;
- the method is an HTTP client method (`get`, `post`, `put`, `patch`, `delete`, `head`, `options`, `request`) called on `this.http` or `this.<name>` where the name equals `http` or ends in `HttpClient` (case-insensitive);
- the receiver name ends in `ApiService` (OpenAPI generated service), and the receiver is an injected property;
- the receiver is an identifier or `this.<prop>` that matches a name imported from a path containing `/generated/`, and it is an injected property;
- the method name is HTTP-like (`get`, `post`, `put`, `patch`, `delete`, or starts with these followed by an uppercase letter or underscore, for example `getUser`) and the receiver is an injected property.

#### Scenario: Direct HttpClient call in component
- **WHEN** a `@Component` class runs `this.http.get('/api')`
- **THEN** the call is reported

#### Scenario: Generated API service call
- **WHEN** a component injects a service (via constructor parameter property or `inject(...)`) and calls `this.api.getUser({})`
- **THEN** the call is reported

#### Scenario: Non-HTTP calls
- **WHEN** a component calls `this.x.doSomething()` on a non-service-typed constructor parameter, or only assigns model values
- **THEN** nothing is reported

#### Scenario: Effects, tests and generated files are exempt
- **WHEN** the class contains `createEffect(`, or the file name matches `.spec.ts`, `.test.ts`, `/testing/`, `/mocks/`, or the file path contains `/generated/`
- **THEN** nothing is reported

> Note (code-derived): classes that are not `@Component`-decorated (for example services) are never reported. The heuristics are name-based, so a constructor parameter typed with any `*Service` name is treated as potentially HTTP-capable and calls such as `this.userService.getAll()` are reported.
