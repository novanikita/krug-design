// Круг · дизайн-система — the page's few moving parts, in vanilla JS.

// ---- Theme: follow the system, or whatever the button says ----------------
(function theme() {
  const root = document.documentElement;
  const button = document.querySelector(".theme");
  const media = matchMedia("(prefers-color-scheme: dark)");
  function apply(mode) {
    root.dataset.theme = mode;
    button.textContent = mode === "dark" ? "Тёмная тема" : "Светлая тема";
  }
  apply(localStorage.getItem("theme") || (media.matches ? "dark" : "light"));
  button.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    apply(next);
    drawAllRings();
  });
  media.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) { apply(e.matches ? "dark" : "light"); drawAllRings(); }
  });
})();

// ---- Rings: the same geometry the app draws ------------------------------
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const RING_COLORS = ["--kcal", "--protein", "--fat", "--carbs"];

/// A capsule path starting at the top center, clockwise — like the app's
/// StadiumShape.
function stadiumPath(w, h, inset) {
  const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset;
  const r = Math.min(x1 - x0, y1 - y0) / 2;
  const cx = (x0 + x1) / 2;
  return [
    `M ${cx} ${y0}`,
    `L ${x1 - r} ${y0}`,
    `A ${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `L ${x0 + r} ${y1}`,
    `A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    `L ${cx} ${y0}`,
  ].join(" ");
}

function drawStadium(svg, progress, stroke = 13, gap = 3) {
  const w = svg.clientWidth || 360, h = svg.clientHeight || 212;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const track = parseFloat(cssVar("--track-alpha"));
  let out = "";
  RING_COLORS.forEach((v, i) => {
    const color = cssVar(v);
    const inset = stroke / 2 + i * (stroke + gap);
    const d = stadiumPath(w, h, inset);
    const p = Math.max(0, progress[i] || 0);
    out += `<path d="${d}" fill="none" stroke="${withAlpha(color, track)}" stroke-width="${stroke}" />`;
    if (p > 0) {
      // pathLength normalises the dash to 0…1 whatever the real length is.
      const lap = Math.min(p, 1);
      out += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" pathLength="1" stroke-dasharray="${lap} 1" class="fill" />`;
      if (p > 1) {
        const over = Math.min(p - 1, 0.999);
        out += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" pathLength="1" stroke-dasharray="${over} 1" style="filter: drop-shadow(0 0 ${stroke * 0.3}px rgba(0,0,0,.45))" />`;
      }
    }
  });
  svg.innerHTML = out;
}

function drawCircles(svg, progress, stroke, gap) {
  const size = 200;
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  const track = parseFloat(cssVar("--track-alpha"));
  let out = "";
  RING_COLORS.forEach((v, i) => {
    const color = cssVar(v);
    const r = size / 2 - stroke / 2 - i * (stroke + gap);
    if (r <= 0) return;
    const p = Math.min(Math.max(progress[i] || 0, 0), 1);
    out += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${withAlpha(color, track)}" stroke-width="${stroke}" />`;
    if (p > 0) {
      out += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" pathLength="1" stroke-dasharray="${p} 1" transform="rotate(-90 ${size / 2} ${size / 2})" />`;
    }
  });
  svg.innerHTML = out;
}

function drawAllRings() {
  document.querySelectorAll("svg.k-stadium").forEach((svg) => {
    drawStadium(svg, JSON.parse(svg.dataset.progress), +svg.dataset.stroke || 13, +svg.dataset.gap || 3);
  });
  document.querySelectorAll("svg.k-rings").forEach((svg) => {
    drawCircles(svg, JSON.parse(svg.dataset.progress), +svg.dataset.stroke || 24, +svg.dataset.gap || 5);
  });
}
addEventListener("load", drawAllRings);
addEventListener("resize", drawAllRings);

// ---- Pill: a tap moves the thumb and the stadium's numbers ---------------
document.querySelectorAll(".k-pill").forEach((pill) => {
  pill.querySelectorAll("span").forEach((seg) => {
    seg.addEventListener("click", () => {
      pill.querySelectorAll("span").forEach((s) => s.classList.remove("on"));
      seg.classList.add("on");
      const target = pill.dataset.rings && document.querySelector(pill.dataset.rings);
      if (target && seg.dataset.progress) {
        target.dataset.progress = seg.dataset.progress;
        drawAllRings();
      }
    });
  });
});

// ---- Motion demos: click to play --------------------------------------------
document.querySelectorAll(".demo").forEach((demo) => {
  demo.addEventListener("click", () => {
    demo.classList.remove("play");
    void demo.offsetWidth; // restart the transition
    demo.classList.add("play");
    setTimeout(() => demo.classList.remove("play"), 1400);
  });
});
