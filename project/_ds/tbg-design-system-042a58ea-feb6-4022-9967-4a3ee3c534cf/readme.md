# TBG Design System

**Thipparath Business Group Co.,Ltd (TBG)** is a Thailand-based IT business services company
delivering across South-East Asia. In the company's own words: *"We combine specific industry
knowledge with a board range of client experiences to to facilitate the ongoing evolution of our
clients' businesses. Our aspiration is simple: to be the best services helping our clients to
succeed."*

TBG sells three lines of work, numbered 01–03 on its own site:

| # | Line | What it is |
| --- | --- | --- |
| 01 | **FleetHubs** — Transport & Logistics | Fleet management and IoT-enabled asset tracking software, plus connectivity devices and ERP integration. 20+ years of delivery. |
| 02 | **Cpay** — e-payment services | End-to-end e-payment platform operating under Thai e-payment licenses, with custom software built around it. |
| 03 | **IoT & System integration** | IoT solutions delivered with telecom, m-health, travel and hospitality partners. |

Contact of record: cs.thipparath@gmail.com · Tel +66 2 946 4299 · 497,499 Ramindra road,
Kannayao, Bangkok, Thailand 10900.

## Sources used to build this system

| Source | Status |
| --- | --- |
| https://www.official.thipparath.com/ | Read (live page text + structure). Wix-built; no source code or CSS was accessible. |
| `uploads/TBG-Log_040225.png` | Primary wordmark → `assets/logos/tbg-logo-primary.png` |
| `uploads/logo_cpay.png` | Cpay product mark → `assets/logos/cpay-mark.png` |
| `uploads/TBG_logo_201119.jpg` | 2011 "eye" mark → `assets/logos/tbg-eye-legacy.jpg` (archival) |

No codebase, Figma file, font binaries, deck or product screenshots were supplied. Everything
below is derived from the three logos and the public site; where a value could not be observed it
is flagged as an interpretation.

---

## CONTENT FUNDAMENTALS

**Voice.** Corporate, plain, engineering-led. TBG describes capability and duration, not
emotion — "Over 20 years experiences", "under e-payment licenses in Thailand". No superlatives
beyond the one stated aspiration ("to be the best services helping our clients to succeed").

**Person.** First-person plural throughout — *we*, *our*. The reader is *our clients*, third
person, not "you". Only calls to action address the reader directly, and even then briefly
("Contact", "Demo").

**Casing.** Three registers, used consistently:
- Section eyebrows and nav: ALL CAPS, widely tracked — `OUR EXPERTISE`, `PRODUCT`, `STAY IN TOUCH`, `ABOUT`, `CONTACT`, `DEMO`.
- Headlines: ALL CAPS with deliberate word spacing — `TRUSTED  in  COMMITMENT`, `MEET a / COMMITMENT`. Note the lowercase connective words; this is a signature.
- Product and body: sentence case — "FleetHubs : Transport & Logistics", "Cpay : e-payment services".

**Punctuation quirks worth preserving.** Products are written *Name* + space + colon + space +
descriptor (`Cpay :   e-payment services`). Emphasis is carried by a capitalised `PLUS` used as
a connective ("...e-payment platform. PLUS we add an e-payment services..."). Lists of industries
are introduced with a spaced colon and separated by commas: "logistics, travel, hospitality,
telecommunication, m-health".

**Register.** The published copy is written by non-native English speakers and contains small
grammatical irregularities ("a board range", "to to facilitate", "variously software"). **When
quoting TBG's existing copy, reproduce it verbatim** — it is the client's own text. When writing
*new* copy, write clean, simple English in the same plain register; do not imitate the errors and
do not raise the register into marketing language either.

**Emoji.** Never. No emoji appear anywhere in TBG material and none should be added.

**Length.** Section bodies run 25–60 words. The vision statement is one line. Headlines are two
to four words. Nothing on the site is longer than a short paragraph.

**Sample sentences in-voice**
- "An end-to-end IT services provider, TBG has deep expertise in e-payment services."
- "We are a customer-centric digital enterprises." *(verbatim vision statement)*
- "We help our transport and logistics clients improve operational efficiencies."

