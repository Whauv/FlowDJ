# FlowDJ (Phase 9 Key-Aware + Mood-Aware Color System)

FlowLight now includes harmonic color intelligence with full user control.

## Phase 9 Features
- Key-to-color mapping engine using Camelot family groups
- Preset palette library:
  - Warm Club
  - Neon Cyber
  - Sunset Melodic
  - Dark Warehouse
- Mood preset mappings that remap key families to palette families
- Custom mapping editor (group -> palette override)
- Custom palette editor (editable colors per palette)
- Smooth color blending during crossfades
- Optional disable for key-aware coloring (energy-only color logic)
- Explanation labels in UI showing why current palette/color is chosen

## Architecture
- `frontend/src/modules/flowlight/palettes.ts`
  - palette library + mood presets + default mapping
- `frontend/src/modules/flowlight/sceneEngine.ts`
  - key/mood decision + blend logic + explanation strings
- `frontend/src/modules/flowlight/manager.ts`
  - runtime updates for presets/mappings/palette edits
- `frontend/src/modules/flowlight/types.ts`
  - settings + decision model contracts
- `frontend/src/components/lighting/FlowLightPreviewPanel.tsx`
  - strategy controls, custom editor, explanation display

## Behavior Notes
- System is deterministic and user-configurable, not black-box.
- Key-aware mode can be fully disabled for energy-based color logic.
- Palette transitions are blended with crossfader position for musical continuity.
- All mapping/palette decisions can be overridden by the user.
