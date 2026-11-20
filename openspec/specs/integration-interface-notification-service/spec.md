# integration-interface-notification-service Specification

## Purpose
`NotificationService` is a thin holder of the `NotificationTopic` for consumers of platform notifications.

## Requirements

### Requirement: Lazy and replaceable topic
`NotificationService.notificationTopic` SHALL create a `NotificationTopic` on first access, return the same instance afterwards, and allow replacement through its setter.

#### Scenario: Lazy init
- **WHEN** `notificationTopic` is read for the first time
- **THEN** a `NotificationTopic` is created

#### Scenario: Override
- **WHEN** a topic is assigned via the setter
- **THEN** the getter returns the assigned topic

### Requirement: Destroy
`destroy()` SHALL destroy the current topic.

#### Scenario: Destroy topic
- **WHEN** `destroy()` is called
- **THEN** `notificationTopic.destroy()` is invoked

> Note (code-derived): `destroy()` accesses the getter, so calling it before initialization creates a topic and then destroys it without error.
