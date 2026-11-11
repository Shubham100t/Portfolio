# COSMOS — Project Handover Document

**Project:** COSMOS — An Interactive 3D Portfolio Universe  
**Current Date:** 2026-11-11  
**Current Phase:** Phase 4–8 foundation and visual-fidelity pass implemented in the working tree; ready for visual QA/polish before Phase 9  
**Git Branch:** `phase-3-cinematic-orchestration`  

---

## 1. Executive Summary & Creative Vision

COSMOS is an ultra-realistic, cinematic, interactive 3D universe presenting a software developer's professional portfolio through an explorable zero-gravity cosmos.

### Core Non-Negotiable Rules:
1. **Persistent 3D Canvas**: The Three.js canvas is mounted once and persists indefinitely. Spatial navigation replaces page unmounting.
2. **The Particle Continuity Law**: In the 55s cinematic prologue, the astronaut falls into the black hole, undergoes tidal spaghettification, and dissolves into particles. **These exact particles must not disappear.** They travel through a cosmic wormhole tunnel and coalesce to form the celestial structures (stars, nebulae, planets, accretion disk) of the explorable universe.
3. **Six Canonical Celestial Destinations**:
   - **About Me**: Black Hole (Gargantua: accretion disk, photon ring, gravitational lensing).
   - **Skills**: Neutron Star / Pulsar (relativistic radiation jets, magnetic field lines, interactive constellations).
   - **Projects**: Luminous Nebula housing distinct planetary systems (1 project = 1 explorable planet).
   - **Achievements**: Supernova remnant with expanding shockwaves and chronological milestones.
   - **Contact**: Modular orbital Space Station with interactive communication terminal.
   - **Resume / Future**: Cosmic Gateway (Einstein-Rosen portal) with resume access and technical vision.
4. **ARIA (AI Guide)**: Realistic adult female astronaut guide with ARKit blendshapes/visemes, FSM (idle, listening, thinking, speaking, gesturing), and strict zero-hallucination grounding in verified portfolio data.
5. **Universal Accessibility**: High-fidelity 3D WebGL universe + full semantic HTML fallback.

---

## 2. Completed Work So Far

### Phase 0: System Architecture & Blueprint (Complete)
- Master architecture, directory structure, state models, and phased roadmap established and approved.

### Phase 1: 3D Foundation (Complete on `phase-1-scene-foundation`)
- **Framework Setup**: Next.js 14.2.5 (App Router), React 18, TypeScript, Tailwind CSS, Lucide icons.
- **Persistent Canvas**: `src/components/canvas/UniverseCanvas.tsx` configured with `z-0` stacking, high-performance WebGL settings, and dynamic client-side loading (`ssr: false`).
- **Scene Assembly**: `src/components/canvas/SceneManager.tsx` hosting `OrbitControls`, cinematic lighting (ambient, key, cyan rim, warm bounce), background stars, cosmic dust, and the central astronaut.
- **Deep Space Environment**: Drei's `<Stars />` (7,500 twinkling stars) + `src/components/canvas/environment/CosmicDust.tsx` (700 local floating micro-particles providing motion parallax).
- **Astronaut Protagonist**: `src/components/canvas/cinematic/BasicAstronaut.tsx` with PBR materials, white EVA spacesuit, reflective gold helmet visor (`metalness: 0.98`, `roughness: 0.08`), PLSS backpack with thrusters, and procedural zero-G floating animation.
- **Sci-Fi HUD & Branding**: `src/components/ui/BrandingOverlay.tsx` with live coordinates telemetry `[X, Y, Z]`, RCS status, audio toggle, and dismissible cinematic identity card.
- **Global State Store**: `src/stores/useUniverseStore.ts` tracking mode, destination, quality tiers, and telemetry coordinates.

