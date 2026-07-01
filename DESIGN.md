---
name: AI Pulse
description: An automated AI news aggregator with an editorial wire-service identity.
colors:
  spot: "#a23b2b"
  ink: "#211b16"
  ink-soft: "#6b6155"
  ink-mute: "#948a79"
  paper: "#e9e1d0"
  clip: "#f3eddf"
  clip-hover: "#efe7d4"
  rule: "#ccc1ab"
  rule-strong: "#b6a98f"
typography:
  display:
    fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(34px, 5.5vw, 60px)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "'Newsreader', Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "56px"
components:
  terminal-zone:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
  terminal-cursor:
    color: "{colors.spot}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.paper}"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  input-field-focus:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.clip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  card-hover:
    backgroundColor: "{colors.clip-hover}"
    textColor: "{colors.ink}"
  ticker-badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "0 12px"
---

# Design System: AI Pulse

## 1. Overview

**Creative North Star: "The Wire Room"**

AI Pulse is designed as a teletype room from the 1950s — machines printing AI news without pause, fresh ink, quiet urgency. The interface does not decorate; it transmits. Every visual decision refers back to the physical act of journalism: newsprint grain on the body, hairline rules separating columns, a masthead with the authority of a broadsheet. The typographic hierarchy is the hierarchy — not color, not cards, not icons.

The system rejects the current AI-editorial cliché: warm-beige newsletters with rounded cards, gradient headings, and a SaaS softness that mistakes approachability for credibility. It also refuses the opposite trap — bare-bones, unstyled HackerNews austerity. The wire room is disciplined, not bare; crafted, not decorated.

This is a portfolio piece. The craft is the argument. Invisible polish — contrast, rhythm, motion — is wasted; make the detail legible.

**Key Characteristics:**
- Typographic hierarchy does all the structural work; color is reserved for punctuation
- Three voices: display serif (Fraunces) for authority, body serif (Newsreader) for depth, monospace (IBM Plex Mono) for the machine layer
- One spot color (printing red `#a23b2b`) used as a live indicator, a focus state, and nothing else
- Motion is editorial: headlines settle into place, cards arrive as the reader scrolls, never as a choreographed show
- The newsprint grain texture prevents the paper palette from reading as AI-generated cream
- Three isolated **terminal accent zones** (the Ticker, the Chat Widget, the Trending rubric header) surface the machine underneath the newsprint — a console reading out the wire feed live — without ever letting that register bleed into the page's paper/ink base

## 2. Colors: The Ink & Newsprint Palette

Two layers — ink on newsprint — with a single spot color that earns its place by being rare.

### Primary
- **Printing Red** (`#a23b2b`): The spot color. Oxidized, not bright. Used exclusively for: the live-indicator dot, active focus rings, interactive hover states, and the italic flourish in the hero headline. Never used for backgrounds or large fills. Its scarcity is its power.

### Neutral
- **Press Ink** (`#211b16`): Primary text, the masthead, the primary button background, the Ticker badge. Warm near-black — cooler than brown, warmer than charcoal. Never pure `#000`.
- **Faded Ink** (`#6b6155`): Secondary text — datelines, bylines, body copy on hover states, the `.wire` label color. Reads as "ink that has aged on the page."
- **Ghost Ink** (`#948a79`): Tertiary — placeholders, muted metadata, captions. The most recessive voice.
- **Newsprint** (`#e9e1d0`): Page background. Warm grey-beige — not cream, not sand. The grain overlay (`body::before`, `opacity: 0.05`, `mix-blend-mode: multiply`) prevents it from reading as a flat AI background fill.
- **Clipping** (`#f3eddf`): Card / article surfaces. One step lighter than newsprint. The visual metaphor: a newspaper clipping lifted off the page.
- **Clipping Hover** (`#efe7d4`): Card hover state. Barely perceptible — a shadow lifting without a shadow.
- **Column Rule** (`#ccc1ab`): Hairline borders, column separators. The rule between sections.
- **Heavy Rule** (`#b6a98f`): Stronger borders — input fields at rest, the folio line. Still a rule, not a frame.

