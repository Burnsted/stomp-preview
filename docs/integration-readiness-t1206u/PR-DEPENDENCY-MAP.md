# PR dependency map — t1206u

Read-only. SHAs re-checked 2026-11-04 via `gh`. CI conclusions from GitHub check rollup + Actions runs.

## Legend

- **DRAFT** = open draft PR — do not merge  
- **MERGED** = on main  
- **OUT OF SCOPE** = arcade; keep separate from snowboard journey

---

## A. Live main (Pages)

| Ref | SHA | Notes |
|---|---|---|
| `origin/main` | `d53b0657cc963d36d6463d29f4dee65d1e4bdcc9` | `deploy(pages): gb-phone Vite static site [skip ci]` after arcade |
| #42 MERGED | merge `862657bbbc1444359bf61c94fa052c7d878cdbe0` · head `b23e48a4d852360ed56e7244d1fa0f6ec8ea4250` | Arcade playtest hub — **OUT OF SCOPE** |

---

## B. Authoritative snowboard draft tip (audit)

| PR | Title (short) | Base → Head | Head SHA | CI |
|---|---|---|---|---|
| **#39** | Multi-rider modular (Man 1 / Woman 3 / Man 2) | `#27` → `cursor/multi-rider-t1205u-2bc0` | `7ee43f46cbcb891a81bd57d70ffadc50e1999661` | **both SUCCESS** ([run 41874806319](https://github.com/Burnsted/stomp-preview/actions/runs/41874806319)) |
| **#27** | Look 2 finishing (Woman 2) | `#21` → `cursor/modular-look2-alignment-t1194u-a5c4` | `f70aaed514953b79f1c76a907931bbbde34248f7` | **both SUCCESS** ([run 41857103766](https://github.com/Burnsted/stomp-preview/actions/runs/41857103766)) |

Jobs: `batch1 typecheck + test` · `gb-phone typecheck + woz tests + build`.

---

## C. Core stack (ancestors of #39)

| PR | Head branch | Base branch | Head SHA | Base SHA (at PR open) | CI |
|---|---|---|---|---|---|
| #12 | `cursor/alpine-redesign-hq-7022` | `main` | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | `4afd43007152a700eca6a14744844574e20ad1c8` | SUCCESS |
| #13 | `cursor/trip-state-fictional-t1138u-5ae0` | #12 branch | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | `78dc9f91…` | SUCCESS |
| #17 | `cursor/release-blocker-closure-t1159u` | #13 branch | `5dc2c8e8bd198b4f244226b3ff18ad1dd21ba7fb` | `1e40eab2…` | SUCCESS |
| #18 | `cursor/avatar-identity-looks-t1169u` | #17 branch | `69d3dafcfbefffeb01b3f80c0e693d8b95c7d309` | `5dc2c8e8…` | SUCCESS |
| #19 | `cursor/release-candidate-t1170u-8e36` | #18 branch | `9c6cc96eae05c438e2a5c479e0e477034c60fdab` | `69d3dafc…` | SUCCESS |
| #20 | `cursor/character-roster-v24-t1171u-27f2` | #19 branch | `1975363404feaf8b9f434ff0384f64794d9fad10` | `9c6cc96e…` | SUCCESS |
| #21 | `cursor/character-production-t1173u-e14a` | #20 branch | `8b4b79986637ea69330698d8363726feaa8f477f` | `19753634…` | SUCCESS |
| #27 | (above) | #21 | `f70aaed5…` | `8b4b7998…` | SUCCESS |
| #39 | (above) | #27 | `7ee43f46…` | `f70aaed5…` | SUCCESS |

**Ancestry check (no merge):** #12, #17, #21, #27 are ancestors of #39. Current main / arcade merge are **not** ancestors of #39.

---

## D. Parallel / sibling drafts

| PR | Head SHA | Bases on | vs #39 |
|---|---|---|---|
| #14 CF-2 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | main | Parallel; CF-2 **selectively folded** into #15/#17 |
| #15 rehearsal | `16b61211f4caecc28ced981952a7171fc9659454` | #13 | Isolated rehearsal; not merge path |
| #16 SV-0 | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | #14 | Parallel; SV-0 **folded** into #17 |
| #22 security readiness | `7917aa69f6249b18945c0f1123a58f11bc6be56a` | #19 | **Sibling** of #20 — **not** in #39 ancestry |
| #23 Franz Look2 docs | `3066ba9d76b5918c6584f684ccc56c4820ff965a` | main | Docs; **superseded** for runtime by #27/#39 |
| #24 Campfire CF-3 shell | `cc1f153fd1dff312da4ded7d54329399534be980` | #17 | Parallel UI; **not** ancestor of #39 |
| #25 progress | `360c567b2367a3f59128761953db848620a47ae3` | #22 | Parallel |
| #26 Campfire depth | `e360ded8bd59dde71660013ba4c4222fa6859657` | #24 | Parallel |

---

## E. Conflicts / duplicates / superseded (honest)

| Issue | Detail | Recommended handling (later; not this audit) |
|---|---|---|
| Duplicate Campfire/Sesh | #14+#16 vs folded #15/#17 | Prefer #17 content; keep parallel tips for history |
| Character vs security fork | #20→#39 vs #22→#25 from shared #19 | Must re-stack before any main merge |
| Stale #12 base vs main | #12 rooted at `4afd4300…`; main now `d53b0657…` (+ arcade) | Future rebase risk; **do not** silent-merge |
| #23 vs #27 Woman 2 | Docs on main vs finishing on draft | Runtime hashes: trust #27/#39 |
| Arcade on main | #42 MERGED | Keep **separate** from snowboard journey PRs |
| Superseded Woz early PRs | #1–#3 closed; #4–#5 historical | Ignore for journey readiness |

---

## F. Stack diagram (snowboard only)

```
main@4afd4300 (historical #12 base)          main@d53b0657 (live Pages)
        │                                           │
        ▼                                           ▼
      [#12] ────────────────────────────────   [#42 arcade MERGED]  ← OUT OF SCOPE
        │
      [#13]
        │
      [#17]─────┬──────────────┐
        │       │              │
      [#18]   [#24]          (#14/#16 parallel history)
        │       │
      [#19]──┐ [#26]
        │    │
      [#20] [#22]──[#25]   ← security sibling (not on #39)
        │
      [#21]
        │
      [#27] Woman 2 finishing
        │
      [#39] multi-rider  ← audit tip 7ee43f46…
```

---

## G. Five-tab + CrewLink on inspected tips

Verified present on #39 tip (inherits from #12+):

- Tabs: Home · Map · Music · Stats · Crew  
- CrewLink export sha pin: `7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe`  
- `gromFlowEnabled=false`
