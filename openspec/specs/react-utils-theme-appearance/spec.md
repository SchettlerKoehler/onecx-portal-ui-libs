# react-utils-theme-appearance Specification

## Purpose
Describes the visual appearance mechanism of `@onecx/react-utils`: the SCSS entry that builds the PrimeReact base theme (`theme-base`) and the OneCX variable layer (`theme-onecx`), how CSS variables drive colors, how styles are layered, and the DOM markers of the style-isolation providers. Generated per-component CSS is described by mechanism and coverage, not rule by rule.

## Requirements

### Requirement: Template and appearance - Theme entry and build output
The package SHALL expose the theme through `src/lib/styling/primeReact/styles.ts` (`import './primeBaseTheme.scss'`), built as the entry `prime-base-theme` and exported as `@onecx/react-utils/prime-base-theme` (JS) and `@onecx/react-utils/prime-base-theme.css` (compiled CSS, `lib/prime-base-theme.css`). `primeBaseTheme.scss` SHALL contain only `@import "./theme/theme-onecx/theme";`.

#### Scenario: Consuming the CSS
- **WHEN** an app imports `@onecx/react-utils/prime-base-theme.css`
- **THEN** the PrimeReact component styles and the `tokens` layer are available

### Requirement: Template and appearance - SCSS file organization
`theme/theme-onecx/theme.scss` SHALL, in order: `@use "./onecx-variables" as onecx`; define `$primaryColor`, `$primaryLightColor`, `$primaryDarkColor`, `$primaryDarkerColor` as `var(--app-primary-color)` and `$primaryTextColor` as `var(--app-text-color)`, `$highlightBg: #eff6ff`, `$highlightTextColor: $primaryDarkerColor`, `$highlightFocusBg: rgba($primaryColor, 0.24)` (all `!default`); `@import "./variables"` (`_variables.scss`, ~900 lines of `$`-variables); `@import "../theme-base/components"`; `@import "./extensions"`; and finally `@layer tokens { :scope { @include onecx.onecx-variables; } }`. `theme-base` SHALL contain `_colors.scss` (generates palette variables), `_mixins.scss`, `_common.scss`, `_components.scss` (import list) and `components/<group>/_<component>.scss` partials.

#### Scenario: Import order
- **WHEN** the theme is compiled
- **THEN** variables are defined before the component partials, and `_extensions.scss` overrides appear after them

### Requirement: Template and appearance - Color token naming
`theme-onecx/onecx-variables.scss` SHALL define the mixin `onecx-variables` which sets 31 custom properties `--app-<name>` on the scope root, each as `var(--ocx-theme-definitions-<name>, var(--<name>, <fallback>))`. The names and fallbacks SHALL be: `body-bg-color #f7f7f7`, `button-hover-bg #ad1457`, `content-bg-color #ffffff`, `danger-button-bg #d32f2f`, `divider-color #e4e4e4`, `error-message-bg #ffcdd2`, `hover-bg-color #ad1457`, `info-message-bg #b3e5fc`, `logo-color #ffffff`, `menu-active-item-bg-color rgba(0,0,0,0.04)`, `menu-active-item-text-color #515c66`, `menu-bg-color #fdfeff`, `menu-item-hover-bg-color #e4e4e4`, `menu-item-text-color #515c66`, `menu-text-color #274b5f`, `overlay-content-bg-color #ffffff`, `primary-color #550e0e33`, `secondary-color #1c4257`, `solid-surface-text-color #ffffff`, `success-message-bg #c8e6c9`, `text-color rgba(0,0,0,0.87)`, `text-secondary-color #262626`, `topbar-bg-color #0d3650`, `topbar-item-text-color #ffffff`, `topbar-item-text-hover-bg-color #262626`, `topbar-left-bg-color #124a6e`, `topbar-menu-button-bg-color rgb(255 0 68)`, `topbar-text-color #ffffff`, `warning-message-bg #ffecb3`. Resolution order is therefore: `--ocx-theme-definitions-*`, then the unprefixed variable (e.g. `--primary-color`), then the fallback. Sass variables of the component partials reference `var(--app-*)` (e.g. `$textColor: var(--app-text-color)`, `$divider: 1px solid var(--app-divider-color)`, `$buttonHoverBg: var(--app-button-hover-bg)`), so runtime theme changes recolor components without recompiling.

#### Scenario: Theme override
- **WHEN** `--ocx-theme-definitions-primary-color: #123456` is defined on the scope root
- **THEN** `--app-primary-color` resolves to `#123456` and primary buttons use it as background

#### Scenario: No theme
- **WHEN** neither prefixed nor unprefixed variable exists
- **THEN** the hard-coded fallback (e.g. `#550e0e33` for primary) is used

> Note (code-derived): the fallback primary color `#550e0e33` has an alpha channel, so without theme data primary elements are semi-transparent.

