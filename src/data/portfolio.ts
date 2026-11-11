import { DestinationId } from "@/types/universe";

/** Replace this fixture with your verified portfolio data before publishing. */
export const portfolio: Record<DestinationId, { eyebrow: string; title: string; summary: string; facts: string[] }> = {
  about: { eyebrow: "ABOUT // GARGANTUA", title: "A developer building calm systems in complex spaces.", summary: "This is placeholder biography copy. Replace it with your real story, location, focus, and the kind of work you want to be hired for.", facts: ["Based in: Your city", "Focus: Full-stack engineering", "Available for: Selected collaborations"] },
  skills: { eyebrow: "SKILLS // PULSAR", title: "Technical range, focused into useful momentum.", summary: "A pulsar represents the tools you use repeatedly and confidently. Replace these labels with your actual stack and strengths.", facts: ["TypeScript · React · Next.js", "Node.js · APIs · SQL", "Three.js · WebGL · UI systems"] },
  projects: { eyebrow: "PROJECTS // NEBULA", title: "Experiments condensed into products.", summary: "Each project can become an explorable planet here. These are editable placeholders.", facts: ["Atlas — analytics workspace", "Orbit — collaboration tool", "Signal — real-time dashboard"] },
  achievements: { eyebrow: "ACHIEVEMENTS // SUPERNOVA", title: "Moments that changed the trajectory.", summary: "Use this timeline for launches, awards, certifications, or measurable outcomes.", facts: ["2026 — Shipped a flagship product", "2025 — Led a cross-functional launch", "2024 — Earned a professional certification"] },
  contact: { eyebrow: "CONTACT // ORBITAL STATION", title: "Open a channel.", summary: "Replace these placeholders with the contact paths you want to publish.", facts: ["hello@yourdomain.dev", "linkedin.com/in/your-profile", "github.com/your-handle"] },
  resume: { eyebrow: "RESUME // EINSTEIN-ROSEN GATE", title: "Resume payload ready for replacement.", summary: "This is intentionally dummy resume data. Update it in src/data/portfolio.ts and wire your PDF URL when you are ready.", facts: ["Your Name — Software Developer", "Experience: 4+ years", "Education: Your degree / institution"] },
};
