# Spellcraft: Wizard of Product — CLAUDE.md

## What This Project Is

A wizarding school browser duel game where product managers duel real product experts (Lenny Rachitsky, Shreyas Doshi, Chip Huyen, etc.) by answering multiple-choice questions drawn from Lenny's Newsletter and Podcast archive. Players get sorted by archetype, clear three towers, and face Lenny in a final duel.

**One-line pitch:** Hogwarts for product people. Get sorted. Duel real product legends. Earn Spells. Build a Playbook. Face Lenny in the final duel.

---

## Scope Decisions (LOCKED — do not re-propose)

These decisions are final. Do not suggest building skipped screens or features.

### Screens NOT Building (locked — do not re-propose)
| Screen | Reason |
|--------|--------|
| Tower Overview | Too much friction before gameplay — increases dropout |
| Tower Chamber | Same — too many screens before the first question |

### All Screens — Current State
| Screen | Status | Notes |
|--------|--------|-------|
| Landing | Built — needs design polish | Open FEEDBACK.md item — background, font, tagline readability |
| Oracle's Rite | Done | |
| Archetype Reveal | Done | |
| Duel | Done | Tower roster left panel deferred |
| Spell Win | Done | |
| Tower Cleared | Done | |
| Lenny Loss | Done | Dedicated 3-heart final boss loss screen with retry |
| Game Over | Done | SP refill button as primary CTA |
| Playbook | Done — needs design polish | |
| Summons Letter | Done | |
| Final Revelation | Done — needs design sign-off | |
| Grand Wizard | Done | |
| Rank Up Ceremony | Done | Overlay (not a screen), 5s display, auto-dismisses |
| Lenny's Blessing | Done | Overlay, ~10% between duels, +500 SP, no heart cost |

### Game Mechanics Built (April 2026)
| Mechanic | Detail |
|---------|--------|
| Rank Up Ceremony | Overlay at z-index 100, 5s, rank-coloured rays. Apprentice=amber, Scholar=blue, Wizard=purple, Archmage=crimson |
| Lenny's Blessing | Overlay at z-index 99, 10% random after non-boss duel win. Fetches `lenny_oracle` from Supabase. Correct=+500 SP + nod. Wrong=no heart cost, fades 1.2s |
| Professor win/loss one-liners | Hardcoded in `PROFESSOR_WIN_LINES` and `PROFESSOR_LOSS_LINES` in page.tsx. Loss line shown on game over screen |
| Dedicated Lenny hearts | 3 separate hearts for final boss duel. HUD shows 3 during final boss. 0 = lenny_loss screen |
| SP refill on game over | Primary CTA on game over. Costs 500 SP, refills to 5 hearts, relaunches current duel. Greyed + "Earn X more SP" hint when insufficient |
| First heart lost hint | One-time toast on first heart lost: "Lose all 5 hearts? Spend 500 SP to refill and keep going." Fades after 4s, never repeats |

### Parked — Needs Setup First (come back to these)
- **Rate limiting on `/api/questions`** — needs Vercel CLI + Upstash Redis. Steps: `npm i -g vercel` → `vercel link` → `vercel integration add upstash` → `vercel env pull .env.local` → install `@upstash/ratelimit` → implement sliding window 60 req/min per IP in route.ts

### Deferred to v2 (do not build in v1)
- Archetype SP bonus (+50 SP in primary tower) — questions table has no archetype_tag
- Lenny's Blessing harder retry subset — no difficulty filter in API yet
- Tower roster progress panel in duel left panel
- localStorage persistence (game resets on page refresh)
- Midnight heart refill (PRD §6.2 "come back tomorrow")
- Cross-device sync / Supabase user accounts

### Other Locked Decisions
- **No Supabase leaderboard** — score submission not being built
- **No duel retry button** — the 500 SP refill mechanic IS the retry. Free retry would undercut it
- **Professor one-liners are hardcoded** — static copy, no reason to put in Supabase
- **Design Spec v3 calls for 14 screens — we are building ~12** (deliberate scope reduction)

---

## Tech Stack (LOCKED — decided March 27 2026)

**DO NOT continue building with Phaser.** The production app is a Next.js web app.

- **Framework:** Next.js (App Router)
- **UI:** React + CSS (all visual effects are CSS — animations, clip-path, gradients)
- **Database:** Supabase (player names, scores)
- **Deployment:** Vercel
- **Content:** Static JSON for all 19 professors, questions, spell names
- **AI:** Vercel AI SDK (post-v1, if adaptive questions added)

