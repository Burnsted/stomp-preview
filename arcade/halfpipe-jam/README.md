# Halfpipe Jam

**Standalone STOMP Arcade game** — path: `arcade/halfpipe-jam/`

## Owner decision (Ted, 2026-11-04)

Halfpipe Jam stays a **completely separate game**. It is:

- Associated with the arcade family visually (purple dusk / cream / coral-amber language where practical)
- **Not** a Terrain Park mode
- **Not** to be folded or merged into Terrain Park tip/source (keeps TP from getting crowded)

Optional tip URL / service-worker promote only when Ted authorizes — until then this path is prototype-only on PR branches.

## Isolation

| Do | Don’t |
|----|--------|
| Develop under `arcade/halfpipe-jam/` | Touch `arcade/terrain-park/` or `arcade/boulder-dodge/` for Halfpipe features |
| Keep PR unmerged until tip authorize | Deploy to GitHub Pages / overwrite `/arcade/release/` or `/arcade/play/` without approval |

Gameplay identity: pipe momentum, air, grabs, landings — progression via **boards + weather**, not obstacles.

See `SIZE.md` and `BATCH-A-NOTES.md` for size audit and batch history.
