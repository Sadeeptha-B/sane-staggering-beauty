# Calm Wiggle Tuning Cheatsheet

Use this as a fast reference while adjusting movement feel in [script.js](script.js).

## Where to tune

Live tuning now happens from the HUD on the page:

- Preset dropdown (`calm`, `heavy`, `snappy`, `stable`, `custom`)
- Sliders:
	- Stiffness (`headStiffness`)
	- Drag (`drag`)
	- Segment Gap (`segmentGap`)
	- Length (`segmentCount`)
	- Stability (`constraintPasses`)
	- Thickness (`baseThickness`)
- Color picker:
	- Worm Color (`wormColor`)

The active values are stored in `config` and used by the simulation immediately.

Body width formula in `drawWorm()`:

- `const baseWidth = config.baseThickness + stretch * config.stretchBoost;`

Anchor depth is in `resize()`:

- `const anchorY = state.height + config.segmentGap * 9;`

Persistence key:

- `calm-wiggle-tuning-v1`

Saved values include preset selection plus all runtime config values (including worm color).

---

## Parameter quick meaning

### `HEAD_STIFFNESS`

How strongly the head accelerates toward pointer.

- Lower: softer, delayed follow, more float.
- Higher: snappier, more direct, easier to overshoot.

Suggested range: `0.14` to `0.30`

UI slider range: `0.10` to `0.35`

### `DRAG`

Velocity damping each frame.

- Lower: more inertia and whip.
- Higher: more control, less overshoot.

Suggested range: `0.80` to `0.92`

UI slider range: `0.75` to `0.95`

### `SEGMENT_COUNT`

How many body points are simulated.

- Lower: shorter body, cheaper CPU.
- Higher: longer/smoother body, heavier CPU.

Suggested range: `36` to `72`

UI slider range: `34` to `72`

### `SEGMENT_GAP`

Distance between consecutive body points.

- Lower: tighter bends, denser chain.
- Higher: larger bends, more stretched look.

Suggested range: `14` to `24`

UI slider range: `14` to `28`

### `CONSTRAINT_PASSES`

How many times constraints are solved each frame.

- Lower: faster but can stretch/jitter.
- Higher: more stable and rigid, more CPU.

Suggested range: `3` to `6`

UI slider range: `2` to `7`

### `baseWidth` formula

`baseWidth = minWidth + stretch * widthBoost`

- Increase `minWidth` for thicker idle body.
- Increase `widthBoost` for stronger speed-based stretching.

Default calm: `92 + stretch * 48`

Note: `stretchBoost` is currently preset-driven (not on a slider yet).

### `wormColor`

Body stroke color of the worm.

- Use softer mid-saturation greens for a calmer look.
- Use higher-contrast colors if the worm gets lost against the background.

Input type: color picker (`#RRGGBB`)

### `anchorY`

How far below screen the tail is pinned.

- Lower value (closer to screen): tail can appear too visible.
- Higher value: stronger rooted-from-below illusion.

Try: `state.height + SEGMENT_GAP * 7` to `* 12`

Current implementation: `state.height + config.segmentGap * 9`

---

## Ready-to-use presets

Apply one full preset at a time from the dropdown.

## 1) Calm / Fidget (default-ish)

```js
const SEGMENT_COUNT = 52;
const SEGMENT_GAP = 20;
const DRAG = 0.84;
const HEAD_STIFFNESS = 0.20;
const CONSTRAINT_PASSES = 4;
// baseWidth = 92 + stretch * 48
```

Use when: you want smooth, controlled movement.

## 2) Heavy / Gooey

```js
const SEGMENT_COUNT = 56;
const SEGMENT_GAP = 22;
const DRAG = 0.90;
const HEAD_STIFFNESS = 0.15;
const CONSTRAINT_PASSES = 5;
// baseWidth = 100 + stretch * 36
```

Use when: you want a weighty worm with slow response.

## 3) Snappy / Playful

```js
const SEGMENT_COUNT = 46;
const SEGMENT_GAP = 18;
const DRAG = 0.80;
const HEAD_STIFFNESS = 0.28;
const CONSTRAINT_PASSES = 4;
// baseWidth = 86 + stretch * 58
```

Use when: you want fast reaction and dramatic stretching.

## 4) Stable / Artifact-Resistant

```js
const SEGMENT_COUNT = 48;
const SEGMENT_GAP = 19;
const DRAG = 0.88;
const HEAD_STIFFNESS = 0.18;
const CONSTRAINT_PASSES = 6;
// baseWidth = 88 + stretch * 34
```

Use when: extreme bends cause occasional visual artifacts.

All presets currently default to the same worm color, but color can be changed independently.

Switching presets keeps your current selected color.

The Reset button restores the full Calm profile, including color.

When you touch a slider, the preset automatically switches to `custom`.

---

## Quick symptom -> fix guide

### Worm feels too sluggish

- Increase `HEAD_STIFFNESS` by `+0.02`
- Lower `DRAG` by `-0.02`

### Worm feels too twitchy

- Decrease `HEAD_STIFFNESS` by `-0.02`
- Raise `DRAG` by `+0.02`

### Body stretches or disconnects under fast motion

- Increase `CONSTRAINT_PASSES` by `+1`
- Reduce `stretchBoost` in preset values

### Shape looks too stiff

- Lower `CONSTRAINT_PASSES` by `-1`
- Lower `DRAG` a bit

### Tail looks too visible

- Increase anchor depth multiplier (`* 9` -> `* 10` or `* 11`)

### Too much CPU usage on low-end devices

- Reduce `SEGMENT_COUNT`
- Reduce `CONSTRAINT_PASSES`

---

## Safe tuning workflow

1. Change only one parameter group at a time.
2. Test with both slow drags and fast flicks.
3. Keep a note of previous values before each change.
4. After finding a good feel, fine-tune only width formula.
5. Refresh page once to verify your settings persist as expected.

Recommended order:

1. `HEAD_STIFFNESS`, `DRAG`
2. `CONSTRAINT_PASSES`
3. `SEGMENT_COUNT`, `SEGMENT_GAP`
4. `baseThickness`
5. `stretchBoost` (via preset edits)
6. `wormColor`
7. `anchorY`

---

## Optional next improvements

- Add URL-based presets (`?preset=heavy`).
- Add a slider for `stretchBoost`.
- Add a slider for anchor depth multiplier (`* 9`).
- Add import/export JSON for sharing tuning profiles.