The `src/Scenes/` Phaser code is legacy and will be replaced. `prototype_v3.html` is the design source of truth — each screen becomes a Next.js page/component. CSS ports directly.

**Current prototype state:** Landing page (s-landing) is fully designed. All other screens (s-oracle, s-archetype, s-duel, s-spellwin, s-cleared, s-playbook, s-summons, s-final, s-grand) have scaffold/structure but are not yet fully fleshed out.

---

## Key Files

| File | Purpose |
|------|---------|
| `prototype_v3.html` | THE working design file — source of truth for all screens |
| `src/app/` | Next.js App Router (production target) |
| `src/data/professors.js` | Game content: towers, professors, questions, archetypes |
| `src/GameState.js` | Global game state singleton |
| `src/supabase.js` | Supabase client + DB queries |
| `assets/` | All game images (see asset rules below) |
| `FEEDBACK.md` | Live feedback log — check before starting work |
| `/Users/vdaga/Documents/Claude/Wizard_of_Product_PRD_Final_March26.docx` | Full PRD |
| `/Users/vdaga/Documents/Claude/Spellcraft_Design_Spec_v3.docx` | Full design spec |

---

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

---

## Screen Inventory (9 screens in prototype_v3.html)

| ID | Screen | Template |
|----|--------|---------|
| s-landing | Landing | A |
| s-oracle | Oracle's Rite | C |
| s-archetype | Archetype Reveal | C (dark ceremony) |
| s-duel | Duel Screen | C |
| s-spellwin | Spell Win | C |
| s-cleared | Tower Cleared | C — flow step only, not a nav destination |
| s-playbook | Playbook | Dark wood gradient |
| s-summons | Summons Letter | B |
| s-final | Final Revelation | C + intense gold |
| s-grand | Grand Wizard Completion | C + maximum gold |

**Still to build:** Grand Wizard Completion (s-grand)

**Removed:** Tower Overview and Tower Chamber screens (were in v3 spec, removed from prototype after design discussion — go directly from landing/playbook to duel).

---

## Visual Design Rules (NEVER break these)

1. **Background images ALWAYS at full brightness.** No CSS `filter`, `overlay`, `brightness()`, or opacity reduction on the image itself.
2. **Contrast comes from dark semi-transparent panels floating on top** — not from darkening the world.
3. **Panel style:** `background: linear-gradient(180deg, rgba(46,32,16,.97), rgba(26,16,8,.97))` · `border: 2px solid #7a5515`
4. **HUD style:** `background: rgba(42,30,14,.96)`

### Color tokens
| Token | Value |
|-------|-------|
| Gold | `#f0c060` |
| Amber | `#c8922a` |
| Panel bg | `rgba(46,32,16,.97)` |
| HUD bg | `rgba(42,30,14,.96)` |

### Fonts
| Font | Use |
|------|-----|
| Cinzel | All UI text |
| Cinzel Decorative | Titles and archetype names |
| EB Garamond | Body text |
| Pinyon Script | Summons Letter only |
| HarryP | Logo only (`assets/fonts/HarryP.woff`) |

---

## Screen Templates

### Template A — Landing Screen
- Background: `assets/Landing_Page_Background.png` — full brightness, edge vignette only
- Logo: "Spellcraft" in HarryP font, gold gradient, STATIC (no float)
- Professor grid LEFT: 2-col × 3-row portrait cards (placeholder: `assets/professor_placeholder.png`)
- Parchment scroll RIGHT: uses `assets/scroll_no_bg.png` image
- Name input + orb CTA BOTTOM CENTER: orb button = `assets/orb_button_transparent.png`
- Lenny card: gold border + FINAL DUEL badge

### Template B — Summons Letter
- Background: `assets/Summo_letter_background.jpg` — full brightness
- NEVER shown on first launch
- Two placements ONLY: (1) Easter egg tapping Lenny portrait, (2) cutscene before Final Revelation
- Lenny's title: **The Keeper of Product Lore**
- **Tone/wording marked for revision** — copy is locked for now, refine later

#### Easter egg letter (tap Lenny on landing — cryptic tease)
> You weren't supposed to find this.
>
> Most mages pass through Lorethorn without ever looking for me. You did.
>
> That's either curiosity or ambition. I haven't decided which yet.
>
> Finish what you started. Then we'll talk.
>
> — L.R.
> The Keeper of Product Lore

