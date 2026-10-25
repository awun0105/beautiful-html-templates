---
name: beautiful-html-templates
description: Build stunning, professionally-designed HTML slide decks by choosing from 34 curated visual design systems. Use when the user wants to create an HTML presentation, deck, pitch deck, or slideshow using pre-designed templates with distinct aesthetics and zero dependencies. Every template includes presenter tools via deck-kit.js (presenter view on a second screen, speaker notes, talk timer, laser/draw, interactive canvas widgets with plot helpers, print to PDF); in-browser edit mode that saves into the HTML; scripts create decks from a template, Markdown or an existing PowerPoint, lint them, export PDF/PNG/handouts/PPTX (image or editable text) and bundle offline files, and deploy to Vercel, Cloudflare Pages or GitHub Pages.
---

# Agent Instructions

You are an agent working with the **beautiful-html-templates** library. Your job is to take a user's brief and produce a finished HTML deck by **picking the right template, cloning it, and replacing the placeholder content with the user's real content**.

This document is your operating manual. Read it once at the start of any deck-building task.

---

## 1. The full workflow

For every deck-building request, follow this exact sequence. Do **not** skip the clarifying step or the preview step.

### Step 1 — Ask the user about occasion and mood

Before reading any files, ask the user:

> "Three quick questions before I pick a template:
> 1. **What's the occasion?** (e.g. founder pitch, research synthesis, brand manifesto, classroom kickoff, etc.)
> 2. **What mood / vibe do you want?** (e.g. confident & punchy, quiet & literary, warm & playful, dark & moody, etc.)
> 3. **Will you present it, or will people read it on their own?**"

Wait for the user's answer. Do not pick yet. Even if the brief seems obvious, ask — the user's *taste* often surprises in ways no inferred brief can capture.

Question 3 sets the **content density** for every slide:

| | Speaking deck (presented live) | Reading deck (sent around, read alone) |
|---|---|---|
| Per slide | One idea; a headline, 1–3 short bullets or one visual | A complete thought: headline that states the point, supporting text, labelled figures |
| Type | Large; generous empty space | Smaller but comfortable to read on a laptop |
| Where the detail goes | Speaker notes (`<aside class="notes">`) | On the slide |
| Slide count | More slides, faster pace | Fewer, denser slides |

When the user brings existing material (a PowerPoint, a document), still ask question 3 — it decides how much text stays on the slides and how much moves into the notes.

**If the user gives you a `.pptx`:** import it first with `node scripts/pptx-to-deck.mjs talk.pptx --theme=<slug> --out=<dir>` (after Steps 2–4 pick the template). It extracts titles, bullets, tables, pictures and notes into `<dir>/source/talk.md` and builds a first deck; then rebuild the slides in the template's own layouts using that outline.

### Step 2 — Read `index.json` and pick 3 candidates

Read `index.json` at the repo root. Match the user's stated occasion + mood against each template's `mood`, `tone`, `best_for`, and `formality`. **Pick three templates** whose tones genuinely fit. The three should be *different enough from each other* that the user has a real choice — e.g. don't pick three editorial templates if the brief is editorial; pick one editorial, one warmer alternative, and one wildcard that re-interprets the brief.

### Step 3 — Build a title-slide preview of each candidate

For each of the 3 candidates:

1. Read the template's `template.html` to learn its visual system.
2. Take the **first slide only** (the cover / title slide of that template).
3. Replace the placeholder content with **the user's actual deck topic / title / subtitle / author / date** — i.e., make this preview real, not generic.
4. Save the preview as a standalone HTML file in a temp folder, e.g. `previews/01-<slug>.html`. Keep all sibling assets (`styles.css`, `deck-stage.js`, etc.) the template needs so the preview opens correctly.

These three preview files should be self-contained — opening any of them shows that template's title slide, populated with the user's real content.

### Step 4 — Open all 3 previews in the browser, send paths to user

