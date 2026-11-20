# angular-accelerator-dialogs Specification

## Purpose
`PortalDialogService.openDialog` opens modal dialogs that show either a translated message or a custom component with primary, secondary and custom buttons, built on the dynamic dialog of the UI library. The dialog building blocks `ocx-dialog-content`, `ocx-dialog-footer`, `ocx-dialog-inline` and `DialogMessageContentComponent` and the `ButtonDialog*` models are also public. Used by application developers.

## Requirements

### Requirement: Opening a dialog
`PortalDialogService.openDialog(title, componentOrMessage, primaryButton, secondaryButton?, extras?)` SHALL return an `Observable<DialogState<T> | null>`; the dialog SHALL only be opened when the observable is subscribed. The observable SHALL emit once, when the dialog closes, with the `DialogState` (or the close value, such as `undefined`, if closed without a button), and complete. `title` SHALL be a `TranslationKey` (string or `{key, parameters}`) or `null`, translated before opening; `null`/empty yields an empty title. The dialog SHALL be modal, appended to the document body, and opened with `duplicate` allowed (several dialogs can be stacked). The service SHALL be provided with `providedIn: 'any'`; `providePortalDialogService()` SHALL return `[DialogService, PortalDialogService]`.

#### Scenario: Message dialog
- **WHEN** `openDialog('TITLE', 'MESSAGE', 'OK', 'CANCEL')` is subscribed
- **THEN** a modal dialog with the translated title and message and two buttons is shown
- **AND** after the user clicks OK the observable emits `{ button: 'primary', result: undefined }` and completes

#### Scenario: Not subscribed
- **WHEN** `openDialog` is called but not subscribed
- **THEN** no dialog is opened

#### Scenario: Dialog creation fails
- **WHEN** the underlying dialog service does not return a dialog reference
- **THEN** an error is logged and the observable emits `null`

### Requirement: Dialog content types
The second argument SHALL accept: a translation key string or `{key, parameters}` (rendered as a message), a `DialogMessage` `{ message: TranslationKey, icon, iconLabel? }` (rendered as message with icon), a component class, or `{ type, inputs? }` (a component with inputs). For components, each entry of `inputs` SHALL be set as a component input. Message dialogs SHALL render via `DialogMessageContentComponent`.

#### Scenario: Component with inputs
- **WHEN** `{ type: MyComponent, inputs: { header: 'H' } }` is passed
- **THEN** `MyComponent` is created inside the dialog with input `header` = `'H'`

#### Scenario: Message with icon
- **WHEN** `{ message: 'MSG', icon: 'pi pi-info-circle' }` is passed
- **THEN** the dialog shows the icon next to the translated message

### Requirement: Dialog buttons
The primary button SHALL be given as a translation key string or `ButtonDialogButtonDetails` (`key`, `id`, `icon`, `parameters`, `tooltipKey`, `tooltipPosition`, `severity`). The secondary button SHALL be shown only if its argument is provided. Default button ids are `buttonDialogPrimaryButton` and `buttonDialogSecondaryButton`. Button labels SHALL be translated with `parameters`, the tooltip with `tooltipKey`, the aria label equals the label, and `severity` (`primary`, `secondary`, `success`, `info`, `warn`, `help`, `danger`, `contrast`) is applied to the button only when set. Defaults when no details are configured (footer defaults) are `OCX_BUTTON_DIALOG.CONFIRM` for primary and `OCX_BUTTON_DIALOG.CANCEL` for secondary. Custom buttons (`extras.customButtons`: `ButtonDialogCustomButtonDetails` with required `id` and `alignment` `left` or `right`) SHALL be rendered: left ones at the left side of the footer, right ones before the secondary and primary buttons.

#### Scenario: Custom button
- **WHEN** `customButtons` contains `{ id:'delete', key:'DEL', alignment:'right' }` and the user clicks it
- **THEN** the observable emits `{ button: 'custom', id: 'delete', result: ... }`

#### Scenario: Single button
- **WHEN** the secondary argument is omitted
- **THEN** only the primary button is rendered

#### Scenario: Severity
- **WHEN** the primary details have `severity: 'danger'`
- **THEN** the button is rendered with the danger severity

### Requirement: Dialog state result
`DialogState<T>` SHALL consist of `button` (`primary`, `secondary` or `custom`), `result` (`T | undefined`) and optional `id` (custom button id). If the displayed component has a `dialogResult` property (`DialogResult<T>`), `result` SHALL be its value at the time of the button click.

#### Scenario: Component result
- **WHEN** the component's `dialogResult` is `'abc'` and the user clicks primary
- **THEN** the emitted state has `result: 'abc'`

