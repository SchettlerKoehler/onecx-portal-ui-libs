# angular-utils-core-providers Specification

## Purpose
Part of `@onecx/angular-utils`. General providers, injection tokens and helpers used by OneCX Angular applications: the combined `provideAngularUtils` setup, locale registration, remote component config, Portal API configuration, module federation remote loading helpers and injector access.

## Requirements

### Requirement: provideAngularUtils
`provideAngularUtils()` SHALL return providers consisting of the permission service providers, the translation path providers (`provideTranslationPaths()`), a `LOCALE_ID` provider using `DynamicLocaleId` (deps `UserService`), and an app initializer that loads the Angular locale data for the user's current language from `localeLoaders` and registers it with `registerLocaleData`. If loading fails a warning is logged and startup continues.

#### Scenario: Known language
- **WHEN** the user language is `de`
- **THEN** locale data `de` is loaded and registered on startup

#### Scenario: Unknown language or failure
- **WHEN** no loader exists for the language or the import fails
- **THEN** no error is thrown (a warning is logged on failure)

> Note (code-derived): `provideTranslationPaths()` also provides a `LOCALE_ID` (plain language value) so two `LOCALE_ID` providers are returned; the later `DynamicLocaleId` provider wins. `AngularUtilsProviderConfig`/`ContentType` types exist but are not used by `provideAngularUtils`.

### Requirement: Locale loaders
`localeLoaders` SHALL map each locale code available in `@angular/common/locales` (742 generated entries, e.g. `de`, `zh-Hant-HK`) to a function lazily importing that locale module. The file is auto-generated at build time.

#### Scenario: Lookup
- **WHEN** `localeLoaders['en']()` is called
- **THEN** the English locale module is imported

### Requirement: Injection tokens and remote component config
The library SHALL export `REMOTE_COMPONENT_CONFIG` (`ReplaySubject<RemoteComponentConfig>` with `appId`, `productName`, `permissions`, `baseUrl`), `SKIP_STYLE_SCOPING` (boolean, true for the shell) and `MULTI_LANGUAGE_IDENTIFIER` (list of `MultiLanguageIdentifier`).

#### Scenario: Token usage
- **WHEN** a remote component provides `REMOTE_COMPONENT_CONFIG`
- **THEN** scoping and translation helpers read its `productName`, `appId` and `baseUrl`

### Requirement: PortalApiConfiguration
`PortalApiConfiguration(configurationClassOfGenerator, apiPrefix)` SHALL wrap a generated OpenAPI `Configuration` class instance. Its `basePath` SHALL initially be `./<apiPrefix>` and, after the first `AppStateService.currentMfe$` value, `<currentMfe.remoteBaseUrl>/<apiPrefix>`. Setting `basePath` SHALL throw `Do not set basePath`. `credentials` and `encodeParam` SHALL read through to the wrapped configuration (`credentials` can be set), and `selectHeaderContentType`, `selectHeaderAccept`, `isJsonMime`, `lookupCredential` SHALL delegate to it.

#### Scenario: Base path update
- **WHEN** the current MFE has `remoteBaseUrl` `/mfe/ws`
- **THEN** `basePath` becomes `/mfe/ws/<apiPrefix>`

#### Scenario: Set basePath
- **WHEN** `basePath` is assigned
- **THEN** an error is thrown

> Note (code-derived): The `encodeParam` setter is misspelled `encocdeParam`, so assigning `encodeParam` has no setter effect.

### Requirement: Remote entry helpers
`createRemoteConfig(entry, name, type = 'module', shareScope = 'default')` SHALL return `{ type, entry, name, shareScope }`. `toLoadRemoteEntryOptions(route)` SHALL map a route or remote component to a module federation `Remote`: `entry` = `remoteEntryUrl`, `shareScope` = given or `'default'`, `type` = `'module'` for technology `Angular` or `WebComponentModule` and `'script'` otherwise (including missing technology), `name` = `remoteName` for `WebComponentScript` when set, else `<productName>|<appId>`. The `Technologies` enum SHALL contain `Angular`, `WebComponent`, `WebComponentScript`, `WebComponentModule`.

#### Scenario: Angular route
- **WHEN** technology is `Angular`
- **THEN** type is `module` and name is `product|app`

#### Scenario: Web component script
- **WHEN** technology is `WebComponentScript` with `remoteName` `rn`
- **THEN** type is `script` and name is `rn`

### Requirement: Shell federation instance and remote loading
`getShellMfInstance()` SHALL return `globalThis.onecxFederationInstance` if set; otherwise the module federation instance named `onecx-shell-ui` or `onecx_shell_ui`; otherwise `null`. `registerAndLoadRemote(instance, remote, exposedModule)` SHALL strip a leading `./` from the exposed module, register the remote on the instance and return `instance.loadRemote('<remote.name>/<module>')`.

#### Scenario: Leading dot-slash
- **WHEN** exposed module is `./Foo`
- **THEN** `loadRemote('<name>/Foo')` is called after `registerRemotes([remote])`

### Requirement: getInjector
`getInjector(object)` SHALL return the first defined of `object.injector`, `object._injector`, `object.__injector`, `object.___injector`, or `undefined` (also for a null object).

#### Scenario: Private injector
- **WHEN** the object has only `_injector`
- **THEN** that injector is returned