Open each of the 3 preview files in the browser — `open <path>` on macOS, `xdg-open <path>` on Linux, `start <path>` on Windows. Then send the user a message like:

> "Three options to compare:
>
> 1. **<Template A>** — <one-line tone description>
>    `/path/to/previews/01-template-a.html`
> 2. **<Template B>** — <one-line tone description>
>    `/path/to/previews/02-template-b.html`
> 3. **<Template C>** — <one-line tone description>
>    `/path/to/previews/03-template-c.html`
>
> Which one feels right?"

Wait for the user to pick.

### Step 5 — Build the full deck in the chosen template

Once the user picks:

1. Start the deck with `node scripts/new-deck.mjs <slug> <dest-dir> [--lang=vi] [--title="…"]` (copies the folder as `index.html`, fresh runtime, clears demo notes). Copying the folder by hand works too — keep `deck-kit.js` with it.
2. Adapt every slide per the rules in §3 (preserve / replace / extend).
3. If the user's deck needs more slides than the template's demo holds, duplicate existing layouts to fit; if it needs fewer, drop slides from the bottom. Update page-number labels.
4. **If a slide needs a layout the template doesn't have, design it from scratch using the template's design system** — same fonts, same color palette, same decorative vocabulary, same spacing rhythm, same component grammar. Do not bail back to the user; do not pick a different template; do not import a new visual language. The new slide should look like a natural extension of the template, not a graft. (See §5 — designing missing layouts.)
5. **Fill in the presenter layer** (§8): a `data-title` on every slide, and — when the user gave talking points or a time budget — `<aside class="notes">` speaker notes, `data-sec` section names and `data-min` planned minutes. For teaching decks, interactive demos go in as `DeckKit.widget(...)` with `DeckKit.plot` / `DeckKit.bind`.
6. **Check it:** `node scripts/check-deck.mjs <deck>/index.html` — fix every ERROR (leftover placeholders, broken images, JS errors) and look at each warning (text outside the slide, clipped text).

### Step 6 — Open the final deck in the browser, send the file path

Open the finished deck (`open` / `xdg-open` / `start`). Send the user a message like:

> "Done. Your deck is at `/path/to/deck/template.html` — opened it in your browser.
>
> [One line about what you did and any caveats.]"

This applies to **every artifact you produce** — preview files, intermediate iterations, final deck. Always open it, always send the path.

---

## 2. What's in `index.json`

```jsonc
{
  "schema_version": 1,
  "template_count": 28,
  "templates": [
    {
      "slug": "neo-grid-bold",
      "name": "Neo-Grid Bold",
      "tagline": "Editorial neo-brutalism with a single neon yellow accent on off-white paper.",
      "mood": ["confident", "punchy", "editorial", "modern"],
      "occasion": ["product launch", "design review", "founder pitch", ...],
      "tone": ["bold", "minimal", "design-led", "graphic"],
      "formality": "medium",
      "density": "high",
      "scheme": "light",
      "best_for": "Anything that should feel confident and editorial-graphic ...",
      "avoid_for": "Contexts that need to feel quiet, traditional, or warm ...",
      "slide_count": 12
    },
    ...
  ]
}
```

Field definitions:

| field | how to use it |
|---|---|
| `mood` | emotional adjectives. Match against the user's *feeling* keywords. |
| `occasion` | example use cases. Useful as soft signal, not a hard filter. |
| `tone` | voice / personality. Match against descriptors like "playful", "serious", "literary". |
| `formality` | `low` / `medium-low` / `medium` / `medium-high` / `high`. Sanity-check against the user's audience. |
| `density` | how much content per slide the template can hold. Match against the user's content volume. |
| `scheme` | `light` / `dark` / `mixed`. Hard signal if the user explicitly wants light or dark. |
| `best_for` | the **feeling** + example contexts. Lead with this when narrating your pick. |
| `avoid_for` | tone *clashes* — soft warning, not a veto. |
| `slide_count` | size of the demo deck. Hint for how many layouts the template demonstrates. |