### Requirement: Component-controlled closing
If the displayed component implements `ocxDialogButtonClicked(state)` (`DialogButtonClicked`), it SHALL be called on every button click. If it returns `undefined`/void, the dialog SHALL close with the state. If it returns `boolean`, `Observable<boolean>` or `Promise<boolean>`, the dialog SHALL close with the state only when the value is `true`. If the component does not implement it, the dialog SHALL close on every button click.

#### Scenario: Prevent closing
- **WHEN** `ocxDialogButtonClicked` returns `false`
- **THEN** the dialog stays open

#### Scenario: Async confirmation
- **WHEN** `ocxDialogButtonClicked` returns a Promise resolving to `true`
- **THEN** the dialog closes with the state

#### Scenario: No handler
- **WHEN** the component has no `ocxDialogButtonClicked`
- **THEN** any button click closes the dialog

### Requirement: Component-controlled button enabling
If the displayed component has a `primaryButtonEnabled` (`DialogPrimaryButtonDisabled`) or `secondaryButtonEnabled` (`DialogSecondaryButtonDisabled`) `Subject<boolean>`, the corresponding button SHALL be disabled until `true` is emitted and follow subsequent values; the component is considered to emit `false` initially. If it has a `customButtonEnabled` (`DialogCustomButtonsDisabled`) subject emitting `{ id, enabled }`, the custom button with that id SHALL follow it, and all custom buttons SHALL initially be disabled. Without these subjects the primary and secondary buttons are enabled.

#### Scenario: Enable primary
- **WHEN** the component emits `true` on `primaryButtonEnabled`
- **THEN** the primary button becomes enabled

#### Scenario: Custom buttons initially disabled
- **WHEN** a dialog with custom buttons is opened and the component implements `customButtonEnabled`
- **THEN** every custom button is disabled until `{ id, enabled: true }` is emitted for it

> Note (code-derived): The documented interface text says buttons are disabled until `true` is emitted; this holds only for components that implement the subject (the dialog emits an initial `false` for them).

### Requirement: Close button and closing behaviour
The header "X" close button SHALL be shown when `extras.closable` is set explicitly to `true`; otherwise when `extras.showXButton` is `true` and a secondary button exists. A boolean passed instead of `extras` SHALL be treated as `showXButton`. Its accessible name SHALL be `extras.closeAriaLabel` if given, otherwise the translation of `OCX_BUTTON_DIALOG.CLOSE`. All remaining `PortalDialogConfig` options (`width`, `height`, `closeOnEscape`, `focusTrap`, `baseZIndex`, `autoZIndex`, `dismissableMask`, `showHeader`, `modal`, `resizable`, `draggable`, `keepInViewport`, `minX`, `minY`, `maximizable`, `maximizeIcon`, `minimizeIcon`, `position`, `ariaLabelledBy`) SHALL be passed to the underlying dialog. Open dialogs SHALL be closed and removed from the DOM on router `NavigationStart` and on a navigation event of the shell (`currentLocation$` when the shell supports the `CURRENT_LOCATION_TOPIC` capability, otherwise `EventsTopic` `NAVIGATED`), and when the service is destroyed.

#### Scenario: X button with secondary
- **WHEN** `showXButton` is `true` and a secondary button is given
- **THEN** the X close button is shown

#### Scenario: X button without secondary
- **WHEN** `showXButton` is `true` but no secondary button is given and `closable` is not set
- **THEN** no X button is shown

#### Scenario: Explicit closable
- **WHEN** `closable` is `true`
- **THEN** the X button is shown regardless of the secondary button

#### Scenario: Navigation
- **WHEN** the router starts a navigation while a dialog is open
- **THEN** the dialog is closed and its elements removed from the body

### Requirement: Dialog focus management
`extras.focusOnShow` SHALL default to `true`. The dialog SHALL automatically focus a footer button when `autoFocusButton` (`primary`, `secondary` or `custom` with `autoFocusButtonCustomId`) is set, and in this case the dialog's own initial focusing is turned off. For message-only dialogs with focus on show and no explicit `autoFocusButton`, the secondary button (if present, otherwise the primary) SHALL be focused. When the dialog closes, focus SHALL return to `initiatorRef` or else to the element that was focused when the dialog opened, unless `onCloseFocus` is `none`. If this element is no longer in the document, focus SHALL move to the `main` landmark (made focusable). `onCloseFocus` values `initiator` and `default` behave identically.

#### Scenario: Message dialog focus
- **WHEN** a message dialog with two buttons opens with defaults
- **THEN** the secondary (cancel) button receives focus

#### Scenario: Explicit auto focus
- **WHEN** `autoFocusButton` is `primary`
- **THEN** the primary button receives focus

