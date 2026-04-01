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


---

## Done

<!-- Completed items move here -->

**Screen:** Landing
**Issue:** Background too dark, font boring, "Three towers. Nineteen professors. One Keeper." tagline unreadable (was missing entirely from JSX).
**Fix:** Added tagline div + CSS, reduced vignette opacity (0.35→0.22), bumped logo title 76→84px, switched banner to Cinzel font.
**Status:** done

**TODO — Professor Photos**
Drop headshot JPGs into `assets/professors/` named by professor key (e.g. `gibson_biddle.jpg`, `lenny_rachitsky.jpg`).
Illustrations/initials circles are placeholders in the duel screen and tower map until photos are added.
Tell Claude "wire up professor photos" once files are in place.