### Requirement: Template and appearance - Cascade layers and scoping
The variable block SHALL be emitted in `@layer tokens { :scope { ... } }` and all `theme-base` component partials in `@layer primereact { ... }` (the `_editor` partial is imported before the layer, outside it); `_extensions.scss` also wraps its rules in `@layer primereact`. `:scope` selects the scope root established by the runtime scoper (the style element is re-targeted to `[data-style-id="<product>|<product>"]`). Runtime theme variables SHALL be injected by `applyThemeVariables` as `/* app-theme-runtime:start */ @layer tokens { :scope { --app-x: v; --x: v; } } @layer base {} /* app-theme-runtime:end */` into the scoped style element and as inline custom properties on the scope roots.

#### Scenario: Layer order
- **WHEN** inspecting the compiled style element
- **THEN** component rules sit in layer `primereact` and variables in layer `tokens`

### Requirement: Template and appearance - Palette generation
`theme-base/_colors.scss` SHALL, inside `:root`, generate for each entry of `$colors` (`blue #3b82f6`, `green #22c55e`, `yellow #eab308`, `cyan #06b6d4`, `pink #ec4899`, `indigo #6366f1`, `teal #14b8a6`, `orange #f97316`, `bluegray #64748b`, `purple #a855f7`, `red #ff3d32`, `primary $primaryColor`) the variables `--<name>-50` (tint 95%), `--<name>-100` ... `--<name>-500` (tint `(5-i)*19%`) and `--<name>-600` ... `--<name>-900` (shade `15%,30%,45%,60%`). `tint` is `color-mix(in srgb, #fff P, c)` and `shade` is `color-mix(in srgb, #000 P, c)`.

#### Scenario: Palette variable
- **WHEN** the theme is compiled
- **THEN** `--blue-500` exists as a tinted/shaded mix of `#3b82f6` and `--primary-900` exists

### Requirement: Template and appearance - Design tokens (Sass variables)
`_variables.scss` SHALL define the global tokens with defaults: `$fontFamily: "Inter var", sans-serif`, `$fontSize: 1rem`, `$fontWeight: normal`, `$borderRadius: 6px`, `$transitionDuration: 0.2s`, `$primeIconFontSize: 1rem`, `$inlineSpacing: 0.5rem`, `$disabledOpacity: 0.6`, `$maskBg: rgba(0,0,0,0.4)`, `$errorColor: #e24c4c`, `$scaleSM: 0.875`, `$scaleLG: 1.25`, focus (`$focusOutline: 0 none`, `$focusShadow: 0 0 0 0.2rem $focusOutlineColor`), grey shades `$shade000 #fff` ... `$shade900 #1f2937`, input tokens (`$inputPadding: 0.75rem 0.75rem`, `$inputBorder: 1px solid $shade400`, hover/focus border `$primaryColor`, error border `$errorColor`), button tokens (`$buttonPadding: 0.75rem 1.25rem`, `$buttonIconOnlyWidth: 3rem`, `$buttonBg: $primaryColor`, `$buttonHoverBg: var(--app-button-hover-bg)`, `$roundedButtonBorderRadius: 2rem`, severity palettes secondary `#64748b`, info `#0ea5e9`, success `#22c55e`, warning `#f97316`, help `#a855f7`, danger), and further sections in this order: checkbox, radiobutton, colorpicker, togglebutton, inplace, rating, slider, calendar, input switch, panel, accordion, tabview, upload, scrollpanel, card, editor, paginator, table, dataview, datascroller, tree, timeline, org chart, message, inline message, toast, severities, overlays, dialog, confirmpopup, tooltip, steps, progressbar, menu, badge and tag, carousel, galleria, divider, avatar, chip, scrollTop, skeleton, splitter, speeddial, dock, image.

#### Scenario: Default font
- **WHEN** an element has class `p-component`
- **THEN** it uses `font-family: var(--font-family)`, `font-size: 1rem`, `font-weight: normal`

### Requirement: Template and appearance - Common and global rules
`_common.scss` SHALL set `* { box-sizing: border-box }`; `.p-component` font settings (`font-feature-settings: var(--font-feature-settings, normal)`); `.p-disabled, .p-component:disabled { opacity: 0.6 }`; `.p-error { color: $errorColor }`; `.p-text-secondary { color: var(--app-text-secondary-color) }`; `.pi { font-size: 1rem }`; `.p-icon { width/height: 1rem }`; `.p-link` focus-visible uses `@include focused()`; and the overlay mask (`.p-component-overlay` background `rgba(0,0,0,0.4)`, 150ms enter/leave animations `p-component-overlay-enter-animation` / `-leave-animation` fading `background-color` between `transparent` and `var(--maskbg)`).

#### Scenario: Disabled
- **WHEN** a PrimeReact element has `.p-disabled`
- **THEN** its opacity is `0.6`

