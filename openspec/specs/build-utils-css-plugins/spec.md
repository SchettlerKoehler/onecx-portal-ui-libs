# build-utils-css-plugins Specification

## Purpose
`@onecx/build-utils` ships two CommonJS build plugins under the subpath `@onecx/build-utils/plugins/*`: a webpack plugin merging global CSS bundles into one `styles.css`, and a PostCSS plugin compiling Tailwind CSS v4 for a single entry file. They are used in webpack/PostCSS configs of OneCX Angular apps.

## Requirements

### Requirement: MergeGlobalCssPlugin merges bundles into styles.css
`MergeGlobalCssPlugin` (module `@onecx/build-utils/plugins/merge-global-css`, exported as module and as property `MergeGlobalCssPlugin`) SHALL, at the process-assets report stage of a compilation, collect emitted CSS assets whose names match the configured bundles, concatenate their contents joined by a newline in bundle order (later wins in cascade), and write the result as `styles.css`. When `styles.css` already exists it SHALL be updated in place, otherwise it SHALL be emitted. The source bundles remain untouched.

#### Scenario: Emit merged styles.css
- **WHEN** assets `styles.abc123.css` and `tailwind.def456.css` exist and no `styles.css`
- **THEN** `styles.css` is emitted containing styles content, a newline and tailwind content
- **AND** `[build-utils] Merge Global CSS: successfully merged styles.abc123.css + tailwind.def456.css into styles.css` is logged

#### Scenario: Replace existing styles.css
- **WHEN** an unhashed `styles.css` and `tailwind.<hash>.css` exist
- **THEN** `styles.css` is updated with the merged content and the tailwind asset is kept

### Requirement: Bundle selection options
The plugin constructor SHALL accept `options.bundles` (default `['styles', 'tailwind']`). Bundle names SHALL match an asset only when the asset name equals the bundle name or continues with a `.` (e.g. `styles.abc.css`), so `stylesheets.css` is not matched by `styles`. Order in `bundles` determines concatenation order.

#### Scenario: Custom order
- **WHEN** `bundles` is `['tailwind', 'styles']`
- **THEN** the tailwind content precedes the styles content in `styles.css`

#### Scenario: No matching assets
- **WHEN** no emitted CSS asset matches any bundle
- **THEN** nothing is emitted or updated and nothing is logged

> Note (code-derived): bundles listed but missing are skipped silently; the matching regex is built from the bundle name without escaping. `webpack` and `webpack-sources` are required lazily inside `apply`. Logging uses `compiler.logger.info` when available, otherwise `console.log`; with environment variable `MERGE_CSS_DEBUG` set, the CSS assets and sizes are logged additionally.

### Requirement: Tailwind PostCSS plugin factory
The module `@onecx/build-utils/plugins/tailwind-postcss` SHALL export a factory function with `postcss === true` that returns a PostCSS plugin named `onecx-app-tailwind` with a `Once` hook. It SHALL be usable as a key in the object-form `plugins` of a `postcss.config.json`.

#### Scenario: Plugin shape
- **WHEN** the factory is called without arguments
- **THEN** the result has `postcssPlugin: 'onecx-app-tailwind'` and a function `Once`

### Requirement: Tailwind only for the configured entry
The plugin SHALL run `@tailwindcss/postcss` only when the processed file's basename (query suffix such as `?raw=true` removed) equals `options.entry` (default `tailwind.css`); for every other file it SHALL do nothing. The file path comes from `root.source.input.file`, falling back to `result.opts.from`; when neither is available the plugin does nothing. When running, it SHALL process the root with a one-plugin PostCSS pipeline using `{ from: <file>, map: false }` and log `[build-utils] Tailwind PostCSS: successfully compiled Tailwind v4 for <basename>`.

#### Scenario: Entry file
- **WHEN** the processed file is `/app/src/tailwind.css`
- **THEN** Tailwind is run on it with `from` set to the file path and no source map
- **AND** the success message is logged

#### Scenario: Other file
- **WHEN** the file is `/app/src/other.css`
- **THEN** Tailwind and postcss are not loaded and nothing is logged

#### Scenario: Custom entry
- **WHEN** the plugin is created with `{ entry: 'custom-tw.css' }`
- **THEN** `tailwind.css` is ignored and `custom-tw.css` is compiled

> Note (code-derived): `@tailwindcss/postcss` and `postcss` are lazily required only when the entry is processed (optional peer dependencies); the Tailwind instance is cached per plugin instance.
