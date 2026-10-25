# deck-kit widgets & attributes — reference

Everything a slide can use from `deck-kit.js`, in one place. Read it before adding interactivity to a deck, and pick from this list instead of writing your own panels, quizzes, charts or players.

**Ground rules**

- **The user's request decides.** Add a feature when it serves what the user asked for (a lecture → steps, a quiz, a live demo; a pitch → a chart, a QR code). Don't sprinkle features on every slide.
- **Stay inside the template.** Everything below draws with the template's own fonts and colours (`DeckKit.palette`); don't add new colours or fonts to make a widget stand out.
- **Prefer attributes over scripts.** Most features are one HTML attribute. Write JavaScript only for live demos (`DeckKit.widget` / `plot` / `chart` / `stepper`), placed in a `<script>` **after** `<script src="deck-kit.js">`.
- **Everything prints.** Printing and every export show all steps, final chart states and drawn canvases. Interactive state (quiz answers, open hotspots, stepper frames) prints as it is at that moment.
- **Check it.** Run `scripts/check-deck.mjs`, then open the deck and click through each interactive slide (→ for steps, click quiz options, drag the slider).
- **Edit mode is safe.** What deck-kit generates (rendered maths, highlighted code, buttons, dots, QR images) is never saved into the file by `E`; the source keeps what you wrote.

Every feature below is running in `examples/deck-kit-demo/index.html` — open it to see them, copy from its source.