#### Scenario: Focus restoration
- **WHEN** the dialog closes
- **THEN** focus returns to the element that opened the dialog

#### Scenario: No restoration
- **WHEN** `onCloseFocus` is `none`
- **THEN** focus is not moved by the service

### Requirement: Dialog accessibility
The dialog content SHALL render in a scroll region; when its content overflows (vertically or horizontally, tracked via a resize observer) the region SHALL be keyboard focusable (`tabindex=0`) and exposed as `role="region"` labelled `OCX_BUTTON_DIALOG.CONTENT_REGION`. If the dialog has no title (or the header is hidden) and no `ariaLabelledBy`, the dialog container SHALL receive `aria-label` set to the translation of `OCX_BUTTON_DIALOG.DEFAULT_NAME` (passed as `dialogAriaLabel`) and no `aria-labelledby`. If the content contains a message (`.dialogMessageText`), the container SHALL get `aria-describedby` referencing it.

#### Scenario: Untitled dialog
- **WHEN** the dialog is opened with `title` `null`
- **THEN** the dialog container has an `aria-label` with the default dialog name

#### Scenario: Overflowing content
- **WHEN** the content is taller than the region
- **THEN** the region is focusable and has `role="region"`

#### Scenario: Message description
- **WHEN** a message dialog is shown
- **THEN** `aria-describedby` of the dialog references the message text

### Requirement: Dialog message content
`DialogMessageContentComponent` SHALL render `message` (default `'message'`) translated with `messageParameters` (default `{}`) in an element with a per-instance unique id. If `icon` (default `''`) is non-empty it SHALL render the icon (hidden from assistive technology) and a visually hidden label: `iconLabel` (`TranslationKey`) if given, otherwise derived from the icon class: check icons map to `OCX_BUTTON_DIALOG.SEVERITY.SUCCESS`, info to `INFO`, exclamation-triangle to `WARNING`, exclamation-circle/times-circle/ban to `ERROR`, question to `QUESTION`. Unknown icons without `iconLabel` have no label.

#### Scenario: Derived icon label
- **WHEN** `icon` is `pi pi-exclamation-triangle`
- **THEN** a visually hidden "warning" label is rendered before the message

#### Scenario: Explicit icon label
- **WHEN** `iconLabel` is `{ key: 'X', parameters: { a: 1 } }`
- **THEN** the translation of `X` with the parameters is used

#### Scenario: No icon
- **WHEN** `icon` is empty
- **THEN** neither icon nor label is rendered

### Requirement: Inline dialog
`ocx-dialog-inline` SHALL render its projected content inside `ocx-dialog-content` followed by an `ocx-dialog-footer` configured by `config` (`ButtonDialogConfig`, default `{}`), without opening a dialog overlay. When a footer button is clicked it SHALL emit `resultEmitter` with the clicked button name (`primary`, `secondary` or `custom`).

#### Scenario: Inline footer
- **WHEN** the user clicks the primary button
- **THEN** `resultEmitter` emits `'primary'`

### Requirement: Inline footer configuration
When used with `config` input, `ocx-dialog-footer` SHALL apply `primaryButtonDetails` and `secondaryButtonDetails` only when they have a non-empty `key`, `secondaryButtonIncluded` only when truthy, and `customButtons` always (split by `alignment`). The footer SHALL emit `buttonClickedEmitter` with the `DialogState` for each button click (`button`, `id` for custom buttons). Defaults are exported as `defaultPrimaryButtonDetails` (`OCX_BUTTON_DIALOG.CONFIRM`), `defaultSecondaryButtonDetails` (`OCX_BUTTON_DIALOG.CANCEL`) and `defaultDialogData`.

#### Scenario: Secondary included
- **WHEN** `config.secondaryButtonIncluded` is `true`
- **THEN** the secondary button is rendered with the configured details

#### Scenario: Empty key ignored
- **WHEN** `primaryButtonDetails` has an empty key
- **THEN** the default primary label is kept

> Note (code-derived): In inline mode `secondaryButtonIncluded: false` does not hide a previously enabled secondary button, because only truthy values are applied; and the footer mutates the shared default dialog data object.

### Requirement: Button dialog models
The library SHALL export `ButtonDialogButtonDetails`, `ButtonDialogCustomButtonDetails` (adds required `id` and `alignment`), `ButtonDialogConfig` (`primaryButtonDetails`, `secondaryButtonIncluded`, `secondaryButtonDetails`, `customButtons`, `autoFocusButton`, `autoFocusButtonCustomId`, `initiatorRef`, `onCloseFocus`), `ButtonDialogData` (`config`, `component`, `componentData`, `dialogAriaLabel`) and `DialogButtonSeverity`. It SHALL also export `TranslationKey` (a string, or `TranslationKeyWithParameters` `{ key, parameters? }`) for translated texts; strings that cannot be translated are displayed as is.

