# integration-interface-topics Specification

## Purpose
Defines the platform topics exported by `@onecx/integration-interface`, their registered names, versions, payload types and shared-model semantics. Shell, microfrontends and remote components use them as the framework-agnostic contract for exchanging state and events. Every topic extends `Topic` from `@onecx/accelerator`.

## Requirements

### Requirement: Topic registration names and versions
Each exported topic class SHALL register itself with a fixed topic name and version 1. The following name/payload pairs MUST be used: `CurrentMfeTopic` -> `currentMfe` (`MfeInfo`); `CurrentPageTopic` -> `currentPage` (`PageInfo | undefined`); `CurrentThemeTopic` -> `currentTheme` (`Theme`); `CurrentWorkspaceTopic` -> `currentPortal` (`Workspace`); `CurrentLocationTopic` -> `currentLocation` (`CurrentLocationTopicPayload`); `UserProfileTopic` -> `userProfile` (`UserProfile`); `ConfigurationTopic` -> `configuration` (`Config`); `ParametersTopic` -> `parameters` (`ParametersTopicPayload`); `GlobalErrorTopic` -> `globalError` (`string`); `GlobalLoadingTopic` -> `globalLoading` (`boolean`); `IsAuthenticatedTopic` -> `isAuthenticated` (`void`); `MessageTopic` -> `message` (`Message`); `NotificationTopic` -> `notification` (`Notification`); `PermissionsTopic` -> `permissions` (`string[]`); `RemoteComponentsTopic` -> `remoteComponentsInfo` (`RemoteComponentsInfo`); `ImageRepositoryTopic` -> `imageRepository` (`ImageRepositoryInfo`).

#### Scenario: Instances share state by name
- **WHEN** two instances of the same topic class are created in different microfrontends
- **THEN** they use the same topic name and version and therefore exchange messages

> Note (code-derived): `CurrentWorkspaceTopic` uses the legacy name `currentPortal`, not `currentWorkspace`.

### Requirement: Message-queue versus state topics
Topics that carry events or request/response messages SHALL be registered without retained (shared) state: `EventsTopic` (`events`), `ResizedEventsTopic` (`resizedEvents`), `PermissionsRpcTopic` (`permissionsRpc`), `DynamicTranslationsTopic` (`dynamicTranslations`) and `IconTopic` (`icon`) pass `false` as third constructor argument. All other topics SHALL retain the latest published value for late subscribers.

#### Scenario: Event topic does not replay
- **WHEN** a subscriber subscribes to `EventsTopic` after a message was published
- **THEN** it does not receive that earlier message as a replayed value

### Requirement: Events topic
`EventsTopic` SHALL carry `TopicEventType` messages, being either `NavigatedEvent` (`type: EventType.NAVIGATED`, payload `NavigatedEventPayload` with `url: string | undefined` and `isFirst: boolean`) or any object with `type` (`EventType | string`) and optional `payload`. `EventType` MUST contain `NAVIGATED = 'navigated'` and `AUTH_LOGOUT_BUTTON_CLICKED = 'authentication#logoutButtonClicked'`.

#### Scenario: Custom event
- **WHEN** a publisher sends `{ type: 'my-event', payload: 1 }`
- **THEN** the message is accepted as a valid `TopicEventType`

> Note (code-derived): `NavigatedEvent` is marked `@deprecated`; `CurrentLocationTopic` SHALL be used for navigation events instead.

### Requirement: Current location topic payload
`CurrentLocationTopic` SHALL carry `CurrentLocationTopicPayload` consisting of an optional `url` and a mandatory `isFirst` flag.

#### Scenario: Initial navigation
- **WHEN** the shell publishes the first navigation
- **THEN** the payload has `isFirst: true`

### Requirement: Current MFE info model
`MfeInfo` SHALL require `mountPath`, `remoteBaseUrl`, `baseHref`, `shellName`, `appId` and `productName`, and SHALL allow optional `version`, `remote` (deprecated per docs), `displayName`, `remoteName` and `elementName`.

#### Scenario: Required properties
- **WHEN** a publisher builds an `MfeInfo`
- **THEN** it must provide all required properties listed above

### Requirement: Current theme model
`Theme` SHALL have only optional properties (`id`, `name`, `description`, `logoUrl`, `faviconUrl`, `properties`, `overrides`, and deprecated `assetsUpdateDate`, `assetsUrl`, `cssFile`, `previewImageUrl`). `properties` SHALL map section name to a map of CSS variable name to value. `ThemeOverride` SHALL have optional `type` (`OverrideType.OPTIMUS = 'OPTIMUS'` or `OverrideType.CSS = 'CSS'`) and optional `value`. Publishing to `CurrentThemeTopic` SHALL deliver the theme to subscribers but SHALL NOT itself apply the theme to the page.