### Named Rules
**The One Spot Rule.** The printing red (`#a23b2b`) appears on ≤5% of any given screen. It marks liveness, focus, and action. If it appears on more than one or two elements per viewport, it has ceased to be a spot and become wallpaper. Remove it from backgrounds, headings, and decorative elements without exception.

**The Warm-Neutral Warning.** The paper palette sits in the OKLCH range that reads as "AI-generated cream" in 2026 (L 0.84–0.97, C < 0.06, hue 40–100). The grain texture and the strict typographic hierarchy are what prevent this reading. Do not soften the grain, do not reduce the ink contrast, and do not add rounded corners or pastel accents — those three moves together collapse the palette into the cliché.

## 3. Typography: Three Voices

**Display Font:** Fraunces (with Georgia, 'Times New Roman', serif fallback)
**Body Font:** Newsreader (with Georgia, serif fallback)
**Wire/Label Font:** IBM Plex Mono (with ui-monospace, 'SFMono-Regular', monospace fallback)

**Character:** Fraunces brings optical-weight drama to headlines — it has personality without being decorative. Newsreader is a proper text face: comfortable at 15–18px, it makes articles readable rather than impressive. IBM Plex Mono is the machine voice — datelines, sources, categories — the voice of the wire service itself. The three fonts are on a contrast axis (opinionated display serif / neutral reading serif / geometric monospace) that never feels like they chose each other by accident.

### Hierarchy
- **Display** (Black/900, `clamp(34px, 5.5vw, 60px)`, line-height 0.98, tracking -0.02em): Hero headline only. Fraunces at maximum weight. `text-wrap: balance` required to prevent uneven breaks. One per page.
- **Masthead** (Black/900, `clamp(44px, 9vw, 92px)`, line-height 0.9, tracking -0.015em): The "AI Pulse" nameplate. Larger than display because it is the publication, not a heading. One per page.
- **Headline** (SemiBold/600, 20px, line-height 1.2): Article card headlines. Fraunces. Clickable; hover to `--spot`.
- **Body** (Regular/400, 15–18px, line-height 1.6–1.65): Article summaries and hero lede. Newsreader. Max line length: 65–75ch enforced by container max-width.
- **Wire Label** (Regular/400, 11px, uppercase, 0.08em tracking): IBM Plex Mono. Datelines, sources, category kickers, section counts, all metadata. Never used for body copy or headlines.

### Named Rules
**The Three-Voice Rule.** Fraunces for authority, Newsreader for depth, IBM Plex Mono for the machine layer. Do not introduce a fourth family. Do not use Fraunces at body sizes or Newsreader for labels — each font has one register and it must not bleed into another.

**The Masthead Exception.** The nameplate (`clamp(44px, 9vw, 92px)`) is the only element permitted above the display ceiling. It is not a heading; it is a logotype in type. Nothing else on the page approaches this scale.

## 4. Elevation

AI Pulse is **flat by default**. Cards have no shadows at rest. The visual hierarchy is established entirely by tonal layering (newsprint → clipping → ink) and by rule lines (hairline borders), not by depth simulation.

Shadows appear only in two exceptional contexts:

### Shadow Vocabulary
- **Tooltip** (`0 6px 20px rgba(33, 27, 22, 0.25)`): The Tippy tooltip uses a warm shadow tinted toward press ink. Soft diffuse ambient — the tooltip floats but does not shout.
- **Chat FAB** (`0 8px 24px rgba(33, 27, 22, 0.4)`): The chat widget's floating action button uses a stronger version of the same warm shadow. It needs to read above the page.
- **Focus Ring** (`0 0 0 3px rgba(162, 59, 43, 0.12)`): Input focus state. Not a shadow — a glow in the spot color at low opacity. The only place the printing red appears as a fill-like element.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A card is distinguished from the background by its tonal step (clip vs. paper), not by elevation. Adding a shadow to a card is prohibited — it converts an editorial clipping into a SaaS product card, which is the exact aesthetic this system rejects.

