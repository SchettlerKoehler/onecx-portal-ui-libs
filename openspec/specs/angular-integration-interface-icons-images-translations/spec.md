# angular-integration-interface-icons-images-translations Specification

## Purpose
Thin Angular wrappers over the integration-interface `IconService`, `ImageRepositoryService` and `DynamicTranslationService`, which request icons, images and dynamic translations from the shell.

## Requirements

### Requirement: Icon requests
`IconService.requestIcon(name, type?)` SHALL return the CSS class for the icon immediately and trigger an icon request (published once) when the icon is not yet cached; an explicit `IconClassType` (`svg`, `background`, `background-before`) SHALL be honoured. `iconTopic` SHALL return the underlying topic.

#### Scenario: First request
- **WHEN** an uncached icon is requested
- **THEN** a normalised class is returned and `IconRequested` is published

#### Scenario: Cached
- **WHEN** the icon is already in the cache
- **THEN** nothing is published

### Requirement: Asynchronous icon resolution
`IconService.requestIconAsync(name, type?, fallbackClass?)` SHALL resolve with the class once available. If the icon resolves to nothing, it SHALL resolve with `fallbackClass` when given, otherwise `null`. Cached results SHALL resolve immediately.

#### Scenario: Waits for IconsReceived
- **WHEN** the icon is not cached
- **THEN** the promise resolves after `IconsReceived` with the class

#### Scenario: Not found
- **WHEN** the icon is not found and no fallback is provided
- **THEN** it resolves `null`; with a fallback it resolves the fallback class

### Requirement: Icon service cleanup
`IconService.ngOnDestroy` SHALL destroy the underlying service.

#### Scenario: Destroy
- **WHEN** the service is destroyed
- **THEN** the underlying topic is destroyed

### Requirement: Image URL lookup
`ImageRepositoryService.getUrl(names, fallbackUrl?)` SHALL delegate to the underlying service and resolve with the URL for the given image names, or `undefined` without fallback; with a truthy `fallbackUrl` it SHALL resolve a string. `imageRepositoryTopic` SHALL expose the underlying topic and `ngOnDestroy` SHALL destroy it.

#### Scenario: No fallback
- **WHEN** `getUrl(['a'])` is called
- **THEN** the underlying `getUrl(names)` is called without a fallback

#### Scenario: With fallback
- **WHEN** `getUrl(['a'], 'x.png')` is called
- **THEN** the underlying call receives the fallback

> Note (code-derived): an empty-string fallback is treated as no fallback.

### Requirement: Dynamic translations
`DynamicTranslationService.getTranslations(lang, contexts)` SHALL return an `Observable` of `Record<string, Record<string, unknown>>` produced by the underlying service for the given language and `TranslationContext[]`. `dynamicTranslationsTopic$` SHALL expose the underlying topic and `ngOnDestroy` SHALL destroy the underlying service.

#### Scenario: Delegation
- **WHEN** `getTranslations('de', contexts)` is called
- **THEN** the underlying method is called with the same arguments and its observable is returned
