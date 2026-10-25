<a id="top"></a>

<div align="center">

# deck-kit

<img src="./assets/banner.png" alt="deck kit — beautiful HTML slide templates" />

**34 designed HTML slide templates with built-in presenter tools, for building talks with a coding agent.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://github.com/awun0105/deck-kit/actions/workflows/test.yml/badge.svg)](https://github.com/awun0105/deck-kit/actions/workflows/test.yml)

[Tiếng Việt: README.md](README.md)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Software Components](#software-components)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Target Audience / Use Case](#target-audience--use-case)
- [Prerequisites & Requirements](#prerequisites--requirements)
- [Getting Started](#getting-started)
- [Customization & Advanced Usage](#customization--advanced-usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security Considerations](#security-considerations)
- [Acknowledgement](#acknowledgement)
- [Contact](#contact)
- [License](#license)

---

## Overview

deck-kit is a set of HTML slide decks and tools for making presentations with a coding agent such as Claude Code, Codex or Gemini CLI. The agent asks about the occasion and mood, picks one of 34 templates, writes the slides and speaker notes, and hands back a single HTML file. The deck opens in any browser and runs offline: no PowerPoint and no account needed.

Every template carries the same presenter runtime, `deck-kit.js`. It adds a presenter view on a second screen, speaker notes, a talk timer, drawing and a laser pointer, in-browser editing that saves into the file, and interactive slides (step reveals, maths, quizzes, charts and more). Node.js scripts turn Markdown or an existing PowerPoint into a deck, check decks for mistakes, export PDF, PNG and PowerPoint, and publish a deck to a shareable link.

## Screenshots

Six of the 34 templates (cover slides):

<p>
  <img src="./screenshots/soft-editorial-4.png" width="32.5%" alt="Soft Editorial" />
  <img src="./screenshots/vellum-1.png" width="32.5%" alt="Vellum" />
  <img src="./screenshots/creative-mode-1.png" width="32.5%" alt="Creative Mode" />
  <img src="./screenshots/8-bit-orbit-1.png" width="32.5%" alt="8-Bit Orbit" />
  <img src="./screenshots/emerald-editorial-1.png" width="32.5%" alt="Emerald Editorial" />
  <img src="./screenshots/daisy-days-1.png" width="32.5%" alt="Daisy Days" />
</p>

<details>
<summary><b>All 34 templates</b> (three slides each)</summary>

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

</details>

## Key Features

- **34 templates:** distinct visual systems (editorial, minimal, poster, retro, pastel, pixel art and more), each a self-contained folder.
- **Presenter view:** current and next slide, notes, timer and plan on the laptop while the projector shows the slide; controls stay in sync between the two windows.
- **Classroom tools:** black or white screen, laser pointer, drawing on slides, zoom into a region, slide menu with planned minutes, countdowns.
- **Interactive slides:** step-by-step reveals, KaTeX maths, highlighted code with line-by-line stepping, multiple-choice quizzes, bar / line / pie charts, play / pause simulations, before / after sliders, image hotspots, QR codes, live canvas widgets.
- **Video and audio:** players with controls; nothing autoplays; leaving a slide stops and rewinds its media.
- **Editing in the browser:** move, resize and retype elements, then save straight into the HTML file; or copy an element's exact location to give the agent precise instructions.
- **Import and export:** Markdown or PowerPoint to deck; deck to PDF, PNG, handout, PowerPoint (images or editable text) or one offline HTML file.
- **Publishing:** one command to Vercel, Cloudflare Pages or GitHub Pages, with speaker notes left out by default.
- **Agent instructions:** `AGENTS.md` / `SKILL.md` tell the agent how to choose a template, keep its design and use every feature.

## Software Components

- **Slides:** plain HTML and CSS per template; the `<deck-stage>` web component (`deck-stage.js`) for slide layout and navigation.
- **Presenter runtime:** `deck-kit.js`, dependency-free JavaScript shared by all templates.
- **Libraries loaded on demand:** KaTeX (maths) and qrcode-generator (QR codes) from the jsDelivr CDN; `bundle.mjs` embeds them for offline files.
- **Tools:** Node.js scripts using `puppeteer-core` (headless Chrome), `pptxgenjs` (PowerPoint) and `jszip` (PowerPoint import).
- **Publishing:** the Vercel CLI, Wrangler (Cloudflare) or the GitHub CLI, run through `npx` / `gh`.

## Architecture

A deck is one HTML file that loads two scripts:

1. **The template's own HTML and CSS** define the slides and their look.
2. **`deck-stage.js`** (or the template's inline navigation) lays out and switches slides.
3. **`deck-kit.js`** finds the slides, adds the presenter tools and interactive features, and talks to the presenter window through `postMessage`.
4. **The scripts in `scripts/`** open the same file in headless Chrome to check it, capture each slide for export, or bundle and publish it.

## Repository Structure

| Path | Description |
|---|---|
| `templates/` | The 34 templates, one self-contained folder each (`template.html`, assets, runtime copies) |
| `runtime/` | `deck-kit.js` and `deck-stage.js`; the only place to edit them (`npm run sync` copies them into every template) |
| `scripts/` | Command-line tools: new deck, Markdown and PowerPoint import, check, export, bundle, deploy, tests |
| `examples/deck-kit-demo/` | One deck that shows every feature |
| `examples/md-deck/` | A sample talk written in Markdown |
| `screenshots/` | Template screenshots used in this README |
| `assets/` | The README banner and its HTML source |
| `tests/fixtures/` | Sample PowerPoint, video and audio files used by the tests |
| `AGENTS.md`, `SKILL.md` | Instructions for coding agents (same content; `SKILL.md` is the skill format) |
| `widgets-reference.md` | Every attribute and interactive feature, with examples |
| `animation-patterns.md` | How to add motion when asked |
| `index.json` | Each template's style, palette, fonts and best uses, for choosing one |

## Target Audience / Use Case

- **Teachers and lecturers:** lessons with step reveals, quizzes, maths, code walkthroughs and live demos.
- **Speakers and presenters:** conference talks, pitches and reports with a presenter view on the laptop.
- **Developers using coding agents:** describe the talk, review three template previews, and get a finished deck with notes.

## Prerequisites & Requirements

### System / Software Requirements

- OS: Linux, macOS or Windows.
- Node.js 18 or newer.
- Google Chrome or Chromium, used to check and export decks. Presenting works in any modern browser.
- Git, to clone the repository.

### API Keys & Credentials

Needed only for publishing, with a one-time login:

- Vercel: `npx vercel login`
- Cloudflare Pages: `npx wrangler login`
- GitHub Pages: the GitHub CLI (`gh auth login`)

---

## Getting Started

### 1. Install

**Option A: Claude Code plugin**

```text
/plugin marketplace add awun0105/deck-kit
/plugin install deck-kit@deck-kit
```

The first time Claude exports a file, it runs `npm install` in the plugin's folder.

**Option B: clone the repository** (other agents, or working by hand)

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit
npm install
```

If Chrome is installed in an unusual place, set `CHROME_PATH=/path/to/chrome`.

### 2. Connect your agent

- Agents with skills: link the folder into the agent's skills directory, for example `~/.claude/skills/deck-kit` or `~/.codex/skills/deck-kit`.
- Other agents: start the agent inside the `deck-kit` folder (it reads `AGENTS.md`), or point it there: "Read ~/deck-kit/AGENTS.md, then make me a deck about …".

### 3. Check the installation

Open `examples/deck-kit-demo/index.html` in a browser and press `→` to step through it. Then check that the tools run:

```bash
node scripts/check-deck.mjs examples/deck-kit-demo/index.html
```

The command prints the number of slides and planned minutes, followed by any warnings.

### 4. Make a deck

**With an agent:**

> Use deck-kit to make me a 20-minute deck about [topic] for my class.

The agent asks a few questions, shows three template previews, then builds the deck with speaker notes.

**By hand, from a template:**

```bash
node scripts/new-deck.mjs vellum ~/slides/kalman --title="Kalman filters"
node scripts/check-deck.mjs ~/slides/kalman/index.html
```

**From Markdown or PowerPoint:**

```bash
node scripts/md-to-deck.mjs talk.md --theme=vellum
node scripts/pptx-to-deck.mjs talk.pptx --theme=vellum
```

Template names are the folder names in `templates/`.

### 5. Present

Open the deck's `index.html` in a browser. Press `?` for all shortcuts.

| Key | Action |
|---|---|
| `←` `→` `Space` `1`–`9` | Navigate; `→` also reveals a slide's steps |
| `P` | Presenter view in a second window (keep it on the laptop, move the original to the projector in extended-display mode) |
| `N` / `M` / `T` | Speaker notes / slide menu / talk timer |
| `B` / `W` | Black / white screen |
| `L` / `D` | Laser pointer / draw on the slide (`C` clears) |
| `Z` | Zoom: drag a box or click; `Z` or `Esc` zooms out |
| `E` | Edit in the browser; `E` again saves into the file |
| `K` | Copy an element's location for the agent |
| `X` | Export and share panel |
| `F` | Fullscreen |
| `Ctrl+P` | Print every slide to PDF |

---

## Customization & Advanced Usage

### Interactive slides

Each feature is one HTML attribute and uses the template's colours and fonts: `data-step` (reveal on click), `$…$` (maths), `<pre data-lines="1-2|4">` (code walkthrough), `data-quiz`, `data-chart`, `data-stepper`, `data-compare`, `data-hotspot` and `data-qr`. Live canvas demos use `DeckKit.widget`, `DeckKit.plot` and `DeckKit.bind`. The full list with examples is in [widgets-reference.md](widgets-reference.md). Printed and exported decks always show every step.

### Motion

Templates keep their original design. When motion is wanted, the agent follows [animation-patterns.md](animation-patterns.md); printed PDFs still show the final state.

### Editing

- **`E`:** click an element to select it, drag to move, drag the handles to resize, double-click to retype, `Del` to hide, `Ctrl+Z` to undo. Pressing `E` again saves into the HTML file (Chrome and Edge; pick the deck file once). Only the edited tags change.
- **`K`:** click an element to copy its file, line, slide and selector, then paste it to the agent with the change wanted.
- **Speaker notes:** edit them in the presenter view (`P`, then Edit, then Save to file).
- **Deck memory:** each deck's `CLAUDE.md` records its purpose, audience, tone and feedback, so the agent keeps to them in later sessions.

### Export and publish

```bash
node scripts/export.mjs ~/slides/kalman/index.html                     # PDF, PNG and a handout with notes
node scripts/export.mjs ~/slides/kalman/index.html --compact --pptx    # small PDF for e-mail, PowerPoint
node scripts/export.mjs ~/slides/kalman/index.html --pptx-editable     # PowerPoint with editable text
node scripts/bundle.mjs ~/slides/kalman/index.html                     # one offline HTML file
node scripts/deploy.mjs ~/slides/kalman/index.html --to=vercel         # or cloudflare, github
```

Each deck gets its own link, named after its folder (`--name` changes it). Re-deploying updates the same link; a name already used by a different deck needs confirmation. `--preview` publishes a separate test link and `--dry-run` publishes nothing. The `X` panel in a deck builds these commands with the deck's real path.

### All commands

| Command | Purpose |
|---|---|
| `scripts/new-deck.mjs <template> <dir>` | Start a deck from a template |
| `scripts/md-to-deck.mjs talk.md --theme=<template>` | Markdown to deck |
| `scripts/pptx-to-deck.mjs talk.pptx --theme=<template>` | PowerPoint to deck: titles, bullets, tables, pictures, notes |
| `scripts/check-deck.mjs <deck.html>` | Find leftover placeholder text, broken images, overflowing text and missing titles or notes |
| `scripts/export.mjs <deck.html>` | Export PDF, PNG, handout and PowerPoint |
| `scripts/bundle.mjs <deck.html>` | Bundle into one offline file |
| `scripts/deploy.mjs <deck.html> --to=…` | Publish to Vercel, Cloudflare Pages or GitHub Pages |
| `scripts/apply-changes.mjs <deck.html> <file.json>` | Merge notes or edits saved from Firefox or Safari |
| `npm test` | Test every template and the demo in headless Chrome |

## Documentation

- [AGENTS.md](AGENTS.md): the full guide (workflow, template rules, presenter features in §8, tools in §9, working on a deck over time in §10).
- [widgets-reference.md](widgets-reference.md): every attribute and interactive feature.
- [animation-patterns.md](animation-patterns.md): motion patterns by mood.
- [examples/deck-kit-demo/index.html](examples/deck-kit-demo/index.html): a working deck with every feature.
- [examples/md-deck/talk.md](examples/md-deck/talk.md): the Markdown format.

## Contributing

1. Fork the repository and create a branch.
2. Edit the runtime only in `runtime/`, then copy it into the templates with `npm run sync`.
3. Run `npm test` (needs Chrome) and make sure every check passes.
4. Open a pull request describing the change.

## Security Considerations

- Publishing makes a deck public. Speaker notes are removed from the published copy unless `--keep-notes` is given, and the published copy disables editing and the export panel.
- In-browser editing writes only to a file the user picks in the browser's file dialog, and refuses to save when the file changed on disk after the page was opened.
- Decks that use maths or QR codes load KaTeX and qrcode-generator from jsDelivr; bundled decks embed them and need no network.

## Acknowledgement

- [beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) by Zara Zhang (MIT): the original project and the 34 design systems.
- [frontend-slides](https://github.com/zarazhangrui/frontend-slides) by Zara Zhang (MIT): content-density and anti-"AI slop" guidance, and the idea of PowerPoint import.
- [ai-deck-builder](https://github.com/Faris-Alanazi/ai-deck-builder) (MIT): the idea of in-place editing saved into the deck file and `#id` slide links.

## Contact

- Bug reports and questions: [GitHub Issues](https://github.com/awun0105/deck-kit/issues)

## License

This project is licensed under the MIT License; see the [LICENSE](LICENSE) file for details.

---

<div align="center">

[Back to Top](#top)

</div>
