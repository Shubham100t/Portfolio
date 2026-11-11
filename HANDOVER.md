# COSMOS — Project Handover Document

**Project:** COSMOS — An Interactive 3D Portfolio Universe  
**Current Date:** 2026-11-11  
**Current Phase:** Phases 4–8 and 10–12 implemented in the working tree; Phase 9 (ARIA) needs external assets and verified portfolio data before it can start  
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

### Phase 4–12: Exploration, Accessibility, Performance & Build (Implemented; uncommitted)

This work is currently **uncommitted** on `phase-3-cinematic-orchestration`. Type-checking and a production build (`NEXT_DIST_DIR=.next-build npm run build`) pass; visual QA on the target GPU is still owned by the user.

#### Phase 4 — Tidal Spaghettification
- `BasicAstronaut.tsx` warps its inner group during the prologue: `smoothstep(progress, 0.36, 0.60)` drives vertical stretch up to 1.8× with lateral thinning to 0.68×, plus a slow strain sway. The transition starts at 0.36, so the pull-back camera can frame the whole body.
- The suit and visor fade from `progress` 0.55–0.66; the visor shader gained `uOpacity` and a tidal-heat rim (`uHeat`).
- Suit panels, joints, trim, steel, and accent materials ramp amber emissive while the local fill light rises, so the body heats before it tears.
- `TidalSheath.tsx` is a tight, rim-only plasma aura (`spaghettification.vert/frag.glsl`) with fresnel energy, flow bands, helical filaments, and an interference tear. It fades with the suit instead of lingering as an empty shell.
- `AstronautDebris.tsx` spawns solid instanced suit fragments (14–55 by quality tier) that peel off the stretched suit, tumble around the pull axis, elongate, and fall into the singularity with the sparks.
- Beat 3 now pulls the camera back to `[0.55, 1.15, 11.2]` at fov 38 so the elongated figure remains fully framed; beat 4 pushes back in for the spark finale.

#### Phase 5 — Particle Continuity
- `AstronautDissolve.tsx` samples the suit surface into a `THREE.Points` buffer, becomes visible at `progress` 0.52–0.62, and streams toward the singularity from 0.58 to ~0.92.
- `ParticleContinuum.tsx` remains one persistent buffer spanning both modes. Dissolve particles are a separate buffer that fades into the singularity rather than literally reforming the destination landmarks; treat full single-buffer continuity as remaining work.

#### Phase 6 — Cinematic Completion
- `CinematicOverlay.tsx` subtitles retimed to the new arc: gravity-gradient warning at 25s, tidal elongation at 31s, suit-material failure at 38s, particle-stream lock at 46s, phase complete at 53s.
- Skip (button/Escape) and the shared `handoffToExploration()` path both restore the exploration camera and astronaut standoff.
- Soundtrack synchronization and the ARIA introduction still require real audio assets and Phase 9.

#### Phase 7 — 6-DOF Navigation & Compass Radar
- `FlightController.tsx` provides W/S, A/D, R/F, Shift boost; disabled during cinematic and fly-to.
- `DestinationNavigator.tsx` owns the camera during a fly-to and restores control when the panel closes.
- `CompassRadar.tsx` is a camera-relative heading radar with clickable blips for all six destinations, live HDG readout, and a sweep gated on reduced motion.

#### Phase 8 — Six Destinations
- `Destinations.tsx` holds the black hole, pulsar, nebula, supernova remnant, orbital station, and gateway coordinates.
- `NavigationOverlay.tsx`, `DestinationPanel.tsx`, and `src/data/portfolio.ts` provide selection, accessible content cards, and editable copy. Replace the dummy strings with verified portfolio facts.

#### Phase 10 — HUD, Quality & Semantic Fallback
- `BrandingOverlay.tsx` now includes a quality cycler (low/medium/high/ultra via `nextQuality()`) and a Text Mode button that calls `setMode("fallback")`.
- `SemanticPortfolio.tsx` renders the full scrollable portfolio as semantic HTML with section anchors and a return-to-3D action.
- `page.tsx` probes WebGL and `prefers-reduced-motion`; unsupported devices get the semantic version and the header sets `aria-hidden` on the canvas.
- Reduced motion freezes star/dust/continuum rotation and the radar sweep.

#### Phase 11 — Performance
- `src/lib/quality.ts` defines four presets controlling DPR, star/dust/continuum/dissolve/hawking counts, and bloom intensity; all major particle systems read from it.
- Transparent materials are configured at creation so the dissolve fade triggers no mid-prologue shader recompiles.
- Remaining: on-device profiling and any LOD/instancing work identified by it.

#### Phase 12 — Build & Deploy
- Production build passes (Route `/` ≈ 272 kB, First Load JS ≈ 360 kB).
- `next.config.mjs` supports `NEXT_DIST_DIR` so a build can run while `next dev` holds `.next` on Windows.
- Deployment credentials/host are not configured; that is the only remaining Phase 12 step.

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

1. Run `npm run dev` and watch the full 55s prologue end to end: astronaut stretch, suit dissolve, particle stream, and handoff. Verify the establishing shot does not clip the astronaut.
2. Inspect each destination at close range and tune counts, point sizes, bloom, and camera offsets on the target GPU.
3. Replace all dummy data in `src/data/portfolio.ts` with verified portfolio facts before beginning ARIA grounding.
4. Decide whether the dissolve particles should feed `ParticleContinuum` directly (single persistent buffer) to satisfy the Particle Continuity Law literally.
5. Begin Phase 9 only after verified content and a rigged ARIA avatar exist: ARIA must not generate facts beyond the real portfolio data.

---

## 5. Development Roadmap Summary

- **Phase 0:** Product Architecture & Blueprint (Done)
- **Phase 1:** 3D Foundation & Persistent Scene (Done)
- **Phase 2:** Cinematic Black Hole (Done & Polished)
- **Phase 3:** Astronaut & Cinematic Timeline Orchestration (Done)
- **Phase 4:** Spaghettification GLSL Vertex Shader (Done)
- **Phase 5:** Particle Transformation & Galactic Assembly (dissolve stream done; literal single-buffer continuity pending)
- **Phase 6:** COSMOS Cinematic Completion (retimed beats and handoff done; audio/ARIA intro pending assets)
- **Phase 7:** 6-DOF Zero-Gravity Flight Navigation & Compass Radar (Done)
- **Phase 8:** 6 Portfolio Destinations (landmarks, fly-to, content panels done; verified content pending)
- **Phase 9:** ARIA AI Guide (Blocked on rigged 3D avatar and grounded portfolio data)
- **Phase 10:** UI HUD, Quality Settings & Semantic HTML Fallback (Done)
- **Phase 11:** Performance Profiling & Optimization (4-tier presets done; on-device profiling pending)
- **Phase 12:** Production Build & Deployment (build passing; deploy credentials pending)

---

## 6. How to Resume in New Chat

Copy and paste the prompt in the next chat:
```markdown
We are developing COSMOS (an ultra-realistic 3D portfolio universe).
Phase 0 through 3 are complete; Phases 4–8 and 10–12 are implemented on branch `phase-3-cinematic-orchestration` and await visual QA, verified portfolio data, and deployment credentials. Phase 9 (ARIA) is blocked on a rigged avatar.
Please read `HANDOVER.md`, inspect the current working tree, and continue with visual QA, real portfolio-data replacement, exact particle continuity, or Phase 9 ARIA only after verifying the project state.
```