#### Pre-Final Revelation letter (automatic cutscene — formal summons)
> You've done it.
>
> Nineteen professors. Three towers. Every framework, every model, every hard question the Academy could throw at you.
>
> I've been watching. They all told me you were different.
>
> There is one duel left. Not a test of what you know — a test of what you believe.
>
> Come find me.
>
> — Lenny Rachitsky
> The Keeper of Product Lore

### Template C — All Game Screens
- Background: `assets/Game_Background.png` — full brightness, NO overlay on image
- Dark panels float on top for contrast
- HUD always visible: Hearts (left) · SP (center) · Rank badge (right)

---

## Background Image Mapping (locked)

| Screen | Background |
|--------|-----------|
| s-landing, s-archetype | `assets/Landing_Page_image.png` |
| s-oracle | Oracle sorting example image (oracle figure + atmosphere baked in; HTML adds interactive question card overlay only) |
| s-duel, s-spellwin, s-cleared, s-final, s-grand | `assets/Game_Background.png` |
| s-summons | `assets/Summo_letter_background.jpg` |
| s-playbook, grand wizard | Dark wood CSS gradient (no image) |

---

## Game Mechanics (PRD spec)

### Duel Structure
| Element | Detail |
|---------|--------|
| Questions per duel | 5 drawn randomly from professor's 18-question pool |
| Winning | Complete all 5 questions with ≥1 heart remaining globally |
| Losing | Run out of hearts before completing all 5 questions |
| Professor defeated | All 5 completed with hearts remaining → spell awarded |
| Retry | Immediate, questions reshuffled |
| SP earned | Per correct answer, even if duel lost — SP is never taken back |

