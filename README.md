# FlowDJ (Phase 7 FlowLight Lighting Sync Architecture)

FlowDJ now includes FlowLight, a music-to-light architecture synchronized to DJ deck state.

## Goal Achieved
Lighting sync is driven by real DJ engine state (BPM/deck/crossfader/phrase/energy), not only raw volume.

## FlowLight Architecture
### Core modules
- `frontend/src/modules/flowlight/eventBus.ts`
  - DJ-to-light event bus
- `frontend/src/modules/flowlight/sceneEngine.ts`
  - Scene selection + fixture rendering logic
- `frontend/src/modules/flowlight/manager.ts`
  - Lighting state manager + adapter fanout
- `frontend/src/modules/flowlight/types.ts`
  - Shared lighting contracts
- `frontend/src/modules/flowlight/adapters.ts`
  - Output adapter interfaces + placeholders

### Output adapters (placeholders)
- DMX placeholder adapter
- Philips Hue placeholder adapter
- Generic MIDI/clock placeholder adapter

No hardware is required for this phase.

## DJ Event Bus Inputs Used
- BPM
- beat phase
- phrase section (build/drop/groove/breakdown)
- active deck
- crossfader position
- energy level
- markers (build/drop/breakdown)
- optional key-to-color mapping

## Virtual Lighting Preview
- UI panel: `frontend/src/components/lighting/FlowLightPreviewPanel.tsx`
- Shows virtual fixtures with:
  - intensity
  - color
  - pan/tilt
  - active scene name

## Integration Hookup
- App publishes DJ state events into FlowLight event bus from `frontend/src/app/App.tsx`
- FlowLight manager consumes events, updates scene state, and fans out to adapters
- Preview panel renders current virtual fixture state

## Extensibility for Real Integrations
Adapters follow a shared interface:
- `connect()`
- `disconnect()`
- `sendState(state)`

To add real hardware:
1. Implement `LightOutputAdapter` for target system.
2. Register adapter in `FlowLightManager` constructor.
3. Map `FlowLightState` fields to protocol channels/commands.

## Run
```bash
cd frontend
npm install
npm run dev
```

(Backend unchanged for this phase.)
