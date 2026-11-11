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
  cameraHeading: number;
  cinematicProgress: number;
  flightEnabled: boolean;

  setMode: (mode: UniverseMode) => void;
  setActiveDestination: (dest: DestinationId | null) => void;
  setQuality: (quality: QualityTier) => void;
  toggleSound: () => void;
  setReducedMotion: (reduced: boolean) => void;
  setCameraCoords: (coords: { x: number; y: number; z: number }, heading?: number) => void;
  setCinematicProgress: (progress: number) => void;
  setFlightEnabled: (enabled: boolean) => void;
}
