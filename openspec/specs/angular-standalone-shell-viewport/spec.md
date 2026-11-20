# angular-standalone-shell-viewport Specification

## Purpose
`StandaloneShellViewportComponent` (`ocx-standalone-shell-viewport`) and `StandaloneShellModule` replace the shell layout when an app runs standalone, giving a router outlet and toast messages.

## Requirements

### Requirement: StandaloneShellModule
The module SHALL declare the viewport component and export it together with `ToastModule` and `TranslateModule`.

#### Scenario: Import
- **WHEN** the module is imported
- **THEN** `<ocx-standalone-shell-viewport>` can be used

### Requirement: Default content
Without projected content the viewport SHALL render a `router-outlet` and a toast (`p-toast`).

#### Scenario: Empty viewport
- **WHEN** no content is projected
- **THEN** router outlet and toast are rendered

### Requirement: Portal messages
The viewport SHALL forward every `PortalMessageService.message$` emission to the optimus-ui `MessageService.add`.

#### Scenario: Message
- **WHEN** a portal message is emitted
- **THEN** a toast message is added

### Requirement: Router outlet check
After content init, the viewport SHALL search its descendants for a `ROUTER-OUTLET` node and log a warning if none exists.

#### Scenario: Custom content without outlet
- **WHEN** projected content has no router outlet
- **THEN** a warning is logged

> Note (code-derived): when content is projected, the default content with the toast is replaced, so no toast is rendered unless supplied.

### Requirement: displayOneCXShellLayout input
The input `displayOneCXShellLayout` SHALL be accepted but only logs a warning that it is not implemented.

#### Scenario: Set input
- **WHEN** the input is set
- **THEN** a warning is logged and nothing else changes

### Requirement: Template and appearance - viewport template
`StandaloneShellViewportComponent` (selector `ocx-standalone-shell-viewport`, `standalone: false`, inline template, change detection `Eager`) SHALL have the inline template `<ng-content><router-outlet></router-outlet><p-toast [style]="{ 'word-break': 'break-word' }"></p-toast></ng-content>`: the router outlet and toast are the fallback content of the single default `ng-content` slot. The toast uses the default position, no `key`/`group`, and the inline style `word-break: break-word`. There are no classes, ids, `data-*`, ARIA attributes or i18n keys in the template.

#### Scenario: Empty viewport
- **WHEN** `<ocx-standalone-shell-viewport></ocx-standalone-shell-viewport>` has no children
- **THEN** its DOM contains `router-outlet` followed by `p-toast` with style `word-break: break-word`

#### Scenario: Projected content
- **WHEN** content is projected
- **THEN** the fallback `router-outlet` and `p-toast` are not rendered

### Requirement: Template and appearance - viewport styles
`standalone-shell-viewport.component.scss` SHALL consist solely of a `::ng-deep` block that, under an ancestor `.layout-menu-button-hidden`, sets `.layout-topbar .layout-topbar-left { padding-right: 0 }`, hides `.layout-topbar .layout-topbar-left .layout-menu-button` with `display: none`, and sets `.layout-topbar .layout-topbar-right { padding-left: 0 }`. The component host has no own style rules (`ocx-standalone-shell-viewport` is `display: inline` by default).

#### Scenario: Menu button hidden
- **WHEN** an ancestor has class `layout-menu-button-hidden` and contains `.layout-topbar`
- **THEN** the menu button is not displayed and the topbar left/right paddings next to it are 0

> Note (code-derived): `.layout-topbar` is not rendered by this component; the rules only affect a topbar supplied by the consuming application.

### Requirement: Template and appearance - shell global styles and assets
The package SHALL ship `assets/styles.scss` and `assets/tailwind.css`. `styles.scss` SHALL `@import './tailwind'` (no `.css` extension so Sass inlines it) and then style `body`: `font-family: var(--font-family)`, `font-size: var(--font-size)`, `color: var(--text-color)`, `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `padding: 0`, `margin: 0`, `background-color: var(--body-bg-color)`, `min-height: 100%`, and nested `a { text-decoration: none; color: var(--text-secondary-color) }`. `assets/tailwind.css` is the compiled Tailwind CSS v4.3.3 output of `tailwind.css` (source: `@layer theme, base, optimus, components, utilities;` then imports of `tailwindcss/theme`, `@openng/optimus-ui-tailwindcss`, `tailwindcss/utilities`, `@source "./src"`); the Tailwind preflight reset MUST NOT be included. It SHALL provide utility classes for layout (`flex`, `grid`, `hidden`, `block`, `flex-col`, `flex-row`, `flex-wrap`, `items-center`, `justify-between`, `justify-center`, `grid-cols-12`, `col-span-*`), spacing (`m*`, `p*`, `gap-*` on a `calc(var(--spacing) * n)` scale with `--spacing: .25rem`), sizing (`w-full`, `h-full`, `min-h-screen`), typography (`text-sm|base|lg|xl|2xl`, `font-light|medium|semibold|bold`), and Optimus-token colors (`bg-primary` = `var(--p-primary-color)`, `bg-surface-0/50`, `text-color` = `var(--p-text-color)`, `text-primary`, `text-surface-600/700/900`, `border-surface` = `var(--p-content-border-color)`, `rounded-border` = `var(--p-content-border-radius)`). Responsive variants use min-width breakpoints `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem (e.g. `md:flex-row`, `lg:col-span-6`). Legacy PrimeFlex-style names `col-12`, `flex-grow-1`, `row-1` remain available.

#### Scenario: Body styling
- **WHEN** `styles.scss` is loaded in an application
- **THEN** `body` has no margin or padding and uses the CSS variables `--font-family`, `--font-size`, `--text-color` and `--body-bg-color`

#### Scenario: Utility classes
- **WHEN** an element has `class="flex items-center gap-2 md:flex-row"`
- **THEN** it is a flex container with centered items and a gap of `calc(.25rem * 2)`, switching to row direction from 48rem

> Note (code-derived): which utilities exist is fixed by the compiled file (only classes found under the library `src`), not by all of Tailwind; actual colors require the Optimus `--p-*` variables to be defined.