### Phase 2: Cinematic Black Hole (Complete & Verified on `phase-2-black-hole`)
- **Webpack 5 GLSL Asset Loading**: Native Webpack 5 `type: 'asset/source'` configured in `next.config.mjs` for `.glsl`, `.vert`, and `.frag` files with TypeScript declarations in `src/types/shaders.d.ts` (zero external npm loader dependencies).
- **Relativistic Shaders** (`src/shaders/blackhole/`):
  - `accretionDisk.vert.glsl` & `accretionDisk.frag.glsl`:
    - Inner Schwarzschild boundary cutoff ($R_{in} = 1.65$) and outer edge falloff ($R_{out} = 6.8$).
    - Keplerian differential rotation where angular frequency $\Omega(r) \propto r^{-1.5}$.
    - Multi-octave procedural logarithmic spiral plasma turbulence and micro-filaments.
    - Relativistic Doppler frequency beaming ($\beta = \sqrt{R_s / 2r}$, $\delta = \frac{1}{\gamma(1 - \beta \cos\alpha)}$) dynamically boosting luminosity on the approaching side (white-hot/cyan) and dimming/redshifting the receding side (amber/crimson).
    - Razor-thin incandescent photon ring emission spike at $1.5 R_s$.
  - `lensedHalo.vert.glsl` & `lensedHalo.frag.glsl`:
    - Dynamic camera-aligned lensed secondary halo simulating light from the rear of the disk bent over the top and bottom of the event horizon.
    - Concentrates intensity vertically ($\text{pow}(|\sin\phi|, 1.6)$) and smoothly fades horizontally at the equator where the physical disk resides.
    - Modulates intensity based on view inclination ($\text{clamp}(1 - |\vec{v}_{view} \cdot \vec{n}_{disk}|^{1.4}, 0, 1)$), naturally disappearing when looking straight down from the pole.
    - Eliminates any rigid intersecting rings or awkward front protrusions when orbiting horizontally in 360°.
  - `gravitationalLens.vert.glsl` & `gravitationalLens.frag.glsl`:
    - Curved spacetime deflection shader warping starlight radially inwards toward the singularity.
- **Celestial BlackHole Component** (`src/components/canvas/celestial/BlackHole.tsx`):
  - **Event Horizon**: Pure black sphere absorbing all incident light ($R_s = 1.35$, `renderOrder={1}`).
  - **Photon Sphere Ring**: Incandescent ring at $1.5 R_s$ with dynamic harmonic pulsation (`renderOrder={2}`).
  - **Primary Equatorial Accretion Disk**: Single physical Keplerian plasma disc in 3D space (`renderOrder={0}`).
  - **View-Aligned Lensed Halo**: Symmetrically billboarding to camera in `useFrame`, hugging the singularity silhouette without front protrusion.
- **Scene Integration & Post-Processing** (`src/components/canvas/SceneManager.tsx`):
  - Mounted `<BlackHole />` at cosmic origin `[0, 0, 0]`.
  - Positioned `<BasicAstronaut />` at standoff coordinates `[0, -0.15, 4.2]` facing the singularity.
  - Integrated `@react-three/postprocessing` `<EffectComposer>` with `<Bloom>` (`luminanceThreshold: 0.75`, `mipmapBlur: true`) for authentic incandescent glow.
  - Camera positioned at `[0, 1.5, 9.2]` in `src/components/canvas/UniverseCanvas.tsx`.

### Phase 3: Astronaut & Cinematic Timeline Orchestration (Complete on `phase-3-cinematic-orchestration`)
- **55-second director:** `CinematicDirector.tsx` uses a GSAP master timeline for the four planned beats: establishing drift, thruster approach, gravitational pull, and photon-ring descent.
- **Cinematic camera hand-off:** The camera stays focused on the singularity throughout the dolly, OrbitControls are disabled while the director owns it, and control returns cleanly in exploration mode.
- **Astronaut choreography:** The astronaut now has an outer director-controlled group plus an inner additive zero-G animation group, preserving its natural float while it descends.
- **Prologue UI:** `CinematicOverlay.tsx` supplies 2.39:1 letterboxing, timed subtitles/telemetry, escalating gravity and event-horizon alarms, a progress readout, and a keyboard-accessible Skip Intro action (button or Escape).
- **State integration:** The store starts in `cinematic` mode and exposes `cinematicProgress`; completion or skip transitions to `exploring`.

### Phase 4–8: Exploration Foundation & Destination Visual Pass (Implemented; needs visual QA)

This work is currently **uncommitted** on `phase-3-cinematic-orchestration`. It provides working foundations, not a claim that all Phase 4–8 production requirements are closed.

#### Phase 4 — Tidal Spaghettification
- Added `src/shaders/spaghettification.vert.glsl` and `src/shaders/spaghettification.frag.glsl`.
- Added `src/components/canvas/cinematic/TidalSheath.tsx`, a GPU-driven, additive tidal-shear envelope around the astronaut.
- `BasicAstronaut.tsx` now mounts the sheath; its existing CPU-scale lensing/tidal deformation remains additive.

