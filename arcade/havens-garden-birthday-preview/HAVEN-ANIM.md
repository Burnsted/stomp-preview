# Haven motion (v0.9-birthday-haven-move)

Code-driven animation on approved Franz pose art (`js/haven-anim.js`). No new art required for ship.

## Uses existing frames
| Pose | Asset |
|------|--------|
| Walk cycle | `haven-walk-01`…`04` |
| Run | `haven-run` |
| Idle | `haven-skip` / front |
| Pick crouch | `haven-pick` |
| Plant / kneel | `haven-plant` |
| Water tilt | `haven-water` (falls back to plant) |
| Net swing | `haven-chase` |
| Celebrate jump | `haven-jump` |

## Code layer
Walk/run bob, squash-stretch, lean into travel, face flip, ponytail lag (upper-sprite + ribbon accents), arm/basket swing, idle breath + look/hop, ease-in/out speed, foot dust/grass puffs, action pose holds.

## Franz follow-ups (optional, not blocking)
See `HavenAnim.FRANZ_REQUESTS`:
- `haven-run-01`…`04` dedicated run cycle
- `haven-look-left` / `haven-look-right`
- `haven-celebrate` distinct from jump
- Optional `haven-walk-05` / `06` for smoother gait
