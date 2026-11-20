# angular-linter-rules Specification

## Purpose
`@onecx/angular-linter-rules` is an ESLint plugin with opinionated Angular rules (RxJS subscribe handling and ngx-translate usage). It is consumed by OneCX application developers via ESLint configuration.

## Requirements

### Requirement: Plugin exports
The plugin SHALL export `rules` (a map of rule name to rule), `configs` (a map of config name to config) and `plugin` (an object `{ rules, configs }`) so that it can be registered in legacy and flat ESLint configurations. It SHALL also export the type `AngularLinterRulesPlugin`.

#### Scenario: Register as flat-config plugin
- **WHEN** a consumer registers `plugin` under the key `@onecx/angular-linter-rules`
- **THEN** the rules `no-subscribe-assignment`, `no-translate-instant` and `prefer-translate-params` are available under that namespace

### Requirement: Recommended config
The `configs.recommended` config SHALL list the plugin name `@onecx/angular-linter-rules` in `plugins` and enable EVERY rule of `rules` under the key `@onecx/angular-linter-rules/<rule-name>` with severity `warn`. The rule map SHALL be generated from the exported `rules`, so newly added rules are included automatically.

#### Scenario: Use the recommended rule map
- **WHEN** a consumer spreads `configs.recommended.rules` into a flat config
- **THEN** all three rules are enabled with severity `warn`

#### Scenario: Override severity
- **WHEN** a consumer sets a rule key after spreading the recommended rules (for example to `error` or `off`)
- **THEN** the later setting takes precedence

> Note (code-derived): `configs.recommended` has the legacy shape (`plugins` as a string array); flat-config users reuse only `configs.recommended.rules` (see docs).

### Requirement: Rule no-subscribe-assignment
The rule `no-subscribe-assignment` (type `problem`, no options, no autofix) SHALL report, with message id `assignmentOutside`, assignments made inside a function callback passed to a `.subscribe(...)` call to variables that are not declared in that callback's body, including assignments to `this.<member>`. The first function (arrow or function expression) among the arguments of the call is analysed.

Reported forms are: plain assignment `x = ...` to an identifier, destructuring assignments (object or array pattern) whose assigned identifiers are not local, update expressions `x++`/`x--` on an identifier, assignments to `this.<prop>` and update expressions on `this.<prop>`.

#### Scenario: Assigning an outer variable
- **WHEN** `of(1).subscribe((value) => { outer = value })` assigns a variable declared outside the callback
- **THEN** the assignment target is reported with `assignmentOutside`

#### Scenario: Assigning a class member
- **WHEN** a subscribe callback executes `this.value = value`
- **THEN** the `this.value` expression is reported

#### Scenario: Update expression and destructuring
- **WHEN** a subscribe callback executes `outer++` or `({ outer } = { outer: value })` on an outer variable
- **THEN** each is reported

#### Scenario: Local variables are allowed
- **WHEN** the callback only assigns to or declares variables declared with `const`/`let` directly in its own block body, including destructured declarations or a local that shadows an outer name
- **THEN** nothing is reported

> Note (code-derived): only top-level variable declarations in a block-bodied callback count as local; callback parameters are not treated as local, and assignments to member expressions other than `this.<prop>` (for example `obj.x = 1`) are not reported. Local declarations in nested blocks do not exempt assignments. Expression-bodied arrow callbacks have no local declarations. Subscribe calls are detected purely by the method name `subscribe`, without type information.

### Requirement: Rule no-translate-instant
The rule `no-translate-instant` (type `problem`, no options, no autofix) SHALL report, with message id `noTranslateInstant`, calls of `instant(...)` on an ngx-translate `TranslateService` in production code. The report node is the callee. Receivers recognised by name are the identifiers `translate` and `translateService` and the member expressions `this.translate` and `this.translateService`. When type information is available from the parser, receivers whose type is the `TranslateService` declared in `@ngx-translate/core` (or whose type prints as `TranslateService`) are also reported regardless of their name.

#### Scenario: Name-based detection
- **WHEN** production code calls `this.translate.instant('KEY')`, `translate.instant('KEY')` or `translateService.instant('KEY')`
- **THEN** the call is reported

#### Scenario: Type-based detection
- **WHEN** a receiver is typed as `TranslateService` from `@ngx-translate/core` and the call is `instant`
- **THEN** it is reported

#### Scenario: Unrelated instant methods
- **WHEN** `other.instant('KEY')` is called on an object that is neither named `translate`/`translateService` nor typed as `TranslateService`
- **THEN** nothing is reported

#### Scenario: Test and helper files are exempt
- **WHEN** the linted file name matches `.spec.ts`, `.test.ts`, contains `/testing/` or `/mocks/` (case-insensitive)
- **THEN** the rule reports nothing

> Note (code-derived): files without a real file name (`<input>`, `<text>`) are never exempt. The message advises using `get`/`stream` or the translate pipe.

### Requirement: Rule prefer-translate-params
The rule `prefer-translate-params` (type `suggestion`, no options, no autofix) SHALL report, with message id `preferTranslateParams`, string building that concatenates translated strings instead of using translation parameters. The following forms are reported:
- a binary `+` expression where either operand is a call to `.get(...)`, `.stream(...)` or `.instant(...)`, or a template pipe expression `x | translate`;
- a template literal that interpolates a call to `.get(...)`, `.stream(...)` or `.instant(...)`;
- a `.get(...).pipe(...)` or `.stream(...).pipe(...)` call whose arguments contain a binary `+` anywhere.

#### Scenario: Concatenation inside pipe
- **WHEN** code runs `translate.get('HELLO').pipe(map((t) => t + name))` or `translate.stream(...)` equivalent
- **THEN** the pipe call is reported

#### Scenario: Template literal interpolation
- **WHEN** a template literal contains `${translate.instant('HELLO')} ${name}`
- **THEN** the template literal is reported

#### Scenario: Parameters or key concatenation are fine
- **WHEN** code calls `translate.get('HELLO_NAME', { name })`, or concatenates only the key argument (`translate.get('HELLO_' + name)`)
- **THEN** nothing is reported

#### Scenario: Test files are exempt
- **WHEN** the file matches `.spec.ts`, `.test.ts`, `/testing/` or `/mocks/`
- **THEN** the rule registers no listeners and reports nothing

> Note (code-derived): detection is syntactic (method names `get`/`stream`/`instant`), not limited to `TranslateService` receivers, so any `x.get(...) + y` is reported.
