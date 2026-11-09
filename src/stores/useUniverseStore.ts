import { create } from 'zustand';
import { UniverseState, UniverseMode, DestinationId, QualityTier } from '@/types/universe';

export const useUniverseStore = create<UniverseState>((set) => ({
  mode: 'exploring',
  activeDestination: null,
  quality: 'high',
  soundEnabled: false,
  reducedMotion: false,
  cameraCoords: { x: 0, y: 0, z: 5.5 },

  setMode: (mode: UniverseMode) => set({ mode }),
  setActiveDestination: (dest: DestinationId | null) => set({ activeDestination: dest }),
  setQuality: (quality: QualityTier) => set({ quality }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setCameraCoords: (coords) => set({ cameraCoords: coords }),
}));
