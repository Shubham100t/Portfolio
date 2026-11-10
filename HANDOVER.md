# COSMOS — Project Handover Document

**Project:** COSMOS — An Interactive 3D Portfolio Universe  
**Current Date:** 2026-11-10  
**Current Phase:** Phase 3 Complete (Cinematic Timeline Orchestration) -> Ready for Phase 4 (Spaghettification GLSL Vertex Shader)  
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

---

## 4. Immediate Next Step: Phase 3 — Astronaut & Cinematic Timeline Orchestration

### Objective:
Orchestrate the 55-second cinematic prologue where the astronaut floats weightlessly, gazes into the singularity, and begins the gravitational descent toward the event horizon.

### Phase 3 Key Requirements:
1. **Branch**: `git checkout -b phase-3-cinematic-orchestration`
2. **Cinematic Director / GSAP Timeline**:
   - 0s - 12s: Establishing deep cosmos, starry expanse, astronaut floating in zero-G facing Gargantua.
   - 12s - 25s: Camera dolly-in, astronaut thruster pulse, drifting closer to the accretion disk.
   - 25s - 40s: Gravitational pull intensifies, HUD alarms, time dilation distortion effects.
   - 40s - 55s: Descent toward photon ring preparing for tidal spaghettification (Phase 4).
3. **Interactive Overlays**:
   - Cinematic Letterboxing (2.39:1 aspect ratio bars).
   - "Skip Intro" button smoothly transitioning camera to exploration mode.
   - Subtitle / narrative telemetry log sequence.
4. **Integration**:
   - Seamless transition hook in `useUniverseStore.ts` (`mode: 'cinematic'` -> `mode: 'exploring'`).

---

## 5. Development Roadmap Summary

- **Phase 0:** Product Architecture & Blueprint (Done)
- **Phase 1:** 3D Foundation & Persistent Scene (Done)
- **Phase 2:** Cinematic Black Hole (Done & Polished)
- **Phase 3:** Astronaut & Cinematic Timeline Orchestration (Done)
- **Phase 4:** Spaghettification GLSL Vertex Shader
- **Phase 5:** Particle Transformation & Galactic Assembly (Continuous Particle Buffer)
- **Phase 6:** COSMOS Cinematic Completion (Audio sync, Skip Intro, ARIA intro)
- **Phase 7:** 6-DOF Zero-Gravity Flight Navigation & Compass Radar
- **Phase 8:** 6 Portfolio Destinations (Neutron Star, Nebula + Project Planets, Supernova, Space Station, Gateway)
- **Phase 9:** ARIA AI Guide (Rigged 3D avatar, visemes, grounded RAG)
- **Phase 10:** UI HUD, Quality Settings & Semantic HTML Fallback
- **Phase 11:** Performance Profiling & Optimization (LOD, 4-tier graphics)
- **Phase 12:** Production Build & Deployment

---

## 6. How to Resume in New Chat

Copy and paste the prompt in the next chat:
```markdown
We are developing COSMOS (an ultra-realistic 3D portfolio universe). 
Phase 0 through Phase 3 are complete on branch `phase-3-cinematic-orchestration`.
Please read `HANDOVER.md` in the root workspace and proceed directly with Phase 4: Spaghettification GLSL Vertex Shader.
```
