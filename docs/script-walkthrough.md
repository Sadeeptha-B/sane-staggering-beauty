# Script Walkthrough: Calm Wiggle Worm

This document explains the current behavior of [script.js](script.js), including movement physics, rendering, the new in-page tuning controls, presets, and localStorage persistence.

## 1. High-Level Overview

The script creates a full-screen canvas animation of a worm-like body that:

- Follows pointer or touch input with a spring-like head movement.
- Maintains a continuous body using chained segments with fixed spacing.
- Anchors the tail below the viewport so the worm appears to rise from the bottom.
- Draws a thick, smooth green body and white eyes.
- Allows live behavior tuning from HUD controls (no code edits required).
- Saves tuning state in localStorage and restores it on refresh.

The main loop is:

1. Read elapsed time per frame.
2. Update physics (head + segment constraints).
3. Draw background.
4. Draw worm.
5. Request next animation frame.

## 2. Core Data Model

The script has five important data groups.

### `PRESETS`

Named movement profiles (`calm`, `heavy`, `snappy`, `stable`) containing:

- `segmentCount`
- `segmentGap`
- `drag`
- `headStiffness`
- `constraintPasses`
- `baseThickness`
- `stretchBoost`
- `wormColor`

### `config`

Active runtime parameters used every frame. This is what sliders and presets mutate.

### `activePreset`

Tracks the selected preset name (`calm`, `heavy`, `snappy`, `stable`, or `custom`).

### `state`

Main simulation state:

Important fields:

- `state.width`, `state.height`, `state.dpr`: canvas/display sizing.
- `state.pointer`: latest pointer or touch location.
- `state.head`: head position and velocity.
- `state.anchor`: fixed tail anchor, intentionally below screen.
- `state.segments`: body chain points from head to tail.
- `state.lastTs`: last frame timestamp.

### `controls`

References to HUD UI elements (settings toggle, presets, sliders, color picker, outputs, reset button, tooltip triggers).

The body is represented as points, not rigid geometry. Smoothness comes from drawing curves through those points.

## 3. Initialization and Resize

Functions: `resize()` and `rebuildSegments(preserveHead)`

Responsibilities:

- Set canvas pixel size with DPR scaling for crisp rendering.
- Reset transform to draw in CSS pixels.
- Rebuild chain from `config` (`segmentCount`, `segmentGap`).
- Place anchor below viewport: `anchorY = height + config.segmentGap * 9`.
- Optionally preserve current head position when rebuilding after live tuning.

Why this matters:

- Rebuilding from `config` keeps simulation consistent with current UI settings.
- Tail anchor below viewport makes the worm appear rooted off-screen.

## 4. Input Handling

Functions:

- `setPointer(event)`
- `pointerEnd()`

Events attached:

- Pointer: down, move, leave, up
- Touch: start, move, end

Current behavior:

- Pointer coordinates always update target head position.
- `pointer.active` is set but currently not used in physics decisions.

Note:

- On resize, worm resets to centered pose.
- During slider-driven rebuilds, head can be preserved to reduce jumpiness.

## 5. Movement and Physics

Function: `update(dt)`

### 5.1 Head movement

The head follows pointer target with spring-like acceleration:

- Compute delta between target and head.
- Add acceleration scaled by `config.headStiffness` and frame duration.
- Apply damping using `config.drag`.
- Integrate velocity into position.

Interpretation:

- Higher `headStiffness` = snappier following.
- Lower `drag` = more inertia/overshoot.

### 5.2 Segment chain constraints

The script uses iterative positional constraints instead of full rigid-body simulation.

Per frame:

1. Force segment 0 to head position.
2. Forward pass: each segment is set exactly `config.segmentGap` away from previous segment.
3. Force last segment to bottom anchor.
4. Backward pass: move back up the chain, preserving exact spacing.
5. Repeat this process `config.constraintPasses` times.

Why repeated passes:

- One pass is usually not enough when both head and tail are constrained.
- Multiple passes reduce stretching and improve shape stability.

This is a common Verlet-style constraint solve pattern using direct point correction.

## 6. Rendering Pipeline

### 6.1 Background

Function: `drawBackdrop()`

- Draws warm gradient from top to bottom.
- Adds two large low-alpha white circles as soft atmosphere.

### 6.2 Worm body

Function: `drawWorm()`

- Computes `speed` from head velocity.
- Converts speed to `stretch` factor.
- Uses stretch to vary line width:
  - `baseWidth = config.baseThickness + stretch * config.stretchBoost`

Body drawing flow:

1. Begin path at head.
2. For each segment pair, draw quadratic curve to midpoint of current and next segment.
3. Continue through full chain.
4. Line to tail.
5. Stroke once with round cap/join.

This creates a single thick smooth ribbon-like body.

### 6.3 Eyes

Eyes are placed relative to local head direction:

