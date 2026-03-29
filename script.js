const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d", { alpha: true });

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STORAGE_KEY = "calm-wiggle-tuning-v1";

const PRESETS = {
    calm: {
        segmentCount: 52,
        segmentGap: 20,
        drag: 0.84,
        headStiffness: 0.2,
        constraintPasses: 4,
        baseThickness: 92,
        stretchBoost: 48,
        wormColor: "#2f7f68",
    },
    heavy: {
        segmentCount: 56,
        segmentGap: 22,
        drag: 0.9,
        headStiffness: 0.15,
        constraintPasses: 5,
        baseThickness: 100,
        stretchBoost: 36,
        wormColor: "#2f7f68",
    },
    snappy: {
        segmentCount: 46,
        segmentGap: 18,
        drag: 0.8,
        headStiffness: 0.28,
        constraintPasses: 4,
        baseThickness: 86,
        stretchBoost: 58,
        wormColor: "#2f7f68",
    },
    stable: {
        segmentCount: 48,
        segmentGap: 19,
        drag: 0.88,
        headStiffness: 0.18,
        constraintPasses: 6,
        baseThickness: 88,
        stretchBoost: 34,
        wormColor: "#2f7f68",
    },
};

const config = { ...PRESETS.calm };
let activePreset = "calm";

const state = {
    width: 0,
    height: 0,
    dpr: 1,
    pointer: { x: 0, y: 0, active: false },
    head: { x: 0, y: 0, vx: 0, vy: 0 },
    anchor: { x: 0, y: 0 },
    segments: [],
    lastTs: performance.now(),
};

const controls = {
    settingsToggle: document.getElementById("settingsToggle"),
    settingsPanel: document.getElementById("settingsPanel"),
    presetSelect: document.getElementById("presetSelect"),
    stiffnessRange: document.getElementById("stiffnessRange"),
    dragRange: document.getElementById("dragRange"),
    gapRange: document.getElementById("gapRange"),
    countRange: document.getElementById("countRange"),
    passesRange: document.getElementById("passesRange"),
    thicknessRange: document.getElementById("thicknessRange"),
    colorInput: document.getElementById("colorInput"),
    stiffnessValue: document.getElementById("stiffnessValue"),
    dragValue: document.getElementById("dragValue"),
    gapValue: document.getElementById("gapValue"),
    countValue: document.getElementById("countValue"),
    passesValue: document.getElementById("passesValue"),
    thicknessValue: document.getElementById("thicknessValue"),
    colorValue: document.getElementById("colorValue"),
    resetTune: document.getElementById("resetTune"),
    tooltipTriggers: Array.from(document.querySelectorAll(".tooltip-trigger")),
};

function closeAllTooltips(exceptTrigger = null) {
    for (const trigger of controls.tooltipTriggers) {
        if (trigger === exceptTrigger) {
            continue;
        }

        trigger.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
    }
}