Quick index: [Slide data](#slide-data) · [Steps](#steps-data-step) · [Maths](#maths) · [Code](#code) · [Quiz](#quiz-data-quiz) · [Reveal & countdown](#reveal-and-countdown) · [Charts](#charts) · [Live canvas widgets](#live-canvas-widgets) · [Stepper](#stepper-play--pause--step) · [Before / after](#before--after-data-compare) · [Hotspots](#hotspots-data-hotspot) · [QR](#qr-code-data-qr) · [Media](#video-audio-embeds) · [Links](#links-between-slides) · [Keys](#keys-while-presenting) · [JS API](#javascript-api) · [Markdown](#markdown-md-to-deck) · [Page switches](#page-level-switches)

---

## Slide data

| Attribute | On | Effect |
|---|---|---|
| `data-title="…"` | slide | Name in the menu, notes, presenter view (else the first heading) |
| `data-sec="…"` | slide | Section header in the menu |
| `data-min="3"` | slide | Planned minutes → start minutes in the menu, progress bar, ahead/behind timer |
| `<aside class="notes">…</aside>` | inside slide | Speaker notes (never shown on the slide). Also `data-notes="…"` |
| `data-print-delay="1500"` | slide | Extra wait (ms) before printing / exporting that slide |
| `id="…"` | slide or any element | Deep link `#id`, and target for `<a href="#id">` |

## Steps (`data-step`)

Reveal parts of a slide one at a time: **→** shows the next step, **←** hides the last one, entering a slide backwards shows all its steps, jumping (menu, number keys, links) shows none.

```html
<li data-step>first</li>
<li data-step>second</li>
<img data-step="3" …>  <p data-step="3">…</p>   <!-- same number → appear together -->
<ul data-steps> <li>…</li> <li>…</li> </ul>      <!-- every child is a step -->
```

- Unnumbered steps count 1, 2, 3… in page order; a number puts the element in that step.
- Hidden steps take their space (opacity 0), so the layout doesn't jump. They fade in (no fade with reduced motion).
- Combine with code line stepping (`pre[data-lines]`) — those segments are steps too, in page order.
- The presenter view shows `step 2/4`; its "next" preview shows the next step.
- Every way of moving goes through the steps, not only the arrow keys: a click on an empty part of the slide (left third = back), the mouse wheel / trackpad (one step per flick), swipes, deck-stage's tap zones, the presenter view's ◀ ▶, and the template's own ‹ › buttons or click-to-advance (if a template still moves on by itself, deck-kit brings it back and shows the step). The template's slide-picker dots and thumbnails are jumps: they go straight to their slide. Links, buttons, inputs, canvases and code blocks keep their clicks.
- Use for: building an argument, bullet-by-bullet lectures, revealing the answer in a diagram. Don't use on every slide — a deck where every bullet needs a click is slow.

## Maths

`$…$` inline, `$$…$$` display, also `\(…\)` and `\[…\]`, rendered with KaTeX (loaded on first use; `bundle.mjs` embeds it for offline decks).

```html
<p>The posterior is $p(x \mid z) \propto p(z \mid x)\,p(x)$.</p>
$$\sigma^2 = \frac{\sigma_A^2 \sigma_B^2}{\sigma_A^2 + \sigma_B^2}$$
```

- Prices stay text: `$` needs no space after it, the closing `$` no space before it and no digit after it (`$5 and $10` is text). Write `\$` for a literal dollar sign next to maths.
- Not rendered inside `pre`, `code`, `kbd`, `textarea`, `svg`, notes, or any element with `data-no-math`. `<meta name="deck-kit-math" content="off">` turns it off for the deck.
- Offline without bundling: the source text stays visible.

## Code

```html
<pre data-lines="1-2|4|5-6"><code class="language-python">def f(x):
    …</code></pre>
```

- `class="language-xxx"` (or `lang-xxx`, or `data-lang` on the `<pre>`) → syntax highlighting in the template's accent colours. Works for C-like languages, Python, shell, SQL, HTML/XML, CSS… (`language-text` = no colours). Only plain-text `<code>` is highlighted; hand-written markup inside it is left alone.
- `data-lines="1-2|4|all"` on the `<pre>` → each `|` segment is a step: those lines stay bright, the rest dim. `all` / `*` = no dimming. Line 1 is the first line of code (a newline right after `<code>` doesn't count). Ranges: `1-3,7`.
- Copy button (hover, top-right) on highlighted blocks; `data-copy` adds it to any `<pre>`, `data-copy="false"` removes it. Hidden in print.

## Quiz (`data-quiz`)

```html
<div data-quiz>
  <p>Which variance is smaller?</p>
  <button data-option>The prediction's</button>
  <button data-option data-correct>The fused estimate's</button>
  <p data-explain>Fusing two Gaussians always narrows the result.</p>
</div>
```

- Options: elements with `data-option` (any tag; non-buttons become keyboard-focusable, Enter chooses). Without any `data-option`, the quiz's `<li>`s are the options.
- Click → the choice is marked ✓/✗, the right answer(s) are marked, `[data-explain]` appears. Click the same option again to clear. Several `data-correct` are allowed. The answer clears when the slide is left.
- Colours: green / red, override with `--dk-right` / `--dk-wrong` on the quiz.
- Synced between the audience screen and the presenter preview.

## Reveal and countdown

- `<button data-reveal="ans1">Show answer</button> <div id="ans1" hidden>…</div>` — toggles the answer (button text flips between `data-reveal-text` / `data-hide-text`, defaults "Show answer" / "Hide answer").
- `<div data-countdown="5:00" data-autostart></div>` — countdown that starts when the slide opens (without `data-autostart`, click to start). Click pauses, double-click resets.

## Charts

From data, in the template's colours, growing in when the slide opens (instant with reduced motion and in print).

```html
<!-- JSON on a canvas (give it a size) -->
<canvas style="width:100%;height:600px" data-chart='{"type":"bar","labels":["Q1","Q2","Q3"],
  "series":[{"name":"2025","data":[12,19,15]},{"name":"2026","data":[16,22,21]}],"values":true}'></canvas>

<!-- or straight from a table: first column = labels, header row = series names -->
<table data-chart="line" data-chart-height="500"> <thead>…</thead> <tbody>…</tbody> </table>
```

```js
const c = DeckKit.chart('#salesCv', { type: 'pie', labels: ['A', 'B', 'C'], data: [50, 30, 20] });
c.update({ data: [40, 40, 20] });   // redraw with new data (no animation)
```

| Option | Meaning |
|---|---|
| `type` | `bar` (default), `line`, `area`, `pie`, `donut` |
| `labels` | category names (x axis / pie slices) |
| `series` | `[{ name, data: [...], color? }]`; or `data: [...]` for one series |
| `stacked` | stacked bars |
| `values` | print values on bars / points (pie shows % unless `false`) |
| `min`, `max` | y range (default: from 0 to a round number above the data) |
| `unit`, `prefix`, `decimals` | number format, e.g. `"unit":"%"`, `"prefix":"$"` |
| `legend` | force the legend for one series |
| `animate: false`, `duration` | no grow-in / its length in ms |
| `fontSize`, `fill` | text size in px; `fill: true` shades under lines |

- The table stays in the page for screen readers but is hidden visually; `data-chart-options='{"values":true}'` passes options; `data-chart-height` sets the chart's height (px or any CSS length).
- Missing values (`null`, empty cell) leave a gap in lines and no bar.
- For anything a bar/line/pie can't show (distributions, live models), use `DeckKit.plot` below.

## Live canvas widgets

```html
<label>σ <output></output><input id="sigma" type="range" min="0.3" max="3" step="0.05" value="1"></label>
<canvas id="bellCv" style="width:100%;height:600px"></canvas>
<script>
  const cv = document.getElementById('bellCv');
  const p = DeckKit.plot(cv, { x: [-4, 4], y: [0, 1.2] });
  let v = {};
  const draw = () => p.clear().axes({ xlabel: 'x' }).gauss(0, 1, { color: 0, fill: true }).gauss(1.5, v.sigma, { color: 1, fill: true });
  DeckKit.bind(['sigma'], (vals) => { v = vals; draw(); });
  DeckKit.widget(cv, { draw });
</script>
```

- `DeckKit.widget(target, { enter, leave, draw, tick(dt), print })` — `enter`/`leave` when the slide opens/closes, `draw` on enter, resize and before print, `tick(dt)` every frame while visible.
- `DeckKit.plot(canvas, { x, y })` — `clear() axes({xlabel, ylabel}) fn(f) line(pts) points(pts) gauss(mu, sigma) vline(x) hline(y) ellipse(cx, cy, cov) text(x, y, s) legend([[label, color]])`; colour `0, 1, 2…` = template accents.
- `DeckKit.bind(inputs, fn)` — calls `fn(values)` now and on every input change; fills `<output>`s.
- `DeckKit.palette(el)` → `{ ink, bg, mute, grid, accents[], dark }`; `DeckKit.canvas(cv)` → `{ ctx, w, h }` in CSS pixels.
- Sliders and inputs sync between the audience screen and the presenter preview. Arrow keys on a focused slider move the slider, not the slide.

## Stepper (play / pause / step)

Controls ⏮ ▶/⏸ ⏭ and a frame counter under a simulation.

```html
<!-- No code: one [data-frame] shown at a time -->
<div data-stepper data-interval="900" data-loop>
  <p data-frame>1 · Predict</p> <p data-frame>2 · Measure</p> <p data-frame>3 · Update</p>
</div>
```

```js
// A simulation: reset() draws frame 0, step(k) advances to frame k.
let pts;
DeckKit.stepper('#walkCv', {
  frames: 60, interval: 120,          // frames: Infinity for open-ended
  reset() { pts = [[0, 0]]; draw(); },
  step(k) { pts.push([k, next()]); draw(); },
});
```

- Returns `{ play(), pause(), next(), reset(), seek(n), frame, playing }`. Playback pauses when the slide is left.
- Make `step` deterministic (seeded random): the presenter preview replays to the same frame.
- Controls go under a `<canvas>`/`<img>`/`<svg>`, or inside a container target (`after: true` forces under).

## Before / after (`data-compare`)

```html
<div data-compare="35" style="height:700px">
  <img src="before.jpg" alt="…" data-label="Before">
  <img src="after.jpg" alt="…" data-label="After">
</div>
```

- First child = before (left), second = after (right). Any elements work (images, SVG, canvases, divs). Value = starting position in % (default 50).
- Drag anywhere on it, or focus it and use arrow keys. Synced to the presenter preview. Prints at its current position.
- Give the box a height (or let the images size it).

## Hotspots (`data-hotspot`)

```html
<div data-hotspots style="width:1100px">
  <img src="diagram.png" alt="…" style="width:100%;display:block">
  <p data-hotspot="16%,50%">Readings come in here.</p>
  <p data-hotspot="50%,30%" data-label="A">The model predicts.</p>
</div>
```

- Each `[data-hotspot="x%,y%"]` becomes a numbered dot at that point of the box (`data-label` replaces the number); clicking it opens the element as a bubble. One bubble at a time; `data-hotspots="many"` allows several. Bubbles close when the slide is left and in print (dots stay).
- Bubbles on the right 40% open to the left. Keep the text short (one or two sentences).

## QR code (`data-qr`)

```html
<div data-qr="https://example.com/slides" style="width:320px"></div>
```

- Empty `data-qr=""` = this deck's own address (when served over http/https; a local file has no useful address).
- Dark templates get black modules on a white card (phones read that reliably). `data-qr-level="L|M|Q|H"` = error correction.
- Library loaded on first use; `bundle.mjs` embeds it. Offline without bundling, the URL is shown as text.

## Video, audio, embeds

- `<video src="clip.mp4">`, `<audio src="song.mp3">`, YouTube / Vimeo `<iframe>`s. Never autoplays; controls (play, seek, volume, mute) added; leaving the slide stops and rewinds. Presenter previews stay muted.

## Links between slides

- `<a href="#some-id">` jumps to the slide holding that id (also clickable in the PDF). URL `#7` / `#some-id` opens that slide.

## Keys while presenting

`→`/`←` (and Space, PgUp/PgDn) navigate and reveal steps · `1`–`9` Home End jump · `P` presenter view · `N` notes · `M` menu · `T` timer · `B`/`W` blank · `L` laser · `D` draw · `Z` zoom (drag a box or click; `Z`/`Esc` back — in the presenter view, drag over the current preview and the audience screen zooms) · `F` fullscreen · `E` edit · `K` copy location · `X` export & share · `Ctrl+P` print · `?` help.

## JavaScript API

| | |
|---|---|
| `DeckKit.goTo(i)`, `.next()`, `.prev()`, `.index`, `.length`, `.slides` | Navigation (`next`/`prev` reveal steps first) |
| `DeckKit.steps.n`, `.total`, `.set(n)`, `.all(true\|false)` | Steps on the current slide; `all` shows every step everywhere |
| `DeckKit.widget`, `.plot`, `.bind`, `.palette`, `.canvas` | Live widgets (above) |
| `DeckKit.chart(target, spec)` | Chart → `{ update(spec), redraw() }` |
| `DeckKit.stepper(target, opts)` | Play/pause/step controls |
| `DeckKit.enhance(el)` | Apply the attributes above to content you add later with JavaScript |
| `DeckKit.zoom.out()` | Leave zoom |
| `DeckKit.timer`, `.presenter()`, `.print()`, `.toggle(name)` | Timer, presenter view, print, panels |
| `deckkit:ready` event | Fired on `document` once the kit is up (`e.detail` = DeckKit) |

## Markdown (`md-to-deck`)

| Markdown | Becomes |
|---|---|
| `$x^2$`, `$$…$$` | Maths |
| ```` ```python {1-2\|4} ```` | Highlighted code stepping through those lines |
| ```` ```chart ```` + JSON | Chart (same JSON as `data-chart`) |
| `- (x) right` / `- ( ) wrong` | Quiz (each item an option; round brackets, like radio buttons) |
| `- [x] done` / `- [ ] to do` | Task list with ticked / unticked boxes (not a quiz) |
| `<!-- steps: true -->` | Every list item on that slide is a step |
| `![](clip.mp4)`, YouTube link alone on a line | Player / embed |
| Raw HTML lines | Passed through (use any attribute above) |

## Page-level switches

| Tag | Effect |
|---|---|
| `<meta name="deck-kit-lang" content="vi\|en">` | Panel language (default: deck `lang`, then browser) |
| `<meta name="deck-kit-math" content="off">` | Don't render `$…$` |
| `<body data-print-visit="off">` | Print without visiting every slide first |
