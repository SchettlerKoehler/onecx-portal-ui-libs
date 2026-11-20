# integration-interface-current-page-topic Specification

## Purpose
`CurrentPageTopic` publishes information about the page currently displayed, but only while the browser location still matches that page. It is used by consumers such as help and permission features.

## Requirements

### Requirement: Page info payload
`CurrentPageTopic` SHALL be registered as `currentPage` version 1 and carry `PageInfo | undefined`. `PageInfo` SHALL have a mandatory `path` and optional `helpArticleId`, `pageName`, `permission` and `applicationId` (deprecated).

#### Scenario: Publish page info
- **WHEN** `PageInfo` with `path: '/a'` is published
- **THEN** subscribers may receive it according to the path matching requirement

### Requirement: Emit page info only for the matching path
`asObservable()` SHALL combine the published `PageInfo` with the current `document.location.pathname` and emit the `PageInfo` only when `pageInfo.path` equals the current pathname; otherwise it SHALL emit `undefined`.

#### Scenario: Matching path
- **WHEN** the location is changed to `/x` and `PageInfo` with `path: '/x'` is published
- **THEN** subscribers receive that `PageInfo`

#### Scenario: Non-matching path
- **WHEN** the location is `/x` and `PageInfo` with another path is published
- **THEN** subscribers receive `undefined`

#### Scenario: Initial location
- **WHEN** the location is not changed and `PageInfo` with `path: '/'` is published
- **THEN** subscribers receive that `PageInfo`

### Requirement: Re-evaluate on location changes
The topic SHALL observe DOM mutations on `body` (child list, subtree) and re-read `document.location.pathname` on each mutation; changes to the pathname SHALL re-trigger emission (consecutive identical paths are de-duplicated).

#### Scenario: Location changes after publish
- **WHEN** a `PageInfo` was published and the pathname later changes to a different value
- **THEN** subscribers receive `undefined`

### Requirement: Fail without a document body
Constructing `CurrentPageTopic` when `document.body` does not exist SHALL log an error and throw `Error('could not listen to location changes')`.

#### Scenario: No body
- **WHEN** `document.querySelector('body')` returns `null` during construction
- **THEN** the constructor throws `could not listen to location changes`

> Note (code-derived): `asObservable` reads `.path` of the raw topic value without null check, so a published `undefined` would throw inside the pipeline.