## 5. Terminal Accent System

The wire room has a machine in the back — a console reading the feed live. This is expressed in exactly **three isolated zones**: the **Ticker**, the **Chat Widget**, and the **Trending rubric header**. Everywhere else, the page stays paper/ink. The terminal register is a room within the room, not a redecoration of the room.

### Rationale
The paper/ink surface is the *page* — what's already been typeset, printed, settled. The terminal is the *machine* — what's still being transmitted, live, unedited. Confining the terminal register to these two zones keeps that distinction legible: readers browsing the news are reading print; the moment they check the live ticker or ask the assistant a question, they're looking directly at the wire.

### Terminal Zone Recipe
- **Background:** `{colors.ink}` — no new dark token. The near-black already used for the FAB and ticker badge becomes the full zone background here, not just a badge chip.
- **Text:** `{colors.paper}` at monospace (IBM Plex Mono). No new text color — the terminal zone is the paper/ink relationship inverted, not a new palette.
- **Cursor / liveness marker:** `{colors.spot}` as a blinking block cursor (`▍`) or caret, replacing dots or generic spinners inside terminal zones. This is the *only* place the spot color is allowed to blink — everywhere else in the system, spot is static.
- **Scanline texture:** repeating horizontal lines, `rgba(233, 225, 208, 0.04)` (paper at 4% opacity) every 3px, `background-size: 100% 3px`. The dark-mode sibling of the existing newsprint grain — same principle (texture prevents a flat AI-generated fill), inverted for a dark surface.
- **Corner style:** 0px radius, matching the rest of the system. Terminal zones are still cut-edge, not rounded — the machine doesn't get to be softer than the page.
- **Typing/reveal motion:** where content appears in a terminal zone (ticker headline, chat typing state), prefer a **character-reveal ("typewriter") effect** or a **blinking cursor** over the crossfade/slide used on the paper surface. This is the one place a different motion vocabulary is allowed, because it signals "live transmission" rather than "editorial reveal." Still needs a `prefers-reduced-motion` fallback: swap typewriter for instant text + static (non-blinking) cursor.

### Where It Applies
- **Ticker (Wire Rotator):** the *entire bar* becomes a terminal zone — ink background with scanline texture, replacing the current clip-background bar with an ink badge. The rotating headline is preceded by a blinking spot-colored cursor and revealed with a brief typewriter effect on each rotation, replacing the slide+fade.
- **Chat Widget:** the FAB and panel header already use ink — extend the terminal treatment to the scanline texture on those ink surfaces, and replace the three-dot typing indicator with a single blinking spot-colored block cursor. The message panel body stays paper/clip (readable, print-register) — only the ink surfaces (FAB, header strip) get the terminal treatment.
- **Trending rubric header:** the "Trending / Most read this week" header strip becomes a terminal zone — ink + scanline, mono uppercase paper text, with the same blinking spot cursor. Justification per the Named Rule below: Trending is the one editorial section that genuinely updates live (it re-fetches on every vote via `ARTICLE_VOTED_EVENT`), so a live-wire readout for its header is earned, not decorative. The ranked list itself (serif rank numbers, headline, vote count) stays print-register — only the header strip is terminal.

### Named Rules
**The Three-Zone Rule.** Terminal accents live in the Ticker, the Chat Widget, and the Trending rubric header — full stop. Do not extend scanlines, blinking cursors, or ink-zone treatments to cards, the masthead, the Hero, or the Trending list items themselves — those are print, not machine. A fourth zone needs the same justification test applied to Trending: does this element genuinely represent a live, unedited feed, or is it just "it would look cool" on typeset content?

**No Fifth Color.** The terminal zones reuse `ink` / `paper` / `spot` exactly as defined elsewhere. Introducing a phosphor-green or amber "terminal color" is explicitly rejected — it would violate the One Spot Rule and turn accent zones into a competing palette.