function sanitizeHexColor(value, fallback) {
    if (typeof value !== "string") {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function setSettingsOpen(isOpen) {
    if (!controls.settingsPanel || !controls.settingsToggle) {
        return;
    }

    controls.settingsPanel.hidden = !isOpen;
    controls.settingsToggle.setAttribute("aria-expanded", String(isOpen));
}

function rebuildSegments(preserveHead = false) {
    const cx = preserveHead ? state.head.x : state.width * 0.5;
    const cy = preserveHead ? state.head.y : state.height * 0.72;

    state.anchor.x = state.width * 0.5;
    state.anchor.y = state.height + config.segmentGap * 9;

    state.pointer.x = cx;
    state.pointer.y = cy;
    state.head.x = cx;
    state.head.y = cy;
    state.head.vx = 0;
    state.head.vy = 0;

    state.segments = [];
    for (let i = 0; i < config.segmentCount; i += 1) {
        state.segments.push({
            x: cx,
            y: cy + i * config.segmentGap * 0.95,
            vx: 0,
            vy: 0,
        });
    }
}

function resize() {
    state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    state.width = window.innerWidth;
    state.height = window.innerHeight;

    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    rebuildSegments(false);
}

function setPointer(event) {
    const point = event.touches ? event.touches[0] : event;
    state.pointer.x = point.clientX;
    state.pointer.y = point.clientY;
    state.pointer.active = true;
}

function pointerEnd() {
    state.pointer.active = false;
}

canvas.addEventListener("pointerdown", setPointer, { passive: true });
canvas.addEventListener("pointermove", setPointer, { passive: true });
canvas.addEventListener("pointerleave", pointerEnd, { passive: true });
canvas.addEventListener("pointerup", pointerEnd, { passive: true });
canvas.addEventListener("touchstart", setPointer, { passive: true });
canvas.addEventListener("touchmove", setPointer, { passive: true });
canvas.addEventListener("touchend", pointerEnd, { passive: true });

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function sanitizeConfig(rawConfig) {
    if (!rawConfig || typeof rawConfig !== "object") {
        return null;
    }

    return {
        segmentCount: Math.round(clamp(Number(rawConfig.segmentCount), 34, 72)),
        segmentGap: Math.round(clamp(Number(rawConfig.segmentGap), 14, 28)),
        drag: clamp(Number(rawConfig.drag), 0.75, 0.95),
        headStiffness: clamp(Number(rawConfig.headStiffness), 0.1, 0.35),
        constraintPasses: Math.round(clamp(Number(rawConfig.constraintPasses), 2, 7)),
        baseThickness: Math.round(clamp(Number(rawConfig.baseThickness), 60, 130)),
        stretchBoost: Math.round(clamp(Number(rawConfig.stretchBoost), 20, 80)),
        wormColor: sanitizeHexColor(rawConfig.wormColor, PRESETS.calm.wormColor),
    };
}

function persistTuning() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                preset: activePreset,
                config,
            })
        );
    } catch {
        // Ignore storage failures (private mode/quota).
    }
}

function loadPersistedTuning() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return;
        }

        const parsed = JSON.parse(raw);
        const parsedPreset = parsed?.preset;
        const hasPreset = typeof parsedPreset === "string" && parsedPreset in PRESETS;

        if (hasPreset && parsedPreset !== "custom") {
            Object.assign(config, PRESETS[parsedPreset]);
            activePreset = parsedPreset;
        }

        const sanitized = sanitizeConfig(parsed?.config);
        if (sanitized) {
            Object.assign(config, sanitized);
        }

        if (parsedPreset === "custom" || !hasPreset) {
            activePreset = "custom";
        }
    } catch {
        // Ignore malformed storage data.
    }
}

function update(dt) {
    const targetX = state.pointer.x;
    const targetY = clamp(state.pointer.y, state.height * 0.18, state.height * 0.9);

    const headDx = targetX - state.head.x;
    const headDy = targetY - state.head.y;

    state.head.vx += headDx * config.headStiffness * dt * 0.06;
    state.head.vy += headDy * config.headStiffness * dt * 0.06;
    state.head.vx *= config.drag;
    state.head.vy *= config.drag;

    state.head.x += state.head.vx;
    state.head.y += state.head.vy;

    state.segments[0].x = state.head.x;
    state.segments[0].y = state.head.y;

    // Head-led and anchor-led passes keep the chain connected and the rear off-screen.
    for (let pass = 0; pass < config.constraintPasses; pass += 1) {
        state.segments[0].x = state.head.x;
        state.segments[0].y = state.head.y;

        for (let i = 1; i < state.segments.length; i += 1) {
            const prev = state.segments[i - 1];
            const seg = state.segments[i];
            const dx = seg.x - prev.x;
            const dy = seg.y - prev.y;
            const distance = Math.hypot(dx, dy) || 1;
            const nx = dx / distance;
            const ny = dy / distance;

            seg.x = prev.x + nx * config.segmentGap;
            seg.y = prev.y + ny * config.segmentGap;
        }

        const tail = state.segments[state.segments.length - 1];
        tail.x = state.anchor.x;
        tail.y = state.anchor.y;

        for (let i = state.segments.length - 2; i >= 0; i -= 1) {
            const next = state.segments[i + 1];
            const seg = state.segments[i];
            const dx = seg.x - next.x;
            const dy = seg.y - next.y;
            const distance = Math.hypot(dx, dy) || 1;
            const nx = dx / distance;
            const ny = dy / distance;

            seg.x = next.x + nx * config.segmentGap;
            seg.y = next.y + ny * config.segmentGap;
        }
    }

    state.head.x = state.segments[0].x;
    state.head.y = state.segments[0].y;
}