You only need a deeper read of a template's actual HTML/CSS once you've shortlisted it.

---

## 3. How to adapt a chosen template

Once you've cloned the template's folder into the user's workspace, follow these rules.

### Always preserve (these ARE the design system)

- **Fonts.** Whatever the template imports from Google Fonts or declares in `font-family` — keep it. Never substitute.
- **Color palette.** All `:root` CSS variables and color values. Never recolor.
- **Layout grid.** The grid columns, the absolute positioning, the flex hierarchies. Don't restructure.
- **Slide-level CSS classes** (e.g. `.s-toc`, `.slide--quote`, `.layout-cover`). These carry the visual identity.
- **Decorative elements** — corner brackets, paper grain, geometric shapes, illustrated SVGs, hand-drawn doodles. They are part of the system, not optional ornament.
- **The navigation runtime** — whether it's `deck-stage.js`, an inline keyboard handler, scroll-snap, or nothing. Whatever the template uses, keep using.
- **`deck-kit.js` and its wiring** — the `<script src="deck-kit.js">` tag right before `</body>`, and in templates with inline navigation the one-line `window.deckAdapter = …` next to the slide-index variable. Copy `deck-kit.js` along with the folder.

### Always replace (this is the user's content)

- **Headlines** — `<h1>`, `<h2>`, `<h3>`, etc.
- **Body copy** — `<p>`, list items, captions.
- **Numbers and stats** — placeholder values like `47%`, `2.4M`, `+142%`.
- **Names, dates, attributions** — author names, citation lines, "May 2026" placeholders.
- **Section labels and chrome text** — the `[Topic]`, `[Year]`, `[Studio]`, etc. tokens that templates use as authored placeholders.
- **Image placeholders** — replace `<div class="img-placeholder">Image Placeholder</div>` or `<img src="placeholder.jpg">` with the user's real image, **at the same dimensions**.

### Adding more slides (existing layout)

If the user has more content than the template's demo deck holds, duplicate an existing slide of the most appropriate layout and replace its content. Update page-number labels (`NN / TT`).

### Removing slides

Drop slides from the bottom if the user doesn't need them. Update page-number labels.

---

## 4. Tone-first matching

Templates have **tones**, not industries. The `best_for` and `avoid_for` fields describe how a template *feels*, not what industry it belongs to.

This means: **a confident editorial deck can carry a tech talk** if the user wants to feel design-led. **A playful pastel deck can carry a finance review** if the user is intentionally rejecting the formal-finance look. The user's taste wins.

When matching:

- **Lead with `mood` + `tone` + `best_for`.** Match the *feeling* the user wants.
- **Treat `avoid_for` as a soft warning, not a hard rule.** If the user has explicitly asked for the look that a template's `avoid_for` flags against, the user wins.
- **Use `formality` and `density` to sanity-check** — a low-formality template for a senior board presentation is probably the wrong call regardless of tone overlap, and you should flag that to the user.
- **Don't over-fit on `occasion`.** That field is example contexts, not the canon list.
- **In Step 1, ask about *tone*, not *industry*.** Good question: "Should this feel polished and authoritative, or warm and design-led?" Bad question: "Is this for finance or tech?"

---

## 5. Designing missing layouts (extending a template)

Some user briefs require a slide layout the chosen template doesn't include — e.g., a comparison table when the template only has process-flow and stat-grid layouts. In that case **design the missing slide using the template's existing design system**. Do not bail. Do not pick a different template. Do not import a new visual language.

The rules:

- **Same fonts.** Use the same `font-family` declarations the template uses for h1 / h2 / body / mono. Same weights, same letter-spacing, same line-heights.
- **Same color palette.** Use the existing `:root` CSS variables. If the new layout needs a "warning" or "highlight" color and one isn't in the palette, pick the closest existing accent rather than introducing a new hex.
- **Same decorative vocabulary.** If the template uses corner brackets, paper grain overlays, hand-drawn doodles, geometric shapes, etc. — your new slide should use the same vocabulary. A bare slide with no decoration in a template full of ornament will look broken.
- **Same spacing rhythm.** If the template uses `padding: 64px` on its slides, your new slide does too. If it uses an 8-column grid with 24px gutter, so do you.
- **Same component grammar.** If the template's stat cards use a specific structure (large number → label → description → mono caption), reuse that structure for new stat-like elements rather than inventing a different one.
- **Same chrome.** Top label / bottom page-number / corner mark — match whatever the rest of the deck shows.
- **Same navigation behavior.** A new slide must integrate with the template's existing nav (deck-stage / inline keyboard / scroll-snap). Add it as a sibling section / div in the same way existing slides are structured.

A good test: open your new slide between two existing slides in the deck. If it visibly *belongs* — same fonts, same colors, same decorations, same rhythm — you've succeeded. If it looks like a different template grafted on, you've failed; redo it.

### Avoid generic "AI slop"

New slides you design tend to drift toward the statistically average slide. Inside the template's system, push the other way:

- **No default fonts or palettes.** Never fall back to Inter / Roboto / Arial / system-ui or a purple-to-blue gradient on white because it's easy — the template's fonts and colours are the point.
- **One focal point per slide.** A slide should have one thing the eye lands on first (a number, a phrase, an image), not a grid of equal-weight boxes.
- **No cookie-cutter card rows.** Three identical icon-title-text cards is the most generic layout there is; prefer the template's own components, asymmetry, or a single strong visual.
- **Real hierarchy.** Big contrasts in size and weight beat many slightly different sizes.
- **Atmosphere over flat fills.** Use the template's textures, grain, rules and ornaments instead of plain coloured rectangles.
- **Motion with intent.** One orchestrated entrance (staggered reveal) beats animating everything; respect `prefers-reduced-motion`.

