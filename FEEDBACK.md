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

**TODO — Sound Design**
Downloaded sample tracks are at `~/Desktop/spellcraft-sounds/`:
- `ambient/` — 4 fantasy/contemplative tracks (MP3)
- `sfx/` — spell_cast_1-7.ogg + magic SFX pack (fire, healing, ice, wind WAVs)

Action: Listen to samples and decide which tracks to use for:
- Landing page ambient loop
- Oracle's Rite ceremony
- Archetype Reveal
- Duel screen ambient loop
- Correct answer SFX
- Wrong answer SFX
- Spell win SFX

Once tracks are chosen, tell Claude "wire up sounds" and implementation will follow (audio manager + mute button in HUD).
**Priority:** medium
**Status:** open

---

## Done

<!-- Completed items move here -->

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
