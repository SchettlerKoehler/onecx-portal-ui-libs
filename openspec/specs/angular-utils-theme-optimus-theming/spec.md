# angular-utils-theme-optimus-theming Specification

## Purpose
Entry point `@onecx/angular-utils/theme/optimus`. Applies the OneCX workspace theme to the Optimus UI (PrimeNG based) theme engine for each application, with isolated, scoped CSS and optional theme overrides. Used by microfrontends, remote components and the shell through `provideThemeConfig`.

## Requirements

### Requirement: provideThemeConfig
`provideThemeConfig(options?)` SHALL return providers consisting of `provideAnimationsAsync()`, `provideOptimus({})`, the theme config service providers (`provideThemeConfigService(options?.isAdvancedTheming ?? false)`), the app styles initializer, and, only if `options.overrides` is set, a `THEME_OVERRIDES` provider with that value. `ThemeConfigProviderOptions` has `overrides` and `isAdvancedTheming`.

#### Scenario: Defaults
- **WHEN** `provideThemeConfig()` is called without options
- **THEN** advanced theming is disabled and no `THEME_OVERRIDES` provider is included

### Requirement: provideThemeConfigService
`provideThemeConfigService(isAdvanced?)` SHALL clear the loaded style names of the Optimus `Theme` and `Base` objects, and return providers that eagerly instantiate `ThemeConfigService` through an environment initializer, provide `CustomUseStyle` as `UseStyle`, and provide `IS_ADVANCED_THEMING` (`false` by default).

#### Scenario: Eager instantiation
- **WHEN** the environment injector is created with these providers
- **THEN** `ThemeConfigService` is instantiated without being injected explicitly

### Requirement: Applying theme variables on theme change
`ThemeConfigService` SHALL subscribe to `ThemeService.currentTheme$` and, for every theme, build the Optimus theme config: it creates a `ThemeConfig` from `theme.properties` and calls `Optimus.setThemeConfig` with `theme.preset` = `CustomPreset` deep-merged with the config from the theme properties and the folded overrides, and `options.darkModeSelector` = `false`.

#### Scenario: Theme properties applied
- **WHEN** the current theme emits properties
- **THEN** `setThemeConfig` is called with a preset that represents the properties (under `semantic.extend.onecx` and the primary palette)

### Requirement: Advanced theming overrides
When `IS_ADVANCED_THEMING` is true, `ThemeConfigService` SHALL take the theme's `overrides` of type `OverrideType.OPTIMUS`, parse each non-empty `value` as JSON, deep-merge them in list order (later overrides win) and merge the result on top of the preset. When it is false, overrides SHALL be ignored.

#### Scenario: Advanced theming on
- **WHEN** `IS_ADVANCED_THEMING` is true and two OPTIMUS overrides set the same key
- **THEN** the later override's value is used

#### Scenario: Advanced theming off
- **WHEN** `IS_ADVANCED_THEMING` is false
- **THEN** override values do not appear in the preset

> Note (code-derived): Invalid JSON in an override value throws in the parsing step.

### Requirement: CustomUseStyle scopes theme CSS per application
`CustomUseStyle` (`providedIn: 'any'`, extends Optimus `UseStyle`) SHALL, on `use(css, options)`, resolve the scope id (see style scoping; shell when `SKIP_STYLE_SCOPING`, remote component via `REMOTE_COMPONENT_CONFIG`, otherwise the current MFE), then transform the CSS (replace `--p-` prefix with the scope variable prefix, `:root` with `:scope`, wrap in `@scope ... to ([data-style-isolation])` or `@supports` fallback), append `-<scopeId>` to the style name (nothing for the shell) and delegate to the parent `use`. The method SHALL return immediately a placeholder object (`id`, `css`) whose `name` and `el` getters log an error when read and return `undefined`.

#### Scenario: Shell styles
- **WHEN** `SKIP_STYLE_SCOPING` is true
- **THEN** the CSS is scoped to `[data-style-id="shell-ui"][data-no-portal-layout-styles]` and the style name has no suffix

#### Scenario: MFE styles
- **WHEN** the current MFE is `product|app`
- **THEN** variables use the prefix `--product-app-` and the style name ends with `-product|app`

#### Scenario: Reading the placeholder
- **WHEN** the caller reads `el` of the return value
- **THEN** an error is logged and `undefined` is returned

### Requirement: Theme variable overrides
If a `THEME_OVERRIDES` value is provided (object, promise, function returning object or promise), `CustomUseStyle` SHALL after each `use` resolve it (functions are called lazily on each use, inside an injection context), convert it to CSS variables, and write the prefixed, scoped CSS into a `<style data-variable-override-id="<scopeId or shell-ui>">` element, re-appending the element to the end of `document.head` so it is always last. If the resolved overrides produce no variables nothing is written.

#### Scenario: Function overrides
- **WHEN** `THEME_OVERRIDES` is a factory using `inject()`
- **THEN** it is executed lazily when styles are used and inside an injection context

#### Scenario: Update
- **WHEN** styles are used a second time
- **THEN** the existing override style element is updated rather than duplicated

### Requirement: App styles initializer
`provideAppStylesInitializer()` SHALL provide an environment initializer that determines the scope id and, if a `<style data-app-styles=<scopeId>>` element with content exists in `document.head`, rewrites its content replacing the `--p-` prefix with the scope prefix. If none exists nothing is changed.

#### Scenario: Pre-created app style
- **WHEN** the shell created an app style for the scope before the application starts
- **THEN** the application replaces `--p-` variable names in it with its scope prefix
