# angular-standalone-shell-providers Specification

## Purpose
Allow an OneCX Angular application to run without the real shell ("standalone"), by providing mock shell state, auth and permissions.

## Requirements

### Requirement: provideStandaloneProviders
`provideStandaloneProviders(config?)` SHALL return providers for: the config token `PROVIDE_STANDALONE_PROVIDERS_CONFIG`, an app initializer for the mock shell state, the router initializer (`initializeRouter`), translation path from meta (`assets/i18n/`), multi-language identifier `@onecx/angular-standalone-shell`, always-grant permission checker, token interceptor, shell auth service and `MessageService`.

#### Scenario: Registration
- **WHEN** the providers are registered in an app
- **THEN** the app starts with mock user, workspace, theme and permissions

### Requirement: Config
`ProvideStandaloneProvidersConfig` SHALL accept partial `workspace`, `userProfile`, `mfeInfo`, `theme` and optional `permissions`; all are optional.

#### Scenario: No config
- **WHEN** called without arguments
- **THEN** defaults below apply

### Requirement: Initialization sequence and defaults
At app start the initializer SHALL: publish global loading true, publish current MFE (defaults: mountPath `/`, remoteBaseUrl `.`, baseHref `/`, shellName `standalone`, empty appId/productName), publish loading false, init `ConfigurationService`, publish a user profile (userId `standaloneMockUser`, locale `en`, menuMode `HORIZONTAL`, colorScheme `AUTO`), publish permissions (default `[]`), publish workspace (name/portalName `Standalone`, baseUrl `/`, no registrations) and apply the theme. Each default SHALL be overridable by the config.

#### Scenario: Overriding locale
- **WHEN** `userProfile.accountSettings.localeAndTimeSettings.locale` is `de`
- **THEN** the published profile uses `de`

> Note (code-derived): overriding `userProfile.accountSettings` replaces the merged nested objects computed before it, because the spread comes last.

### Requirement: Theme application
Applying the theme SHALL publish it to `ThemeService.currentTheme$` and set every property of each property group as CSS custom property `--<key>` on `document.documentElement`.

#### Scenario: Theme property
- **WHEN** a theme has properties `{ general: { 'primary-color': '#fff' } }`
- **THEN** `--primary-color` is set to `#fff` on the root element
