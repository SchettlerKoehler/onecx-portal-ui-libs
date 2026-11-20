# angular-remote-components-permission-service Specification

## Purpose
`PermissionService` fetches the permissions of a remote component's application over the permissions RPC topic, with caching.

## Requirements

### Requirement: Permission retrieval
`getPermissions(appId, productName)` SHALL publish a request `{ appId, productName }` on `PermissionsRpcTopic` and resolve with the `permissions` array from the first response whose `appId` and `productName` match and whose `permissions` is an array.

#### Scenario: Matching response
- **WHEN** a response for another app arrives and then one for the requested app
- **THEN** only the matching response resolves the promise

### Requirement: Caching
Results SHALL be cached per `appId:productName` key; repeated calls return the same promise and do not publish again.

#### Scenario: Second call
- **WHEN** `getPermissions` is called twice with the same arguments
- **THEN** only one request is published

> Note (code-derived): the promise is cached before resolution, and never expires or is invalidated; if no response arrives it never settles.

### Requirement: Lifecycle
The topic SHALL be created lazily, be replaceable via the `permissionsTopic$` setter, and be destroyed on service destroy.

#### Scenario: Destroy
- **WHEN** the service is destroyed
- **THEN** the topic is destroyed if it was created