#### Scenario: Theme published
- **WHEN** a `Theme` is published on `CurrentThemeTopic`
- **THEN** subscribers receive an equal object

#### Scenario: Empty override
- **WHEN** a `ThemeOverride` is created as `{}`
- **THEN** `type` and `value` are both `undefined`

### Requirement: Workspace model
`Workspace` SHALL require `baseUrl`, `workspaceName`, `portalName` (deprecated, to be renamed to `workspaceName`) and `microfrontendRegistrations` (deprecated), and SHALL allow optional `displayName`, `homePage`, `routes` (`Route[]`), `i18n` and further deprecated properties. `Route` SHALL describe a microfrontend (`url`, `baseUrl`, `remoteEntryUrl`, `appId`, `productName`, `technology`, `exposedModule`, `pathMatch`, `remoteName`, `elementName`, `displayName`, `endpoints`), all optional. `Endpoint` SHALL have optional `name` and `path`.

#### Scenario: Route lookup data
- **WHEN** a workspace is published with routes containing endpoints
- **THEN** consumers can resolve URLs via the workspace utilities (see `integration-interface-utils`)

### Requirement: Remote components model
`RemoteComponentsInfo` SHALL contain `components: RemoteComponent[]` and `slots: Slot[]`. `RemoteComponent` SHALL carry `name`, `baseUrl`, `remoteEntryUrl`, `appId`, `productName`, `exposedModule`, `remoteName`, `technology` and optional `shareScope`. `Technologies` MUST be `Angular`, `WebComponentScript` or `WebComponentModule`. `Slot` SHALL have a `name` and a list of component names.

#### Scenario: Slot to components
- **WHEN** a slot lists component names
- **THEN** each name refers to a `RemoteComponent.name` in the same info object

### Requirement: User profile model
`UserProfile` SHALL require `userId` and `person` (`UserPerson`) and SHALL allow `organization`, `tenantId`, `issuer`, `settings` (`locales?: string[]`) and `accountSettings`. `accountSettings` SHALL contain optional `localeAndTimeSettings` (`locale`, `timezone`) and `layoutAndThemeSettings` (`menuMode`: `HORIZONTAL|STATIC|OVERLAY|SLIM|SLIMPLUS`, `colorScheme`: `AUTO|LIGHT|DARK`). `PhoneType` MUST be `MOBILE` or `LANDLINE`. Properties `id`, `identityProvider`, `identityProviderId`, `tenantName`, `avatar`, `memberships`, `privacySettings`, `notificationSettings` are deprecated.

#### Scenario: Minimal profile
- **WHEN** a profile has only `userId` and `person: {}`
- **THEN** it is a valid `UserProfile`

### Requirement: Configuration, parameters and permissions payloads
`Config` SHALL be a string-to-string map. `ParametersTopicPayload` SHALL hold `parameters: ApplicationParameters[]`, each with `productName`, `appId` and a `Parameters` map whose values are `boolean | number | string | object`. `PermissionsRpc` SHALL carry `appId`, `productName` and optional `permissions`; a message without `permissions` is a request and a message with `permissions` is the response.

#### Scenario: Permissions request
- **WHEN** a microfrontend publishes `{ appId, productName }` on `PermissionsRpcTopic`
- **THEN** the message represents a request for that application's permissions

### Requirement: Message and notification payloads
`Message` SHALL have only optional PrimeNG-toast-like properties (`severity`, `summary`, `detail`, `id`, `key`, `life`, `sticky`, `closable`, `data`, `icon`, `contentStyleClass`, `styleClass`). `Notification` SHALL carry `type`, `address`, `headers` and a `body` with `id`, `applicationId`, `senderId`, `receiverId`, `persist`, `creationData` (sic) and `contentMeta`.

#### Scenario: Toast message
- **WHEN** a `Message` with `severity` and `summary` is published on `MessageTopic`
- **THEN** the shell may display it as a toast

### Requirement: Global state topics
`GlobalErrorTopic` SHALL carry an error string and `GlobalLoadingTopic` SHALL carry a boolean loading flag. `IsAuthenticatedTopic` carries no payload; its first emission SHALL signal that the user is authenticated.

#### Scenario: Authenticated signal
- **WHEN** a consumer awaits the first value of `IsAuthenticatedTopic`
- **THEN** it can assume the user is authenticated afterwards
