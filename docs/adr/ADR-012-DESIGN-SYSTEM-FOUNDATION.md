# ADR-012: Design System Foundation

## Status

Accepted.

## Context

Merkurio has dashboard, editor, storefront, commerce and publication flows. The
next UI work needs a stable foundation for tokens, shared components, future
Figma UI kit and Editor Shell v1 without redesigning existing product screens.

The critical product distinction is:

- **Merkurio UI**: dashboard and editor interface.
- **Site Theme**: visual system of sites created by users inside Merkurio.

A dark editor interface must not automatically switch a previewed customer site
to a dark theme.

## Decision

Design System Foundation v1 lives in `packages/ui`. The editable token source is
`packages/ui/src/tokens/index.ts`. Dashboard consumes the semantic CSS variable
contract and exposes a protected `/design-system` route as the living demo.

Token resolution follows:

1. global semantic token;
2. component class/token;
3. local override for a narrow state.

## Naming

Merkurio UI semantic tokens use dotted names such as `color.bg.surface`,
`color.text.primary`, `color.border.selected`, `color.accent.primary`,
`color.accent.brand`, `color.accent.focus` and `color.accent.selected`. CSS
variables use `--m-ui-*`. Site Theme placeholders use the `site.*` namespace and
must not be mixed with `--m-ui-*`.

## Modes

Merkurio UI supports `light`, `dark` and `system`. The selected mode is persisted
in `localStorage` under `merkurio-ui-theme`. A pre-hydration script sets
`data-merkurio-theme` before React renders to avoid hydration mismatch.

Site Theme placeholders have light/dark values, but v1 does not wire them into
existing storefront rendering. The `/design-system` site preview theme persists
under a separate local key and is independent from `merkurio-ui-theme`.

## Typography

Prata Regular is reserved for large brand/editorial headings. Inter remains the
default UI and body font. UI headings use Inter 600, body text uses Inter 400,
labels use Inter 500 and buttons/numeric values use Inter 600. UI headings
should normally use Inter; Prata is intentional and sparse.

## Spacing, Radius, Borders, Shadows

Spacing uses 4, 8, 12, 16, 24, 32, 48, 64 and 96 px. Radius stays architectural:
0, 2, 4 and 8 px, with pill reserved for badges, statuses and segmented
controls. Borders are thin by default with clear focus and selected states.
Shadows remain quiet and utilitarian.

## Component States

Components expose default, hover, pressed, selected, disabled, loading, error
and focus states where applicable. Primary buttons are graphite by default; the
brand gradient is a separate `brand` variant. State must not be communicated by
color alone.

## Icons

System icons are inline SVG, `currentColor`, 16/20/24 px. Decorative artwork and
generated images are not part of the icon registry.

## Accessibility

Foundation components include accessible labels for icon-only controls,
focus-visible styling, keyboard semantics for tab index calculation, reduced
motion hooks, minimum interactive sizing and explicit error surfaces.

## Dual Viewport Preview

Simultaneous desktop and mobile preview is a key Merkurio advantage and must be
preserved in Editor Shell v1. Foundation v1 introduces `DualViewportPreview`
with desktop, mobile and side-by-side modes, active viewport styling, a 375 px
mobile logical viewport and site theme preview light/dark independent of editor
theme. The API names future mobile override states: `editingDesktop`,
`editingMobileOverride` and `inheritedMobile`.

## Figma Handoff

The Figma handoff uses semantic token names, component names and variants from
`docs/design-system/FIGMA-HANDOFF.md`. The JSON export is
`docs/design-system/merkurio-ui-tokens.json`.

## Limitations

Foundation v1 does not redesign auth, commerce, storefront, publication logic,
page model, uploaded fonts, animations, custom component builder or full Theme
Engine. Modal/drawer/toast foundations are structural, not final production
interaction systems.

## Future Work

Future milestones should connect Site Theme tokens to a Theme Engine, harden
modal focus trap and menu keyboard behavior, move CSS artifact generation behind
a script, and use these primitives to design Editor Shell v1.
