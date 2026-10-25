# deck-kit

[Tiếng Việt](./README.md) · **English**

HTML slides for people who work with a coding agent (Claude Code, Codex, Gemini CLI…): **34 ready-made design systems**, a **presenter runtime** built into every deck, and **tools** to export PDF/PowerPoint, import an existing PowerPoint and publish decks online.

Tell your agent what talk you need. It picks a template, fills in your content, and you present straight from the HTML file — no PowerPoint, no internet required.

## What's inside

- **34 slide templates** in very different styles: editorial, minimal, activist poster, retro, pastel, pixel arcade… (see the [gallery](#gallery) below).
- **deck-kit.js** — the presenter layer in every template: presenter view, speaker notes, timer, laser pointer, drawing, in-place editing, print to PDF…
- **Tools in `scripts/`** — start a deck, write it in Markdown, import PowerPoint, lint, export, deploy.

## Quick start

**Option 1 — ask your agent (recommended):**

> Use deck-kit to make me a deck about [topic], [N] minutes, that I'll present to a class.

The agent asks a few questions (occasion, mood, will you present it or will people read it), shows you three template previews, then builds the full deck with speaker notes. Its playbook is [`AGENTS.md`](./AGENTS.md).

**Option 2 — by hand:**

```bash
git clone https://github.com/awun0105/deck-kit.git
cd deck-kit && npm install            # once; uses the Chrome already on your machine

node scripts/new-deck.mjs vellum ~/slides/kalman --title="Kalman filters"
# open ~/slides/kalman/index.html, edit the content, then:
node scripts/check-deck.mjs ~/slides/kalman/index.html
```

Already have a PowerPoint, or prefer Markdown?

```bash
node scripts/pptx-to-deck.mjs old-talk.pptx --theme=vellum    # import a PowerPoint
node scripts/md-to-deck.mjs outline.md --theme=vellum         # write it in Markdown (see examples/md-deck/talk.md)
```

> Needs **Node.js** and **Google Chrome**. With skills-hub the repo lives at `~/.agents/skills/deck-kit`.

## Presenting

Open `index.html` in a browser and present. Press `?` for every shortcut.

| Key | Does |
|---|---|
| `←` `→` `Space` `1`–`9` | Navigate |
| `P` | **Presenter view** — a second window with the current and next slide, notes and timer. Keep it on the laptop and the original window on the projector (displays in *extend* mode). Sliders move on both screens |
| `N` | Speaker notes (on this screen) |
| `M` | Slide menu with planned minutes |
| `T` | Talk timer: elapsed time, ahead or behind plan |
| `B` / `W` | Black / white screen |
| `L` | Laser pointer |
| `D` | Draw on the slide (`C` clears, `Backspace` undoes) |
| `E` | **Edit mode** — see below |
| `K` | Copy an element's location for your agent |
| `X` | Export & share |
| `F` | Fullscreen |
| `Ctrl+P` | Print to PDF, one slide per page (charts included) |

Panels are in Vietnamese when the deck is Vietnamese or your browser prefers Vietnamese, English otherwise.

## Interactive slides

Every template runs live charts, sliders, "show answer" buttons and countdowns — great for teaching. The agent writes them with `DeckKit.widget`, `DeckKit.plot` and `DeckKit.bind`, in the template's colours. Try [`examples/deck-kit-demo/index.html`](./examples/deck-kit-demo/index.html).

## Editing

- **Quick fixes by hand (`E`)** — press `E`, click text or a picture: drag to move, drag handles to resize, double-click to retype, `Del` to hide, `Ctrl+Z` to undo. Press `E` again to **save into the HTML file** (Chrome/Edge; pick the deck file once). Only what you changed is touched.
- **Ask the agent (`K`)** — press `K` and click the spot; its exact location (file, slide, element) is copied. Paste it in the chat with what to change.
- **Speaker notes** — edit them in the presenter view (`P` → ✎ Edit → 💾 Save to file).
- **A `CLAUDE.md` per deck** — the deck's memory for agents: purpose, audience, voice, rules and your corrections, so a new chat picks up where you left off.

## Export & share

Press `X` in the deck: print a PDF right away, or tick formats / a deploy target and **Copy command** to paste in a terminal or hand to your agent.

```bash
node scripts/export.mjs ~/slides/kalman/index.html                      # PDF + PNGs + handout with notes
node scripts/export.mjs ~/slides/kalman/index.html --compact --pptx     # small PDF for e-mail, PowerPoint
node scripts/export.mjs ~/slides/kalman/index.html --pptx-editable      # PowerPoint with editable text (+ fonts to install)
node scripts/bundle.mjs ~/slides/kalman/index.html                      # one offline .html file
node scripts/deploy.mjs ~/slides/kalman/index.html --to=vercel          # or cloudflare / github → a shareable link
```

About deploying:
- Each deck gets its own link (folder name, or `--name`). Re-deploying the same deck updates it; if a **different** deck already uses the name, you're asked before it's replaced.
- **Speaker notes are left out** (anyone with the link could read them) — add `--keep-notes` to include them.
- `--preview` publishes a separate preview link; `--dry-run` shows what would happen without publishing.
- Vercel / Cloudflare need a one-time login (`npx vercel login`, `npx wrangler login`); GitHub Pages uses `gh`.

## Tools

| Command | What it does |
|---|---|
| `scripts/new-deck.mjs <template> <dir>` | Start a deck from a template |
| `scripts/md-to-deck.mjs talk.md --theme=<template>` | Markdown → deck (standard layouts in the template's look) |
| `scripts/pptx-to-deck.mjs talk.pptx --theme=<template>` | Import PowerPoint: titles, bullets, tables, pictures, notes |
| `scripts/check-deck.mjs <deck.html>` | Lint: leftover placeholders, broken images, overflowing text… |
| `scripts/export.mjs <deck.html>` | Export PDF, PNG, handout, PowerPoint |
| `scripts/bundle.mjs <deck.html>` | One self-contained offline file |
| `scripts/deploy.mjs <deck.html> --to=…` | Publish to Vercel, Cloudflare Pages or GitHub Pages |
| `scripts/apply-changes.mjs <deck.html> <file.json>` | Merge notes / edits saved from Firefox or Safari |
| `npm test` | Automated checks for all 34 templates |

Full guide (for agents and anyone going deeper): [`AGENTS.md`](./AGENTS.md) — sections 8 (presenting), 9 (tools), 10 (working on a deck over time).

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