#### Scenario: Untranslatable key
- **WHEN** a `TranslationKey` has no translation
- **THEN** the key text is displayed as is

### Requirement: Dialog content Template and appearance
`ocx-dialog-content` (`dialog-content.component.scss`) SHALL render `div.buttonDialogScrollableContent` (template ref `#scrollRegion`) containing an inner `div` (`#scrollContent`) that holds an `ng-container #container` (dynamic component host) followed by `<ng-content>`. When `scrollable()` is true the scroll div SHALL carry `tabindex="0"`, `role="region"` and `aria-label` = `OCX_BUTTON_DIALOG.CONTENT_REGION` (en: "Dialog content"); otherwise all three attributes are absent. Styles: `:host { display:flex; flex-direction:column; min-height:0 }` and `.buttonDialogScrollableContent { overflow:auto; min-height:0; max-height:500px; margin-bottom:20px }`. The portal dialog service SHALL open the PrimeNG/Optimus dynamic dialog with `contentStyle: { display:'flex', flexDirection:'column' }`, `modal: true`, `appendTo: 'body'`, `templates.footer = DialogFooterComponent`, a `header` equal to the translated title (empty string when no title) and `closeAriaLabel` = caller value or `OCX_BUTTON_DIALOG.CLOSE` ("Close dialog").

#### Scenario: Scrollable content
- **WHEN** the content overflows 500px
- **THEN** `.buttonDialogScrollableContent` scrolls, is focusable, has `role=region` and name "Dialog content"

### Requirement: Dialog footer Template and appearance
`ocx-dialog-footer` SHALL render a root `div.w-full.flex-row.justify-end.flex.flex-wrap.gap-2` containing, in order: one `div` per left custom button (the last left one has `style="margin-right:auto"`, others `0`), one `div` per right custom button, a `div` with the secondary button (only when `config.secondaryButtonIncluded`) and a `div` with the primary button. Each button SHALL be `button[pButton]` with `id` = `details.id` (defaults `buttonDialogSecondaryButton` / `buttonDialogPrimaryButton`; custom buttons use `button.id`), `[icon]` (`''` when none), `[label]` and `[attr.aria-label]` = translated `key` with `parameters`, `[disabled]` from the corresponding async enable state, `[ocxTooltip]` = translated `tooltipKey` or null, `[tooltipPosition]` (`''` default) and `[severity]`. The primary button additionally carries the `autofocus` attribute. Custom buttons are rendered through `ng-template #customButtonTemplate` (context `button`).

#### Scenario: Footer order
- **WHEN** one left custom, one right custom, secondary and primary buttons are configured
- **THEN** the DOM order inside the footer root is left custom, right custom, secondary, primary, with the left button pushing the rest to the right

### Requirement: Inline dialog Template and appearance
`ocx-dialog-inline` SHALL render `div > ocx-dialog-content` (projecting its own `<ng-content>`) followed by `ocx-dialog-footer [config]="config()"`, forwarding `buttonClickedEmitter` to `buttonClicked($event)`. It has no styles of its own.

#### Scenario: Inline layout
- **WHEN** rendered with content and a config
- **THEN** the content region sits above the footer inside a single wrapper `div`

### Requirement: Dialog message content Template and appearance
`ocx-dialog-message-content` (`.scss`) SHALL render `div.dialogMessageContent > div` containing, when `icon !== ''`, `i[class=<icon>][aria-hidden=true]` and, when an icon label key resolves, `span.dialogMessageIconLabel.sr-only` with text `<translated label>. `; then always `span.dialogMessageText#<messageId>` (`ocx-dialog-message-<n>`, unique per instance) with `message | translate:messageParameters`. The icon label key is the explicit `iconLabel` (string or `{key, parameters}`) else derived from the icon class by pattern: `pi-check|pi-check-circle` to `OCX_BUTTON_DIALOG.SEVERITY.SUCCESS`, `pi-info|pi-info-circle` to `INFO`, `pi-exclamation-triangle` to `WARNING`, `pi-exclamation-circle|pi-times-circle|pi-ban` to `ERROR`, `pi-question|pi-question-circle` to `QUESTION`. Style: `.dialogMessageContent { overflow-wrap:anywhere }`. Defaults: `message='message'`, `icon=''`.

#### Scenario: Warning icon
- **WHEN** rendered with `icon='pi pi-exclamation-triangle'`
- **THEN** the DOM contains the hidden `i`, an `.sr-only` span reading "Warning. " and the message span

> Note (code-derived): `.sr-only` is not defined in this component's stylesheet; it relies on a global utility (the library's Tailwind build).
