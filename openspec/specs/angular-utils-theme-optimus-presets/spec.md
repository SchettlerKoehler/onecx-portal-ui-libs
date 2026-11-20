# angular-utils-theme-optimus-presets Specification

## Purpose
Part of `@onecx/angular-utils/theme/optimus`. Describes the OneCX Optimus preset (Aura based with OneCX semantic variables and component presets) and the utilities that derive Optimus theme configuration from OneCX theme properties: colour palettes and key normalisation.

## Requirements

### Requirement: Colour adjustment
`adjustColor(color, offset)` SHALL add `offset` to each RGB channel of a hex colour (with or without leading `#`), clamp each channel to 0..255 and return a 6-digit hex string, keeping the `#` prefix only if the input had one. Positive offsets lighten, negative darken.

#### Scenario: Clamping
- **WHEN** `adjustColor('#ffffff', 50)` is called
- **THEN** the result is `#ffffff`
- **AND** `adjustColor('#000000', -50)` yields `#000000`

#### Scenario: No hash
- **WHEN** the input has no `#`
- **THEN** the output has no `#`

### Requirement: Palette creation
`createPalette(primaryColor, adjustments)` SHALL return an object with one adjusted colour per adjustment key. `standardColorAdjustment` SHALL map 50:210, 100:195, 200:150, 300:98, 400:20, 500:0, 600:-25, 700:-65, 800:-80, 900:-110, 950:-140, so 500 equals the primary colour.

#### Scenario: Standard palette
- **WHEN** `createPalette('#274B5F', standardColorAdjustment)` is called
- **THEN** key `500` equals `#274B5F` (lowercased by hex formatting) and keys `50`..`950` are present

### Requirement: Colour distance
`colorDelta(a, b)` SHALL return the Euclidean RGB distance between two hex colours (with or without `#`).

#### Scenario: Identical colours
- **WHEN** both colours are equal
- **THEN** the distance is 0

### Requirement: Key normalisation
`normalizeKeys(obj)` SHALL recursively convert camelCase keys into nested objects (`hoverColor` becomes `{hover: {color}}`, all lowercase), preserving values; non-object values and arrays are returned unchanged. Keys matching (case-insensitively) `primitive`, `semantic`, `components`, `directives`, `variables`, `colorscheme`, `light`, `dark`, `common`, `root`, `states`, `extend`, `css` SHALL be kept as is (their values still normalised). Keys with several segments that collide are merged into the same nested object.

#### Scenario: Camel case split
- **WHEN** `{ itemHoverColor: 'x' }` is normalised
- **THEN** the result is `{ item: { hover: { color: 'x' } } }`

#### Scenario: Excluded key
- **WHEN** the object contains `colorScheme`
- **THEN** the key is preserved unchanged

### Requirement: Theme properties to Optimus config
The internal `ThemeConfig` (default export of `theme-config.ts`) SHALL convert section and property names of the theme properties from kebab-case to camelCase and return a normalised config in which `semantic.extend.onecx` merges the `font`, `topbar`, `sidebar` and `general` sections, and `semantic.primary` and `semantic.colorScheme.light.primary` contain the standard palette derived from `general.primaryColor`.

#### Scenario: Normalised variables
- **WHEN** `general.primary-color` is `#ababab` and `font.size` is `14px`
- **THEN** `semantic.extend.onecx` contains `primary.color = '#ababab'` and `font.size = '14px'`

> Note (code-derived): Accessing `general.primaryColor` fails with a TypeError when the theme has no `general` section (undefined properties become `{}`).

### Requirement: CustomPreset
`CustomPreset` (named and default export of `custom-preset`) SHALL be `definePreset(normalizeKeys(Aura), normalizeKeys(presetVariables))`, with `semantic.colorScheme.dark` set to an empty object. The preset variables SHALL define OneCX component presets (autocomplete, breadcrumb, button, datatable, dialog, fieldset, fileupload, floatlabel, inputtext, paginator) and `semantic.extend.onecx` defaults (fonts, topbar, sidebar and general colours such as primary `#274B5F`, `errorColor` `#b00020`, `animationDuration` `0.2s`).

#### Scenario: Dark mode disabled
- **WHEN** the preset is loaded
- **THEN** `semantic.colorScheme.dark` is `{}`

> Note (code-derived): `preset-variables` only has a default export, so `export *` from the index exposes nothing from it.
