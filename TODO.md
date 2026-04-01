# Spellcraft — Backlog

Non-urgent polish and v2 items. Tell Claude "work through the TODO" when ready.

---

## Waiting on User

- [ ] **Professor portraits** — Generate in Midjourney using prompts at `/Users/vdaga/Documents/Personal OS/Knowledge/Prompts/spellcraft-midjourney-prompts.md`. Drop JPGs into `public/assets/professors/` named by professor key. Say "wire up professor photos" when done.
- [ ] **Landing screen design polish** — Background too dark, font boring, tagline unreadable. (FEEDBACK.md open item)
- [ ] **Playbook design polish** — Needs design pass against prototype_v3.html
- [ ] **Final Revelation design sign-off** — Built, needs visual approval
- [ ] **Custom domain** — Considering spellcraft.gg. Buy on Namecheap/Porkbun, add in Vercel dashboard.

---

## Easter Eggs

- [ ] **Lenny portrait easter egg** — Clicking Lenny's card on the landing page should trigger the Summons Letter screen. Tap anywhere to dismiss and return to landing. Per CLAUDE.md: one of only two placements for the summons letter (the other is the cutscene before Final Revelation).

---

## Parked (needs setup first)

- [ ] **Rate limiting on `/api/questions`** — Needs: `vercel integration add upstash` → `vercel env pull .env.local` → install `@upstash/ratelimit` → 60 req/min sliding window per IP in route.ts

---

## v2 (do not build in v1)

- [ ] Archetype SP bonus (+50 SP in primary tower)
- [ ] Tower roster progress panel in duel left panel
- [ ] localStorage persistence (game resets on page refresh)
- [ ] Midnight heart refill ("come back tomorrow")
- [ ] Cross-device sync / Supabase user accounts
- [ ] Lenny's Blessing harder retry subset

---

## Done ✓

- [x] All 12 screens built (Landing, Oracle's Rite, Archetype Reveal, Duel, Spell Win, Tower Cleared, Lenny Loss, Game Over, Playbook, Summons Letter, Final Revelation, Grand Wizard)
- [x] Rank Up Ceremony overlay
- [x] Lenny's Blessing overlay (10% random, +500 SP, no heart cost)
- [x] 2-option duel format — correct answer + Claude-curated best_distractor
- [x] best_distractor column — all 549 questions populated via one-time migration
- [x] Professor win/loss one-liners hardcoded
- [x] Dedicated 3 Lenny hearts + Lenny Loss screen
- [x] SP refill on game over (500 SP, primary CTA)
- [x] First heart lost hint toast
- [x] Supabase questions wired (549 questions, 20 professor keys)
- [x] Fisher-Yates shuffle in API route
- [x] Supabase error UX (error message shown, not silent loading)
- [x] PostHog analytics + crash guard
- [x] .env.example committed
- [x] Phaser code fully removed
- [x] vercel.json — framework + outputDirectory fixed
- [x] Deployed to Vercel (wizard-of-product.vercel.app)
- [x] All env vars set on Vercel production
- [x] Oracle sorting questions (5 hardcoded, one picked randomly per session)
- [x] Player name wired (displayName with archetype fallback)
