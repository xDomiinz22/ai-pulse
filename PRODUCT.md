# Product

## Register

brand

## Users

Portfolio project / personal showcase. The primary audience is anyone who discovers it — developers, AI enthusiasts, potential employers or collaborators reviewing the creator's work. Secondary: anyone who actually uses it to follow AI news. The interface should feel impressive and intentional, not like a tutorial or a boilerplate.

## Product Purpose

AI Pulse is an automated AI news aggregator that scrapes, filters, and summarizes the latest AI news using Gemini, then presents it through a polished editorial frontend. It exists to demonstrate full-stack craft: real backend (Express, Prisma, pgvector, Redis), a semantic chat agent, an MCP server, and a frontend with editorial identity. Success looks like someone who opens it and thinks "this person knows what they're doing."

## Brand Personality

Curious · Intelligent · Editorial

Voice: confident without being loud, informed without being dry. The interface has an opinion — it's not a utility, it's a publication. Tone sits closer to The New Yorker's tech coverage or a sharp independent newsletter than to a corporate news aggregator.

## Anti-references

- **TechCrunch / The Verge** — generic tech-news design, corporate feel, no strong identity
- **Morning Brew / SaaS newsletters** — the warm-beige AI newsletter cliché; exactly what to avoid (our palette already sits in this zone; future changes should push away from it, not deeper in)
- **HackerNews** — bare-bones, zero visual craft, pure function
- **Feedly / Flipboard-type aggregators** — uniform card grids, no editorial hierarchy, content as commodity

## Design Principles

1. **Editorial voice over utility chrome** — every design decision should reinforce that this is a publication with a point of view, not a data dashboard. Typography and hierarchy are the primary design tools.
2. **Typographic authority** — the type does the heavy lifting. Fraunces for authority and voice, Newsreader for readable depth, IBM Plex Mono for the machine/wire layer. Don't flatten these into decoration.
3. **Sparing is powerful** — the spot color (printing red) earns its impact by being rare. Same with motion: use it once or twice to say something, not everywhere to fill silence.
4. **Craft as the argument** — this is a portfolio piece; invisible craft is wasted. Details matter (contrast, spacing rhythm, micro-interactions) because the audience is evaluating the maker, not just consuming news.
5. **The NYT rule** — if The New York Times's digital masthead would be embarrassed by a choice, reconsider it. Clear hierarchy, purposeful whitespace, no decorative noise.

## Accessibility & Inclusion

WCAG AA minimum. Body text must meet 4.5:1 on --paper background (current #211b16 on #e9e1d0 passes comfortably). Reduced motion: all GSAP animations must have a `prefers-reduced-motion` alternative. No reliance on color alone to convey meaning.