### Scoring
- Basic question: 100 SP
- Advanced question: 200 SP
- ~~Archetype bonus: 50 SP (if question matches player's archetype)~~ — **deferred to v2** (questions table has no archetype_tag; domain-as-proxy would make bonus fire constantly, adding no meaningful differentiation)
- Lenny's Blessing (correct): +500 SP — **deferred to v2** (see below)

### Lenny's Blessing (v2 — not yet built)
Lenny appears as a rare **golden encounter** (~1 in 10 duels) between any two professor duels within a tower. He is not on the professor roster — this is a surprise cameo.
- One question only
- Correct answer: +500 SP (enough to jump a full rank)
- Wrong answer: **no heart cost** — the only exception in the game
- Triggering logic: after each professor duel completes, ~10% random chance fires before launching the next professor duel
- Needs its own screen/card distinct from normal duel UI
- Source: PRD §3 and §5.2

### Hearts
- 5 hearts globally per session
- Hearts deducted on wrong answer (not per-duel)
- 0 hearts = session over

### Archetypes (Oracle's Rite output)
| Archetype | Key | Primary Tower |
|-----------|-----|---------------|
| Visionary | V | PM |
| Mastermind | M | Strategy |
| Builder | B | AI |

### Ranks (by cumulative SP)
Muggle → Apprentice → Scholar → Wizard → Archmage → Grand Wizard

---

## Professor Roster

### PM Tower (7 professors, fixed order)
1. Gibson Biddle — DHM Keeper
2. Julie Zhuo — Enchantress of Design & Leadership
3. Teresa Torres — Oracle of Discovery
4. Shreyas Doshi — Master of Strategic Spells
5. Jules Walter — The Influence Enchanter
6. April Dunford — The Positioning Sage
7. **Marty Cagan** — Tower Boss

### Strategy Tower (5 professors, fixed order)
1. Chandra Janakiraman — Strategy Blocks Sage
2. Roger Martin — Wizard of Winning Choices
3. Christopher Lochhead — The Category Pirate
4. Marc Andreessen — The Venture Contrarian
5. **Hamilton Helmer** — Tower Boss

### AI Tower (7 professors, fixed order)
1. Tal Raviv — Wizard of Modern Product Tools
2. Aman Khan — The Eval Conjurer
3. Claire Vo — Conjurer of Agentic Arts
4. Nick Turley — Keeper of the Speaking Crystal
5. Hamel Husain — The Grand Evaluator
6. Chip Huyen — The Architect of AI Systems
7. **Dr. Fei-Fei Li** — Tower Boss

**Final Boss:** Lenny Rachitsky (unlocked after all 3 tower bosses defeated)

### Spell Names (all 19)
| Professor | Spell |
|-----------|-------|
| Gibson Biddle | DHM Principle |
| Julie Zhuo | The Design Mirror |
| Teresa Torres | Continuous Discovery |
| Shreyas Doshi | Upstream Thinking |
| Jules Walter | The Influence Pact |
| April Dunford | The Positioning Code |
| Marty Cagan | The Empowered Team |
| Chandra Janakiraman | The Strategy Block |
| Roger Martin | The Winning Wager |
| Christopher Lochhead | Category Design |
| Marc Andreessen | The Contrarian Lens |
| Hamilton Helmer | The 7 Powers |
| Tal Raviv | The Modern Toolkit |
| Aman Khan | The Eval Rite |
| Claire Vo | The Agentic Art |
| Nick Turley | The Trust Protocol |
| Hamel Husain | The Eval Stack |
| Chip Huyen | Systems Sight |
| Dr. Fei-Fei Li | The Intelligence Arc |

---

## Oracle's Rite — Ceremony Rules (locked)
- **One question per session** — one question is picked randomly from the pool of 5 at the start of each session
- The player picks one of three answers (A / B / C); that answer's archetype is the result directly — no tallying, no multi-step
- Archetypes: A = Visionary (V), B = Mastermind (M), C = Builder (B) — but the mapping is per-question, not fixed to letters
- Submit button label: "Reveal What the Oracle Has Decided" (single label — no "Next Question" state)

## Oracle's Rite Question Card (locked)
- CHAMFERED corners (clip-path octagon) — outer wrapper = amber border, inner card clips same shape
- Card background: warm dark brown `rgba(38,25,8,.97)` — NOT black
- Unselected coins: stone/grey `#706860 → #302820`, 46px
- Selected coins: bright gold `#f0d060 → #7a5a10` + outer glow
- Selected row: thin gold border `rgba(195,152,45,.65)` around full row

---

## Playbook Screen
- 3 columns by tower: PM (blue) | Strategy (orange) | AI (purple)
- 19 cards total (1 per professor), Lenny excluded
- Collected cards: diagonal green COLLECTED ribbon
- Locked cards: desaturated, 🔒 overlay, "Defeat [Professor] to unlock"
- Tower boss cards: red-tinted border
- SHARE YOUR PLAYBOOK button at bottom

---

## Final Revelation Screen
- NO HUD — pure cinematic
- Player (left): dark hooded wizard silhouette with orange fire glow
- Lenny (right): portrait in spinning gold-blue conic-gradient ring with blue aura
- Energy collision orb center with beam effects
- Floating product rune icons: 📋 ⚡ 🎯 (player side) / 📊 🧠 💡 (Lenny side)
- Quote: *"You've read the frameworks. Learned the models. Bested nineteen masters. Now I need to know what you actually believe."*
- CTA: `✦ BEGIN THE FINAL REVELATION ✦`
- Lenny's tone: Dumbledore — grand, earned, unlike any other screen

---

## Grand Wizard Completion (s-grand)
- NO Lenny portrait — this screen is about the player
- Achievement card (parchment): "Your Playbook" (→ "[Name]'s Playbook" when name input wired)
- Card: archetype sigil + name (NO "Your Archetype" label), 3 tower spell rows, stats bar
- Lenny's final quote (LOCKED): *"Most PMs read one framework and call it wisdom. You read nineteen. You didn't just learn the game — you earned the right to change it."*
- Share bar: SHARE YOUR JOURNEY (green) | DOWNLOAD YOUR PLAYBOOK (gold) | Return to the Academy (text link)

---

## Supabase Schema
- **questions table:** `professor` (key), question text, options, correct answer, difficulty, archetype tag
- **leaderboard table:** `player_name`, `character` (archetype), `score`, `domain_breakdown`

Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (in `.env`)

---

## Professor Photos
Drop headshot JPGs into `assets/professors/` named by professor key (e.g. `gibson_biddle.jpg`, `lenny_rachitsky.jpg`). Tell Claude "wire up professor photos" once files are in place.

---

## FEEDBACK.md Workflow
Before starting any fix pass, read `FEEDBACK.md`. It is the live bug/polish log. When the user says "address the feedback file", work through all open items in priority order and mark them done.
