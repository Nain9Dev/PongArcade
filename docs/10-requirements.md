# 10 — Requirements: Pong Arcade 3D

Requirements defined using EARS (Easy Approach to Requirements Syntax).

## Core Simulation & Physics

- **REQ-001 (Deterministic Fixed Timestep):** The simulation engine shall advance game state in fixed increments of exactly $1/120$ seconds (8.33 ms), regardless of the browser display refresh rate.
- **REQ-002 (Render Interpolation):** When rendering between fixed physics ticks, the engine shall compute an alpha interpolation factor $\alpha \in [0, 1)$ to blend entity positions smoothly without visual jitter.
- **REQ-003 (Continuous Collision Detection):** When the ball moves between ticks, the physics solver shall compute the exact time-of-impact against tunnel boundary planes and paddle volumes in chronological order to prevent tunneling.
- **REQ-004 (Spin & Deflection Dynamics):** When the ball impacts a moving paddle, the solver shall deflect the trajectory based on impact offset and paddle tangential velocity.
- **REQ-005 (Seeded Reproducibility):** When supplied with an initial seed and an input trace, the match simulation shall produce identical numerical states across all platforms.

## Artificial Intelligence

- **REQ-006 (Predictive Trajectory AI):** The AI opponent shall calculate where the ball will intersect its goal plane, accounting for intermediate wall reflections.
- **REQ-007 (Difficulty Calibration):** When configured across difficulty tiers (Rookie, Pro, Master, Singularity), the AI shall modulate reaction latency, aiming error, and commitment horizons rather than raw paddle speed.

## Rendering & Audio

- **REQ-008 (Procedural Rendering Adapter):** The rendering engine shall generate the neon arena, paddles, and ball procedurally in Three.js without downloading external 3D asset files.
- **REQ-009 (Real-time Audio Synthesis):** When collision or goal events occur, the audio adapter shall synthesize sound waves dynamically via Web Audio API oscillators and gain envelopes with zero audio files.
- **REQ-010 (Multiple Perspective Cameras):** The system shall support switching between chase camera, cockpit view, and broadcast side view.

## Mobile & Cross-Platform Playability

- **REQ-011 (Relative Drag Steering):** When touch input is detected, the game shall convert relative pointer delta into paddle displacement independent of screen resolution.
- **REQ-012 (Aspect-Aware Field of View):** In portrait mode on mobile devices, the camera rig shall dynamically adjust vertical FOV to maintain arena walls within visible bounds.
- **REQ-013 (Touch-Accessible Controls):** On touch devices, all interactive elements shall provide a minimum hit target size of 44x44 CSS pixels.
- **REQ-014 (Local Records Persistence):** The system shall persist personal bests and audio preferences in localStorage without server dependencies.

## Discoverability

- **REQ-015 (Canonical and Description):** When a crawler fetches the site root, the page shall carry one canonical link equal to `https://pong.naindev.com/` and one meta description of 70 to 160 characters.
- **REQ-016 (Social Metadata):** When a link to the site is shared, the page shall provide Open Graph and Twitter `summary_large_image` metadata whose URL equals the canonical and whose image is an absolute URL.
- **REQ-017 (Structured Data):** When a search or AI engine reads the page, it shall find `SoftwareApplication` and `VideoGame` JSON-LD that names the author by `@id` and links the source repository.
- **REQ-018 (Crawler Files):** When a crawler requests `/robots.txt`, the site shall allow everything and advertise `/sitemap.xml`, which lists only the root.
- **REQ-019 (AI Summary):** When an AI engine requests `/llms.txt`, the site shall serve an English Markdown summary with links to the game, the repository and the author's site.

## Installability

- **REQ-020 (Web App Manifest):** When a browser requests `/manifest.webmanifest`, the site shall serve a manifest that declares `name` `Pong Arcade 3D`, `short_name` `Pong Arcade`, `display` `standalone`, `id`, `start_url` and `scope` `./`, `lang` `es`, `dir` `ltr`, the meta description of the page, and `theme_color` and `background_color` `#04050c`, and that does not declare `prefer_related_applications`.
- **REQ-021 (Install Icons):** The manifest shall declare three PNG icons that exist at the declared size, one purpose per entry: 192 px and 512 px with purpose `any`, and 512 px with purpose `maskable`.
- **REQ-022 (Opaque Icons and Safe Zone):** The maskable icon and the 180 px `apple-touch-icon` shall be opaque edge to edge, and the maskable icon shall keep the mark inside the centred circle whose radius is 40% of its width.
- **REQ-023 (Home-Screen Head Tags):** The page shall link the manifest and the `apple-touch-icon` with paths relative to the site root, and shall carry `mobile-web-app-capable` and `apple-mobile-web-app-capable` set to `yes`, an `apple-mobile-web-app-title` equal to the manifest `short_name`, `apple-mobile-web-app-status-bar-style` set to `black`, and one `theme-color` equal to the manifest `theme_color`.
