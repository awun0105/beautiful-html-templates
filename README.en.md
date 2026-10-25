<p align="center"><img src="./assets/banner.png" alt="deck kit — beautiful HTML slide templates" /></p>

<p align="center"><a href="./README.md">Tiếng Việt</a> · <b>English</b></p>

**deck-kit** lets you make beautiful HTML presentations with a coding agent (Claude Code, Codex, Gemini CLI…) doing most of the work. This repository has **34 designed slide templates**, a **presenter toolkit** built into every one, and **commands** to export PDF / PowerPoint, import an existing PowerPoint, and put a deck online.

Tell the agent what you're presenting; it picks a template and writes the slides, and you open the file in a browser to present — no PowerPoint, no internet needed.

**Contents:** [What this repository contains](#what-this-repository-contains) · [Installation](#installation) · [Your first deck](#your-first-deck) · [Presenting](#presenting) · [Livelier slides](#livelier-slides) · [Editing](#editing) · [Export and share](#export-and-share) · [Commands](#commands) · [Gallery](#gallery)

## What this repository contains

| Folder / file | What it is |
|---|---|
| [`templates/`](./templates/) | 34 slide templates, each a self-contained folder (`template.html`). Screenshots in the [Gallery](#gallery) |
| [`runtime/deck-kit.js`](./runtime/deck-kit.js) | The presenter toolkit built into every template: presenter view, notes, timer, laser, drawing, in-browser editing, print to PDF, and interactive features (step reveals, maths, quizzes, charts…) |
| [`scripts/`](./scripts/) | Commands: start a deck, turn Markdown / PowerPoint into a deck, lint, export, bundle offline, deploy |
| [`examples/deck-kit-demo/`](./examples/deck-kit-demo/index.html) | One deck showing every feature — open it to see what deck-kit can do |
| [`AGENTS.md`](./AGENTS.md) / [`SKILL.md`](./SKILL.md) | Instructions for agents: what to ask, how to pick a template, how to keep the design (SKILL.md is the same text as a skill) |
| [`widgets-reference.md`](./widgets-reference.md) | Every attribute and interactive feature, with examples |
| [`animation-patterns.md`](./animation-patterns.md) | How to add motion when you ask for it |
| [`index.json`](./index.json) | Each template's style, colours, fonts and best uses, for picking one |

## Installation

**You need:** [Node.js](https://nodejs.org) 18 or newer and Google Chrome (or Chromium). Chrome is used to check decks and export PDF / images / PowerPoint; to just present, any browser works.

### Option 1 — Claude Code (plugin)

In Claude Code:

```
/plugin marketplace add awun0105/deck-kit
/plugin install deck-kit@deck-kit
```

That's it — ask Claude for slides and it uses deck-kit. The first time it exports a file, Claude runs `npm install` in the plugin's folder.

### Option 2 — Other agents (Codex, Gemini CLI, Cursor…) or by hand

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit
npm install          # once; fetches the export tools, uses the Chrome already on your machine
```

So your agent can use it:
- Agents with skills: clone (or symlink) it into the agent's skills folder, e.g. `~/.claude/skills/deck-kit` or `~/.codex/skills/deck-kit`.
- Other agents: start the agent inside the `deck-kit` folder (it reads `AGENTS.md`), or tell it: *"Read ~/deck-kit/AGENTS.md, then make me a deck about…"*.

If Chrome lives somewhere unusual, set `CHROME_PATH=/path/to/chrome`.

### Check the installation

Open `examples/deck-kit-demo/index.html` in a browser, press `→` to look around and `?` for shortcuts. To make sure the commands work:

```bash
node scripts/check-deck.mjs examples/deck-kit-demo/index.html
```

## Your first deck

**Ask your agent (recommended).** For example:

> Use deck-kit to make me a [N]-minute deck about [topic] for my class.

The agent asks a few questions (occasion, mood, read or presented), shows you 3 template previews, then builds the full deck with speaker notes.

**From a template, by hand:**

```bash
node scripts/new-deck.mjs vellum ~/slides/kalman --title="Kalman filters"
# open ~/slides/kalman/index.html, edit the content, then check it:
node scripts/check-deck.mjs ~/slides/kalman/index.html
```

**From a Markdown outline or an existing PowerPoint:**

```bash
node scripts/md-to-deck.mjs outline.md --theme=vellum      # write in Markdown (see examples/md-deck/talk.md)
node scripts/pptx-to-deck.mjs old.pptx --theme=vellum      # import a PowerPoint
```

Template names (`vellum`, `coral`, `grove`…) are the folder names in `templates/`.

## Presenting

Open the deck's `index.html` in a browser. Press `?` any time for the shortcuts.

| Key | Does |
|---|---|
| `←` `→` `Space` `1`–`9` | Navigate (`→` also reveals a slide's steps) |
| `P` | **Presenter view** — a second window with the current and next slide, notes and timer. Keep it on the laptop and drag the original window to the projector (displays in *extend* mode) |
| `N` | Speaker notes (on this screen) |
| `M` | Slide menu with planned minutes |
| `T` | Talk timer: elapsed time, ahead or behind plan |
| `B` / `W` | Black / white screen |
| `L` | Laser pointer |
| `D` | Draw on the slide (`C` clears, `Backspace` undoes) |
| `Z` | Zoom: drag a box (or click) to magnify that spot; `Z` / `Esc` zooms out. In the presenter view, drag over the current preview and the projector zooms |
| `E` | Edit in the browser (see [Editing](#editing)) |
| `K` | Copy an element's location for your agent |
| `X` | Export and share |
| `F` | Fullscreen |
| `Ctrl+P` | Print to PDF, one slide per page |

Panels are in Vietnamese when the deck is Vietnamese or your browser prefers Vietnamese, English otherwise.

## Livelier slides

Every template runs live charts, sliders, "show answer" buttons and countdowns — great for teaching. Each of these is one HTML attribute, in the template's colours and fonts:

- **Step-by-step reveals** — `→` shows the next point, `←` hides it; clicks, the wheel, swipes and the template's own buttons step through too.
- **Maths** — type `$x^2$` or `$$…$$`.
- **Code** — syntax colours, `→` highlights line by line, a copy button.
- **Multiple-choice quizzes** — click an answer to see right or wrong, with an explanation.
- **Bar, line and pie charts** — from a table or a few numbers.
- **Simulations** with play / pause / step controls.
- **Before / after slider** for two images.
- **Hotspots on a picture** — click a number to see its note.
- **QR codes** to any link.
- **Video, audio, YouTube** — never autoplay, mute button included, stop when you leave the slide.
- **Motion** — templates stay as designed; when you want it livelier, the agent follows [`animation-patterns.md`](./animation-patterns.md).

Just tell the agent what you want ("add a quiz at the end of part 2", "chart revenue from this table"); it looks it up in [`widgets-reference.md`](./widgets-reference.md). Prints and exports always show every step. See them all in [`examples/deck-kit-demo/index.html`](./examples/deck-kit-demo/index.html).

## Editing

- **By hand (`E`)** — press `E`, click text or an image: drag to move, drag handles to resize, double-click to retype, `Del` hides, `Ctrl+Z` undoes. Press `E` again to **save straight into the HTML file** (Chrome/Edge; pick the deck file once). Only what you changed is touched.
- **Ask your agent (`K`)** — press `K`, click what to change; its exact location (file, slide, element) goes to the clipboard. Paste it into the chat with what you want: *"[location] — make this shorter"*.
- **Speaker notes** — edit them in the presenter view (`P` → ✎ Edit → 💾 Save to file).
- **Each deck's `CLAUDE.md`** — the deck's memory for the agent: purpose, audience, tone, your feedback. Next session the agent reads it and keeps to it without being told again.

## Export and share

Press `X` in the deck: print a PDF now, or tick formats / a host and press **Copy command** — paste it in a terminal or hand it to your agent. Or run directly:

```bash
node scripts/export.mjs ~/slides/kalman/index.html                      # PDF + PNG images + a handout with notes
node scripts/export.mjs ~/slides/kalman/index.html --compact --pptx     # small PDF for e-mail, PowerPoint
node scripts/export.mjs ~/slides/kalman/index.html --pptx-editable      # PowerPoint with editable text (+ fonts to install)
node scripts/bundle.mjs ~/slides/kalman/index.html                      # one self-contained HTML file, works offline
node scripts/deploy.mjs ~/slides/kalman/index.html --to=vercel          # or cloudflare / github → a link to share
```

About deploying:
- Each deck gets its own link (named after its folder, change with `--name`). Re-deploying the same deck updates it; if the name already belongs to a **different deck**, it asks before overwriting.
- **Speaker notes are left out** (anyone with the link could read them) — add `--keep-notes` to include them.
- `--preview` makes a separate test link; `--dry-run` shows what would happen without publishing.
- Vercel / Cloudflare need a one-time login (`npx vercel login`, `npx wrangler login`); GitHub Pages uses `gh`.

## Commands

| Command | What it does |
|---|---|
| `scripts/new-deck.mjs <template> <dir>` | Start a deck from a template |
| `scripts/md-to-deck.mjs talk.md --theme=<template>` | Markdown → deck (standard layouts in the template's colours and fonts) |
| `scripts/pptx-to-deck.mjs talk.pptx --theme=<template>` | Import a PowerPoint: titles, bullets, tables, pictures, notes |
| `scripts/check-deck.mjs <deck.html>` | Lint: leftover placeholder text, broken images, overflowing text… |
| `scripts/export.mjs <deck.html>` | Export PDF, PNG, handout, PowerPoint |
| `scripts/bundle.mjs <deck.html>` | Bundle into one offline file |
| `scripts/deploy.mjs <deck.html> --to=…` | Publish to Vercel, Cloudflare Pages or GitHub Pages |
| `scripts/apply-changes.mjs <deck.html> <file.json>` | Merge notes / edits saved in Firefox or Safari |
| `npm test` | Automated tests for all 34 templates |

Going deeper: [`AGENTS.md`](./AGENTS.md) — §8 (presenting), §9 (tools), §10 (working on a deck over time).

## Gallery

All 34 templates, three slides each (cover · mid-deck · later). Click a name to open its folder.

### [Soft Editorial](./templates/soft-editorial/)

<p>
  <img src="./screenshots/soft-editorial-4.png" width="32.5%" alt="Soft Editorial — slide 4" />
  <img src="./screenshots/soft-editorial-6.png" width="32.5%" alt="Soft Editorial — slide 6" />
  <img src="./screenshots/soft-editorial-10.png" width="32.5%" alt="Soft Editorial — slide 10" />
</p>

> Cormorant Garamond serif on warm paper with sage, blush, and lemon accents.

### [Editorial Forest](./templates/editorial-forest/)

<p>
  <img src="./screenshots/editorial-forest-1.png" width="32.5%" alt="Editorial Forest — slide 1" />
  <img src="./screenshots/editorial-forest-2.png" width="32.5%" alt="Editorial Forest — slide 2" />
  <img src="./screenshots/editorial-forest-5.png" width="32.5%" alt="Editorial Forest — slide 5" />
</p>

> Forest green, dusty pink, and warm cream in Source Serif 4 — quiet, intentional quarterly-review aesthetic.

### [Pin & Paper](./templates/pin-and-paper/)

<p>
  <img src="./screenshots/pin-and-paper-1.png" width="32.5%" alt="Pin & Paper — slide 1" />
  <img src="./screenshots/pin-and-paper-11.png" width="32.5%" alt="Pin & Paper — slide 11" />
  <img src="./screenshots/pin-and-paper-3.png" width="32.5%" alt="Pin & Paper — slide 3" />
</p>

> Yellow paper with safety-pin illustrations, ink-blue handwritten Caveat, paper-grain texture.

### [Sakura Chroma](./templates/sakura-chroma/)

<p>
  <img src="./screenshots/sakura-chroma-1.png" width="32.5%" alt="Sakura Chroma — slide 1" />
  <img src="./screenshots/sakura-chroma-3.png" width="32.5%" alt="Sakura Chroma — slide 3" />
  <img src="./screenshots/sakura-chroma-4.png" width="32.5%" alt="Sakura Chroma — slide 4" />
</p>

> Vintage Japanese cassette-package aesthetic: cream paper, diagonal rainbow ribbons, condensed bold type, JIS-style spec checkboxes.

### [Stencil & Tablet](./templates/stencil-tablet/)

<p>
  <img src="./screenshots/stencil-tablet-1.png" width="32.5%" alt="Stencil & Tablet — slide 1" />
  <img src="./screenshots/stencil-tablet-3.png" width="32.5%" alt="Stencil & Tablet — slide 3" />
  <img src="./screenshots/stencil-tablet-8.png" width="32.5%" alt="Stencil & Tablet — slide 8" />
</p>

> Bone paper with stencil-cut headlines and a six-color earth palette: archaeology meets brand.

### [Cobalt Grid](./templates/cobalt-grid/)

<p>
  <img src="./screenshots/cobalt-grid-1.png" width="32.5%" alt="Cobalt Grid — slide 1" />
  <img src="./screenshots/cobalt-grid-3.png" width="32.5%" alt="Cobalt Grid — slide 3" />
  <img src="./screenshots/cobalt-grid-5.png" width="32.5%" alt="Cobalt Grid — slide 5" />
</p>

> Electric cobalt italic serifs on a graph-paper canvas, anchored by stair-stepped pixel-glitch decorations and slim hairline rules.

### [Vellum](./templates/vellum/)

<p>
  <img src="./screenshots/vellum-1.png" width="32.5%" alt="Vellum — slide 1" />
  <img src="./screenshots/vellum-4.png" width="32.5%" alt="Vellum — slide 4" />
  <img src="./screenshots/vellum-8.png" width="32.5%" alt="Vellum — slide 8" />
</p>

> Deep navy canvas with warm-yellow italic Cormorant serifs and a single dusty teal accent. A quiet, scholarly aesthetic.

### [Emerald Editorial](./templates/emerald-editorial/)

<p>
  <img src="./screenshots/emerald-editorial-1.png" width="32.5%" alt="Emerald Editorial — slide 1" />
  <img src="./screenshots/emerald-editorial-3.png" width="32.5%" alt="Emerald Editorial — slide 3" />
  <img src="./screenshots/emerald-editorial-6.png" width="32.5%" alt="Emerald Editorial — slide 6" />
</p>

> Magazine-cover business deck: emerald + navy + paper with double-rule masthead ornaments and a heavy Bodoni-style display serif.

### [Neo-Grid Bold](./templates/neo-grid-bold/)

<p>
  <img src="./screenshots/neo-grid-bold-1.png" width="32.5%" alt="Neo-Grid Bold — slide 1" />
  <img src="./screenshots/neo-grid-bold-3.png" width="32.5%" alt="Neo-Grid Bold — slide 3" />
  <img src="./screenshots/neo-grid-bold-8.png" width="32.5%" alt="Neo-Grid Bold — slide 8" />
</p>

> Editorial neo-brutalism with a single neon yellow accent on off-white paper.

### [Editorial Tri-Tone](./templates/editorial-tri-tone/)

<p>
  <img src="./screenshots/editorial-tri-tone-1.png" width="32.5%" alt="Editorial Tri-Tone — slide 1" />
  <img src="./screenshots/editorial-tri-tone-4.png" width="32.5%" alt="Editorial Tri-Tone — slide 4" />
  <img src="./screenshots/editorial-tri-tone-3.png" width="32.5%" alt="Editorial Tri-Tone — slide 3" />
</p>

> Three-color editorial system: dusty pink, mustard cream, and deep burgundy, set in Bricolage + Instrument Serif.

### [Creative Mode](./templates/creative-mode/)

<p>
  <img src="./screenshots/creative-mode-1.png" width="32.5%" alt="Creative Mode — slide 1" />
  <img src="./screenshots/creative-mode-4.png" width="32.5%" alt="Creative Mode — slide 4" />
  <img src="./screenshots/creative-mode-6.png" width="32.5%" alt="Creative Mode — slide 6" />
</p>

> Cream paper canvas with confident multi-color (green, pink, orange, yellow) accents and Archivo Black display.

### [Monochrome](./templates/monochrome/)

<p>
  <img src="./screenshots/monochrome-1.png" width="32.5%" alt="Monochrome — slide 1" />
  <img src="./screenshots/monochrome-4.png" width="32.5%" alt="Monochrome — slide 4" />
  <img src="./screenshots/monochrome-12.png" width="32.5%" alt="Monochrome — slide 12" />
</p>

> Ivory ledger paper with all-black type; Lora serif headlines, Jost body, no color at all.

### [People's Platform (Block & Bold)](./templates/peoples-platform/)

<p>
  <img src="./screenshots/peoples-platform-1.png" width="32.5%" alt="People's Platform (Block & Bold) — slide 1" />
  <img src="./screenshots/peoples-platform-4.png" width="32.5%" alt="People's Platform (Block & Bold) — slide 4" />
  <img src="./screenshots/peoples-platform-8.png" width="32.5%" alt="People's Platform (Block & Bold) — slide 8" />
</p>

> Activist poster energy: blue, orange, red on cream, with Alfa Slab + Caveat Brush.

### [Pink Script — After Hours](./templates/pink-script/)

<p>
  <img src="./screenshots/pink-script-1.png" width="32.5%" alt="Pink Script — After Hours — slide 1" />
  <img src="./screenshots/pink-script-4.png" width="32.5%" alt="Pink Script — After Hours — slide 4" />
  <img src="./screenshots/pink-script-8.png" width="32.5%" alt="Pink Script — After Hours — slide 8" />
</p>

> Black canvas, hot pink accent, pearl-cream paper, Instrument Serif headlines: late-night editorial luxury.

### [8-Bit Orbit](./templates/8-bit-orbit/)

<p>
  <img src="./screenshots/8-bit-orbit-1.png" width="32.5%" alt="8-Bit Orbit — slide 1" />
  <img src="./screenshots/8-bit-orbit-6.png" width="32.5%" alt="8-Bit Orbit — slide 6" />
  <img src="./screenshots/8-bit-orbit-5.png" width="32.5%" alt="8-Bit Orbit — slide 5" />
</p>

> Pixel-art neon arcade aesthetic on a deep navy void.

### [BlockFrame](./templates/block-frame/)

<p>
  <img src="./screenshots/block-frame-1.png" width="32.5%" alt="BlockFrame — slide 1" />
  <img src="./screenshots/block-frame-4.png" width="32.5%" alt="BlockFrame — slide 4" />
  <img src="./screenshots/block-frame-8.png" width="32.5%" alt="BlockFrame — slide 8" />
</p>

> Neobrutalist deck with pastel-neon color blocks and chunky black borders.

### [Blue Professional](./templates/blue-professional/)

<p>
  <img src="./screenshots/blue-professional-1.png" width="32.5%" alt="Blue Professional — slide 1" />
  <img src="./screenshots/blue-professional-6.png" width="32.5%" alt="Blue Professional — slide 6" />
  <img src="./screenshots/blue-professional-8.png" width="32.5%" alt="Blue Professional — slide 8" />
</p>

> Cream paper background with electric cobalt blue accents; clean modern professional.

### [Bold Poster](./templates/bold-poster/)

<p>
  <img src="./screenshots/bold-poster-1.png" width="32.5%" alt="Bold Poster — slide 1" />
  <img src="./screenshots/bold-poster-4.png" width="32.5%" alt="Bold Poster — slide 4" />
  <img src="./screenshots/bold-poster-8.png" width="32.5%" alt="Bold Poster — slide 8" />
</p>

> Editorial poster aesthetic with massive Shrikhand display and a single fire-engine red accent.

### [Broadside](./templates/broadside/)

<p>
  <img src="./screenshots/broadside-1.png" width="32.5%" alt="Broadside — slide 1" />
  <img src="./screenshots/broadside-4.png" width="32.5%" alt="Broadside — slide 4" />
  <img src="./screenshots/broadside-13.png" width="32.5%" alt="Broadside — slide 13" />
</p>

> Dark editorial canvas with a single fire orange accent and bilingual Latin/Chinese type stack.

### [Capsule](./templates/capsule/)

<p>
  <img src="./screenshots/capsule-1.png" width="32.5%" alt="Capsule — slide 1" />
  <img src="./screenshots/capsule-4.png" width="32.5%" alt="Capsule — slide 4" />
  <img src="./screenshots/capsule-8.png" width="32.5%" alt="Capsule — slide 8" />
</p>

> Modular pill-shaped cards on warm bone with a full pastel-pop palette.

### [Cartesian](./templates/cartesian/)

<p>
  <img src="./screenshots/cartesian-1.png" width="32.5%" alt="Cartesian — slide 1" />
  <img src="./screenshots/cartesian-4.png" width="32.5%" alt="Cartesian — slide 4" />
  <img src="./screenshots/cartesian-8.png" width="32.5%" alt="Cartesian — slide 8" />
</p>

> Quiet warm-neutral palette with classical Playfair serifs; tasteful and unhurried.

### [Coral](./templates/coral/)

<p>
  <img src="./screenshots/coral-1.png" width="32.5%" alt="Coral — slide 1" />
  <img src="./screenshots/coral-4.png" width="32.5%" alt="Coral — slide 4" />
  <img src="./screenshots/coral-8.png" width="32.5%" alt="Coral — slide 8" />
</p>

> Cream and coral on near-black, set in oversized Bebas Neue.

### [Daisy Days](./templates/daisy-days/)

<p>
  <img src="./screenshots/daisy-days-1.png" width="32.5%" alt="Daisy Days — slide 1" />
  <img src="./screenshots/daisy-days-4.png" width="32.5%" alt="Daisy Days — slide 4" />
  <img src="./screenshots/daisy-days-8.png" width="32.5%" alt="Daisy Days — slide 8" />
</p>

> Cheerful pastel deck with hand-drawn daisies, stars, and rainbows. Friendly, soft, and warm.

### [Grove](./templates/grove/)

<p>
  <img src="./screenshots/grove-1.png" width="32.5%" alt="Grove — slide 1" />
  <img src="./screenshots/grove-4.png" width="32.5%" alt="Grove — slide 4" />
  <img src="./screenshots/grove-8.png" width="32.5%" alt="Grove — slide 8" />
</p>

> Forest-green canvas with cream type, classical Playfair serifs, and a single rust accent.

### [Mat](./templates/mat/)

<p>
  <img src="./screenshots/mat-1.png" width="32.5%" alt="Mat — slide 1" />
  <img src="./screenshots/mat-4.png" width="32.5%" alt="Mat — slide 4" />
  <img src="./screenshots/mat-8.png" width="32.5%" alt="Mat — slide 8" />
</p>

> Dark sage canvas with bone paper and burnt-orange accent; mid-century modern with wood undertones.

### [Playful](./templates/playful/)

<p>
  <img src="./screenshots/playful-1.png" width="32.5%" alt="Playful — slide 1" />
  <img src="./screenshots/playful-6.png" width="32.5%" alt="Playful — slide 6" />
  <img src="./screenshots/playful-8.png" width="32.5%" alt="Playful — slide 8" />
</p>

> Sun-warm peach background with Syne display: a friendly indie launch deck.

### [Raw Grid](./templates/raw-grid/)

<p>
  <img src="./screenshots/raw-grid-1.png" width="32.5%" alt="Raw Grid — slide 1" />
  <img src="./screenshots/raw-grid-4.png" width="32.5%" alt="Raw Grid — slide 4" />
  <img src="./screenshots/raw-grid-8.png" width="32.5%" alt="Raw Grid — slide 8" />
</p>

> Neo-brutalist deck with thick borders, offset shadows, and a pink/sage/ink palette.

### [Retro Windows](./templates/retro-windows/)

<p>
  <img src="./screenshots/retro-windows-1.png" width="32.5%" alt="Retro Windows — slide 1" />
  <img src="./screenshots/retro-windows-4.png" width="32.5%" alt="Retro Windows — slide 4" />
  <img src="./screenshots/retro-windows-8.png" width="32.5%" alt="Retro Windows — slide 8" />
</p>

> Windows 95 chrome: gray title bars, MS Sans Serif, pixel typography, full nostalgia.

### [Retro Zine](./templates/retro-zine/)

<p>
  <img src="./screenshots/retro-zine-1.png" width="32.5%" alt="Retro Zine — slide 1" />
  <img src="./screenshots/retro-zine-4.png" width="32.5%" alt="Retro Zine — slide 4" />
  <img src="./screenshots/retro-zine-8.png" width="32.5%" alt="Retro Zine — slide 8" />
</p>

> Beige paper with green accent and Bebas Neue + Caveat: a riso-printed zine in HTML form.

### [Scatterbrain](./templates/scatterbrain/)

<p>
  <img src="./screenshots/scatterbrain-1.png" width="32.5%" alt="Scatterbrain — slide 1" />
  <img src="./screenshots/scatterbrain-4.png" width="32.5%" alt="Scatterbrain — slide 4" />
  <img src="./screenshots/scatterbrain-8.png" width="32.5%" alt="Scatterbrain — slide 8" />
</p>

> Post-it inspired: pastel sticky notes, Caveat handwriting, Shrikhand and Zilla Slab type stack.

### [Signal](./templates/signal/)

<p>
  <img src="./screenshots/signal-1.png" width="32.5%" alt="Signal — slide 1" />
  <img src="./screenshots/signal-18.png" width="32.5%" alt="Signal — slide 18" />
  <img src="./screenshots/signal-8.png" width="32.5%" alt="Signal — slide 8" />
</p>

> Deep navy canvas with bone paper and a single muted-gold accent; institutional with quiet weight.

### [Studio](./templates/studio/)

<p>
  <img src="./screenshots/studio-1.png" width="32.5%" alt="Studio — slide 1" />
  <img src="./screenshots/studio-4.png" width="32.5%" alt="Studio — slide 4" />
  <img src="./screenshots/studio-8.png" width="32.5%" alt="Studio — slide 8" />
</p>

> Black canvas with electric-yellow type; high-voltage design studio aesthetic.

### [Biennale Yellow](./templates/biennale-yellow/)

<p>
  <img src="./screenshots/biennale-yellow-1.png" width="32.5%" alt="Biennale Yellow — slide 1" />
  <img src="./screenshots/biennale-yellow-5.png" width="32.5%" alt="Biennale Yellow — slide 5" />
  <img src="./screenshots/biennale-yellow-8.png" width="32.5%" alt="Biennale Yellow — slide 8" />
</p>

> Solar yellow on warm parchment with deep indigo serif and atmospheric sun-glow gradients. Dutch-editorial poster energy.

### [Long Table](./templates/long-table/)

<p>
  <img src="./screenshots/long-table-1.png" width="32.5%" alt="Long Table — slide 1" />
  <img src="./screenshots/long-table-3.png" width="32.5%" alt="Long Table — slide 3" />
  <img src="./screenshots/long-table-7.png" width="32.5%" alt="Long Table — slide 7" />
</p>

> Warm cream and rust-red supper-club aesthetic with bold uppercase grotesk headlines, italic Fraunces, and pill-shaped outlined buttons.

## Credits & license

- deck-kit grew out of Zara Zhang's [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) (MIT) — the 34 design systems come from the original project.
- Content-density and anti-"AI slop" guidance and the idea of PowerPoint import come from [frontend-slides](https://github.com/zarazhangrui/frontend-slides) (MIT, Zara Zhang).
- In-place editing that writes into the deck file and `#id` slide links were inspired by [ai-deck-builder](https://github.com/Faris-Alanazi/ai-deck-builder) (MIT).
- License: [MIT](./LICENSE).