### Requirement: Template and appearance - Mixins
`_mixins.scss` SHALL provide `icon-override($icon)`, `focused()`, `focused-inset()`, `focused-input()`, `focused-listitem()`, `invalid-input()`, `menuitem-link`, `horizontal-rootmenuitem-link`, `placeholder`, `scaledPadding`, `scaledFontSize`, `nested-submenu-indents`, `action-icon($enabled)` (width/height `2rem`, circular `50%`, hover colors) and `action-icon-hover()`, and the functions `tint`/`shade`. `_extensions.scss` provides `focused-ring($ring-color)`: `box-shadow: 0 0 0 2px #fff, 0 0 0 4px <ring>, 0 1px 2px 0 rgba(0,0,0,1)`.

#### Scenario: Button focus ring
- **WHEN** a `.p-button` (or `.p-button-secondary|success|info|warning|help|danger:enabled`) is focused
- **THEN** the focus ring color is `color-mix(in srgb, #fff 50%, <severity bg>)`

### Requirement: Template and appearance - Component coverage
The theme SHALL style the following PrimeReact components, one partial each under `theme-base/components/`: input (autocomplete, calendar, cascadeselect, checkbox, tristatecheckbox, chips, colorpicker, dropdown, editor, inputgroup, inputnumber, inputswitch, inputtext, iconfield, inputicon, inputotp, listbox, mention, multiselect, password, radiobutton, rating, selectbutton, slider, treeselect, togglebutton); button (button, splitbutton, speeddial); data (carousel, datatable, dataview, datascroller, filter, orderlist, organizationchart, paginator, picklist, tree, treetable, timeline); panel (accordion, card, fieldset, divider, panel, splitter, stepper, scrollpanel, tabview, toolbar); overlay (confirmpopup, dialog, overlaypanel, sidebar, tooltip); file (fileupload); menu (breadcrumb, contextmenu, dock, megamenu, menu, menubar, panelmenu, slidemenu, steps, tabmenu, tieredmenu); messages (inlinemessage, message, toast); multimedia (galleria, image); misc (avatar, chip, scrolltop, skeleton, tag, inplace, metergroup, progressbar, terminal, badge). Selectors follow PrimeReact class names (`.p-button`, `.p-datatable`, `.p-dialog`, ...). The largest partials are button (666 lines), treetable, datatable, splitbutton, multiselect, dropdown and calendar.

#### Scenario: Styled component
- **WHEN** a `.p-card` is rendered
- **THEN** it uses `$panelContentBg` background, `$cardShadow`, border radius `6px`, body padding `$cardBodyPadding`

### Requirement: Template and appearance - OneCX extensions
`theme-onecx/_extensions.scss` SHALL apply OneCX-specific overrides inside `@layer primereact`: `.p-button-label { font-weight: 700 }`; 0.2s transitions (background-color, border-color, box-shadow) on selectbutton/togglebutton buttons, accordion header links, tabview nav links and tabmenu links; `$primaryColor` background on highlighted carousel and galleria indicators and on highlighted `.p-steps-number` / `.p-stepper-number` (text `$primaryTextColor`); `focused-ring` for buttons and speeddial items; datatable drag-point indicators (`.p-datatable-dragpoint-top > td { box-shadow: inset 0 2px 0 0 $primaryColor }`, bottom `inset 0 -2px 0 0`); `.p-toast-message { backdrop-filter: blur(10px) }`; `.p-inline-message-text { font-weight: 500 }`; opacity/color/border/shadow transitions on picklist and orderlist control buttons.

#### Scenario: Toast blur
- **WHEN** a toast message is shown
- **THEN** its message element has `backdrop-filter: blur(10px)`

### Requirement: Template and appearance - Style isolation providers DOM
The PrimeReact style providers for app and remotes (`PrimeReactStyleProvider` in `contexts/app` and `contexts/remotes`) SHALL render `<div data-style-id="<PRODUCT_NAME>|<PRODUCT_NAME>" data-style-isolation data-no-portal-layout-styles style="display: contents">{children}</div>`, so the wrapper does not create a box. The remotes variant renders `null` until scoping is attached (`isScoped`), the app variant renders immediately. `StyleRegistry` renders no DOM, only `PrimeReactProvider` with `{ unstyled: false, appendTo: 'self', styleContainer }`. `withApp` composes (outermost first) app globals, app PrimeReact isolation, `withAppStyles`, base providers; `withRemote` composes app globals, `withRemoteStyles`, remote PrimeReact isolation, base providers. Base providers (`AppStateProvider`, `ConfigurationProvider`, `SyncedRouterProvider`, `UserProvider`, `TranslationBridge`) and `withSyncedRouter` (`BrowserRouter`) add no DOM elements of their own.

#### Scenario: App wrapper
- **WHEN** an app is wrapped with `withApp(Component, { PRODUCT_NAME: 'p' })`
- **THEN** the DOM contains `div[data-style-id="p|p"][data-style-isolation][data-no-portal-layout-styles]` with `display: contents`

#### Scenario: Remote first render
- **WHEN** a remote component renders for the first time
- **THEN** nothing is rendered until the scoper has been attached, then the isolation `div` appears

> Note (code-derived): theme variables, rendering of PrimeReact portals and visual appearance in a real browser (computed colors, overlay positions) could not be verified statically.