function drawBackdrop() {
    const grad = ctx.createLinearGradient(0, 0, state.width, state.height);
    grad.addColorStop(0, "#fff8e7");
    grad.addColorStop(1, "#f6ead2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(state.width * 0.16, state.height * 0.18, 220, 0, Math.PI * 2);
    ctx.arc(state.width * 0.87, state.height * 0.83, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawWorm() {
    const speed = Math.hypot(state.head.vx, state.head.vy);
    const stretch = clamp(speed / 38, 0, 1);
    const baseWidth = config.baseThickness + stretch * config.stretchBoost;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = config.wormColor;

    ctx.beginPath();
    ctx.lineWidth = baseWidth;
    ctx.moveTo(state.segments[0].x, state.segments[0].y);

    for (let i = 1; i < state.segments.length - 1; i += 1) {
        const p = state.segments[i];
        const n = state.segments[i + 1];
        const cx = (p.x + n.x) * 0.5;
        const cy = (p.y + n.y) * 0.5;
        ctx.quadraticCurveTo(p.x, p.y, cx, cy);
    }

    const tail = state.segments[state.segments.length - 1];
    ctx.lineTo(tail.x, tail.y);
    ctx.stroke();

    const head = state.segments[0];
    const prev = state.segments[1] || { x: head.x, y: head.y + 1 };
    const dirX = head.x - prev.x;
    const dirY = head.y - prev.y;
    const angle = Math.atan2(dirY, dirX);

    const eyeForward = 12;
    const eyeSide = 16;
    const eyeRadius = 4.7;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
        head.x + Math.cos(angle) * eyeForward + Math.cos(angle + Math.PI / 2) * eyeSide,
        head.y + Math.sin(angle) * eyeForward + Math.sin(angle + Math.PI / 2) * eyeSide,
        eyeRadius,
        0,
        Math.PI * 2
    );
    ctx.arc(
        head.x + Math.cos(angle) * eyeForward + Math.cos(angle - Math.PI / 2) * eyeSide,
        head.y + Math.sin(angle) * eyeForward + Math.sin(angle - Math.PI / 2) * eyeSide,
        eyeRadius,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function syncControlUI() {
    controls.stiffnessRange.value = config.headStiffness.toFixed(2);
    controls.dragRange.value = config.drag.toFixed(2);
    controls.gapRange.value = String(config.segmentGap);
    controls.countRange.value = String(config.segmentCount);
    controls.passesRange.value = String(config.constraintPasses);
    controls.thicknessRange.value = String(config.baseThickness);
    controls.colorInput.value = config.wormColor;

    controls.stiffnessValue.textContent = Number(config.headStiffness).toFixed(2);
    controls.dragValue.textContent = Number(config.drag).toFixed(2);
    controls.gapValue.textContent = String(config.segmentGap);
    controls.countValue.textContent = String(config.segmentCount);
    controls.passesValue.textContent = String(config.constraintPasses);
    controls.thicknessValue.textContent = String(config.baseThickness);
    controls.colorValue.textContent = config.wormColor;
}

function setPreset(name, options = {}) {
    if (!PRESETS[name]) {
        return;
    }

    const preserveColor = options.preserveColor !== false;
    const previousColor = config.wormColor;

    Object.assign(config, PRESETS[name]);
    if (preserveColor) {
        config.wormColor = previousColor;
    }

    activePreset = name;
    syncControlUI();
    rebuildSegments(true);
    persistTuning();
}

function markCustomPreset() {
    activePreset = "custom";
    controls.presetSelect.value = "custom";
}

function setupControls() {
    if (!controls.presetSelect) {
        return;
    }

    if (controls.settingsToggle && controls.settingsPanel) {
        controls.settingsToggle.addEventListener("click", () => {
            const isOpen = controls.settingsToggle.getAttribute("aria-expanded") === "true";
            setSettingsOpen(!isOpen);
        });
    }

    for (const trigger of controls.tooltipTriggers) {
        trigger.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = trigger.classList.contains("is-open");
            closeAllTooltips(isOpen ? null : trigger);
            trigger.classList.toggle("is-open", !isOpen);
            trigger.setAttribute("aria-expanded", String(!isOpen));
        });
    }

    document.addEventListener("click", () => {
        closeAllTooltips();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAllTooltips();
        }
    });

    controls.settingsPanel?.addEventListener("scroll", () => {
        closeAllTooltips();
    });

    controls.settingsPanel?.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        if (!event.target.closest(".tooltip-trigger")) {
            closeAllTooltips();
        }
    });

    controls.settingsToggle?.addEventListener("click", () => {
        closeAllTooltips();
    });

    controls.presetSelect.addEventListener("change", () => {
        const nextPreset = controls.presetSelect.value;
        if (nextPreset !== "custom") {
            setPreset(nextPreset);
        }
    });

    controls.stiffnessRange.addEventListener("input", () => {
        config.headStiffness = Number(controls.stiffnessRange.value);
        controls.stiffnessValue.textContent = config.headStiffness.toFixed(2);
        markCustomPreset();
        persistTuning();
    });

    controls.dragRange.addEventListener("input", () => {
        config.drag = Number(controls.dragRange.value);
        controls.dragValue.textContent = config.drag.toFixed(2);
        markCustomPreset();
        persistTuning();
    });

    controls.gapRange.addEventListener("input", () => {
        config.segmentGap = Number(controls.gapRange.value);
        controls.gapValue.textContent = String(config.segmentGap);
        rebuildSegments(true);
        markCustomPreset();
        persistTuning();
    });

    controls.countRange.addEventListener("input", () => {
        config.segmentCount = Number(controls.countRange.value);
        controls.countValue.textContent = String(config.segmentCount);
        rebuildSegments(true);
        markCustomPreset();
        persistTuning();
    });

    controls.passesRange.addEventListener("input", () => {
        config.constraintPasses = Number(controls.passesRange.value);
        controls.passesValue.textContent = String(config.constraintPasses);
        markCustomPreset();
        persistTuning();
    });

    controls.thicknessRange.addEventListener("input", () => {
        config.baseThickness = Number(controls.thicknessRange.value);
        controls.thicknessValue.textContent = String(config.baseThickness);
        markCustomPreset();
        persistTuning();
    });

    controls.colorInput.addEventListener("input", () => {
        config.wormColor = sanitizeHexColor(controls.colorInput.value, PRESETS.calm.wormColor);
        controls.colorValue.textContent = config.wormColor;
        markCustomPreset();
        persistTuning();
    });

    controls.resetTune.addEventListener("click", () => {
        setPreset("calm", { preserveColor: false });
    });

    controls.presetSelect.value = activePreset;
    syncControlUI();
    setSettingsOpen(false);
}

function frame(ts) {
    const dtRaw = ts - state.lastTs;
    state.lastTs = ts;

    const dt = clamp(dtRaw, 6, 28);

    update(reduceMotion ? dt * 0.55 : dt);
    drawBackdrop();
    drawWorm();

    requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
loadPersistedTuning();
setupControls();
resize();
requestAnimationFrame(frame);