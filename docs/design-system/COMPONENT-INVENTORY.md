# Component Inventory

| Component | Purpose | Variants / Sizes | States | Keyboard | Theme | Figma | Code | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | Primary commands | primary, brand, secondary, ghost, danger / sm, md, lg | default, hover, pressed, disabled, loading, focus | native button | semantic tokens | Core/Button | Button | foundation |
| IconButton | Icon-only command | ghost, secondary, danger / sm, md, lg | default, selected, disabled, focus | native button, aria-label | currentColor | Core/IconButton | IconButton | foundation |
| Input | Single-line text | default | error, disabled, focus | label + native input | semantic tokens | Core/Input | Input | foundation |
| Textarea | Multi-line text | default | error, disabled, focus | label + native textarea | semantic tokens | Core/Textarea | Textarea | foundation |
| Select | Option selection | default | disabled, focus | native select | semantic tokens | Core/Select | Select | foundation |
| Checkbox | Binary form field | default | checked, disabled, focus | native checkbox | accent token | Core/Checkbox | Checkbox | foundation |
| Toggle | Binary switch-like control | default | on, off, disabled, focus | button with aria-pressed | semantic tokens | Core/Toggle | Toggle | foundation |
| Tabs | Section navigation | default | selected, disabled, focus | roving index helper | semantic tokens | Core/Tabs | Tabs | foundation |
| SegmentedControl | Small mode switch | text, icon+text | selected, focus | radiogroup semantics | semantic tokens | Core/SegmentedControl | SegmentedControl | foundation |
| Badge | Metadata chip | neutral, accent, success, warning, danger, info | default | none | semantic tokens | Core/Badge | Badge | foundation |
| StatusBadge | Publication/status label | draft, published, publishing, changed, error | default | none | semantic tokens | Core/StatusBadge | StatusBadge | foundation |
| Tooltip | Label wrapper | default | hover placeholder | future | semantic tokens | Core/Tooltip | Tooltip | prototype |
| Dropdown/Menu | Context actions | default, danger item | open, focus | native details foundation | semantic tokens | Core/Menu | DropdownMenu | prototype |
| Card | Repeated item frame | default | hover by consumer | section/article semantics | semantic tokens | Core/Card | Card | foundation |
| Panel | Tool panel | with/without header actions | default | section semantics | semantic tokens | Core/Panel | Panel | foundation |
| Modal | Dialog foundation | default | open | dialog semantics, future focus trap | semantic tokens | Core/Modal | Modal | prototype |
| Drawer | Side surface foundation | default | open | labelled aside | semantic tokens | Core/Drawer | Drawer | prototype |
| Toast | Temporary feedback | success, warning, danger, info | visible | status role | semantic tokens | Core/Toast | Toast | prototype |
| EmptyState | Empty workflow | default | default | semantic section | semantic tokens | Core/EmptyState | EmptyState | foundation |
| LoadingState | Loading feedback | default | loading | status role | semantic tokens | Core/LoadingState | LoadingState | foundation |
| ErrorState | Error feedback | default | error | alert role | semantic tokens | Core/ErrorState | ErrorState | foundation |
| Breadcrumbs | Location | default | current item | nav | semantic tokens | Core/Breadcrumbs | Breadcrumbs | foundation |
| Divider | Visual separator | default | default | none | border token | Core/Divider | Divider | foundation |
| EditorTopBar | Editor command surface | default | draft/status via slots | header | semantic tokens | Editor/TopBar | EditorTopBar | foundation |
| EditorRail / Item | Editor navigation | selected/default | selected, focus | nav + buttons | semantic tokens | Editor/RailItem | EditorRailItem | foundation |
| EditorSidePanel | Left editor panel | default | scroll by consumer | aside | semantic tokens | Editor/SidePanel | EditorSidePanel | foundation |
| SectionNavigatorItem | Page section row | default, hover, selected, hidden, dragging, error | all listed, error has text issue marker | row actions native buttons | semantic tokens | Editor/SectionNavigatorItem | SectionNavigatorItem | foundation |
| BlockLibraryCard | Block selection | default, hover, selected, recent, favorite, unavailable | all listed | future selectable behavior | semantic tokens | Editor/BlockLibraryCard | BlockLibraryCard | foundation |
| InsertSectionControl | Add section affordance | default | focus | button | semantic tokens | Editor/InsertSectionControl | InsertSectionControl | foundation |
| CanvasSectionFrame | Selected canvas frame | default, selected | selected | section label | semantic tokens | Editor/CanvasSectionFrame | CanvasSectionFrame | foundation |
| FloatingSectionToolbar | Canvas quick actions | default | focus | toolbar buttons | semantic tokens | Editor/FloatingToolbar | FloatingSectionToolbar | prototype |
| Inspector / Tabs | Property editing shell | content/layout/style/spacing/adaptive | selected | tabs helper | semantic tokens | Editor/Inspector | Inspector | foundation |
| PropertyGroup / Row | Inspector property layout | expanded/collapsed | default | native details/summary | semantic tokens | Editor/PropertyGroup | PropertyGroup | foundation |
| ResponsiveModeSwitch | Preview viewport selector | desktop/tablet/mobile | selected | radiogroup | semantic tokens | Editor/ResponsiveModeSwitch | ResponsiveModeSwitch | foundation |
| PublicationStatus | Publication state | draft, published, publishing, changed, error | default | none | semantic tokens | Editor/PublicationStatus | PublicationStatus | foundation |
| ThemeModeSwitch | Static theme switch specimen | light/dark/system | selected | radiogroup | semantic tokens | Editor/ThemeModeSwitch | ThemeModeSwitch | foundation |
| DualViewportPreview | Desktop/mobile preview workspace | desktop, mobile, side-by-side | active viewport, editingDesktop, editingMobileOverride, inheritedMobile | section/frame semantics | editor and site themes independent | Preview/DualViewportPreview | DualViewportPreview | prototype |

## Review Notes

Current foundation uses softer steel-blue brand accent, brighter blue only for
focus/selection, graphite primary buttons and a separate brand gradient variant.
Main panel/card geometry uses 0/2/4/8 px radius; pill is reserved for compact
status controls. Remaining Figma work: refine exact component metrics, prototype
keyboard interactions and validate mobile overflow in composed Editor Shell
screens.
