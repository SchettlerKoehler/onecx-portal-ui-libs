# build-utils-shared-config Specification

## Purpose
`@onecx/build-utils` provides helpers that generate Module Federation shared-library configuration for OneCX applications (Angular and React remotes). It is used in webpack / Nx module-federation configuration files at build time.

## Requirements

### Requirement: Recommendations for OneCX shared libraries
`getOneCXSharedRecommendations(libraryName, sharedConfig)` SHALL return `false` and leave `sharedConfig` untouched when `libraryName` does not match one of the patterns `^@angular`, `^@onecx`, `^rxjs`, `^@openng/optimus-ui`, `^@ngx-translate`, `^@ngrx`, `^react`, `^primereact`. For matching names it SHALL mutate and return the same `sharedConfig` object with `singleton`, `strictVersion` and `eager` all set to `false`.

#### Scenario: Matching library
- **WHEN** called with `@angular/core` and a config with `singleton: true`
- **THEN** the same object is returned with `singleton`, `strictVersion` and `eager` set to `false`

#### Scenario: Other library
- **WHEN** called with `some-random-lib`
- **THEN** `false` is returned and the config is unchanged

> Note (code-derived): patterns are prefix matches without a separator, so `react_something` and `reactive-x` also match; `primeng` does not match (only `primereact`), despite the docs mentioning PrimeNG.

### Requirement: Default package filter
`onecxPackageFilter(packageName)` SHALL return `true` (exclude) for packages in the scopes `@nx`, `@module-federation` and `@onecx/build-utils` (including sub-paths) and for a fixed list of full package paths (for example `@angular/common/locales/*`, `@angular/router/upgrade`, `rxjs/internal/*`, `@openng/optimus-ui/editor`, `@onecx/angular-accelerator/testing`, `react/jsx-dev-runtime`, `react-dom/server`, `react-router/internal`, `@onecx/react-utils/prime-base-theme`), and `false` (include) otherwise.

#### Scenario: Excluded packages
- **WHEN** called with `@nx/angular`, `@module-federation/enhanced`, `@onecx/build-utils/test-lib` or `@openng/optimus-ui/editor`
- **THEN** it returns `true`

#### Scenario: Included packages
- **WHEN** called with `@angular/core/testing` or `@ngrx/store`
- **THEN** it returns `false`

### Requirement: Generating the shared library map
`getOneCXSharedLibraryConfig(dependencies, shouldGenerateSubDeps, options?)` SHALL return a record mapping package names to `SharedLibraryConfig`. For every dependency passing the package filter it SHALL create an entry with `requiredVersion` set to the dependency's version, a `shareScope`, and the OneCX recommendations (`singleton`, `strictVersion`, `eager` all `false`). Dependencies that do not match the OneCX recommendation patterns SHALL be omitted. An empty dependency map yields an empty result.

#### Scenario: Typical Angular project
- **WHEN** dependencies contain `@angular/core`, `rxjs`, `@ngrx/store`, `@nx/angular`, `@module-federation/enhanced` and `some-build-tool`
- **THEN** only the first three are present, each with `singleton`, `strictVersion`, `eager` false and `requiredVersion` equal to the declared version

#### Scenario: Blacklisted or unrelated packages
- **WHEN** a dependency is excluded by the filter or not matching the recommendation patterns
- **THEN** it is absent from the result

### Requirement: Share scope derivation
The `shareScope` SHALL be the same for all entries and derived from the dependencies map: `react_<major>` when `react` is declared with a major version of 19 or higher (this takes precedence), else `angular_<major>` when `@angular/core` is declared with a major version of 21 or higher, else `default`. The major version is the first dot-separated segment with a leading `^` removed.

#### Scenario: Angular 21 and 22
- **WHEN** `@angular/core` is `^21.0.0` or `22.0.0`
- **THEN** every entry has `shareScope` `angular_21` or `angular_22` respectively

#### Scenario: Older or missing frameworks
- **WHEN** `@angular/core` is below 21, absent or empty, and no react 19+ is declared
- **THEN** `shareScope` is `default`

#### Scenario: React precedence
- **WHEN** `react` is `^19.0.0` or `^20.0.0` (also together with `@angular/core` 21)
- **THEN** all entries have `react_19` / `react_20`; React 18 or absent react gives `default`

> Note (code-derived): only a leading `^` is stripped, so versions like `~19.0.0` yield a NaN major and fall through.

### Requirement: Sub-package generation
When `shouldGenerateSubDeps` is `true`, the function SHALL additionally add an entry for every key of the dependency's `package.json` `exports` map except `.` and `./package.json`, named `<dependency>/<export path without './' prefix>` and carrying the parent's version. The dependency's `package.json` is resolved with `require.resolve`. When it cannot be resolved or does not exist on disk, a console message `[build-utils] Shared Config: skipping <dependency>: package.json not found at resolved path` SHALL be logged and no sub-packages are added (the main package is kept). When `false`, no sub-packages are generated.

#### Scenario: Sub-packages from exports
- **WHEN** called with `{ '@angular/core': '^21.0.0' }` and `true`
- **THEN** entries such as `@angular/core/testing` exist, but `@angular/core/package.json` and default-blacklisted paths do not

#### Scenario: Unresolvable package
- **WHEN** the dependency cannot be resolved
- **THEN** the function does not throw and returns only the main entry (if it passes filter and recommendations)

#### Scenario: No sub-packages requested
- **WHEN** `shouldGenerateSubDeps` is `false`
- **THEN** no `<dependency>/...` entries are produced

### Requirement: Custom package filter callback
`options.packageFilterCallback(packageName)` SHALL replace the default filter. It is applied to the main package and each sub-package; `true` excludes the package and a falsy value (`false` or `undefined`) includes it. When the callback is omitted, `onecxPackageFilter` is used.

#### Scenario: Exclude and force-include
- **WHEN** the callback returns `true` for `rxjs` and `false` for `@angular/router/upgrade`
- **THEN** `rxjs` is absent and `@angular/router/upgrade` is present

> Note (code-derived): returning `undefined` does NOT defer to the default filter, it includes the package (the type comment and tests describe it as deferring; packages like `@nx/angular` are still dropped only because they match no recommendation pattern). A callback that wants the defaults must call `onecxPackageFilter` itself.

### Requirement: Custom configuration callback
`options.configCallback(packageName, currentConfig)` SHALL be invoked for every entry that is kept (main and sub-packages) with the package name and the config already containing recommendations, `requiredVersion` and `shareScope`. When the callback returns an object, its properties SHALL be merged over the entry (overriding them); non-object results (`undefined`, primitives) SHALL be ignored.

#### Scenario: Override share scope
- **WHEN** the callback returns `{ ...config, shareScope: 'customScope' }`
- **THEN** that entry has `shareScope` `customScope`

#### Scenario: Invalid result
- **WHEN** the callback returns `undefined` or a string
- **THEN** the entry keeps the computed configuration

#### Scenario: Excluded packages are not passed
- **WHEN** a package is excluded by the filter
- **THEN** the config callback is not invoked for it

> Note (code-derived): the callback receives the same object that is mutated by the recommendations; the callback is not invoked for packages that do not match the recommendation patterns.

### Requirement: Exported types
The library SHALL export the types `SharedLibraryConfig` (`singleton`, `strictVersion`, `eager`, `requiredVersion: string | false`, `version`, `includeSecondaries`, `shareScope`) and `SharedLibraryConfigOptions` (`configCallback`, `packageFilterCallback`).

#### Scenario: Typed callbacks
- **WHEN** a consumer writes a `configCallback` in TypeScript
- **THEN** it can type its parameters with `SharedLibraryConfig`
