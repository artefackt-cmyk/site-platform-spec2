# Merkurio Design Tokens

`packages/ui/src/tokens/index.ts` is the editable source of truth for Design
System Foundation v1.

## Namespaces

- `Merkurio UI` tokens describe dashboard and editor chrome.
- `Site Theme` placeholder tokens describe websites created inside Merkurio.

These namespaces are intentionally independent. Switching the editor to dark
mode must not switch the previewed site theme.

## Token Layers

1. Global semantic token, for example `color.bg.surface`.
2. Component token/class, for example `.ui-button-secondary`.
3. Local override only when a component has a specific product state.

## Review Refinements

- `color.accent.brand` is the quieter steel-blue brand accent.
- `color.accent.focus` keeps the brighter blue for focus rings.
- `color.accent.selected` is used for selection outlines and soft selected fills.
- Radius uses 0, 2, 4 and 8 px; pill is reserved for badges/status controls.
- Typography weights are intentionally calm: Inter 400/500/600 and Prata
  Regular for editorial display only.

## Exports

- TypeScript: `merkurioUiTokens`, `merkurioUiFigmaTokens`.
- CSS variables: use `getMerkurioUiCssVariables("light" | "dark")`.
- Figma handoff JSON: `docs/design-system/merkurio-ui-tokens.json`.

When values change, update the TypeScript source first and refresh the docs JSON
from the exported `merkurioUiFigmaTokens` shape.
