import { create } from 'zustand';
import { UniverseState, UniverseMode, DestinationId, QualityTier } from '@/types/universe';

export const useUniverseStore = create<UniverseState>((set) => ({
  // Phase 3: Start in cinematic mode so the prologue plays on load
  mode: 'cinematic',
  activeDestination: null,
  quality: 'high',
  soundEnabled: false,
  reducedMotion: false,
  cameraCoords: { x: 0, y: 0, z: 5.5 },
  cameraHeading: 0,
  cinematicProgress: 0,
  flightEnabled: true,

  setMode: (mode: UniverseMode) => set({ mode }),
  setActiveDestination: (dest: DestinationId | null) => set({ activeDestination: dest }),
  setQuality: (quality: QualityTier) => set({ quality }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setCameraCoords: (coords, heading) =>
    set((state) => ({ cameraCoords: coords, cameraHeading: heading ?? state.cameraHeading })),
  setCinematicProgress: (progress: number) => set({ cinematicProgress: progress }),
  setFlightEnabled: (flightEnabled: boolean) => set({ flightEnabled }),
}));
