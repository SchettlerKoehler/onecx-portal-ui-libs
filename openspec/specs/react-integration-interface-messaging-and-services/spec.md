# react-integration-interface-messaging-and-services Specification

## Purpose
React providers for portal messages, remote components and the image repository service, wrapping integration-interface topics and services for React microfrontends.

## Requirements

### Requirement: Portal message helpers
`PortalMessageProvider` SHALL provide via `usePortalMessage()` the `message$` topic and `success`, `info`, `error` and `warning` functions. Each function SHALL resolve translations of the message's summary and detail (via `resolveTranslation` with the optional `translate` prop and the `*Key`/`*Parameters` fields), build the payload with the severity (`success`, `info`, `error`, `warning`) and publish it to `message$`.

#### Scenario: Publish
- **WHEN** `success({ summaryKey: 'k' })` is called
- **THEN** a message with severity `success` and the translated summary is published

#### Scenario: Outside provider
- **WHEN** `usePortalMessage()` is used without a provider
- **THEN** it throws `usePortalMessage must be used within a PortalMessageProvider`

### Requirement: Message topic ownership
The provider SHALL use `value.message$` when given and never destroy it; otherwise it SHALL create a `MessageTopic` and destroy it on unmount.

#### Scenario: Internal topic
- **WHEN** the provider unmounts without an override
- **THEN** the created topic is destroyed

### Requirement: Remote components provider
`RemoteComponentsProvider` SHALL provide `remoteComponents$` via `useRemoteComponents()`, using `value.remoteComponents$` if given, otherwise a new `RemoteComponentsTopic` destroyed on unmount. `useRemoteComponents()` MUST throw `useRemoteComponents must be used within a RemoteComponentsProvider` outside the provider.

#### Scenario: Default and override
- **WHEN** rendered with and without an override
- **THEN** the provided or newly created topic is returned respectively

### Requirement: Image repository provider
`ImageRepositoryProvider` SHALL provide `imageRepositoryService` via `useImageRepositoryService()`, using `value.imageRepositoryService` if given, otherwise a new `ImageRepositoryService` which is destroyed on unmount. The hook MUST throw `useImageRepositoryService must be used within an ImageRepositoryProvider` outside the provider.

#### Scenario: Internal service
- **WHEN** the provider unmounts without an override
- **THEN** the created service is destroyed
- **AND** a supplied service is not destroyed

> Note (code-derived): unlike other providers, these three use `useMemo` + effect cleanup rather than `useTopic`, so destruction happens synchronously on unmount (StrictMode double-mount may destroy a live instance).
