# Spellcraft: Wizard of Product — CLAUDE.md

## What This Project Is

A wizarding school browser duel game where product managers duel real product experts (Lenny Rachitsky, Shreyas Doshi, Chip Huyen, etc.) by answering questions drawn from Lenny's Newsletter and Podcast archive. Players get sorted by archetype, clear three towers, and face Lenny in a final duel.

**One-line pitch:** Hogwarts for product people. Get sorted. Duel real product legends. Earn Spells. Build a Playbook. Face Lenny in the final duel.

---

## Prototype Fidelity Rule (MANDATORY)

`prototype_v3.html` at `/tmp/spellcraft_assets/attached_assets/prototype_v3.html` is the **source of truth** for every screen.

**Before touching any screen**, read the corresponding section of the prototype HTML + CSS and compare it element-by-element against the implementation. Do not guess or approximate — copy exact values for:
- Font family, size, weight, color, letter-spacing
- Position (top/bottom/left/right/transform), width, height
- Background colors and gradients
- Border, box-shadow, padding, gap
- Text content (copy must match prototype exactly)

**When making any UI change**, run through this checklist for every affected screen:
1. Read the prototype's CSS for every class used in that screen
2. Read the prototype's HTML structure for that screen
3. Diff against globals.css and page.tsx
4. Fix every mismatch — do not leave partial matches

Never ask the user to point out individual mismatches. It is Claude's responsibility to find them all by reading the prototype directly.

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
| Duel | Done | Tower switch tabs handle tower navigation |
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

### Game Mechanics Built
| Mechanic | Detail |
|---------|--------|
| 2-option duel format | Each question shows exactly 2 choices: correct answer + best distractor. Shuffled randomly each load. **Do not revert to 4 options.** |
| Best distractor | Claude-curated per question. Stored in `best_distractor` column in Supabase. One-time migration done (549 questions). |
| Open progression | Players choose any professor in any order within a tower. Mid-duel switching allowed (no spell if abandoned). |
| Tower boss unlock | Boss unlocks when ≥3 non-boss professors in that tower are defeated. Boss avatar shows 🔒 + "X to go" until unlocked. |
| Tower switching | Topbar has 3 clickable tower tabs (🏰 PM / ⚔️ Strategy / 🤖 AI) that update the right panel. Does NOT auto-start a duel. |
| Professor selection UI | Right panel tower avatars are clickable. Click any unlocked professor to start that duel. |
| Duel selecting state | After a spell win (or blessing), screen returns to duelPhase='selecting'. Center shows "Choose Your Opponent". Player picks from right panel. |
| Lenny unlock | All 3 tower bosses defeated → pre-final Summons Letter → Final Revelation. Unchanged. |
| Rank Up Ceremony | Overlay at z-index 100, 5s, rank-coloured rays. Apprentice=amber, Scholar=blue, Wizard=purple, Archmage=crimson |
| Lenny's Blessing | Overlay at z-index 99, 10% random after non-boss duel win. Fetches `lenny_oracle` from Supabase. Correct=+500 SP + nod. Wrong=no heart cost, fades 1.2s |
| Professor win/loss one-liners | Hardcoded in `PROFESSOR_WIN_LINES` and `PROFESSOR_LOSS_LINES` in page.tsx. Loss line shown on game over screen |
| Dedicated Lenny hearts | 3 separate hearts for final boss duel. HUD shows 3 during final boss. 0 = lenny_loss screen |
| SP refill on game over | Primary CTA on game over. Costs 500 SP, refills to 5 hearts, relaunches same professor. Greyed + "Earn X more SP" hint when insufficient |
| First heart lost hint | One-time toast on first heart lost: "Lose all 5 hearts? Spend 500 SP to refill and keep going." Fades after 4s, never repeats |

### Parked — Needs Setup First (come back to these)
- **Rate limiting on `/api/questions`** — needs: `vercel integration add upstash` → `vercel env pull .env.local` → install `@upstash/ratelimit` → implement sliding window 60 req/min per IP in route.ts

