# 20 — Architecture: Pong Arcade 3D

## System Context (C4 Level 1)

Pong Arcade 3D runs entirely on the client within the user's browser. It has no remote backend, telemetry, or user accounts.

```mermaid
flowchart TB
    player(["Player<br/>Human user"])

    game["Pong Arcade 3D<br/>Client-side WebGL Game Engine"]

    browser["Web Browser<br/>WebGL2, Web Audio API,<br/>Pointer/Gamepad APIs, localStorage"]
    pages["GitHub Pages (pong.naindev.com)<br/>Static asset distribution"]

    player -->|"Keyboard, mouse, touch, or gamepad"| game
    game -->|"Visual canvas, audio synthesis, HUD"| player
    game -->|"Renders WebGL, synthesizes sound,<br/>persists high scores"| browser
    pages -->|"Delivers HTML, CSS, and JS bundle"| browser

    classDef system fill:#0f766e,stroke:#0d9488,color:#f0fdfa
    classDef external fill:#334155,stroke:#475569,color:#f8fafc
    classDef person fill:#7c3aed,stroke:#8b5cf6,color:#f5f3ff
    class game system
    class browser,pages external
    class player person
```

---

## Container Diagram (C4 Level 2)

```mermaid
flowchart TB
    player(["Player"])

    subgraph pages["Hosting (pong.naindev.com)"]
        static["Static Web Bundle<br/>HTML + CSS + JS (Vite build)"]
    end

    subgraph tab["Browser Tab"]
        app["Application Chunk<br/>TypeScript (Domain + Application + Adapters)"]
        vendor["Vendor Chunk<br/>Three.js (manualChunks)"]
        canvas["WebGL Canvas<br/>Procedural 3D Scene"]
        audio["Web Audio Graph<br/>Real-time parametric audio synthesis"]
        dom["DOM Shell<br/>HUD, menus, and controls"]
        store[("localStorage<br/>High scores & settings")]
    end

    pages -.->|"Serves"| static
    static -->|"Executes in"| tab
    player -->|"Inputs"| dom
    dom -->|"Forwards input"| app
    app -->|"Animates"| canvas
    app -->|"Synthesizes sound"| audio
    app -->|"Persists"| store
    vendor -->|"Three.js runtime"| app
```

---

## Hexagonal Component Architecture (C4 Level 3)

Dependencies point inward. The domain knows nothing about the browser or Three.js.

```mermaid
flowchart LR
    subgraph infra["Infrastructure & UI"]
        R["Three.js Renderer Adapter"]
        A["Web Audio Synthesizer Adapter"]
        I["Input Adapters (Keyboard, Touch, Gamepad)"]
        U["DOM Shell & HUD Overlay"]
    end

    subgraph app["Application Layer"]
        P["Ports (IRenderer, IAudio, IInput)"]
        L["Fixed Timestep Loop (120 Hz)"]
        S["Session State Machine"]
    end

    subgraph dom["Domain Layer (Pure TypeScript)"]
        M["Match Aggregate"]
        F["Continuous Collision Detection (CCD)"]
        AI["Predictive Trajectory AI"]
        V["3D Vector Math (Vec3)"]
        RNG["Injected PRNG (Rng)"]
    end

    infra -->|Implements| P
    app --> dom
    P --> dom

    style dom fill:#182B49,stroke:#fff,stroke-width:2px,color:#fff
    style app fill:#2A4878,stroke:#fff,color:#fff
    style infra fill:#0F766E,stroke:#fff,color:#fff
```

---

## The Simulation Tick Lifecycle

Every fixed tick (8.33 ms, 120 Hz):
1. **Poll Inputs:** Collect normalized directional displacement vector $\vec{d} \in [-1, 1]^2$ from active devices.
2. **Advance Paddles:** Move paddles along $(x, y)$ planes, clamped by arena boundaries and dynamic speed limits.
3. **Continuous Collision Detection (CCD):**
   - Trace ball velocity vector $\vec{v}$.
   - Find earliest plane impact time $t_i \in [0, \Delta t]$.
   - Reflect velocity against the boundary normal $\vec{n}$: $\vec{v}' = \vec{v} - 2(\vec{v} \cdot \vec{n})\vec{n}$.
   - Add paddle deflection and tangential spin.
4. **Predictive AI Evaluation:** Compute the ball's terminal $(x, y)$ intersection on the AI goal plane and steer the AI paddle toward target with latency/noise filters.
5. **State Transition:** Check goal planes for score updates, ball reset, or match end.
