# Spellcraft — Backlog

Non-urgent polish items. Tell Claude "work through the TODO" when ready.

---

## Easter Eggs

- [ ] **Lenny portrait easter egg** — Clicking Lenny's card on the landing page should trigger the Summons Letter screen (s-summons). Tap/click anywhere on the summons letter to dismiss and return to landing. Per CLAUDE.md: this is one of only two placements for the summons letter (the other is the cutscene before Final Revelation). Never shown on first launch automatically.

## Game Mechanics (v2)

- [ ] **Lenny's Blessing** — Rare golden encounter (~1 in 10 duels) that can appear between any two professor duels within a tower. One question, +500 SP on correct answer, **no heart cost on wrong answer** (the only exception in the game). Lenny is not on the professor roster — this is a surprise cameo, not a scheduled duel. Triggering logic: after each professor duel completes, ~10% random chance fires before launching the next professor. Needs its own screen/card distinct from the normal duel UI. See PRD §3 and §5.2.

---

## Duel Screen

- [ ] **Tower roster on duel left panel** — Show which professors are in the current tower and where the player is. Current thinking: compact vertical list below the portrait (✓ defeated · ▶ current · · upcoming · 👑 boss). Design TBD — user will bring examples before we build. Needs to work for up to 7 professors (PM Tower).

---

## Design Review

- [ ] **Full design pass — all screens** — Revisit every screen side-by-side against `prototype_v3.html` and finalize CSS. Screens to review: S1 Landing, S2 Oracle's Rite, S3 Archetype Reveal, S4 Duel, S5 Spell Win, S6 Tower Cleared, S7 Playbook, S8 Summons Letter, S9 Final Revelation, S10 Grand Wizard Completion.

---

## Polish

- [ ] **Logo glow** — "Spellcraft" and "Wizard of Product" glow doesn't exactly match prototype_v3.html. Glow was strengthened March 28 but needs side-by-side comparison to confirm. CSS is in `src/app/globals.css` → `.landing-logo-title` and `.landing-logo-sub`.

---

## Content

- [ ] **Professor portraits** — Need a decision on source before implementing. Options: (a) AI-generated wizarding-style portraits — recommended, consistent art style, no rights issues; (b) real headshots from LinkedIn/press kits — rights grey area for a game; (c) reach out to professors directly for permission. When ready: Claude will write Midjourney prompts for all 19 (style + `--ar 2:3` framing). Tool: Midjourney (or similar). Code will use `object-fit: cover` + `object-position: top center` to fit any slight crop variation. Drop final JPGs into `assets/professors/` named by key (e.g. `teresa_torres.jpg`) and tell Claude "wire up professor photos".
  - **Lenny special portrait** — Lenny gets a second portrait in full Dumbledore style (grand, wise, long robes, the final boss energy) — used on the Final Revelation screen. Separate from his standard professor card portrait.

- [x] **Oracle sorting questions** — 5 questions hardcoded in page.tsx (from PRD), one picked randomly per session. Correct as designed — Oracle questions are archetype-sorting (3 options → V/M/B), not duel questions, so Supabase is not needed here.

---

## Deployment

- [ ] **Vercel environment variables** — Before deploying, add these in the Vercel project dashboard under Settings → Environment Variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`

---

## Integration

- [x] **Wire player name** — `displayName` derived from entered name or archetype fallback (V → "The Dreamer", M → "The Tactician", B → "The Maker"). Used in Playbook title, Grand Wizard subtitle, and all share messages.

- [ ] **GameState integration** — `src/GameState.js` exists but not used. Hearts (5), SP, defeated professors, collected spells all need to persist across screens.

- [x] **Supabase questions** — `/api/questions` route fetches real per-professor questions. 549 questions across 19 professors.

---

## Screens Still To Build

- [x] S4 — Duel Screen (built + wired to Supabase)
- [x] S5 — Spell Win (built)
- [x] S6 — Tower Cleared (flow step, built)
- [ ] S7 — Playbook
- [ ] S8 — Summons Letter
- [ ] S9 — Final Revelation (logic + prototype CSS built — **awaiting your design before finalising**)
- [ ] S10 — Grand Wizard Completion