(Design guidance adapted from [frontend-slides](https://github.com/zarazhangrui/frontend-slides), MIT.)

---

## 6. Common pitfalls

- **Don't skip Step 1.** Even if the brief is detailed, ask about occasion and mood explicitly. The user's stated *taste* almost always reveals something the brief alone didn't.
- **Don't skip the previews in Step 4.** A title slide is the fastest, cheapest way for the user to feel which template is right. Don't talk them through tradeoffs in prose; show them.
- **Don't substitute fonts.** "Inter is similar enough" — no, the typography is the design system. If the original Cormorant Garamond doesn't load, fix the import, don't replace the family.
- **Don't recolor.** Even small accent shifts break the palette's harmony.
- **Don't combine layouts from different templates.** Each template is a closed visual system. Mixing slide A from raw-grid with slide B from neo-grid-bold will look amateur. (This is *different* from §5: extending one template is fine; mashing two templates is not.)
- **Don't strip "extra" decoration thinking it's noise.** Corner brackets, paper grain, SVG ornaments — they are part of the identity.
- **Don't try to "modernize" old templates** — they're working as designed. If a template feels dated, pick a different template, don't edit the existing one.
- **Don't forget to open the file in the browser.** Every preview, every iteration, every final deck. Use `open <path>` (`xdg-open` on Linux).
- **Don't write your own notes panel, timer, menu or print CSS.** `deck-kit.js` already does it for every template; add data to the slides instead (§8).
- **Don't hand over a deck without running `scripts/check-deck.mjs`.** It catches leftover `[Topic]`-style placeholders and overflowing text you won't see in one screenshot.
- **Don't put canvases or buttons in a deck without testing them in the browser.** Arrow keys, taps and print are handled by deck-kit only if the widget is registered with `DeckKit.widget` and drawn with `DeckKit.canvas`.

---

## 7. Output contract

After **every artifact** you produce — title-slide previews, intermediate iterations, the final deck — do both of these:

1. **Open the file in the browser.** Use `open /absolute/path/to/file.html` (`xdg-open` on Linux). Don't just announce it; actually open it.
2. **Send the user the absolute file path** in your message, on its own line, formatted as a path so it's clickable.

For the final deck, also include:
- A one-line note about which template you picked and why (the *tone match*).
- Any caveats (e.g., "I designed slides 4 and 7 from scratch using the template's design system since you needed a comparison table and a 4-column timeline that the demo deck didn't include").

Do not narrate every step you took. The user wants the artifact + the path + a one-line rationale, not a transcript.

---

## 8. Presenter features (`deck-kit.js`)

Every template loads `deck-kit.js` after its own navigation script. It finds the deck (through `<deck-stage>`, or `window.deckAdapter` in templates with inline navigation) and adds presenter tools without touching the design:

| Key / action | What it does |
|---|---|
| `←` `→` Space PgUp/PgDn Home End `1`–`9` | Navigate. Presses during a template's slide transition are queued, not dropped |
| `P` | **Presenter view**: a second window with current + next slide, notes, timer and plan. Put it on the laptop, keep the original window on the projector (displays in *extend* mode). Sliders, inputs and revealed answers stay in sync both ways — you can drive a demo from the laptop's preview. **✎ Edit** turns the notes into an editor (changes show at once and survive a reload as a draft); **💾 Save to file** writes them into the deck's HTML (Chrome/Edge: pick the deck file once; other browsers get `notes.json` for `scripts/apply-notes.mjs`) |
| `N` | Speaker-notes panel on this screen (use `P` when the screen is projected) |
| `M` | Slide menu grouped by section, with planned start minute; click to jump |
| `T` / `Shift+T` | Talk timer (elapsed vs. plan, ahead / on time / behind); reset. Click it to pause |
| `B` / `W` | Black / white screen |
| `L` | Laser pointer |
| `D` | Draw on the slide; `C` clears that slide's ink, `Backspace` undoes, `Esc` stops. Ink stays with its slide |
| `F` | Fullscreen |
| `Ctrl/Cmd+P` | Visits every slide (so charts drawn on entry fill in), then prints one slide per page, canvases kept |
| `E` | **Edit mode**: click to select, drag to move, drag the handles to resize (corners scale text), double-click to retype, `Del` hides, arrows nudge, `Ctrl+Z`/`Ctrl+Y`. `E` again **saves into the HTML file** — only the edited tags change (`style="translate: …; width: …"` and new text) |
| `X` | **Export & share** panel: *Print PDF now*, and ready-made commands (with this deck's real path) for the other exports — PDF, small PDF, PNG, handout, PPTX, editable PPTX — and for deploying to Vercel / Cloudflare / GitHub (preview, link name). The user pastes the command in a terminal or sends it to you to run |
| `K` | Click an element to **copy its location** (file, line when known, slide, tag, text, CSS selector) — paste it to the agent with what to change |
| `?` / `Esc` | Shortcut help / close panels |
| `#7` / `#some-id` in the URL | Opens slide 7 / the slide holding that id; the hash follows navigation |
| `<a href="#some-id">` | Jumps to the slide holding that id — also clickable in the printed PDF |
| Swipe / tap | Touch navigation; taps on buttons, sliders and canvases go to the control |

Panel text follows `<html lang>`: Vietnamese for `lang="vi"`, English otherwise.

### Slide data the kit reads (all optional)

```html
<section class="slide" data-title="Why filters" data-sec="Motivation" data-min="3">
  …slide content…
  <aside class="notes">What to say, what to click, which question to ask.</aside>
</section>
```

- `data-title` — name shown in the menu, notes and presenter view (falls back to the first heading).
- `data-sec` — section header in the menu.
- `data-min` — planned minutes. When any slide has it, the menu shows start minutes, a thin progress bar tracks planned time and the timer compares against the plan.
- `<aside class="notes">` — never shown on the slide; also accepted: `data-notes="…"` or the `#speaker-notes` JSON array that `deck-stage` templates use.
- `data-print-delay="1500"` — extra wait (ms) on that slide before printing/exporting, for long entry animations.

### Interactive slides

```html
<label>Sensor σ <output></output><input id="sigma" type="range" min="0.3" max="3" step="0.05" value="1"></label>
<canvas id="bellCv" style="width:100%;height:600px"></canvas>
<script>
  const cv = document.getElementById('bellCv');
  const p = DeckKit.plot(cv, { x: [-4, 4], y: [0, 1.2] });   // data coordinates
  let v = {};
  function draw() {
    p.clear().axes({ xlabel: 'x' })
      .gauss(0, 1, { color: 0, fill: true })                // colour 0, 1, 2… = template accents
      .gauss(1.5, v.sigma, { color: 1, fill: true })
      .legend([['prediction', 0], ['sensor', 1]]);
  }
  DeckKit.bind(['sigma'], (vals) => { v = vals; draw(); });  // also fills the <output>
  DeckKit.widget(cv, { draw, tick(dt) { /* animate, only while visible */ } });
</script>
```

- `DeckKit.widget(target, { enter, leave, draw, tick(dt), print })` — `draw` runs on enter, resize and before print; `tick` every frame while the slide is visible.
- `DeckKit.plot(canvas, { x, y })` — `clear() axes() fn(f) line(pts) points(pts) gauss(mu, sigma) vline(x) hline(y) ellipse(cx, cy, cov) text() legend()`; chainable, sized for any screen, styled from the template.
- `DeckKit.bind(inputs, fn)` — ids / elements / a container; calls `fn(values)` now and on every change.
- `DeckKit.palette(el)` — `{ ink, bg, mute, grid, accents[] }` read from the template's CSS.
- `DeckKit.canvas(cv)` — `{ ctx, w, h }` for hand-drawn canvases in CSS pixels.

Put widget scripts after the `deck-kit.js` tag. Arrow keys on a focused slider move the slider, not the slide.

No-code helpers:

- `<button data-reveal="ans1">Show answer</button> <div id="ans1" hidden>…</div>` — toggles the answer.
- `<div data-countdown="5:00" data-autostart></div>` — countdown; starts when its slide opens (without `data-autostart`, click to start). Click pauses, double-click resets.

`DeckKit.goTo(i)`, `.next()`, `.prev()`, `.index`, `.length`, `.timer`, `.presenter()`, `.print()` and the `deckkit:ready` event are available for custom logic. A full working example is `examples/deck-kit-demo/index.html`.

### Decks written from scratch

If a deck doesn't use `<deck-stage>`, expose its navigation so deck-kit can drive it — one line next to the slide-index variable:

```js
window.deckAdapter = { go: (i) => showSlide(i), index: () => current };   // + nativeScroll: true for scroll-snap decks
```

Without it deck-kit falls back to guessing the current slide from `.active` / `.is-active` and stepping with arrow keys, which is fragile.

---

## 9. Tools (`scripts/`)

Run `npm install` once in the repo root (installs `puppeteer-core`; it uses the Chrome already on the machine, or `CHROME_PATH`).

| Command | What it does |
|---|---|
| `node scripts/new-deck.mjs <slug> <dir> [--lang=vi] [--title=…]` | Start a deck from a template |
| `node scripts/md-to-deck.mjs talk.md --theme=<slug>` | Markdown → working deck in standard layouts, dressed in the template's fonts and palette (see `examples/md-deck/talk.md`). Use it to get content and timing right fast; move slides into the template's own layouts for the final look |
| `node scripts/check-deck.mjs <deck.html> [--strict]` | Lint: placeholders, broken images, JS errors (errors); overflow, clipping, missing titles/notes/minutes (warnings) |
| `node scripts/export.mjs <deck.html> [--pdf] [--png] [--handout] [--compact] [--pptx] [--pptx-editable]` | `slides.pdf`, `slide-NN.png`, an A4 `handout.pdf` with notes under each slide; `--compact` = small image-based PDF for e-mail; `--pptx` = PowerPoint with one slide image per slide and the speaker notes in the notes pane; `--pptx-editable` = real PowerPoint text boxes over a picture of the design, `<img>` as separate pictures, plus `fonts/` (TTF) to install — see below. Each slide is captured once its entry animations finish |
| `node scripts/apply-changes.mjs <deck.html> notes.json\|edits.json` | Merge notes (presenter view) or visual edits (`E`) saved in browsers without direct file access (Firefox, Safari); only the affected tags change. `apply-notes.mjs` is an alias |
| `node scripts/pptx-to-deck.mjs talk.pptx --theme=<slug>` | Import a PowerPoint: titles, bullets (levels), tables, pictures and speaker notes → `source/talk.md` + a deck in md-to-deck layouts with the theme's look; hidden slides skipped unless `--include-hidden` |
| `node scripts/deploy.mjs <deck.html> --to=vercel\|cloudflare\|github` | Publish one self-contained file (never `CLAUDE.md` or other files) to a link named after the deck folder (`--name=…`). `--preview` publishes a separate link without touching the main one; `--dry-run` shows the commands. Vercel/Cloudflare need a one-time `npx vercel login` / `npx wrangler login`; GitHub uses `gh` and a `<you>/slides` repo with one folder per deck. Publishing is public — run it only when the user asks. **Overwrite guard:** re-deploying the same deck updates its link; if a *different* deck already uses that name it stops with exit code 2 — ask the user whether to replace it (`--force`) or pick another `--name` |
| `node scripts/bundle.mjs <deck.html> [--all-subsets]` | One self-contained offline `.html` with fonts embedded |
| `node scripts/sync-runtime.mjs [--check]` | Copy `runtime/` into every template (edit runtime files only in `runtime/`) |
| `npm test` | Runtime-copy check + headless test of all templates and the demo (also runs in GitHub Actions) |

### Editable PowerPoint (`--pptx-editable`, experimental)

Each slide becomes a background picture with the text hidden (decoration, charts and canvases stay exact), separate pictures for `<img>`, and editable text boxes with the same font, size, colour, weight, italics, letter spacing, line height and sub/superscript. Notes go to the notes pane. Things to tell the user:

- **Install the fonts in `fonts/` first** (instructions inside). Without them PowerPoint substitutes a font and lines wrap differently.
- Rotated text, gradient-filled text, text inside SVG and `aria-hidden` decoration stay in the background picture (not editable).
- Variable fonts with an optical-size axis (e.g. Source Serif 4, DM Sans) render a little wider in PowerPoint than in the browser at large sizes — leave room or shorten headlines.
- Charts, shapes and decoration are pictures: text is editable, the design is not.

---

## 10. Working on a deck over time

- **`CLAUDE.md` in the deck folder** is the deck's memory: purpose, audience, length, reading vs. speaking, voice, colour meanings, rules, and a dated list of the user's corrections. `new-deck.mjs`, `md-to-deck.mjs` and `pptx-to-deck.mjs` create it (in Vietnamese for `--lang=vi`). Read it before every change, fill in the `<FILL IN>` parts from the conversation, and add each correction the user makes so the next session doesn't repeat it.
- **Locations from `K`** look like `…/index.html, line 412 — slide 5 "Title" — <p.lead> "text…" — selector: div.body > p.lead`. Edit exactly that element.
- **Visual edits from `E`** arrive as inline `translate`, `width`, `height`, `font-size` or `display` on the edited tags. When you next restructure that slide, fold them into proper layout CSS.

