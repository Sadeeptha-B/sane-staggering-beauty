# Sane Staggering Beauty

A calm, fidget-friendly worm interaction inspired by Staggering Beauty.

This version is intentionally sensory-safe:
- No flashing visuals
- No sound effects
- Smooth, tuneable movement

## Highlights

- Full-screen interactive worm animation on HTML canvas
- Spring-like head tracking with chained body constraints
- Tail anchored below the viewport so the worm emerges from below
- Live settings panel with presets and tuning sliders
- Worm color picker
- Mobile-friendly tap tooltips in settings
- Local persistence of tuning and color between refreshes

## Project Structure

- index.html: App structure and settings UI
- styles.css: Visual theme and responsive layout
- script.js: Animation, physics, controls, and persistence logic
- docs/script-walkthrough.md: Detailed technical walkthrough
- docs/tuning-cheatsheet.md: Practical tuning guide and presets


## How To Use

1. Move, drag, or flick the pointer to drive the worm.
2. Click Settings to open tuning controls.
3. Select a preset or tune values manually.
4. Use the color picker to set worm color.
5. Your settings are automatically saved and restored on refresh.

## Tuning Controls

- Preset: Applies a movement profile
- Stiffness: How quickly the head chases the pointer
- Drag: Damping for momentum and overshoot
- Segment Gap: Distance between body points
- Length: Number of body points
- Stability: Constraint passes per frame
- Thickness: Base body width
- Color: Worm body color
- Reset: Restores full Calm defaults

Note:
- Switching presets keeps your selected color
- Reset restores Calm values including color

## Persistence

Settings are stored in localStorage using:
- calm-wiggle-tuning-v1

Stored values include:
- Active preset
- Movement configuration
- Worm color

## Accessibility and Interaction Notes

- Tooltips support hover, keyboard focus, and tap-to-toggle
- Escape closes open tooltips
- Clicking outside tooltip triggers closes tooltips
- Settings panel opens and collapses from the same Settings button

## Acknowledgement

Inspired by Staggering Beauty:
- https://staggeringbeauty.io

GPT 5.3 Codex Medium 
