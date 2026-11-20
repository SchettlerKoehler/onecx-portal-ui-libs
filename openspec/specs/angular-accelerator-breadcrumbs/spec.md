# angular-accelerator-breadcrumbs Specification

## Purpose
`BreadcrumbService` supplies the breadcrumb items shown by the page header: either generated from router data, or set manually by the application. `BreadCrumbMenuItem` describes manually provided items.

## Requirements

### Requirement: Automatic breadcrumb generation
`BreadcrumbService` SHALL expose `generatedItemsSource`, a `BehaviorSubject<MenuItem[]>` initially `[]`, and SHALL regenerate it from the route tree at construction and after every router `NavigationEnd`. When a route with `data.mfeInfo` is found, the first item SHALL have `label` = `mfeInfo.productName` and `routerLink` = `mfeInfo.baseHref`, followed by one item per descendant route that has a `routeConfig.path`. When no `mfeInfo` exists but a route has `data.breadcrumb`, items SHALL be generated from that route and its descendants. Otherwise the service SHALL descend to the first child route.

#### Scenario: MFE route
- **WHEN** the active route has `data.mfeInfo` with `productName` "Products" and `baseHref` "/products"
- **THEN** `generatedItemsSource` emits an array whose first item is `{ label: 'Products', routerLink: '/products' }`

#### Scenario: Navigation
- **WHEN** a `NavigationEnd` event occurs
- **THEN** breadcrumbs are regenerated from the router state root

### Requirement: Breadcrumb labels and links
For each route-derived item the `routerLink` SHALL be `/` plus the accumulated URL segments. The label SHALL be `data.breadcrumb`, or the result of `data.breadcrumbFn(data, paramMap)` when `breadcrumbFn` is a function. If the route has no `data.breadcrumb`, the label SHALL be `NA`. When a route using a matcher (its URL segments are not all contained in the `baseHref`) is the MFE root, an additional item for it SHALL be created.

#### Scenario: Static label
- **WHEN** a child route has `data.breadcrumb` = "Details" and path "details"
- **THEN** the item has label "Details" and routerLink ending in `/details`

#### Scenario: Dynamic label
- **WHEN** a route defines `breadcrumbFn` and `breadcrumb`
- **THEN** the label is the return value of `breadcrumbFn(data, paramMap)`

#### Scenario: Missing breadcrumb data
- **WHEN** a route with a path has no `data.breadcrumb`
- **THEN** its item label is `NA`

### Requirement: Manual breadcrumbs
`BreadcrumbService.setItems(items)` SHALL publish manual breadcrumbs, which are exposed via the `itemsHandler` observable as `MenuItem[]`. If any item has `labelKey` or `titleKey`, the keys SHALL be translated via `TranslateService` and each published item SHALL be the original item with `label` set to the translation of `labelKey` and `title` to the translation of `titleKey`. If there are no keys, the items SHALL be published unchanged.

#### Scenario: Translated items
- **WHEN** `setItems([{ labelKey: 'HOME.LABEL', routerLink: '/' }])` is called
- **THEN** `itemsHandler` emits an item with `label` equal to the translation of `HOME.LABEL`

#### Scenario: Items without keys
- **WHEN** `setItems([{ icon: 'x', url: '/a' }])` is called
- **THEN** `itemsHandler` emits the same items without translation

> Note (code-derived): For an item that has only one of `labelKey`/`titleKey` while another has a key, the missing key is looked up as an empty string, so its `label` or `title` becomes `undefined`.

### Requirement: Manual breadcrumb transport
Manual breadcrumbs SHALL be transported via a versioned topic named `manualBreadcrumbs` that is created lazily, and the service SHALL destroy this topic when it is destroyed. The service SHALL be provided with `providedIn: 'any'`.

#### Scenario: Lazy topic
- **WHEN** neither `setItems` nor `itemsHandler` is used
- **THEN** no topic is created

#### Scenario: Destroy
- **WHEN** the service is destroyed
- **THEN** the topic (if created) is destroyed

### Requirement: BreadCrumbMenuItem model
`BreadCrumbMenuItem` SHALL be an interface with all-optional menu item properties (for example `labelKey`, `titleKey`, `icon`, `url`, `routerLink`, `queryParams`, `fragment`, `command`, `items`, `disabled`, `visible`, `target`, `separator`, `badge`, `tooltip`, `tooltipOptions`, `id`, `state`) where `labelKey` and `titleKey` are translation keys used by `setItems`.

#### Scenario: Using the model
- **WHEN** an application passes `{ labelKey: 'X', routerLink: '/x' }` to `setItems`
- **THEN** it type-checks as `BreadCrumbMenuItem`
