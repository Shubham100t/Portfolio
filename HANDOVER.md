# COSMOS — Project Handover Document

**Project:** COSMOS — An Interactive 3D Portfolio Universe  
**Current Date:** 2026-11-10  
**Current Phase:** Phase 1 Complete -> Ready for Phase 2 (Cinematic Black Hole)  
**Git Branch:** `phase-1-scene-foundation` (Clean, Committed)  
**Latest Commit:** `21093a8` (`fix(phase-1): correct stacking context z-index, add OrbitControls, and improve stellar lighting`)

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

### Phase 0: System Architecture & Blueprint
- Master architecture, folder structure, state model, and phased roadmap established and approved.

### Phase 1: 3D Foundation (Complete & Verified)
- **Framework Setup**: Next.js 14.2.5 (App Router), React 18, TypeScript, Tailwind CSS, Lucide icons.
- **Persistent Canvas**: `src/components/canvas/UniverseCanvas.tsx` configured with `z-0` stacking, high-performance WebGL settings, and dynamic client-side loading (`ssr: false`).
- **Scene Assembly**: `src/components/canvas/SceneManager.tsx` hosting `OrbitControls`, cinematic lighting (ambient, key, cyan rim, warm bounce), background stars, cosmic dust, and the central astronaut.
- **Deep Space Environment**: Drei's `<Stars />` (7,500 twinkling stars) + `src/components/canvas/environment/CosmicDust.tsx` (700 local floating micro-particles providing motion parallax).
- **Astronaut Protagonist**: `src/components/canvas/cinematic/BasicAstronaut.tsx` with PBR materials, white EVA spacesuit, reflective gold helmet visor (`metalness: 0.98`, `roughness: 0.08`), PLSS backpack with thrusters, and procedural zero-G floating animation.
- **Sci-Fi HUD & Branding**: `src/components/ui/BrandingOverlay.tsx` with live coordinates telemetry `[X, Y, Z]`, RCS status, audio toggle, and dismissible cinematic identity card.
- **Global State Store**: `src/stores/useUniverseStore.ts` tracking mode, destination, quality tiers, and telemetry coordinates.

---

## 3. Important Implementation Lessons & Bug Fixes

1. **Stacking Context & Z-Index in Next.js/Tailwind**:
   - Never assign `-z-10` to a fixed/absolute Canvas container if parent elements or `body` have background colors (`bg-[#020617]`). In CSS, elements with negative z-index are painted behind the background of the stacking context root, causing a black screen.
   - Correct approach: Canvas container at `z-0` with `bg-black`, and HUD overlays on top at `z-10` with `pointer-events-none`.
2. **Early Development Controls**:
   - Per project specification, Drei's `OrbitControls` with damping (`dampingFactor: 0.06`) is used during Phase 1-2 scene development and debugging. It will transition to the custom 6-DOF zero-gravity flight controller in Phase 7.
3. **PowerShell Windows Encoding**:
   - In PowerShell 5.1, when writing JSON files, use UTF8 without BOM (`[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)`) to prevent `SyntaxError: Unexpected token '﻿'` during Node/Next.js builds.

---

## 4. Immediate Next Step: Phase 2 — Cinematic Black Hole

### Objective:
Build an ultra-realistic, procedural Gargantua-style black hole representing the **About Me** destination and the central visual spectacle of the cinematic prologue.

### Phase 2 Implementation Steps:
1. **Branch**: `git checkout -b phase-2-black-hole`
2. **Shader Architecture**:
   - `src/shaders/blackhole/accretionDisk.vert.glsl` & `accretionDisk.frag.glsl`:
     - Inner Schwarzschild event horizon ($R_s$) absorbing all incident light.
     - Photon sphere at $1.5 R_s$ with concentrated incandescent emission.
     - Dual-sided volumetric Keplerian accretion disk with Doppler frequency shifting (approaching side is brighter and bluer; receding side is dimmer and redder).
   - `src/shaders/blackhole/gravitationalLens.frag.glsl`:
     - Screen-space curved spacetime distortion bending background stars and starlight around the singularity.
3. **Component Creation**:
   - `src/components/canvas/celestial/BlackHole.tsx`:
     - Black hole core mesh + accretion disk geometry + gravitational lensing pass.
4. **Integration**:
   - Integrate `BlackHole.tsx` into `SceneManager.tsx` at the cosmic origin `[0, 0, 0]` with the astronaut positioned at standoff coordinates.
5. **Verification**:
   - Test 60 FPS performance, visual aesthetics against Interstellar's Gargantua reference, and commit to `phase-2-black-hole`.

---

## 5. Development Roadmap Summary

- **Phase 0:** Product Architecture & Blueprint (Done)
- **Phase 1:** 3D Foundation & Persistent Scene (Done)
- **Phase 2:** Cinematic Black Hole (Next)
- **Phase 3:** Astronaut & Cinematic Timeline Orchestration
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
Phase 0 (System Architecture) and Phase 1 (3D Foundation) are complete on branch `phase-1-scene-foundation`.
Please read `HANDOVER.md` in the root workspace and proceed directly with Phase 2: Cinematic Black Hole.
```
