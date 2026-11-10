export type UniverseMode = 'cinematic' | 'exploring' | 'destination' | 'fallback';

export type DestinationId = 'about' | 'skills' | 'projects' | 'achievements' | 'contact' | 'resume';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface CelestialCoordinate {
  id: DestinationId;
  name: string;
  category: string;
  position: [number, number, number];
  color: string;
}

export interface UniverseState {
  mode: UniverseMode;
  activeDestination: DestinationId | null;
  quality: QualityTier;
  soundEnabled: boolean;
  reducedMotion: boolean;
  cameraCoords: { x: number; y: number; z: number };
  cinematicProgress: number;

  setMode: (mode: UniverseMode) => void;
  setActiveDestination: (dest: DestinationId | null) => void;
  setQuality: (quality: QualityTier) => void;
  toggleSound: () => void;
  setCameraCoords: (coords: { x: number; y: number; z: number }) => void;
  setCinematicProgress: (progress: number) => void;
}