- Direction is estimated from head minus segment 1.
- Angle from `atan2`.
- Eyes offset by:
  - `eyeForward`: moves eyes toward front of head.
  - `eyeSide`: separates left/right eyes perpendicular to direction.

Result: eyes rotate naturally as head rotates.

## 7. Main Animation Loop

Function: `frame(ts)`

- Compute `dtRaw = ts - lastTs`.
- Clamp dt between 6 and 28 ms to prevent unstable jumps after frame drops.
- For reduced motion users, scale dt down.
- Run update + draw.
- Call `requestAnimationFrame(frame)`.

Why dt clamp helps:

- Large dt spikes can explode velocity or create geometry glitches.
- Clamping improves visual stability.

## 8. Important Tuning Parameters

Runtime parameters live in `config` (set by preset or slider):

- `segmentCount`: body length resolution.
- `segmentGap`: spacing between points.
- `drag`: damping.
- `headStiffness`: responsiveness.
- `constraintPasses`: chain solver quality/stability.
- `baseThickness`: idle worm thickness.
- `stretchBoost`: extra thickness under speed.
- `wormColor`: body stroke color.

Practical tuning guidance:

- Longer worm: increase `segmentCount`.
- Wider bend spacing: increase `segmentGap`.
- More responsive: raise `headStiffness`.
- Less jitter under stress: increase `constraintPasses`.
- Less elastic feel: increase `drag`.
- Thicker at rest: increase `baseThickness`.
- Stronger speed expansion: increase `stretchBoost` (preset-only for now).
- Change appearance quickly: set `wormColor`.

## 9. On-Page Controls and Presets

Function: `setupControls()`

UI controls:

- Preset dropdown (`calm`, `heavy`, `snappy`, `stable`, `custom`)
- Sliders: stiffness, drag, segment gap, length, stability, thickness
- Color picker: worm body color
- Reset button (returns to `calm`)

Behavior rules:

- Choosing a preset calls `setPreset(name)`.
- Preset switches preserve the currently selected `wormColor`.
- Adjusting any slider marks mode as `custom`.
- Changing worm color marks mode as `custom`.
- Gap/length changes call `rebuildSegments(true)` for safe live updates.
- Reset calls `setPreset("calm", { preserveColor: false })`, which resets color too.

## 10. Persistence (localStorage)

Key: `calm-wiggle-tuning-v1`

Functions:

- `persistTuning()`: writes `{ preset, config }`
- `loadPersistedTuning()`: restores data on startup
- `sanitizeConfig(rawConfig)`: clamps loaded values to valid ranges
- `sanitizeHexColor(value, fallback)`: validates persisted color values

Startup flow:

1. `loadPersistedTuning()`
2. `setupControls()`
3. `resize()`
4. animation loop begins

## 11. Known Concerns and Cleanup Opportunities

### 11.1 UI copy drift

Keep control labels/help text in sync with runtime behavior when adding or removing settings.

### 11.2 Potential line artifacts at extreme angles

Because the body is one very thick stroke, sharp turns can still create visual overlap artifacts in edge cases. If this appears:

- Try reducing `stretchBoost`, or
- Slightly increase `constraintPasses`, or
- Add a subtle bottom clipping strategy.

### 11.3 Unused pointer active flag

`pointer.active` is currently tracked but unused. Options:

- Remove it, or
- Use it to pause movement when pointer is inactive.

### 11.4 Full rebuild on resize

Rebuilding on resize is simple and stable, but resets pose. If preserving pose is desired, implement proportional remapping.

## 12. Ideas for Future Improvement

### 12.1 Better physical realism

- Use Verlet integration fully for all points.
- Add angular damping or curvature limits.

### 12.2 Better appearance controls

- Add a settings panel for:
  - Worm hue
  - Stretch boost slider in UI
  - Eye size/spacing
  - Anchor depth slider

### 12.3 Accessibility and UX

- Add a “show/hide tuning panel” toggle.
- Add keyboard controls as alternative to pointer.
- Add optional pause toggle.

### 12.4 Performance

- Cache gradients if backdrop is static.
- Reduce segment count on low-powered devices.

## 13. Mental Model Summary

A helpful way to think about this script:

- The head is a damped spring chasing your pointer.
- The body is a chain solved by repeated distance constraints.
- The tail is pinned below screen.
- Rendering is a single smooth thick curve through the chain.
- `config` is the single source of truth for movement behavior.
- Presets and sliders are just controlled ways of mutating `config`.

If movement looks wrong, inspect in this order:

1. Head spring constants (`headStiffness`, `drag`)
2. Constraint stability (`constraintPasses`, `segmentGap`)
3. Draw width formula (`baseThickness`, `stretchBoost`)
4. Tail anchor placement (`anchorY`)
5. Persisted values in localStorage (stale data can affect startup feel)

That sequence usually identifies issues quickly.