---

## VISUAL FOUNDATIONS

### Colour
The palette comes straight off the marks. The 2025 wordmark's ellipse is a sweep from near-black
navy `#0000a0` through periwinkle `#a0a0e0`; the Cpay sphere runs amber → `#f06030` → `#c8281e`.
Pure black `#000000` is the wordmark's type colour and is used as a real surface, not just ink —
the hero and the services band are black.

- **TBG blue** (`--tbg-blue-*`) is the corporate colour: links, focus, primary buttons, section numerals.
- **Cpay ember** (`--cpay-*`) is a *product* colour. Use it on Cpay surfaces only; never as a general accent alongside blue in the same action group.
- **Neutrals** are cool (blue-tinted greys), so they sit under the blue without going warm.
- **Legacy spectrum** (`--legacy-*`) is the eight-colour rainbow of the 2011 eye mark. Kept for provenance; do not use.
- Backgrounds are only ever white, `--ink-050`, or black. Two background colours per page maximum.

### Type
Set in **Archivo** (display) and **IBM Plex Sans Thai** (body), with **IBM Plex Mono** for
references and amounts. See the substitution note below.
- Hero: Archivo Black 900, uppercase, `0.06em` tracking, line-height 1.04.
- Headings: Archivo Bold 700, tight tracking, sentence case for product names.
- Eyebrows: 11–12px, 700, `0.28em` tracking, uppercase, muted grey.
- Body: 16/1.7, max 66ch.
- Section numerals ("01") are Archivo Black in TBG blue at heading scale.

### Backgrounds and imagery
Flat colour, no photography in this system — TBG's own site uses a small number of stock images
that were not supplied. The only "texture" is the orbit sweep: a radial periwinkle glow bled off
the top-right of dark sections, echoing the ellipse in the mark. No patterns, no grain, no
hand-drawn illustration. If photography is added later it should read cool and neutral to sit with
the blue.

### Gradients
Exactly three, all tokenised: `--gradient-orbit` (the 103° wordmark sweep, used on 4px rules and
card top edges), `--gradient-orbit-deep` (dark section fills), `--gradient-cpay` (Cpay surfaces).
No other gradients — in particular, no violet-to-pink SaaS gradients.

### Shape, borders, cards
Near-square. 4px on controls, 6px on cards, 10px on modals; pills are reserved for badges and
switches. Cards are white with a 1px `--border-subtle` hairline and 32px padding; the raised
variant swaps the hairline for `--shadow-sm`. **Accent bars run along the top edge, never the
left** — a coloured left border is off-brand here. Borders come in three weights: 1px hairline
(structure), 2px (controls and outline buttons), 3px (status rules on toasts).

### Elevation and transparency
Shadows are cool and blue-black (`rgba(0,0,60,…)`), from a 1px `xs` to a 60px `xl`. Filled
buttons gain a *tinted* shadow on hover — blue for brand, ember for Cpay. Transparency is used in
two places only: white-on-black text at 0.55–0.82 opacity inside dark bands, and the sticky
header, which is white at 92% with `saturate(1.2) blur(14px)`. No frosted-glass cards.

### Motion
Fast and flat. 80ms press, 140ms hover/focus, 220ms lift, 420ms overlays, 800ms hero fades.
`cubic-bezier(.4,0,.2,1)` for state changes, `cubic-bezier(.16,1,.3,1)` for entrances. No bounce,
no spring, no parallax, no looping animation. All durations collapse to 0 under
`prefers-reduced-motion`.

### States
- **Hover** — filled controls darken one step and gain a tinted shadow; outline controls fill solid; ghost controls take an `--ink-100` wash; cards lift 2px. Links change colour and underline at a 3px offset.
- **Press** — `scale(.985)`, no colour change.
- **Focus** — 2px `--tbg-blue-600` outline at 2px offset; inputs additionally show a 3px `rgba(0,0,160,.12)` ring and a blue border.
- **Disabled** — 40% opacity, `not-allowed`; no greyscale filter.
- **Selected** — 2px TBG-blue bottom border on nav and tabs.

