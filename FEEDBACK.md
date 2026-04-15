# Spellcraft: Feedback Log

Add raw notes as you play. Tell Claude "address the feedback file" when ready for a fix pass.

---

## Format

**Screen:** what you're looking at
**Issue:** what's wrong or feels off
**Priority:** high / medium / low
**Status:** open / in progress / done

---

## Open

**TODO — PostHog dashboard setup**
**Screen:** PostHog
**Issue:** No dashboard configured yet. Need to set up "Spellcraft Daily" dashboard with 6 insights: (1) Players today - pageview trend, (2) Funnel: pageview → game_started → duel_started → spell_won, (3) Most popular professors - duel_started by professor, (4) Game over rate - game_over vs spell_won, (5) How far players get - spell_won by is_boss, (6) Grand Wizard completions count. Then subscribe to daily email digest.
**Priority:** medium
**Status:** open

---

**TODO — SEO: Domain + canonical URL**
**Screen:** layout.tsx metadata
**Issue:** `og:url` currently placeholder `https://spellcraft.game`. Once domain decided, update: `openGraph.url`, `openGraph.siteName`, `alternates.canonical` in layout.tsx.
**Priority:** medium — do after domain is finalised
**Status:** open

---

**TODO — SEO: OG image**
**Screen:** layout.tsx / public/
**Issue:** `/og-image.png` does not exist. Social shares (Twitter, LinkedIn, iMessage) will show no preview image. Need a 1200×630px image placed at `public/og-image.png`.
**Priority:** medium
**Status:** open

---

**TODO — Image loading performance**
**Screen:** Landing (professor grid), Select Professors modal, Playbook
**Issue:** All professor images (19 professors × card + duel = 38+ files) load slowly on first visit. No preloading, no lazy loading strategy, mix of PNG/JPG formats — most not AVIF optimised. Most impactful fix: convert all card images to AVIF (Gibson Biddle already done — 98% reduction). Secondary: JS preload after initial render.
**Priority:** high — affects first impression
**Status:** open — discuss approach before implementing

## Done

<!-- Completed items move here -->

**TODO — Sound Design**
**Fix:** Kevin MacLeod tracks downloaded and wired. ambient_landing (enchanted_valley), ambient_oracle/archetype (wizardtorium), ambient_duel (ghost_story), ambient_spellwin (movement_proposition). SFX: correct.ogg, wrong.ogg, spell_win.wav. Music loops per screen, no mute button in HUD.
**Status:** done

---

**TODO — SP & Rank System**
**Fix:** SP and rank system killed entirely for v1. No SP earning, no rank display. HUD now shows archetype name (Visionary/Mastermind/Builder) + tower name on player side. Deferred to v2.
**Status:** done

---

**TODO — How to Play modal**
**Fix:** "Rules of the Academy" modal built. ℹ button fixed below HUD bar (top-right). Auto-opens on first duel screen visit per session. Summons letter parchment background, Lorethron crest, 6 sections, Lenny's signature in Pinyon Script gold. Content: Hearts, Duels, Winning a Duel, Towers, Lenny (+3 hearts), Grand Wizard.
**Status:** done

**Screen:** Landing
**Issue:** Background too dark, font boring, "Three towers. Nineteen professors. One Keeper." tagline unreadable (was missing entirely from JSX).
**Fix:** Added tagline div + CSS, reduced vignette opacity (0.35→0.22), bumped logo title 76→84px, switched banner to Cinzel font.
**Status:** done

**Screen:** All screens
**Issue:** Design polish pass — new assets and redesigned screens.
**Fix:** Swapped in new asset pack (April 2026):
- Landing: new grand hall background with orb pedestal
- Oracle: illustrated Codex Oracle face, title/eyebrow/submit text updated
- Archetype Reveal: parchment scroll with fire/energy effects
- Spell Win: full redesign — Lorethorn header bar, professor portrait (left), playbook progress badge (top right), green-glow spell scroll, SP pill + green continue button
- Playbook: open parchment book background
- Grand Wizard: same open parchment book background (matches Playbook)
- Lorethron crest updated to transparent version
- Lumos font added to assets (not yet wired to any screen)
**Status:** done

**TODO — Professor Photos**
Drop headshot JPGs into `assets/professors/` named by professor key (e.g. `gibson_biddle.jpg`, `lenny_rachitsky.jpg`).
Illustrations/initials circles are placeholders in the duel screen and tower map until photos are added.
Tell Claude "wire up professor photos" once files are in place.
