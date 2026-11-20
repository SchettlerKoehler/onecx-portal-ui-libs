# angular-accelerator-module Specification

## Purpose
Describes what consumers receive by importing `AngularAcceleratorModule` and `AngularAcceleratorOptimusModule` from `@onecx/angular-accelerator`.

## Requirements

### Requirement: Exported declarations
`AngularAcceleratorModule` SHALL export `AngularRemoteComponentsModule`, the table/view components (`ColumnGroupSelectionComponent`, `CustomGroupColumnSelectorComponent`, `DataLayoutSelectionComponent`, `DataListGridComponent`, `DataTableComponent`, `DataViewComponent`, `InteractiveDataViewComponent`, `FilterViewComponent`), page components (`PageHeaderComponent`, `SearchHeaderComponent`, `LifecycleComponent`, `DiagramComponent`, `GroupByCountDiagramComponent`, `OcxContentComponent`, `OcxContentContainerComponent`, `GlobalErrorComponent`, `LoadingIndicatorComponent`, `ConsentComponent`), the dialog components (`DialogFooterComponent`, `DialogContentComponent`, `DialogInlineComponent`, `DialogMessageContentComponent`), the pipe `OcxTimeAgoPipe`, and the directives `IfPermissionDirective`, `IfBreakpointDirective`, `SrcDirective`, `OcxTooltipDirective`, `TooltipOnOverflowDirective`, `AdvancedDirective`, `BasicDirective`, `TemplateDirective`, `OcxContentDirective`, `OcxContentContainerDirective`, `LoadingIndicatorDirective`.

#### Scenario: Use in a template
- **WHEN** a module imports `AngularAcceleratorModule`
- **THEN** these components, directives and the time-ago pipe are usable in its templates

> Note (code-derived): `DynamicPipe`, `DataListGridSortingComponent` and the Optimus modules are declared/imported but not re-exported; consumers needing optimus-ui modules must import `AngularAcceleratorOptimusModule` themselves.

### Requirement: Module providers
Importing `AngularAcceleratorModule` SHALL provide: a permission checker (`providePermissionChecker()`), a `LOCALE_ID` resolved dynamically from the user's language (`DynamicLocaleId`), translation asset paths for `onecx-angular-accelerator/assets/i18n/` and `.../i18n/optimus/`, a multi-language identifier `@onecx/angular-accelerator` with the library version (type `lib`), `MessageService`, `AppConfigService`, the translation connection service and the portal dialog service.

#### Scenario: Locale follows user language
- **WHEN** the application is created
- **THEN** `LOCALE_ID` reflects the user's language

### Requirement: Locale data loading at startup
An `APP_INITIALIZER` SHALL wait for the second emission of `UserService.lang$` (skipping the initial value), then load and register the Angular locale data for that language from `localeLoaders`. If loading fails, a console warning SHALL be logged and application start-up SHALL continue.

#### Scenario: Locale loading fails
- **WHEN** the locale loader for the language throws
- **THEN** a warning `Could not load locale data for '<lang>'...` is logged and initialization completes

> Note (code-derived): start-up waits until `lang$` emits a second time; if it never does, the initializer does not complete. A language without a loader is silently ignored.

### Requirement: Missing translation handling
The library SHALL export `AngularAcceleratorMissingTranslationHandler`, a subclass of `MultiLanguageMissingTranslationHandler` from `@onecx/angular-utils`, usable as the ngx-translate missing-translation handler.

#### Scenario: Use as handler
- **WHEN** it is configured as missing translation handler
- **THEN** it behaves as `MultiLanguageMissingTranslationHandler`

### Requirement: Optimus module
`AngularAcceleratorOptimusModule` SHALL import and re-export the optimus-ui modules used by the library (Breadcrumb, Chip, Checkbox, Select, Button, Dialog, PickList, SelectButton, DataView, Table, Menu, Chart, MultiSelect, Skeleton, Message, FloatLabel, Popover, FocusTrap, Tooltip, Timeline, Ripple, Shared) and provide `provideOptimus()`.

#### Scenario: Import optimus module
- **WHEN** a consumer imports `AngularAcceleratorOptimusModule`
- **THEN** those optimus-ui modules are available and optimus configuration is provided
