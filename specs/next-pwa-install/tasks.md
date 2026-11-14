# Installable site — Tasks

| ID | Task | Covers | Label | Done when |
| --- | --- | --- | --- | --- |
| T-205 | Contract test `tests/site/install.spec.ts`, written before the files it reads | REQ-020..023 | [A] | It fails on the tree without the manifest, the icons and the tags |
| T-206 | Install icons, manifest and head tags; rebuild the deployed `index.html` | REQ-020..023 | [A] | `npm run check` passes and Chrome reports no installability error for the files a commit publishes |
| T-207 | Verify the install on the live site | Acceptance criteria | [M] | The live manifest answers 200 with a manifest media type and the owner has installed the site on Android and on iOS |

## Handoff

- Done: T-205 and T-206.
- Verified:
  - T-205: before the implementation `npm test` ended with 9 failed and 153 passed. The manifest
    and icon tests failed with `ENOENT`, the tag tests with empty lists.
  - T-206: `npm run check` passes with 162 tests in 13 files, and the build leaves the bundle
    hashes unchanged. Replacing an icon with one that breaks a rule (transparent corners, mark
    outside the safe zone, blank tile, wrong size) fails the matching test.
  - Headless Chrome over the DevTools protocol, on a loopback copy of the files a commit
    publishes: manifest parsed, no installability error on `/`, and the app id and the scope
    resolve to the site root. The same probe on the live site before the change answers
    `no-manifest`.
  - The dev and preview servers answer the manifest and icon paths with the files of the root,
    and Chrome reports no manifest error on either.
- Next: T-207 after the merge. Needs from the owner: merge the pull request, then install from
  Chrome on Android and from Safari on an iPhone, and confirm the icon, the label `Pong Arcade` and
  the window with no browser bar.
- Blocked: nothing. T-207 needs the owner's phones.