## 6. Components

### Masthead
The publication's identity. Two rows: a folio line (dateline, search, live dot, auth) separated by a hairline rule, and the nameplate in Fraunces Black. The bottom of the nameplate is sealed by a 3px ink rule — the heaviest rule on the page — which signals "below this line is content."
- **Folio line height:** 44px (h-11)
- **Nameplate:** Fraunces Black, `clamp(44px, 9vw, 92px)`, tracking -0.015em, centered
- **Heavy rule:** `border-bottom: 3px solid var(--ink)` — used here and in the footer only

### Ticker (Wire Rotator) — Terminal Zone
A horizontal bar beneath the masthead, now a full **terminal accent zone** (see §5): ink background with scanline texture, replacing the previous clip-background bar. A "● LATEST" badge in IBM Plex Mono tabs the content on the left; a blinking spot-colored cursor precedes the rotating headline, which reveals with a brief typewriter effect on each rotation (was: slide+fade). Respects `prefers-reduced-motion` (falls back to instant text swap + static cursor).
- **Zone background:** ink + scanline texture (`rgba(233,225,208,0.04)` horizontal lines, 3px)
- **Badge:** ink background (blends into the zone), paper text, 11px mono uppercase, no border radius
- **Headline:** paper text, 12.5px IBM Plex Mono, preceded by spot-colored blinking cursor, truncated to single line, hover to spot

### News Cards (Clippings)
- **Corner Style:** None (0px radius). Cards are newspaper clippings — they have cut edges, not rounded corners.
- **Background:** `--clip` (`#f3eddf`), hover to `--clip-h` (`#efe7d4`).
- **Border:** 1px solid `--rule` at rest; `--rule-strong` on hover.
- **Internal Padding:** 24px (p-6) on all sides.
- **Structure:** Kicker (■ CATEGORY + dateline) → Headline (Fraunces 20px) → Standfirst (Newsreader 15px) → Byline (wire label) → Vote row + READ link.
- **Vote buttons:** IBM Plex Mono 12px, no fill, hover to spot. Disabled (logged-out) at 40% opacity.

### Buttons
Sobrio con carácter — cold in form, warm in type.
- **Shape:** 4px radius (rounded-md). The only softness in the system; enough to read as interactive, not enough to read as rounded.
- **Primary:** `background: --ink`, `color: --paper`, IBM Plex Mono 12px uppercase, 0.1em tracking, padding 10px 16px. Hover: 90% opacity.
- **Disabled:** 50% opacity, cursor not-allowed.
- **Ghost / inline:** text-only, wire label style, hover to spot color.

### Inputs / Fields
- **Style:** 1px solid `--rule-strong`, 2px radius (`rounded-sm`), paper background. No shadow at rest.
- **Focus:** border shifts to `--spot`; box-shadow adds the focus ring (`0 0 0 3px rgba(162,59,43,0.12)`).
- **Placeholder:** `--ink-mute`. Contrast note: `#948a79` on `#e9e1d0` is borderline for WCAG AA — acceptable for placeholder text specifically but must not be used for readable content.
- **Error / disabled:** Text at `--spot` for errors. Disabled at 50% opacity.

### Navigation (Folio Search)
An underlined search field set in IBM Plex Mono, expanding on focus from 28 to 40ch. No box, no background — the underline is the boundary. Focus shifts border to spot color.

### Chat Widget (Signature Component)
A floating chat assistant. The FAB and panel header are the widget's **terminal accent zone** (see §5): ink background with scanline texture. The panel body stays paper-palette — editorial styling: user messages in ink/paper bubbles, assistant messages in clipping/rule containers. Suggestion chips are clipping-background with rule borders and squared corners. The textarea uses IBM Plex Mono to keep caret-to-placeholder alignment precise. The typing indicator is a single blinking spot-colored block cursor (`▍`), not three dots — the terminal zone's liveness marker, not a generic spinner.
- **FAB:** ink background + scanline texture, paper icon, warm shadow, 0px radius (square, not circular — matches the rest of the system)
- **Panel:** 0px radius, rule-strong border, paper background
- **Panel header:** ink background + scanline texture (terminal zone), paper text
- **User bubble:** ink background, paper text, 0px radius
- **Assistant bubble:** clip background, rule border, ink text, 0px radius
- **Typing indicator:** single blinking spot-colored block cursor, terminal zone only

