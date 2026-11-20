# angular-utils-permissions Specification

## Purpose
Part of `@onecx/angular-utils`. Offers an Angular permission service and pluggable permission checkers, plus the `ocx-portal-page` component that guards page content by permission and publishes page information (for help management) to the app state.

## Requirements

### Requirement: HasPermissionChecker contract and tokens
`HasPermissionChecker` SHALL declare `hasPermission(key | keys): Promise<boolean>` and an optional `getPermissions(): Observable<string[]>`. `HAS_PERMISSION_CHECKER` SHALL be the injection token for it.

#### Scenario: Token
- **WHEN** a checker is provided under `HAS_PERMISSION_CHECKER`
- **THEN** `PermissionService` uses it in preference to `UserService`

### Requirement: Checker providers
`providePermissionChecker()` SHALL provide `HAS_PERMISSION_CHECKER` through `hasPermissionCheckerFactory`, using an already existing parent checker if available. `provideAlwaysGrantPermissionChecker()` SHALL provide `AlwaysGrantPermissionChecker`, whose `hasPermission` always resolves `true`. `providePermissionService()` SHALL return `[PermissionService]`.

#### Scenario: Always grant
- **WHEN** `provideAlwaysGrantPermissionChecker()` is used
- **THEN** `hasPermission('x')` resolves `true`

### Requirement: hasPermissionCheckerFactory
`hasPermissionCheckerFactory(parentInjector, existing)` SHALL return `existing` if it is non-null. Otherwise it SHALL create a child injector that provides `HAS_PERMISSION_CHECKER` as `UserService` (adding a new `UserService` instance when the parent injector has none) and return that checker.

#### Scenario: No checker and no UserService
- **WHEN** neither a checker nor `UserService` exist
- **THEN** a new `UserService` instance is created and returned as checker

### Requirement: PermissionService construction
`PermissionService` SHALL optionally inject `UserService` and `HAS_PERMISSION_CHECKER` and SHALL throw `UserService or HasPermissionChecker have to be provided to check permissions!` in its constructor if neither is available.

#### Scenario: Nothing provided
- **WHEN** neither dependency exists
- **THEN** instantiation throws

### Requirement: hasPermission
`PermissionService.hasPermission(keyOrKeys)` SHALL return an observable of a boolean. With a `HAS_PERMISSION_CHECKER` that implements `getPermissions` it SHALL evaluate against the emitted permissions (a single key must be included; an array requires every key). Otherwise it SHALL delegate to the checker's or `UserService`'s `hasPermission` promise. Observables SHALL be cached per `JSON.stringify(key)` so the same instance is returned for repeated calls (avoiding re-render loops in templates).

#### Scenario: Array of permissions
- **WHEN** an array is passed
- **THEN** the result is true only if all permissions are granted

#### Scenario: Caching
- **WHEN** `hasPermission('a')` is called twice
- **THEN** the same observable instance is returned

> Note (code-derived): The "returns false" fallback observable is only reachable if no checker exists, which the constructor already forbids.

### Requirement: getPermissions
`getPermissions()` SHALL return the `UserService.getPermissions()` observable when `UserService` is available (cached), else an observable emitting `undefined`.

#### Scenario: No UserService
- **WHEN** only a custom checker is provided
- **THEN** `getPermissions()` emits `undefined`

### Requirement: ocx-portal-page access control
`PortalPageComponent` (`ocx-portal-page`) SHALL have inputs `permission`, `helpArticleId`, `pageName`, `applicationId` (all default `''`). It SHALL evaluate access via `PermissionService.hasPermission(permission)` whenever `permission` changes, treating an empty permission as granted. While access is unresolved nothing is rendered; when granted the projected content is rendered; when denied it SHALL render translated unauthorized title and message (`OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE`, `UNAUTHORIZED_MESSAGE`, `MISSING_PERMISSION` with the permission).

#### Scenario: No permission
- **WHEN** `permission` is empty
- **THEN** the content is shown without calling the permission service

#### Scenario: Denied
- **WHEN** the permission check yields `false`
- **THEN** the unauthorized heading and message are shown instead of the content

### Requirement: ocx-portal-page publishes page info
On init the component SHALL publish to `AppStateService.currentPage$` an object `{ path: document.location.pathname, helpArticleId, permission, pageName, applicationId }`, and log a warning including the URL path when `helpArticleId` is empty.