### Layout
1200px container, page gutter `clamp(20px,5vw,80px)`, 96px vertical section band (64px tight),
12 columns with 24px gutters. Sections alternate white / `--ink-050` / black. The header is the
only fixed element. Content measure caps at 66ch.

---

## ICONOGRAPHY

TBG ships **no icon font, sprite or SVG set** — the corporate site uses three small raster
pictograms (Our story, Our vision, Our services) hosted on Wix's CDN, which were not supplied as
files. There is no in-house icon language to copy.

**Substitution (flagged):** this system uses **Lucide** from CDN
(`https://unpkg.com/lucide@0.460.0/dist/umd/lucide.js`) at **1.75 stroke weight**, the closest
open match to the thin, single-weight line pictograms on the site. Access it through the `Icon`
component rather than raw markup. If TBG has original icon artwork, drop it into `assets/icons/`
and rewrite `Icon.jsx` to read from there — that is the preferred end state.

Rules: line icons only, never filled; 16–26px in UI, 26px+ as decorative card marks in
`--ink-300`; icons sit *beside* text, never inside the type; **no emoji, ever**, and no unicode
glyphs standing in for icons (the only unicode in use is × for dismiss). Brand marks are images
from `assets/logos/`, placed only via the `Logo` component — never redrawn.

---

## FONT SUBSTITUTION — ACTION NEEDED

No font binaries were provided and the Wix site's webfont stack was not readable. The wordmark is
set in a heavy neo-grotesque with squared terminals and the sub-lockup in a Gill-Sans-like
humanist. Substitutes chosen:

| Role | Using | Replacing |
| --- | --- | --- |
| Display / headings | **Archivo** (Google Fonts, 400–900) | the wordmark's heavy grotesque |
| Body (Latin + Thai) | **IBM Plex Sans Thai** (Google Fonts, 300–700) | unknown site body face |
| Mono | **IBM Plex Mono** | — (added; TBG has no mono face) |

**Please send the real font files or the licensed family names** and these will be swapped for
`@font-face` rules over local binaries.

---

## Intentional additions

Nothing in the supplied sources defines a component library, so the primitive set below is a
standard inventory sized to TBG's surfaces. Two additions are worth naming explicitly:
- **`Icon`** — a wrapper over the substituted Lucide set, so the substitution lives in one file and can be swapped once real artwork arrives.
- **`SectionLabel`** and **`StatRow`** — encodings of two patterns that *are* observable on the site (the numbered 01/02/03 eyebrow, and headline figures such as "20+ years").

---

## Index

**Root**
- `styles.css` — the single entry point consumers link. `@import` list only.
- `thumbnail.html` — homepage tile.
- `SKILL.md` — Agent Skills wrapper.
- `readme.md` — this file.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css`

**`assets/logos/`** — `tbg-logo-primary.png`, `cpay-mark.png`, `tbg-eye-legacy.jpg`

**Components**

| Group | Components |
| --- | --- |
| `components/core/` | **Button**, **IconButton**, **Badge**, **Tag**, **Card**, **Logo**, **SectionLabel**, **Icon** |
| `components/forms/` | **Field**, **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch** |
| `components/navigation/` | **NavBar**, **Tabs**, **Footer** |
| `components/feedback/` | **Dialog**, **Toast**, **Tooltip**, **StatRow** |

Each has a sibling `.d.ts` (props contract) and `.prompt.md` (what & when, usage example).

**`ui_kits/corporate-site/`** — interactive recreation of official.thipparath.com. See its own
`README.md` for the section map and known gaps.

**`guidelines/`** — 20 specimen cards across Colors, Type, Spacing and Brand, rendered in the
Design System tab.

## Not built (and why)
- **FleetHubs and Cpay product UI kits.** No screenshots, code or Figma of either product were supplied. Recreating them would mean inventing screens. Send any product material and they can be added.
- **Slide template.** No deck was provided.
- **Client logos.** The site has an "Our clients" section but publishes no marks; the kit leaves that section deliberately blank.
