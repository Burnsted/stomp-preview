# T1189U — LOOK 2 MODULAR PLATE EXTRACT + GATE (t1188u/t1189u)

**PR:** draft #21 · `cursor/character-production-t1173u-e14a`  
**Prior tip:** `6735847` (t1182u ingest scaffolding)  
**Hard nos:** no merge/Pages/prod · no youth/payments · no invent Looks 1/3–8 · protect #12–#20/#22/#23 · ink ABSENT

## Verdict

Look 2 mint modular `@512.webp` plates **extracted from owner modular sheet** and bound to exact `LOOK2_MINT_REQUIRED_PATHS`. Selector/Locker use real plates for mint defaults; `acceptanceEligible=true` when outfit constraints hold. Ink variants **ABSENT**. Android Batch E **OPEN_DEVICE** (not fake-PASS). Other looks still missing-plates.

## Source

| Field | Value |
|---|---|
| Sheet | `docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png` |
| sha256 | `e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322` |
| Size | 1448×1086 |
| Extract | `scripts/extract-look2-mint-plates.py` |

## Plate inventory (sha256)

| URL | sha256 | bytes |
|---|---|---|
| `/stomper/adult/starter/f-hana/preview@512.webp` | `88ac50a6b1244259eb2acd40f394323227ff2c0d2e7953651f35b7071832ed02` | 84988 |
| `/stomper/adult/jacket/jacket-look2-mint@512.webp` | `56904a59aeb3d5f937722e0b14423eb43193cf43f70ecb4bf971371535537202` | 37286 |
| `/stomper/adult/pants/pants-look2-mint@512.webp` | `9ba3c7443f48f45dc20e03afed5133ec69f2cc229b40471d4c0d7bec5bf94d68` | 40936 |
| `/stomper/adult/body/body-athletic@512.webp` | `9fb70d1a8a578010f85df9c40e424cc785b7e7281420e32c4943266856160353` | 53998 |
| `/stomper/adult/face/face-female@512.webp` | `5e3417919819725ae91d660d616695792490d03ac5cd1c2cfb34f395dfa7dbea` | 13734 |
| `/stomper/adult/hair/hair-straight@512.webp` | `0d5280b80eaa81b91f5e421e167d6e47872dca4c447357f93aa1f5ec305bed36` | 23946 |
| `/stomper/adult/headwear/helmet-basic@512.webp` | `07ddd228fcc1ce8c98ae7a5d0fa066caf841fb690f6cee4a162276e1eff92d71` | 11754 |
| `/stomper/adult/goggles/goggles-basic@512.webp` | `5e1d3464d8a85fbeaabab93397c43b459a8057a7e638b9f0f7a090b0c894f11d` | 5770 |
| `/stomper/adult/gloves/gloves-basic@512.webp` | `9827b823faac3f1cebf47f18e8db227b806438a606efed3e77cdd5441086ee90` | 21916 |
| `/stomper/adult/boots/boots-basic@512.webp` | `d11a8a9b456243bad908ca231f9ae8ffd2790e855d190a314b9100b742ce7f9a` | 11392 |
| `/stomper/adult/board/board-basic@512.webp` | `0b37732fc0dec8e1de6a916304afd5b794b7aefcf4c0d654a8a04f09ccc6e9fd` | 70176 |
| `/stomper/adult/backpack/backpack-daypack@512.webp` (optional) | `275cade084de17b1ce3bf14bae9c0af43ffbdef28beded87597fc9119cf7fb27` | 143814 |

## acceptanceEligible

- Mint defaults (`jacket-look2-mint` + `pants-look2-mint` + `goggles-basic` + backpack OFF + full set): **true**
- Wrong jacket / eyewear-on / backpack-on / incomplete: **false** (fail-closed)
- Physical Android Batch E: **OPEN** (not claimed PASS)

## Remaining gaps

1. Device Batch E screenshots / Ted PASS  
2. Looks 1 & 3–8 modular plates (after Look 2)  
3. Ink variants (ABSENT on sheet)  

## Files

- `gb-phone/public/stomper/adult/**/*.webp`
- `gb-phone/src/lib/stomp/avatar/look2-plate-manifest.{ts,json}`
- `gb-phone/src/lib/stomp/avatar/plate-registry.ts` (+ AvatarRenderer / Locker / onboard)
- `gb-phone/tests/woz/update02/look2-plates-t1189u.test.tsx`
- Docs: `ARTWORK-STATUS.md`, `LOOK2-MINT-ACCEPTANCE.md`, `BATCH-E-…`, `ACTUAL-BLOCKERS.md`, this report

## Tip SHA / CI

_(filled after push + both jobs green)_
