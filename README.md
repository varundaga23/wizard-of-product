# Spellcraft: Wizard of Product

Hogwarts for product people. Get sorted by archetype. Duel real product legends. Earn Spells. Build a Playbook. Face Lenny Rachitsky in the final duel.

**Live:** https://wizard-of-product.vercel.app/

---

## What It Is

A browser-based duel game where product managers answer questions drawn from Lenny's Newsletter and Podcast archive, competing against 19 real product experts across 3 towers.

- **Oracle's Rite** — Answer one question to reveal your archetype (Visionary / Mastermind / Builder)
- **Three Towers** — PM Tower (7 professors) · Strategy Tower (5) · AI Tower (7)
- **Duel format** — 5 questions per duel, 2 options each (correct answer + curated distractor)
- **Final Boss** — Defeat all 3 tower bosses to unlock Lenny Rachitsky

---

## Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (549 questions across 20 professors)
- **Deployment:** Vercel
- **Analytics:** PostHog

---

## Setup

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST

# Run dev server
npm run dev
```

---

## Commands

```bash
npm run dev      # localhost:3000
npm run build    # Production build
vercel --prod    # Deploy to production
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | All screens + game logic |
| `src/app/globals.css` | All CSS |
| `src/app/api/questions/route.ts` | Question API (Supabase) |
| `src/data/professors.js` | Professor roster, spell names, archetypes |
| `prototype_v3.html` | Design source of truth |
| `CLAUDE.md` | Full project spec + decisions |
| `TODO.md` | Backlog |
| `FEEDBACK.md` | Live bug/polish log |