#### Phase 5 — Persistent Particle Foundation
- Added `src/components/canvas/cinematic/ParticleContinuum.tsx` and mounted it in `SceneManager.tsx`.
- It is one persistent `THREE.Points` buffer whose opacity changes with cinematic/exploration mode. This is a foundation for the Particle Continuity Law, but it does **not yet** make the astronaut mesh dissolve into those exact particles.

#### Phase 6 — Cinematic Completion Status
- Existing skip/escape and cinematic-to-exploration handoff remain in place from Phase 3.
- Dedicated soundtrack synchronization and a complete ARIA introduction are **not implemented**; those remain future work tied to real audio assets and Phase 9 portfolio grounding.

#### Phase 7 — 6-DOF Navigation
- Added `src/components/canvas/FlightController.tsx`.
- Exploration controls: `W/S` forward/back, `A/D` strafe, `R/F` vertical translation, and `Shift` boost.
- Flight is disabled during the cinematic and while a destination fly-to is active.
- Added `src/components/canvas/DestinationNavigator.tsx`: selecting a destination disables OrbitControls, smoothly moves the camera to an observation point, and points the camera at that target. Closing the panel restores manual controls.

#### Phase 8 — Six Destinations & Editable Portfolio Content
- Added destination state support (`flightEnabled`) in `src/types/universe.ts` and `src/stores/useUniverseStore.ts`.
- Added `src/components/ui/NavigationOverlay.tsx` for destination selection and control hints.
- Added `src/components/ui/DestinationPanel.tsx`, a closeable accessible content card rendered after a destination selection.
- Added all destination world coordinates in `src/components/canvas/celestial/Destinations.tsx`:
  - About: existing black hole at the origin.
  - Skills: pulsar with an emissive neutron-star core, equatorial energized ring, and polar jets.
  - Projects: Pillars-of-Creation-inspired volumetric dust columns.
  - Achievements: diffuse, asymmetric supernova shock shell.
  - Contact: ISS-inspired modular truss with transverse solar wings.
  - Resume: shader-driven lensing/vortex gateway.
- Added editable dummy portfolio and resume copy in `src/data/portfolio.ts`. Replace this file’s strings with verified biography, resume, project, achievement, contact, and link data.

#### Latest Visual-Fidelity Changes (Reference-Driven)
- User-supplied reference images were inspected; the first reads as a dusty pillar/nebula composition, the second as a bipolar stellar/nebular eruption, and the third as a stylized gravitational lensing scene.
- Replaced the visibly toy-like capped `TubeGeometry` pillars with 5,600 color-varied, soft radial-sprite particles following three irregular dust-column curves.
- Replaced visible line spikes/smooth remnant lobes with a 7,600-particle, uneven cyan/orange/red shock shell that slowly expands and precesses.
- Replaced the Resume gateway’s many exposed torus loops with a camera-facing GLSL vortex: warped polar light streams, turbulence, a dark core, and cyan/gold lensing. The effect relies on existing bloom rather than hard geometry.
- Added an in-memory radial `CanvasTexture` sprite (`useGlowMap`) so nebula/remnant particles render as soft glows rather than square point sprites.

---

## 3. Important Implementation Lessons & Bug Fixes

1. **Stacking Context & Z-Index in Next.js/Tailwind**:
   - Never assign `-z-10` to a fixed/absolute Canvas container if parent elements or `body` have background colors (`bg-[#020617]`). In CSS, elements with negative z-index are painted behind the background of the stacking context root, causing a black screen.
   - Correct approach: Canvas container at `z-0` with `bg-black`, and HUD overlays on top at `z-10` with `pointer-events-none`.
2. **GLSL Bundling in Next.js 14**:
   - Do not use deprecated Webpack 4 loaders (`raw-loader`, `glslify-loader`). Use Webpack 5's native `type: 'asset/source'` rule in `next.config.mjs` alongside a TypeScript module declaration file (`src/types/shaders.d.ts`).
3. **Secondary Lensed Halos in WebGL**:
   - Never use a static perpendicular 3D mesh (`rotation={[0, 0, 0]}`) for the lensed halo of a black hole. When the user orbits horizontally, two rigid rings slice through each other at 90°, and half of the halo sticks out awkwardly in front of the black hole.
   - The correct approach is a single physical equatorial disk in 3D plus a camera-aligned billboard halo centered at `[0, 0, 0]` whose shader weights intensity vertically and modulates with view inclination. This ensures the halo is always seen hugging the top and bottom of the event horizon from any 360° orbit angle.