### Deferred to v2 (do not build in v1)
- Archetype SP bonus (+50 SP in primary tower) — questions table has no archetype_tag
- Lenny's Blessing harder retry subset — no difficulty filter in API yet
- localStorage persistence (game resets on page refresh)
- Midnight heart refill (PRD §6.2 "come back tomorrow")
- Cross-device sync / Supabase user accounts
- **Post-duel review summary** — after duel ends (win or lose), show a summary of all 5 questions with correct/wrong indicators. Tapping a wrong answer reveals the `explanation` field from Supabase. Framed as "the professor debriefs you after the battle." `explanation` column already exists in the questions table.
- **Question writing quality pass** — fix in a single Claude migration script across all 549 questions: (1) Replace em dash overuse (`X — Y` constructions) with varied punctuation. (2) Vary answer option lengths — correct answer is currently always the longest/most hedged option, letting players pattern-match without reading. Mix in short direct correct answers and long plausible wrong answers to force genuine engagement. (3) Break the uniform scenario structure — not every question should be `"You're [role] and [situation]. What do you do?"`. (4) Remove repeated AI-favoured phrases: "connective tissue", "table stakes", "upstream thinking", "first principles" used too frequently. (5) Remove hedging qualifiers ("likely", "often", "typically") that signal which option is correct before the player has thought about it.

### Other Locked Decisions
- **No Supabase leaderboard** — score submission not being built
- **No duel retry button** — the 500 SP refill mechanic IS the retry. Free retry would undercut it
- **Professor one-liners are hardcoded** — static copy, no reason to put in Supabase
- **2 options per question (not 4)** — feels like a duel, not a quiz. Best distractor is Claude-curated. Do not change back.
- **Open progression is the model** — sequential tower/professor auto-advance is removed. State uses `activeTowerKey` + `activeProfKey` + `duelPhase`. Do not revert to towerIndex/profIndex.
- **Design Spec v3 calls for 14 screens — we are building ~12** (deliberate scope reduction)

---

## Tech Stack (LOCKED — decided March 27 2026)

- **Framework:** Next.js 16 (App Router)
- **UI:** React + CSS (all visual effects are CSS — animations, clip-path, gradients)
- **Database:** Supabase (questions, best_distractor)
- **Deployment:** Vercel (`wizard-of-product.vercel.app`)
- **Content:** Static JS for all 19 professors, spell names, archetypes (`src/data/professors.js`)
- **AI:** Anthropic SDK used for one-time Supabase migrations (scripts only, not at runtime)

**Phaser is fully removed.** All legacy `src/Scenes/`, `src/Config/`, `index.html`, `webpack.config.js` deleted. Do not reference or rebuild Phaser.

`prototype_v3.html` is the design source of truth — each screen is a Next.js component. CSS ports directly.

---

## Key Files

| File | Purpose |
|------|---------|
| `prototype_v3.html` | THE working design file — source of truth for all screens |
| `src/app/page.tsx` | ALL screens, ALL game logic, ALL PostHog events |
| `src/app/globals.css` | ALL CSS |
| `src/app/layout.tsx` | Fonts, OG metadata, PostHog provider |
| `src/app/api/questions/route.ts` | Supabase fetch (professor key → 5 shuffled questions with best_distractor) |
| `src/data/professors.js` | Game content: towers, professors, archetypes, spell names, win/loss lines |
| `scripts/` | One-time migration scripts (generate questions, add best_distractor, etc.) |
| `public/assets/` | All game images — `professors/` subdir for portraits |
| `FEEDBACK.md` | Live bug/polish log — check before starting work |
| `/Users/vdaga/Documents/Claude/Wizard_of_Product_PRD_Final_March26.docx` | Full PRD |
| `/Users/vdaga/Documents/Claude/Spellcraft_Design_Spec_v3.docx` | Full design spec |

