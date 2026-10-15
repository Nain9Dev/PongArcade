@AGENTS.md

## Claude Code Specifics

- Read `docs/README.md` and `docs/40-tasks.md` before any code changes.
- Never import Three.js, browser globals, or DOM into `app/src/domain/`.
- Ensure all 140 automated tests pass with `npm test` before reporting work complete.
- Verify production bundle with `npm run check`.
- Pin dev server to port `5320` (`http://pong.localhost:5320`).
