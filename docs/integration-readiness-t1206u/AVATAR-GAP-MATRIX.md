# Avatar gap matrix — t1206u

**Status labels:** `REGISTERED_VISUAL_PROTOTYPE_ONLY` · Android **NOT RUN** · no owner visual PASS claimed.  
**Slot labels only** in owner-facing text. Internal file IDs appear once in the checksum table below.

Audit tip: `7ee43f46cbcb891a81bd57d70ffadc50e1999661` (#39) · Look 2 base tip: `f70aaed514953b79f1c76a907931bbbde34248f7` (#27).

---

## 1. Completeness by slot

| Slot | Roster master | Modular ingest on #39 | 8 prototype plates | Separated hair | Helmet | Goggles | Board+bindings | Backpack | Jacket-off | Clothing-swap | Owner visual | Android |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Man 1 | PRESENT (docs master) | PRESENT | PRESENT | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT/OFF | PRESENT (prototype) | TEST-ONLY alt | OWNER_REVIEW_REQUIRED | NOT RUN |
| Woman 2 | PRESENT (approved character master) | PRESENT (Look 2 finishing) | PRESENT | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT/OFF | PRESENT (finishing body) | mint↔ink PRESENT | LOOK2_PRESERVED — finishing staged; **no PASS** | NOT RUN |
| Woman 3 | PRESENT (docs master) | PRESENT | PRESENT | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT/OFF | PRESENT | TEST-ONLY alt | OWNER_REVIEW_REQUIRED | NOT RUN |
| Man 2 | PRESENT (docs master) | PRESENT (framework) | PRESENT | ABSENT | ABSENT | ABSENT (locked in head) | ABSENT | ABSENT/OFF | PRESENT | TEST-ONLY alt | **NOT owner-visually approved** | NOT RUN |
| Woman 1 | PRESENT (docs master) | **NOT in #39 modular set** | — | — | — | — | — | — | — | — | master only | NOT RUN |
| Man 3 | PRESENT (docs master) | **NOT in #39 modular set** | — | — | — | — | — | — | — | — | master only | NOT RUN |
| Grom 1 | Preview master | **HELD** (`gromFlowEnabled=false`) | — | — | — | — | — | — | — | — | preview only | NOT RUN |
| Grom 2 | Preview master | **HELD** | — | — | — | — | — | — | — | — | preview only | NOT RUN |

**No roster expansion** for test counts. Shared fact: head is **one locked plate** (hair/helmet/goggles not independent). Underbody is constructed apparel, not photo anatomy.

---

## 2. Checksum / ingest table (internal IDs once)

### Woman 2 — Franz newest finishing vs #27/#39 disk

| Artifact | Drive / path | sha256 | Match? |
|---|---|---|---|
| Finishing ZIP | Drive `1Tg0OG-9poiaLKscqx8jdrpXGicMIxTby` | `2118bdc84855f2aae526fdaf6111d014e5d990dd0705a1354113988b67bdbd84` | Receipt pin |
| ARTWORK-STATUS | Drive `1nBoJAz5vZG7NBra5K8KgavdrSLNBKpRO` | (text status) | Modified 2026-11-04 ~15:11Z |
| Face locked webp | `…/face/face-f-hana-locked-composite@512.webp` | `c2ffcbd901648b718d71d468f31090b959459b97b7fd9a7d25ca6044580bd434` | **MATCH** Franz status |
| Body athletic webp | `…/body/body-athletic@512.webp` | `85ecf3646890a4e4a730f7045a34b8284fbea8aa5dbeb4b0d26614873d26d37a` | **MATCH** Franz status |
| Jacket mint | `…/jacket/jacket-look2-mint@512.webp` | `2c7e796345854bd27eddfbdeacaa32adcd1889735c8cb31379819a49d0f12c1e` | On tip |
| Jacket ink | `…/jacket/jacket-look2-ink@512.webp` | `1611f0fb5d4f868c0439624dbce2092f6a2f26e884c766bf6dc98c4c10056462` | On tip |
| Pants mint | `…/pants/pants-look2-mint@512.webp` | `1f21b5f90f7c659ba478011d23228c1a1ef9dd276845a92210754a05fc6ab1ce` | On tip |
| Pants ink | `…/pants/pants-look2-ink@512.webp` | `904c32b7df3bd7b2c3c7415cd1282230338b5ff2dc7e37bc60404881ad22227d` | On tip |

Canonical Look2 folder: Drive `1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH`.

### Other Franz packs (ingest presence on #39)

| Slot | Drive ZIP id | Tip evidence |
|---|---|---|
| Man 1 | `1V-2Ve-OUaRX8zziiKHIbNIrQ0RiFGzHo` | Pack under `docs/multi-rider-t1205u/packs/` + runtime webps; RECEIPT zip sha `d51249b715a46872fbc54d122217aaa3351c1c538f334ea0b79f2b951b605365` |
| Woman 3 | `1Ig8de_AtYKdmRLEd2eTpmGG-54HFw5nN` | Pack + runtime; RECEIPT zip sha `c23e0ceb6f332b5f55ba253844b8926eb6ab3f80fd9c95e7312e551b6de2f758` |
| Man 2 | `1lU8TagATSNf4MtN-Sdau7c3Q6H2bApIz` | Pack + runtime framework; RECEIPT zip sha `d7d6484409c4da276ca095f21d765ff00c7d915d16befe2cccebd075d7fa7a02` |

Runtime plate digests for Man 1 / Woman 3 / Man 2: `docs/multi-rider-t1205u/ingested-runtime-sha256.json`.

---

## 3. Jacket-off + clothing-swap honesty

| Claim | Honest status |
|---|---|
| Jacket-off shows underbody | Prototype A path present; quality still needs owner eyes (esp. Man 1) |
| Clothing-swap keeps registration | Automated zero-drift claims on Woman 2 finishing tip; others framework-tested |
| Alt outfits production-ready | **No** — marked TEST-ONLY where applicable |
| `acceptanceEligible` | **false** for all modular prototypes |
| Browser 390×844 shots | Engineering evidence only — **≠ Android PASS** |

---

## 4. Per-rider Locker isolation

| Check | Status | Evidence path |
|---|---|---|
| Separate storage keys per starter | PRESENT | `stomp-avatar-locker-rider:{starterId}` (documented in multi-rider RECEIPT) |
| Switch rider without clobber | Synthetic PASS | `docs/multi-rider-t1205u/FUNCTIONAL-RESULTS.md` |
| Device confirmation | **NOT RUN** | See Android instructions |

---

## 5. Missing production layers (block merge / acceptance)

1. Separated hair plate  
2. Separated helmet / headwear  
3. Separated goggles  
4. Real board + bindings as own layers  
5. Independent backpack as production optional layer  
6. Full 11-slot production outfit with `acceptanceEligible` path  
7. Owner visual sign-off per rider  
8. Physical Android Batch E evidence  

Until then: label remains **REGISTERED_VISUAL_PROTOTYPE_ONLY**.