4. **R3F EffectComposer Props**:
   - In `@react-three/postprocessing`, pass `enableNormalPass={false}` instead of `disableNormalPass` to satisfy TypeScript types.
5. **PowerShell Windows Encoding**:
   - In PowerShell 5.1, use single-quoted here-strings (`@' ... '@`) or UTF8 without BOM (`[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)`) to prevent unintended variable/escape evaluation.
6. **Avoid Visible Debug Geometry for Astronomical Objects**:
   - Exposed torus loops, flat-ended tubes, line-segment rays, and default square `PointsMaterial` sprites read as toy/debug geometry at close range.
   - Prefer soft radial-sprite particle volumes for dust and shock fronts; reserve hard meshes for recognizable engineered objects such as the station. Use shader-driven screenspace/billboard vortexes for nonphysical concepts such as a wormhole gateway.
7. **Destination Navigation Must Own the Camera**:
   - A button that only writes `activeDestination` provides no visible navigation. During a fly-to, disable OrbitControls and player flight, interpolate camera position/look-at toward the destination, then restore controls when the panel closes.
8. **Next.js Development 404 / Trace Cache**:
   - After adding scene modules, an old browser session can request stale hashed chunks and return a 404. Clear only the git-ignored `.next` directory, then restart `npm run dev`.
   - `npx tsc --noEmit` passed after the latest changes. `next build` intermittently stalls or errors while opening/writing `.next\\trace` on this Windows environment even after compiling source; treat this as an environment/cache-lock issue and retry after stopping other Next processes.

---

## 4. Immediate Next Step: Visual QA and Phase 9 Preparation

1. Start/restart the development server (`npm run dev`) and inspect each destination at close range after cache regeneration.
2. Tune particle counts, point sizes, bloom, and destination camera offsets on the target GPU. The latest particle volumes are intentionally denser and need performance profiling on the intended device.
3. Replace all dummy data in `src/data/portfolio.ts` with verified portfolio facts before beginning ARIA grounding.
4. Decide whether Phase 5’s astronaut-to-particles transition should use a single instanced model/surface-sampling buffer or a GPU simulation. The present `ParticleContinuum` is only its continuity foundation.
5. Begin Phase 9 only after verified content exists: ARIA must not generate facts beyond the real portfolio data.

---

## 5. Development Roadmap Summary

- **Phase 0:** Product Architecture & Blueprint (Done)
- **Phase 1:** 3D Foundation & Persistent Scene (Done)
- **Phase 2:** Cinematic Black Hole (Done & Polished)
- **Phase 3:** Astronaut & Cinematic Timeline Orchestration (Done)
- **Phase 4:** Spaghettification GLSL Vertex Shader (foundation implemented; visual QA pending)
- **Phase 5:** Particle Transformation & Galactic Assembly (persistent buffer implemented; exact mesh-to-particle continuity pending)
- **Phase 6:** COSMOS Cinematic Completion (skip integration present; audio/ARIA intro pending)
- **Phase 7:** 6-DOF Zero-Gravity Flight Navigation & Compass Radar (flight and destination fly-to implemented; radar pending)
- **Phase 8:** 6 Portfolio Destinations (landmarks, fly-to, and content panels implemented; production content/polish pending)
- **Phase 9:** ARIA AI Guide (Rigged 3D avatar, visemes, grounded RAG)
- **Phase 10:** UI HUD, Quality Settings & Semantic HTML Fallback
- **Phase 11:** Performance Profiling & Optimization (LOD, 4-tier graphics)
- **Phase 12:** Production Build & Deployment

---

## 6. How to Resume in New Chat

Copy and paste the prompt in the next chat:
```markdown
We are developing COSMOS (an ultra-realistic 3D portfolio universe).
Phase 0 through 3 are complete; Phase 4 through 8 foundations are implemented but require visual QA and production polish on branch `phase-3-cinematic-orchestration`.
Please read `HANDOVER.md`, inspect the current working tree, and continue with visual QA, real portfolio-data replacement, exact particle continuity, or Phase 9 ARIA only after verifying the project state.
```
