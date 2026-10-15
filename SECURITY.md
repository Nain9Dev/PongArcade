# Security Policy

## Reporting Security Issues

We take the security of Pong Arcade 3D and its deterministic physics engine seriously. If you believe you have discovered a vulnerability, please report it responsibly:

- **Email:** security@naindev.com (or via contact at [naindev.com](https://www.naindev.com))
- **Response Target:** Initial acknowledgment within 48 hours.

Please do not disclose security issues publicly until a fix has been validated and released.

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `3.x` (current) | Yes |
| `< 3.0` | No |

## Scope & Security Model

Pong Arcade 3D runs entirely on the client:
- **Zero Remote Execution:** The simulation, rendering, and predictive AI run client-side without executing remote code.
- **Pure Domain Engine:** The domain physics engine takes no uncontrolled external input and relies on strict value clamping and numerical bounds.
- **Resource Limits:** WebGL canvas allocations and audio context nodes are strictly capped and properly disposed of upon session reset.