#### Scenario: Missing help article
- **WHEN** `helpArticleId` is not set
- **THEN** a warning is logged and the page info is still published

> Note (code-derived): The component logs permission checks with `console.debug`. Page info is published once on init and not updated on later input changes.

### Requirement: Template and appearance - ocx-portal-page DOM structure
`PortalPageComponent` (selector `ocx-portal-page`, standalone, imports `CommonModule` and `TranslateModule`, styles from `portal-page.component.scss` with default emulated encapsulation, change detection `Eager`) SHALL render a single `<div class="content-wrapper">` as the only template root. Inside it the template evaluates `@let accessAllowed = (hasAccess$ | async)` and renders nothing while `accessAllowed` is `null` (pending). When `accessAllowed` is truthy it SHALL render `<ng-content>` (default slot only, no named slots). When it is falsy it SHALL render, directly inside `.content-wrapper`, `<h3>{{'OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE' | translate}}</h3>` followed by `<p>` containing the text `{{'OCX_PORTAL_PAGE.UNAUTHORIZED_MESSAGE' | translate}}` and a nested `<span>{{'OCX_PORTAL_PAGE.MISSING_PERMISSION' | translate : {permission: permission} }}</span>`. The template has no `data-testid`, no ARIA attributes, no roles and no `pTooltip`.

#### Scenario: Granted
- **WHEN** `hasPermission` emits `true`
- **THEN** the DOM is `ocx-portal-page > div.content-wrapper > <projected content>`

#### Scenario: Denied
- **WHEN** `hasPermission` emits `false` for permission `X`
- **THEN** the DOM is `ocx-portal-page > div.content-wrapper > h3 + p > span`, where the `span` shows `OCX_PORTAL_PAGE.MISSING_PERMISSION` interpolated with `permission = X`

#### Scenario: Pending
- **WHEN** the access observable has not emitted
- **THEN** `div.content-wrapper` is present but empty

### Requirement: Template and appearance - ocx-portal-page i18n keys
The unauthorized view SHALL use the translation keys `OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE` (rendered in the `h3`), `OCX_PORTAL_PAGE.UNAUTHORIZED_MESSAGE` (rendered as the text of the `p`) and `OCX_PORTAL_PAGE.MISSING_PERMISSION` (rendered in the `span` inside the `p`, parameter `permission`). The library assets `libs/angular-utils/assets/i18n/en.json` and `de.json` SHALL provide `OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE` ("Unauthorized" / "Nicht autorisiert") and `UNAUTHORIZED_MESSAGE` ("Sorry, you do not have the permission required to view this page." / "Leider verfügen Sie nicht über die erforderliche Berechtigung zum Anzeigen dieser Seite."). There is no inline default: a missing translation shows the key.

#### Scenario: English texts
- **WHEN** the language is `en` and access is denied
- **THEN** the heading reads "Unauthorized" and the paragraph starts with "Sorry, you do not have the permission required to view this page."

The assets SHALL also define `OCX_PORTAL_PAGE.MISSING_PERMISSION` as "Missing permission key: {{permission}}" (en) / "Fehlender Berechtigungsschlüssel: {{permission}}" (de).

### Requirement: Template and appearance - ocx-portal-page styles
`portal-page.component.scss` SHALL define `:host { display: block; padding: var(--page-padding, 1rem); height: 100%; }` and `.content-wrapper { width: 100%; height: 100%; }`. It additionally contains `@media (max-width: var(--mobile-break-point)) { :host { padding: var(--page-padding-lg, 1rem); padding-top: var(--page-padding, 1rem); } }`. Colors, fonts and typography are inherited; the component sets none.

#### Scenario: Default layout
- **WHEN** rendered with no CSS variables defined
- **THEN** the host is a block with 1rem padding filling 100% of its parent height, and `.content-wrapper` is 100% wide and high

#### Scenario: Custom padding
- **WHEN** `--page-padding: 2rem` is defined on an ancestor
- **THEN** the host padding is `2rem`

> Note (code-derived): CSS media queries cannot contain `var()`, so the `@media (max-width: var(--mobile-break-point))` rule is invalid and never applies; the mobile padding override is effectively dead and mobile uses the same padding as desktop.
