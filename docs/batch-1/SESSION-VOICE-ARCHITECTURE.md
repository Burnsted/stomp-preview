# SESSION voice architecture (prep)

**Status:** Registry + docs only (Batch 1).  
**Not claimed:** device compatibility, Cardo/Sena/Aleck certification, or always-on mic.

## Wake names

| Phrase | Required |
|---|---|
| Hey Session | Yes |
| Yo Session | Yes |
| Sesh | Optional |

Listening model for future work: **explicit user-initiated** listen session only. No unrestricted background listening in this branch.

## Shared command set

One registry (`batch1/src/session/command-registry.ts`) for intended transports:

- phone audio
- Bluetooth headsets
- Cardo / Sena / Aleck (documentation hints only — **no** proprietary SDKs)

Commands include: log trick, start/end park session, mark stash, next hit, play/pause/duck sample, crew status (local), help.

## Naming conflict (preserved)

Master HQ notes “Session” already names Terrain Park Session, TourSession, PhotoSessionStore, AudioDuckingSession. Wake assistant = **SESSION** voice; resolve UI labels later without deleting history.

## Hard stops

- No proprietary radio integrations in this PR  
- No unverified “works on Cardo/Sena/Aleck” claims  
- No AI coaching commands
