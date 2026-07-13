# Figma Handoff

## File Structure

- `00 Cover`
- `01 Foundations`
- `02 Icons`
- `03 Core Components`
- `04 Editor Components`
- `05 Site Builder Primitives`
- `06 Editor Screens`
- `07 Prototype`

## Tokens

Use the names from `docs/design-system/merkurio-ui-tokens.json`. Import Merkurio
UI tokens and Site Theme placeholder tokens as separate variable collections.
Do not alias `site.*` tokens to `--m-ui-*` tokens.

## Component Naming

- Core: `Core/Button`, `Core/IconButton`, `Core/Input`, `Core/Tabs`.
- Editor: `Editor/TopBar`, `Editor/RailItem`, `Editor/SectionNavigatorItem`.
- Preview: `Preview/DualViewportPreview`, `Preview/ViewportFrame`.

## Variants

Use Figma variant properties that match code:

- `variant`: `primary`, `brand`, `secondary`, `ghost`, `danger`.
- `size`: `sm`, `md`, `lg`.
- `state`: `default`, `hover`, `pressed`, `focus`, `selected`, `disabled`, `loading`, `error`.
- `theme`: `light`, `dark`.
- `viewport`: `desktop`, `mobile`, `side-by-side`.

## Auto Layout

Use 4 px grid steps. Keep control heights at 32, 40 and 48 px. Use thin borders,
0/2/4/8 px radius and restrained shadows. Reserve pill radius for badges,
statuses and segmented controls.

## Typography

Use Prata Regular only for display and editorial headings. Use Inter 600 for UI
headings, Inter 400 for body text, Inter 500 for labels and Inter 600 for
buttons/numeric values. Check Cyrillic line breaks manually.

## Components To Transfer

Transfer foundations, icons, all core components, editor rail/panels, section
navigator states, block library cards, collapsible inspector groups,
publication status and DualViewportPreview.

DualViewportPreview should be represented as a key Merkurio differentiator with
desktop, mobile and side-by-side variants plus `editingDesktop`,
`editingMobileOverride` and `inheritedMobile` labels.

## Placeholder Scope

Modal, drawer, toast, Site Theme tokens and mobile override logic are foundation
placeholders. They are not final interaction design or full Theme Engine output.

## Not Final Design

The `/design-system` route is a living implementation reference and component
inventory. It is not a polished final Editor Shell screen.
