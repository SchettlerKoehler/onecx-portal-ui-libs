# integration-interface-image-repository Specification

## Purpose
Resolves image URLs by logical name from the shell-published image repository via `ImageRepositoryService`.

## Requirements

### Requirement: Image repository topic
`ImageRepositoryTopic` SHALL be registered as `imageRepository` version 1 with payload `ImageRepositoryInfo` (`images`: name to URL map).

#### Scenario: Payload
- **WHEN** the shell publishes `{ images: { logo: '/l.png' } }`
- **THEN** consumers can look up `logo`

### Requirement: Resolve first matching image name
`ImageRepositoryService.getUrl(names, fallbackUrl?)` SHALL take the first value of the topic and return the URL of the first name in `names` that is a key of `images`. If none matches, or `images` is missing or empty, it SHALL return `fallbackUrl` (`undefined` if not given). If `names` is empty or not provided it SHALL return `fallbackUrl` without reading the topic.

#### Scenario: Existing image
- **WHEN** `getUrl(['a','b'])` and `b` exists
- **THEN** the URL of `b` is returned

#### Scenario: Missing with fallback
- **WHEN** no name matches and `fallbackUrl` is given
- **THEN** `fallbackUrl` is returned

#### Scenario: Missing without fallback
- **WHEN** no name matches and no fallback is given
- **THEN** `undefined` is returned

#### Scenario: No names
- **WHEN** `names` is empty
- **THEN** the fallback is returned immediately

### Requirement: Topic override and cleanup
`imageRepositoryTopic` SHALL be lazily created and replaceable via setter; `destroy()` SHALL destroy it.

#### Scenario: Lazy creation
- **WHEN** the property is first read
- **THEN** a topic instance is created
