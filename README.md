# FlowDJ (Phase 8 BPM + Phrase-Driven Lighting)

FlowLight now runs a rule-based musical lighting engine synchronized to DJ playback state.

## Phase 8 Features
- BPM-driven movement speed
- Beat-synced pulse behavior
- Phrase-based scene changes
- Distinct looks for:
  - intro
  - buildup
  - drop
  - breakdown
  - outro
- Deck-aware emphasis (dominant deck gets stronger focus)
- Crossfader-aware blending of fixture emphasis
- Intensity scaling from energy estimate
- Optional strobe behavior gated to approved moments (build/drop)

## Safety + Intentionality
- No random flashing logic
- Scene changes use deterministic phrase mapper
- Strobe can be disabled globally
- Safety intensity cap prevents overly aggressive output

## User Controls (FlowLight Preview)
- Movement sensitivity
- Intensity scale
- Beat pulse strength
- Safety limit
- Allow strobe toggle
- Strobe only on drops/build toggle

## Architecture
### Rule engine
- `frontend/src/modules/flowlight/sceneEngine.ts`
  - phrase-to-scene mapper
  - BPM/beat/crossfader/deck/energy-driven fixture rendering

### State manager + adapters
- `frontend/src/modules/flowlight/manager.ts`
  - event-driven state manager with live settings updates
- `frontend/src/modules/flowlight/adapters.ts`
  - DMX placeholder
  - Philips Hue placeholder
  - MIDI/clock placeholder

### Event bus hookup
- `frontend/src/modules/flowlight/eventBus.ts`
- `frontend/src/app/App.tsx`
  - publishes phrase/beat/deck state from live playback loop

### Virtual preview
- `frontend/src/components/lighting/FlowLightPreviewPanel.tsx`
  - virtual fixtures synced to playback

## Integration path for real hardware
Real integrations should implement `LightOutputAdapter` (`connect`, `disconnect`, `sendState`) and be injected into `FlowLightManager`.
