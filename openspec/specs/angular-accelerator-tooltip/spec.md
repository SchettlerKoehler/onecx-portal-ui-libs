# angular-accelerator-tooltip Specification

## Purpose
Accessible tooltips for host elements: `OcxTooltipDirective` (`ocxTooltip`) and `TooltipOnOverflowDirective` (`ocxTooltipOnOverflow`), built on the optimus-ui tooltip.

## Requirements

### Requirement: Tooltip content
`OcxTooltipDirective` (standalone, selector `[ocxTooltip]`) SHALL display the value of `ocxTooltip` (`string | TemplateRef<HTMLElement> | undefined`) as tooltip content and update it when the input changes.

#### Scenario: Text tooltip
- **WHEN** `ocxTooltip` is set to a string
- **THEN** hovering the host shows a tooltip with that text

### Requirement: Trigger events
The tooltip SHALL be shown on both hover and keyboard focus and hidden on unhover/blur.

#### Scenario: Focus
- **WHEN** the host receives focus
- **THEN** the tooltip is shown

#### Scenario: Enter key
- **WHEN** the tooltip is shown via focus and Enter is pressed
- **THEN** it stays visible

### Requirement: Escape dismisses tooltip
While the tooltip container exists, pressing Escape (`Escape` or `Esc`) in it SHALL hide the tooltip. The listener SHALL be removed on destroy.

#### Scenario: Escape pressed
- **WHEN** the tooltip is visible and Escape is pressed
- **THEN** the tooltip is hidden

### Requirement: Accessibility id
The directive SHALL give the tooltip an id and set `aria-describedby` on the host to it. The id SHALL be the one in the tooltip options if non-blank; otherwise a generated id of the form `ocx-tooltip-<time>-<random>` that remains stable for the directive instance. The tooltip container SHALL receive the same id once created.

#### Scenario: No id provided
- **WHEN** no id is configured
- **THEN** a generated id is applied to the host's `aria-describedby` and to the tooltip container

#### Scenario: Id provided in options
- **WHEN** a non-blank id is in `tooltipOptions`
- **THEN** that id is used

### Requirement: Cursor handling
`ocxTooltipCursor` (`string | null | undefined`, default `'pointer'`) SHALL define the inline `cursor` style applied to the host while tooltip content is non-empty. `undefined` or empty string yields `pointer`; any other string is applied as-is; `null` means the directive neither sets nor removes the cursor. When the content is cleared or the input becomes `null`, the directive SHALL restore the host's previous inline cursor (or remove the style) only if it had applied one.

#### Scenario: Default
- **WHEN** a tooltip text is set and no cursor input is given
- **THEN** the host has `cursor: pointer`

#### Scenario: Null cursor
- **WHEN** `ocxTooltipCursor` is `null`
- **THEN** no inline cursor is set and host styling is untouched

#### Scenario: Text cleared
- **WHEN** the tooltip text is cleared after the directive applied a cursor
- **THEN** the previous host cursor is restored

### Requirement: Tooltip only on overflow
`TooltipOnOverflowDirective` (selector `[ocxTooltipOnOverflow]`, extends `OcxTooltipDirective`) SHALL set `text-overflow: ellipsis`, `overflow: hidden` and `white-space: nowrap` on the host and enable the tooltip (content from `ocxTooltipOnOverflow`) only while the host's scroll width exceeds its offset width. It SHALL initially be disabled, re-evaluate after the first render and on content mutations (subtree, text, children), and disconnect its observer on destroy.

#### Scenario: Content fits
- **WHEN** the text fits the host
- **THEN** no tooltip is shown

#### Scenario: Content truncated
- **WHEN** the text is wider than the host
- **THEN** the tooltip is enabled and shows the text

> Note (code-derived): `ocxTooltipOnOverflow` only sets `content`/`tooltipLabel`; it does not use the `ocxTooltip` input, so the inherited cursor logic driven by `ocxTooltip` does not apply to it unless `ocxTooltip` is set too.
