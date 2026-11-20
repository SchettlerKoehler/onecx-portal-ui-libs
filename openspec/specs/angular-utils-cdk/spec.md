# angular-utils-cdk Specification

## Purpose
Secondary entry point `@onecx/angular-utils/cdk`. Provides Angular CDK overlay containers that render overlays (dialogs, tooltips, dropdowns) inside the OneCX dynamic container instead of `document.body`, so overlays of web-component based microfrontends and remote components stay inside the application scope. Used by application developers who register them as providers.

## Requirements

### Requirement: OnecxOverlayContainer uses the dynamic container
`OnecxOverlayContainer` (extends CDK `OverlayContainer`) SHALL, when the `DYNAMIC_CONTAINER` token is provided, create its overlay container element and then replace it with the element returned by calling `DYNAMIC_CONTAINER()`, copying the class name and all attributes of the default container (including `cdk-overlay-container`) onto the dynamic element. The container element SHALL be reused on subsequent `getContainerElement()` calls.

#### Scenario: DYNAMIC_CONTAINER provided
- **WHEN** `OnecxOverlayContainer` is provided for `OverlayContainer` and `DYNAMIC_CONTAINER` returns an element
- **THEN** `getContainerElement()` returns that dynamic element
- **AND** the element has the class `cdk-overlay-container`
- **AND** repeated calls return the same element

#### Scenario: DYNAMIC_CONTAINER not provided
- **WHEN** `DYNAMIC_CONTAINER` is not provided
- **THEN** the container behaves like the default CDK container, appended to `document.body`, with class `cdk-overlay-container`

### Requirement: OnecxFullscreenOverlayContainer uses the dynamic container
`OnecxFullscreenOverlayContainer` (extends CDK `FullscreenOverlayContainer`) SHALL behave like `OnecxOverlayContainer` with respect to `DYNAMIC_CONTAINER`: the default container is replaced by the dynamic container element with classes and attributes copied, and the container is reused on subsequent calls. Without `DYNAMIC_CONTAINER` it SHALL fall back to the default fullscreen container in `body`.

#### Scenario: Fullscreen container with dynamic container
- **WHEN** `DYNAMIC_CONTAINER` is provided and the container element is requested
- **THEN** the returned element is the dynamic container element with class `cdk-overlay-container`

#### Scenario: Fullscreen container without dynamic container
- **WHEN** `DYNAMIC_CONTAINER` is not provided
- **THEN** the container falls back to `body`

> Note (code-derived): The docs show `{ provide: OverlayContainer, useClass: OnecxFullscreenOverlayContainer }`; the class itself extends `FullscreenOverlayContainer`.
