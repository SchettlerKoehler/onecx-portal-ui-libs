# react-utils-portal-page Specification

## Purpose
`PortalPage` is the React counterpart of the Angular portal-page component: it wraps page content, enforces an optional permission check, and publishes current-page metadata for help and analytics integration.

## Requirements

### Requirement: Layout and styling
`PortalPage` SHALL render `<div class="portal-page [className]">` containing `<div class="content-wrapper">`. The wrapper style SHALL default to `display: block; padding: var(--page-padding, 1rem); height: 100%` and MUST be overridable per property by the `style` prop.

#### Scenario: Custom class and style
- **WHEN** `className="x"` and `style={{ height: '50%' }}` are given
- **THEN** the class list is `portal-page x` and height is `50%` while other defaults remain

### Requirement: Rendering without permission
When no `permission` prop is given, `PortalPage` SHALL render its children immediately without loading state.

#### Scenario: No permission
- **WHEN** `permission` is undefined
- **THEN** children are rendered at once

### Requirement: Permission check
When `permission` (string or string array) is given, `PortalPage` SHALL render nothing in the content area while `hasPermission(permission)` of the user service is pending, then render children if it resolves `true`. If it resolves `false` it SHALL render an `h3` with the translation of `OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE` and a `p` with `OCX_PORTAL_PAGE.UNAUTHORIZED_MESSAGE`. If the check throws/rejects, a warning is logged and access is denied. State updates MUST NOT occur after unmount.

#### Scenario: Permission granted
- **WHEN** `hasPermission` resolves `true`
- **THEN** children are rendered

#### Scenario: Permission denied
- **WHEN** `hasPermission` resolves `false`
- **THEN** the unauthorized title and message are shown instead of children

#### Scenario: Permission check fails
- **WHEN** `hasPermission` throws
- **THEN** a warning is logged and the unauthorized message is shown

### Requirement: Publishing current page info
On mount and when `applicationId`, `helpArticleId`, `pageName` or `permission` change, `PortalPage` SHALL publish to `currentPage$` of the app state an object with `path` (`document.location.pathname`), `helpArticleId`, `permission` (array joined with `,`), `pageName` and `applicationId`, each defaulting to `''`.

#### Scenario: Array permission
- **WHEN** `permission={['A','B']}`
- **THEN** the published `permission` is `'A,B'`

#### Scenario: Defaults
- **WHEN** optional props are omitted
- **THEN** the published values are empty strings

### Requirement: Missing help article warning
When `helpArticleId` is not set, `PortalPage` SHALL log a warning stating the page URL has no `helpArticleId`.

#### Scenario: No helpArticleId
- **WHEN** rendered without `helpArticleId`
- **THEN** a warning mentioning `helpArticleId` is logged

### Requirement: Template and appearance - PortalPage DOM structure
`PortalPage` SHALL render exactly `<div class="portal-page[ <className>]" style="display:block;padding:var(--page-padding, 1rem);height:100%[;...style]"><div class="content-wrapper">{content}</div></div>`. The outer `div` has no ARIA attributes, roles or `data-*` attributes; the inner `.content-wrapper` has no inline style (unlike the Angular counterpart, the 100% width/height rules are not applied to it). `content` is `null` while the permission check is loading (`isLoading` is initially `!!permission`), `children` when access is granted, and the fragment `<h3>{t('OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE')}</h3><p>{t('OCX_PORTAL_PAGE.UNAUTHORIZED_MESSAGE')}</p>` when denied.

#### Scenario: Denied view
- **WHEN** `hasPermission` resolves `false`
- **THEN** the DOM is `div.portal-page > div.content-wrapper > h3 + p` with the translated texts and no `span`

#### Scenario: Loading
- **WHEN** a `permission` is set and unresolved
- **THEN** `div.content-wrapper` is empty

> Note (code-derived): the React unauthorized view does not render the `OCX_PORTAL_PAGE.MISSING_PERMISSION` text that the Angular variant shows.

### Requirement: Template and appearance - PortalPage i18n assets
`libs/react-utils/assets/i18n/en.json` and `de.json` SHALL define `OCX_PORTAL_PAGE.UNAUTHORIZED_TITLE` ("Unauthorized" / "Nicht autorisiert") and `OCX_PORTAL_PAGE.UNAUTHORIZED_MESSAGE` ("Sorry, you do not have the permission required to view this page." / "Leider verfügen Sie nicht über die erforderliche Berechtigung zum Anzeigen dieser Seite."). Translations are obtained through `useTranslation().t` without default values.

#### Scenario: German
- **WHEN** i18n language is `de` and access is denied
- **THEN** the `h3` reads "Nicht autorisiert"
