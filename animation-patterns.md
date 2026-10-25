# Motion & animation patterns

Reference for adding motion to a deck **when the user asks for it** ("make it more lively", "animate the bullets", "add some motion"). Templates stay as they are by default: some already animate (keep their motion as-is), most are deliberately still. Never bolt animation onto every slide unasked.

Adapted from [frontend-slides](https://github.com/zarazhangrui/frontend-slides) `animation-patterns.md` (MIT, Zara Zhang) for deck-kit decks.

---

## 1. Pick motion by feeling

Match the user's mood (Step 1 of AGENTS.md) and the template's character:

| Feeling | Motion | Fits templates like |
|---|---|---|
| **Dramatic / cinematic** | Slow fades (1–1.5 s), large scale-ins (0.9 → 1), one hero element at a time | vellum, pink-script, broadside, studio |
| **Techy / futuristic** | Quick grid or line reveals, scramble/typewriter text, subtle glow pulses | 8-bit-orbit, cobalt-grid, signal |
| **Playful / friendly** | Bouncy easing, gentle float/bob, stickers popping in | daisy-days, scatterbrain, capsule, playful |
| **Professional / corporate** | Short, subtle (200–300 ms) fades and slides; numbers counting up | blue-professional, emerald-editorial, grove |
| **Calm / minimal** | Very slow, very small movement; fades only | cartesian, monochrome, soft-editorial |
| **Editorial / magazine** | Staggered text reveals, image and text sliding in from opposite sides | editorial-forest, editorial-tri-tone, neo-grid-bold |

Rules of thumb:

- **One orchestrated entrance per slide** — the headline, then the supporting items in a short stagger — beats animating everything.
- **Animate `opacity` and `transform` only.** They're smooth and don't shift the layout.
- **Short and consistent.** Pick 2–3 durations for the whole deck (e.g. 250 ms, 600 ms, 1.2 s) and one easing.
- **Stay inside the template's system.** Motion must not introduce new colours, fonts or decoration (AGENTS.md §3 and §5).

---

## 2. Trigger entrances when a slide opens

Slides in deck-kit decks stay in the DOM; templates switch them with their own classes. To run an entrance every time a slide is shown — in **any** template — mark the slide with a class through `DeckKit.widget`:

```html
<script>
  // After <script src="deck-kit.js">. Adds .is-in while a slide is on screen.
  document.querySelectorAll('[data-motion]').forEach((slide) =>
    DeckKit.widget(slide, {
      enter: () => slide.classList.add('is-in'),
      leave: () => slide.classList.remove('is-in'),
    }));
</script>
```

Put `data-motion` on the slides you animate (`<section class="slide" data-motion>`), then write the CSS against `.is-in`. Because deck-kit calls `enter` on every widget before printing and exporting, **printed and exported slides show the final state**, and `DeckKit.settle` waits for finite animations to finish before capturing.

---

## 3. Entrance patterns

```css
:root {
  --dk-ease: cubic-bezier(0.16, 1, 0.3, 1);   /* ease-out-expo */
  --dk-fast: 250ms; --dk-mid: 600ms; --dk-slow: 1200ms;
}

/* Fade + slide up (most versatile) */
[data-motion] .rise { opacity: 0; transform: translateY(30px);
  transition: opacity var(--dk-mid) var(--dk-ease), transform var(--dk-mid) var(--dk-ease); }
[data-motion].is-in .rise { opacity: 1; transform: none; }

/* Scale in */
[data-motion] .pop { opacity: 0; transform: scale(0.9);
  transition: opacity var(--dk-mid), transform var(--dk-mid) var(--dk-ease); }
[data-motion].is-in .pop { opacity: 1; transform: none; }

/* From the side (pair .from-left with .from-right for image + text) */
[data-motion] .from-left  { opacity: 0; transform: translateX(-50px); transition: opacity var(--dk-mid), transform var(--dk-mid) var(--dk-ease); }
[data-motion] .from-right { opacity: 0; transform: translateX(50px);  transition: opacity var(--dk-mid), transform var(--dk-mid) var(--dk-ease); }
[data-motion].is-in .from-left, [data-motion].is-in .from-right { opacity: 1; transform: none; }

/* Blur in (cinematic; use on one element, it's heavy) */
[data-motion] .unblur { opacity: 0; filter: blur(10px); transition: opacity var(--dk-slow), filter var(--dk-slow) var(--dk-ease); }
[data-motion].is-in .unblur { opacity: 1; filter: none; }

/* Stagger: set --i on each item (0, 1, 2…) */
[data-motion] .stagger > * { opacity: 0; transform: translateY(16px);
  transition: opacity var(--dk-mid) var(--dk-ease), transform var(--dk-mid) var(--dk-ease);
  transition-delay: calc(var(--i, 0) * 90ms + 150ms); }
[data-motion].is-in .stagger > * { opacity: 1; transform: none; }

/* Leaving resets instantly so the entrance replays next time */
[data-motion]:not(.is-in) * { transition-duration: 0s !important; transition-delay: 0s !important; }
```

```html
<section class="slide" data-motion>
  <h2 class="rise">Three findings</h2>
  <ul class="stagger">
    <li style="--i:0">…</li><li style="--i:1">…</li><li style="--i:2">…</li>
  </ul>
</section>
```

**Numbers counting up** — do it in the widget so it restarts on entry:

```js
DeckKit.widget(slide, {
  enter() {
    slide.querySelectorAll('[data-count]').forEach((el) => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 1200;
      const tick = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  },
});
```

---

## 4. Background effects

Only with the template's own colours (its `:root` variables):

```css
/* Gradient mesh — depth from layered radial gradients */
.mesh { background:
  radial-gradient(ellipse at 20% 80%, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--accent-2, var(--accent)) 20%, transparent) 0%, transparent 50%),
  var(--bg); }

/* Grid pattern — subtle structure */
.grid { background-image:
  linear-gradient(color-mix(in srgb, currentColor 6%, transparent) 1px, transparent 1px),
  linear-gradient(90deg, color-mix(in srgb, currentColor 6%, transparent) 1px, transparent 1px);
  background-size: 48px 48px; }

/* Slow drift for an ambient layer (infinite loops are ignored by settle/print) */
@keyframes dk-drift { from { transform: translate(0, 0); } to { transform: translate(-3%, 2%); } }
.drift { animation: dk-drift 18s ease-in-out infinite alternate; }
```

---

## 5. Interactive effects

Use sparingly — the audience watches a projector, not a mouse:

```js
// 3D tilt on hover for a card (skip on touch screens)
if (matchMedia('(hover: hover)').matches) document.querySelectorAll('.tilt').forEach((el) => {
  el.style.transformStyle = 'preserve-3d';
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});
```

For live charts and sliders use `DeckKit.widget` + `DeckKit.plot` / `DeckKit.bind` (AGENTS.md §8) — that is deck-kit's main kind of interactivity.

---

## 6. Always

```css
@media (prefers-reduced-motion: reduce) {
  [data-motion] *, .drift { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
}
```

- Run `scripts/check-deck.mjs` and look at the deck after adding motion: text must not start off-slide or overlap when it lands.
- Heavy effects (big blurs, large box-shadows, many particles) make `export.mjs --pdf` files large — suggest `--compact` for sharing.
- Edit mode (`E`) moves elements with the CSS `translate` property, separate from `transform`, so it doesn't fight these animations.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Entrance doesn't run | The `DeckKit.widget` script must come after `<script src="deck-kit.js">`; the slide needs `data-motion`; the CSS must key on `.is-in` |
| Animates only the first time | Keep the `:not(.is-in)` reset rule so leaving the slide snaps elements back |
| Printed / exported slide is half-animated | Use finite durations; deck-kit waits for finite animations and calls `enter` before printing |
| Template already animates the slide | Don't stack a second system on it — extend the template's own animation classes instead |
| Janky on a slow laptop or projector | Animate only `opacity` / `transform`, fewer simultaneous elements, drop blur |