---

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
vercel --prod    # Deploy to production
```

---

## Screen Inventory

| ID | Screen | Status |
|----|--------|--------|
| s-landing | Landing | Done — new grand hall BG, assets updated April 2026 |
| s-oracle | Oracle's Rite | Done — Codex Oracle illustrated face, updated title/eyebrow/submit |
| s-archetype | Archetype Reveal | Done — parchment scroll with fire/energy effects |
| s-duel | Duel Screen | Done |
| s-spellwin | Spell Win | Done — redesigned April 2026: Lorethorn header, professor portrait, green-glow spell scroll |
| s-cleared | Tower Cleared | Done |
| s-playbook | Playbook | Done — open book background |
| s-summons | Summons Letter | Done |
| s-final | Final Revelation | Done — design sign-off pending |
| s-grand | Grand Wizard Completion | Done — open book background (matches Playbook) |
| — | Lenny Loss | Done (overlay flow) |
| — | Game Over | Done |
| — | Rank Up Ceremony | Done (overlay) |
| — | Lenny's Blessing | Done (overlay) |

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
| HarryP | Logo + Lorethorn header in Spell Win (`public/assets/fonts/HarryP.woff`) |
| Lumos | Available (`public/assets/fonts/Lumos.woff`) — not yet used |

---

## Screen Templates

### Template A — Landing Screen
- Background: `public/assets/Landing_Page_Background.png` — full brightness, edge vignette only
- Logo: "Spellcraft" in HarryP font, gold gradient, STATIC (no float)
- Professor grid LEFT: 2-col × 3-row portrait cards (placeholder: `public/assets/professor_placeholder.png`)
- Parchment scroll RIGHT: uses `public/assets/scroll_no_bg.png` image
- Name input + orb CTA BOTTOM CENTER: orb button = `public/assets/orb_button_transparent.png`
- Lenny card: gold border + FINAL DUEL badge

### Template B — Summons Letter
- Background: `public/assets/Summo_letter_background.jpg` — full brightness
- NEVER shown on first launch
- Two placements ONLY: (1) Easter egg tapping Lenny portrait, (2) cutscene before Final Revelation
- Lenny's title: **The Keeper of Product Lore**

### Template C — All Game Screens
- Background: `public/assets/Game_Background.png` — full brightness, NO overlay on image
- Dark panels float on top for contrast
- HUD always visible: Hearts (left) · SP (center) · Rank badge (right)

---

## Background Image Mapping (locked)

| Screen | Background |
|--------|-----------|
| s-landing | `public/assets/Landing_Page_Background.png` (grand hall with orb pedestal) |
| s-archetype | `public/assets/Archetype_BG.png` + parchment scroll (`parchment_scroll.png`) |
| s-oracle | `public/assets/Archetype_BG.png` + Codex Oracle illustrated face (`codex_oracle.png`) |
| s-duel, s-spellwin, s-cleared, s-final | `public/assets/Game_Background.png` |
| s-summons | `public/assets/Summo_letter_background.jpg` |
| s-playbook, s-grand | `public/assets/playbook_bg.png` (open parchment book, night sky) + `rgba(8,5,2,.35)` overlay |

---

## Game Mechanics (implemented)

### Duel Structure
| Element | Detail |
|---------|--------|
| Questions per duel | 5 drawn randomly from professor's pool (27 per professor, 36 for Gibson Biddle) |
| Answer format | **2 options only** — correct answer + best_distractor, randomly shuffled |
| Winning | Complete all 5 questions with ≥1 heart remaining globally |
| Losing | Run out of hearts before completing all 5 questions |
| Professor defeated | All 5 completed with hearts remaining → spell awarded |
| SP earned | Per correct answer, even if duel lost — SP is never taken back |

### Scoring
- Basic question: 100 SP
- Advanced question: 200 SP
- ~~Archetype bonus: 50 SP~~ — deferred to v2
- Lenny's Blessing (correct): +500 SP

### Hearts
- 5 hearts globally per session (normal duels)
- 3 hearts for Lenny final boss (separate counter)
- Hearts deducted on wrong answer (not per-duel)
- 0 hearts = Game Over (normal) or Lenny Loss screen (final boss)

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
7. **Marty Cagan** — Tower Boss (The Ancient Sage)

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
- **Oracle's Rite keeps 3 options** — archetype sorting requires 3 distinct choices. The 2-option change applies to duels only.

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
- **questions table:** `id`, `professor` (key), `question`, `options` (array of 4), `correct_answer` (letter A-D), `explanation`, `difficulty` (basic/advanced), `best_distractor` (full text of best wrong option — Claude-curated, one-time migration done)
- **leaderboard table:** exists in DB but NOT being used — no score submission in v1

Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

---

## Professor Photos
Drop headshot JPGs into `public/assets/professors/` named by professor key (e.g. `gibson_biddle.jpg`).
Midjourney prompts: `/Users/vdaga/Documents/Personal OS/Knowledge/Prompts/spellcraft-midjourney-prompts.md`
Tell Claude "wire up professor photos" once files are in place.

---

## Deployment
- **Live URL:** https://wizard-of-product.vercel.app/
- **Branch:** `development` → auto-deploys to production via `vercel --prod`
- **Env vars set on Vercel:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- **vercel.json** sets `framework: nextjs` and `outputDirectory: .next` (required — old project had wrong defaults)

---

## FEEDBACK.md Workflow
Before starting any fix pass, read `FEEDBACK.md`. It is the live bug/polish log. When the user says "address the feedback file", work through all open items in priority order and mark them done.
