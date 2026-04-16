# Project: Go Real-Time DDoS Attack Map (Frontend)

# Documentation
"Always cross-reference `ui-ux-pro-max` guidelines in `.agent/skills/ui-ux-pro-max/SKILL.md`. Use the specific color palettes and interaction patterns defined there."

## Core Architectural Principles
- **Real-Time Data (WebSockets):** Use a single WebSocket connection to the Go backend. Parse incoming JSON events and update global state immediately.
- **Performance Optimization (R3F):** Keep the active `AttackArc` count under 100 to maintain 60 FPS. Use `useMemo` for heavy coordinate-to-vector3 calculations.
- **Visual Excellence:** Use high-resolution textures for the sphere. Apply glow effects and smooth transitions (150-300ms) for UI overlays.
- **Responsiveness:** Ensure the dashboard is usable at 375px (mobile) to 1440px (desktop). All HUD elements should use `backdrop-filter: blur()`.

## Tech Stack Constraints
- **Language:** TypeScript (Next.js 14+)
- **3D Engine:** React-Three-Fiber (Three.js)
- **Styling:** CSS Variables and Modern CSS (Glassmorphism).
- **Icons:** Use Lucide-React or Heroicons. Avoid emojis for professional icons.

## Coding Style
- Use `useEffect` for managing WebSocket lifecycle (connect/disconnect).
- Implement `getColorForType(type)` to unify coloring for arcs, tooltips, and badges.
- Use `framer-motion` for UI entrance/exit animations if needed for the sidebar feed.