### Filter Bar (Section Tabs)
Section tabs styled as newspaper column tabs — text-only, no box, no background. Active tab: 2px bottom border in spot color, ink text. Inactive: transparent border, ink-soft text. IBM Plex Mono 12px uppercase.

## 7. Do's and Don'ts

### Do:
- **Do** use `text-wrap: balance` on all h1–h3 headings to prevent uneven line breaks at narrow viewports.
- **Do** keep the printing red (`#a23b2b`) to live indicators, focus rings, hover states, and the hero italic flourish. These four roles, no more.
- **Do** use the warm shadow formula (`rgba(33, 27, 22, ...)`) for all shadows — the ink color desaturated, not a generic drop shadow.
- **Do** keep card radius at 0. Clippings have cut edges.
- **Do** use IBM Plex Mono for every metadata element: datelines, sources, categories, counts, wire labels. The machine voice must be consistent.
- **Do** preserve the newsprint grain texture (`body::before` SVG noise at 5% opacity). Without it, the paper palette collapses into AI cream.
- **Do** include `prefers-reduced-motion` alternatives for every GSAP animation: skip y-transforms, crossfade only.
- **Do** verify contrast before choosing a muted color. `--ink-soft` (#6b6155) on `--paper` (#e9e1d0) passes 4.5:1. `--ink-mute` (#948a79) on paper is for placeholders and captions only — never body copy.
- **Do** confine terminal accents (scanlines, blinking cursors, typewriter reveals) to the Ticker, Chat Widget, and Trending rubric header's ink surfaces only (see §5). These three zones read as "the machine"; everywhere else reads as "the page."

### Don't:
- **Don't** use `background-clip: text` with a gradient. The hero italic flourish is a flat spot-color italic, not gradient text. Gradient text is banned.
- **Don't** add rounded corners to cards. Anything above 2px on a card is a SaaS move and explicitly rejected.
- **Don't** use side-stripe borders (`border-left > 1px` as a colored accent). This is a banned pattern.
- **Don't** add box shadows to cards at rest. The flat-by-default rule is load-bearing; shadows on cards undo the editorial register entirely.
- **Don't** let the spot color appear on backgrounds, section headings, or more than one or two elements per viewport.
- **Don't** introduce a fourth typeface. The system has three voices with explicit roles. A fourth creates ambiguity.
- **Don't** design anything that looks like TechCrunch, The Verge, or Morning Brew. Generic tech-news chrome, corporate layouts, or warm-beige newsletter aesthetics are the exact clichés this system defines itself against.
- **Don't** use numbered section markers (01 / 02 / 03) as scaffolding. Numbers earn their place only in the Trending "Most Read" list, where the ordinal carries editorial meaning.
- **Don't** soften the color contrast "for elegance." Muted text is the single biggest reason AI designs feel hard to read. If text is in `--ink-soft` it must hit 4.5:1; if it doesn't, darken it — don't accept it.
- **Don't** use glassmorphism, backdrop-filter as decoration, or blurred card backgrounds. Not in this system.
- **Don't** extend the terminal accent (scanlines, blinking cursor, ink-zone background) to cards, the masthead, the Hero, or any paper-surface component. It is a two-zone system (Ticker, Chat Widget) — a third zone needs its own justification, not just "it would look cool."
- **Don't** introduce a phosphor-green, amber, or any new "terminal color." Terminal zones reuse ink/paper/spot exactly as defined — a fifth color breaks the One Spot Rule.
