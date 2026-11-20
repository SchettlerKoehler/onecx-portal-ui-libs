# angular-accelerator-data-view-state-and-announcements Specification

## Purpose
`DataViewStateService` is the shared signal store of the data view components, and `ResultsAnnouncementService` coordinates which component announces search, filter and sort results to screen readers (WCAG 4.1.3). Both are used by data components and search headers.

## Requirements

### Requirement: Data view state defaults
`DataViewStateService` SHALL be an injectable (not root-provided) service exposing writable signals with these defaults: `layout` `grid`; `activeColumnGroupKey` undefined; `availableColumns`, `columns`, `additionalActions`, `filters`, `selectedRows`, `expandedRows`, `data` empty lists; `actionColumnConfigFrozen` `false`; `actionColumnConfigPosition` `right`; `sortColumn` empty string; `sortDirection` `NONE`; `activePage` `0`; `pageSize` `10`; `listGridPaginator` and `tablePaginator` `true`.

#### Scenario: Fresh instance
- **WHEN** a new instance is created
- **THEN** layout is `grid`, page size is 10 and the sort direction is `NONE`

### Requirement: State shared across components
Components of a data view SHALL read and write the same service instance, so that a change made by one component is observed by the others.

#### Scenario: Layout change
- **WHEN** the layout selection sets `layout` to `table`
- **THEN** the interactive data view reads `table`

### Requirement: Search header registration
`ResultsAnnouncementService` (provided in root) SHALL count registered search headers through `registerSearchHeader(destroyRef)`; `searchHeaderPresent` is `true` while the count is above zero. Destroying the registrant SHALL decrement the count and drop any pending search results announcement request.

#### Scenario: Header destroyed
- **WHEN** the only registered search header is destroyed
- **THEN** `searchHeaderPresent()` is `false`

### Requirement: Search results announcement request
`requestSearchResultsAnnouncement()` SHALL mark that the next data component receiving new data announces its count. `consumeSearchResultsAnnouncementRequest()` SHALL return whether a request exists and clear it. `clearSearchResultsAnnouncementRequest()` SHALL drop it.

#### Scenario: Consume once
- **WHEN** a request is made and consumed twice
- **THEN** the first call returns `true` and the second `false`

### Requirement: Displayed results announcement
Data components (data table, data list grid) SHALL announce the displayed result count through `LiveAnnouncer` once per user action, using a "results" message with `results` = count, or a "no results" message for 0. Several changes in the same turn SHALL yield only the final count. Nothing is announced for the first rendering.

#### Scenario: Zero results
- **WHEN** a filter change leaves no rows
- **THEN** the no-results message is announced

#### Scenario: Initial render
- **WHEN** the component renders for the first time
- **THEN** nothing is announced

### Requirement: Announcement triggers
A change of items SHALL be announced if (a) a client-side filter or sort change is waiting for new data, (b) a search results announcement was requested, or (c) `announceResults` is `true`, or `announceResults` is undefined and no search header is present. A filter or sort change SHALL be announced immediately if applied on the client (`clientSideFiltering` / `clientSideSorting`); otherwise it SHALL wait for the next new items. Filters are compared by deep equality; items by reference.

#### Scenario: Server-side sort
- **WHEN** sort changes with `clientSideSorting` false
- **THEN** the announcement happens when new items arrive

#### Scenario: Search header owns announcement
- **WHEN** a search header is present, `announceResults` is undefined, and new items arrive without a request
- **THEN** nothing is announced

#### Scenario: Explicit announce
- **WHEN** `announceResults` is `true` and new items arrive
- **THEN** the count is announced even with a search header
