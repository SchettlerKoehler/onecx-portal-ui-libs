# angular-accelerator-permissions Specification

## Purpose
Lets consumers show, hide or disable template content depending on the permissions of the current user, using the structural directive `IfPermissionDirective` (`*ocxIfPermission`, `*ocxIfNotPermission`) and the types `PermissionInput` and `OnMissingPermission`. Also documents the deprecated re-exports of the permission checker tokens.

## Requirements

### Requirement: Permission source required
`IfPermissionDirective` SHALL require either a `HAS_PERMISSION_CHECKER` provider or a `UserService`; if neither is available, creating the directive MUST throw.

#### Scenario: No provider available
- **WHEN** the directive is instantiated and neither `HAS_PERMISSION_CHECKER` nor `UserService` is provided
- **THEN** it throws the error `IfPermission requires UserService or HasPermissionChecker to be provided!`

> Note (code-derived): a plain string is thrown, not an `Error` instance.

### Requirement: Permission checker precedence
The directive SHALL use the `HAS_PERMISSION_CHECKER` provider if present and otherwise fall back to `UserService`. If the checker offers `getPermissions()`, the directive SHALL evaluate the permissions against that stream (re-evaluating on every emission); otherwise, if it offers `hasPermission(permissions)`, the directive SHALL use that result; if it offers neither, access SHALL be treated as denied.

#### Scenario: Checker with getPermissions
- **WHEN** the checker emits a new permission list
- **THEN** the view is re-evaluated and shown or removed accordingly

#### Scenario: Checker with hasPermission only
- **WHEN** the checker has no `getPermissions` but `hasPermission` resolves true for the required permissions
- **THEN** the content is shown

### Requirement: Positive permission check
`*ocxIfPermission` SHALL accept a `PermissionInput` (`string | string[] | undefined`). A single string is treated as a one-element list. Content SHALL be rendered only if the user holds ALL listed permissions.

#### Scenario: User has permission
- **WHEN** `ocxIfPermission="X"` and the user has `X`
- **THEN** the host template is rendered

#### Scenario: Multiple permissions
- **WHEN** `ocxIfPermission` is an array and the user lacks one entry
- **THEN** the content is not rendered

#### Scenario: Undefined or empty input
- **WHEN** the permission input is `undefined` or an empty array
- **THEN** the permission is treated as not granted and the content is not shown (the missing-permission handling applies)

### Requirement: Negated permission check
`*ocxIfNotPermission` SHALL render content only when the user does NOT hold all listed permissions. If `ocxIfNotPermission` is defined, it takes precedence over `ocxIfPermission`.

#### Scenario: User lacks permission
- **WHEN** `ocxIfNotPermission="X"` and the user does not have `X`
- **THEN** the content is shown

#### Scenario: User has permission
- **WHEN** `ocxIfNotPermission="X"` and the user has `X`
- **THEN** the content is not shown

> Note (code-derived): with an undefined or empty `ocxIfNotPermission` value the content is not shown (the empty-list short-circuit denies before negation is applied), unlike a naive negation.

### Requirement: Permission override list
The inputs `ocxIfPermissionPermissions` / `ocxIfNotPermissionPermissions` (`string[]`) SHALL, when set, replace the checker as permission source; the directive checks that every required permission is contained in that list.

#### Scenario: Override grants
- **WHEN** the override list contains all required permissions
- **THEN** the content is shown without consulting the checker

#### Scenario: Override lacks permission
- **WHEN** the override list misses a required permission
- **THEN** access is denied and a debug message is logged

### Requirement: Else template
`ocxIfPermissionElseTemplate` / `ocxIfNotPermissionElseTemplate` (`TemplateRef`) SHALL be rendered when the check does not pass; it takes precedence over `OnMissingPermission` handling.

#### Scenario: Else template shown
- **WHEN** the check fails and an else template is given
- **THEN** the else template is rendered and the main template is not

### Requirement: Missing permission behaviour
`ocxIfPermissionOnMissingPermission` / `ocxIfNotPermissionOnMissingPermission` (`OnMissingPermission`: `'hide'` | `'disable'`, default `'hide'`) SHALL control what happens when the check fails and no else template exists. With `'hide'` nothing is rendered. With `'disable'` the host template is rendered and its first root node receives the attribute `disabled="disabled"`.

#### Scenario: Disable mode
- **WHEN** the check fails and the mode is `'disable'`
- **THEN** the content is rendered with `disabled` set on its root element

#### Scenario: Permission later granted
- **WHEN** a disabled view exists and the permission becomes granted
- **THEN** the view is recreated and the `disabled` attribute is removed

### Requirement: Reactivity
The directive SHALL re-evaluate when its inputs change or when the permission stream emits, and SHALL stop observing when destroyed.

#### Scenario: Permissions change at runtime
- **WHEN** the user's permissions change from missing to granted
- **THEN** the content appears without recreating the directive

### Requirement: Deprecated permission checker exports
`HasPermissionChecker`, `AlwaysGrantPermissionChecker` and `HAS_PERMISSION_CHECKER` exported from this library's injection-tokens SHALL be re-exports of the same symbols from `@onecx/angular-utils` and are deprecated in favour of importing from there.

#### Scenario: Same symbol
- **WHEN** a consumer imports `HAS_PERMISSION_CHECKER` from either package
- **THEN** it is the identical token
