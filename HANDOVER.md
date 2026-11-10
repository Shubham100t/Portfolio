# COSMOS — Project Handover Document

**Project:** COSMOS — An Interactive 3D Portfolio Universe  
**Current Date:** 2026-11-10  
**Current Phase:** Phase 2 Complete -> Ready for Phase 3 (Astronaut & Cinematic Timeline Orchestration)  
**Git Branch:** `phase-2-black-hole` (Clean, Verified)  
**Latest Milestone:** Cinematic Black Hole (Gargantua Singularity, Keplerian Accretion Disk, Relativistic Doppler Beaming, Lensed Halo & Gravitational Lensing)

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
- Master architecture, folder structure, state model, and phased roadmap established and approved.

### Phase 1: 3D Foundation (Complete & Verified on `phase-1-scene-foundation`)
- **Framework Setup**: Next.js 14.2.5 (App Router), React 18, TypeScript, Tailwind CSS, Lucide icons.
- **Persistent Canvas**: `src/components/canvas/UniverseCanvas.tsx` configured with `z-0` stacking, high-performance WebGL settings, and dynamic client-side loading (`ssr: false`).
- **Scene Assembly**: `src/components/canvas/SceneManager.tsx` hosting `OrbitControls`, cinematic lighting (ambient, key, cyan rim, warm bounce), background stars, cosmic dust, and the central astronaut.
- **Deep Space Environment**: Drei's `<Stars />` (7,500 twinkling stars) + `src/components/canvas/environment/CosmicDust.tsx` (700 local floating micro-particles providing motion parallax).
- **Astronaut Protagonist**: `src/components/canvas/cinematic/BasicAstronaut.tsx` with PBR materials, white EVA spacesuit, reflective gold helmet visor (`metalness: 0.98`, `roughness: 0.08`), PLSS backpack with thrusters, and procedural zero-G floating animation.
- **Sci-Fi HUD & Branding**: `src/components/ui/BrandingOverlay.tsx` with live coordinates telemetry `[X, Y, Z]`, RCS status, audio toggle, and dismissible cinematic identity card.
- **Global State Store**: `src/stores/useUniverseStore.ts` tracking mode, destination, quality tiers, and telemetry coordinates.

### Phase 2: Cinematic Black Hole (Complete & Verified on `phase-2-black-hole`)
- **Webpack 5 GLSL Asset Loading**: Native Webpack 5 `type: 'asset/source'` configured in `next.config.mjs` with TypeScript module declarations in `src/types/shaders.d.ts` (zero external npm loader dependencies).
- **Accretion Disk Shaders** (`src/shaders/blackhole/accretionDisk.vert.glsl` & `accretionDisk.frag.glsl`):
  - Schwarzschild inner boundary cutoff ($R_{in} = 1.65$) and outer edge falloff ($R_{out} = 7.2$).
  - Keplerian differential rotation where angular frequency $\Omega(r) \propto r^{-1.5}$.
  - Multi-octave procedural logarithmic spiral plasma turbulence and micro-filaments.
  - Relativistic Doppler frequency beaming ($\beta = \sqrt{R_s / 2r}$, $\delta = \frac{1}{\gamma(1 - \beta \cos\alpha)}$) dynamically boosting luminosity on the approaching side (white-hot/cyan) and dimming/redshifting the receding side (amber/crimson).
  - Razor-thin incandescent photon ring emission spike at $1.5 R_s$.
- **Gravitational Lensing Shaders** (`src/shaders/blackhole/gravitationalLens.vert.glsl` & `gravitationalLens.frag.glsl`):
  - Relativistic deflection angle $\Delta \theta \propto 2R_s / \Delta b$ warping starlight radially inwards toward the singularity.
  - Einstein ring caustic glow and smooth shadow silhouette boundary.
- **Celestial BlackHole Component** (`src/components/canvas/celestial/BlackHole.tsx`):
  - Schwarzschild event horizon sphere (absolute black core).
  - Incandescent photon ring at $1.5 R_s$ with dynamic pulsation.
  - Primary equatorial accretion disk with Keplerian plasma dynamics.
  - Secondary vertical lensed accretion halo (simulating light from behind the horizon bent over and under the singularity).
  - Gravitational lensing curved spacetime shell.
- **Scene Integration & Post-Processing** (`src/components/canvas/SceneManager.tsx`):
  - Mounted `<BlackHole />` at cosmic origin `[0, 0, 0]`.
  - Repositioned `<BasicAstronaut />` to standoff coordinates `[0, -0.15, 4.2]` facing the singularity.
  - Configured `@react-three/postprocessing` `<EffectComposer>` with `<Bloom>` (`luminanceThreshold: 0.75`, `mipmapBlur: true`) for authentic incandescent glow.

---

## 3. Important Implementation Lessons & Bug Fixes

1. **Stacking Context & Z-Index in Next.js/Tailwind**:
   - Never assign `-z-10` to a fixed/absolute Canvas container if parent elements or `body` have background colors (`bg-[#020617]`). In CSS, elements with negative z-index are painted behind the background of the stacking context root, causing a black screen.
   - Correct approach: Canvas container at `z-0` with `bg-black`, and HUD overlays on top at `z-10` with `pointer-events-none`.
2. **GLSL Bundling in Next.js 14**:
   - Do not rely on deprecated Webpack 4 loaders (`raw-loader`, `glslify-loader`). Use Webpack 5's native `type: 'asset/source'` rule in `next.config.mjs` alongside a TypeScript module declaration file (`src/types/shaders.d.ts`).
3. **R3F EffectComposer Props**:
   - In `@react-three/postprocessing`, pass `enableNormalPass={false}` instead of `disableNormalPass` to satisfy TypeScript types.
4. **PowerShell Windows Encoding**:
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

---

## 5. Development Roadmap Summary

- **Phase 0:** Product Architecture & Blueprint (Done)
- **Phase 1:** 3D Foundation & Persistent Scene (Done)
- **Phase 2:** Cinematic Black Hole (Done)
- **Phase 3:** Astronaut & Cinematic Timeline Orchestration (Next)
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
Phase 0, Phase 1, and Phase 2 are complete and verified on branch `phase-2-black-hole`.
Please read `HANDOVER.md` in the root workspace and proceed directly with Phase 3: Astronaut & Cinematic Timeline Orchestration.
```