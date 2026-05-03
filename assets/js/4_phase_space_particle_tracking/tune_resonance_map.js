// assets/js/4_phase_space_particle_tracking/tune_resonance_map.js

function getElem(id) {
  return document.getElementById(id);
}

const tuneMapState = {
  maxOrder: 6,
  workingPoint: { x: 0.228, y: 0.210 },
  editMode: false,
};

function sampleLineSegment(x1, y1, x2, y2, nSamples = 200) {
  const x = [];
  const y = [];

  for (let i = 0; i < nSamples; i++) {
    const t = i / (nSamples - 1);
    x.push(x1 + t * (x2 - x1));
    y.push(y1 + t * (y2 - y1));
  }

  return { x, y };
}

function generateResonanceLines(maxOrder = 6, xlim = [0, 1], ylim = [0, 1]) {
  const lines = [];
  const seen = new Set();

  const [x0, x1] = xlim;
  const [y0, y1] = ylim;

  for (let order = 1; order <= maxOrder; order++) {
    for (let mx = -order; mx <= order; mx++) {
      for (let my = -order; my <= order; my++) {
        if (mx === 0 && my === 0) continue;
        if (Math.abs(mx) + Math.abs(my) !== order) continue;

        let mxn = mx;
        let myn = my;
        if (mx < 0 || (mx === 0 && my < 0)) {
          mxn = -mx;
          myn = -my;
        }

        const vals = [
          mxn * x0 + myn * y0,
          mxn * x0 + myn * y1,
          mxn * x1 + myn * y0,
          mxn * x1 + myn * y1,
        ];

        const pMin = Math.floor(Math.min(...vals));
        const pMax = Math.ceil(Math.max(...vals));

        for (let p = pMin; p <= pMax; p++) {
          const key = `${order}_${mxn}_${myn}_${p}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const points = [];

          if (myn !== 0) {
            let y = (p - mxn * x0) / myn;
            if (y >= y0 && y <= y1) points.push([x0, y]);

            y = (p - mxn * x1) / myn;
            if (y >= y0 && y <= y1) points.push([x1, y]);
          }

          if (mxn !== 0) {
            let x = (p - myn * y0) / mxn;
            if (x >= x0 && x <= x1) points.push([x, y0]);

            x = (p - myn * y1) / mxn;
            if (x >= x0 && x <= x1) points.push([x, y1]);
          }

          const uniquePoints = [];
          for (const pt of points) {
            const exists = uniquePoints.some(
              q => Math.abs(pt[0] - q[0]) < 1e-10 && Math.abs(pt[1] - q[1]) < 1e-10
            );
            if (!exists) uniquePoints.push(pt);
          }

          if (uniquePoints.length >= 2) {
            const p1 = uniquePoints[0];
            const p2 = uniquePoints[1];

            const sampled = sampleLineSegment(p1[0], p1[1], p2[0], p2[1], 100);

            lines.push({
              order: order,
              mx: mxn,
              my: myn,
              p: p,
              x: sampled.x,
              y: sampled.y,
            });
          }
        }
      }
    }
  }

  return lines;
}

function buildResonanceTraces(lines, maxOrder) {
  const colors = {
    1: "red",
    2: "magenta",
    3: "orange",
    4: "yellow",
    5: "lightgreen",
    6: "lightblue",
  };

  const traces = [];
  const usedLegend = new Set();

  const sortedLines = [...lines].sort((a, b) => b.order - a.order);

  for (const line of sortedLines) {
    const order = line.order;
    const color = colors[order] || "gray";
    const alpha = 0.25 + 0.75 * (maxOrder - order + 1) / maxOrder;

    traces.push({
      x: line.x,
      y: line.y,
      mode: "lines",
      type: "scatter",
      line: {
        color: color,
        width: 1,
      },
      opacity: alpha,
      name: `Order ${order}`,
      legendgroup: `order-${order}`,
      showlegend: !usedLegend.has(order),
      hovertemplate:
        `Order ${order}<br>${line.mx}νx + ${line.my}νy = ${line.p}<extra></extra>`,
    });

    usedLegend.add(order);
  }

  return traces;
}

function buildWorkingPointTrace(x, y, editMode = false) {
  return {
    x: [x],
    y: [y],
    mode: "markers",
    type: "scatter",
    name: "Working Point",
    marker: {
      symbol: "x",
      size: 12,
      color: editMode ? "red" : "black",
      line: {
        width: 2,
      },
    },
    hovertemplate:
      `νx = ${x.toFixed(3)}<br>νy = ${y.toFixed(3)}<extra></extra>`,
  };
}

function pointToLineDistance(x, y, line) {
  return Math.abs(line.mx * x + line.my * y - line.p) /
         Math.sqrt(line.mx * line.mx + line.my * line.my);
}

function getNearestResonances(x, y, lines, nNearest = 3) {
  const distances = lines.map(line => ({
    ...line,
    distance: pointToLineDistance(x, y, line),
  }));

  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, nNearest);
}

function computeStabilityMetric(x, y, lines) {
  const nearest = getNearestResonances(x, y, lines, 1)[0];
  const dMin = nearest.distance;

  const scale = 0.05;
  const score = Math.max(0, Math.min(100, 100 * dMin / scale));

  return {
    dMin: dMin,
    score: score,
  };
}

function updateInfoPanel(lines) {
  const infoDiv = getElem("tune-map-info");
  if (!infoDiv) return;

  const x = tuneMapState.workingPoint.x;
  const y = tuneMapState.workingPoint.y;

  const nearest = getNearestResonances(x, y, lines, 3);
  const stability = computeStabilityMetric(x, y, lines);

  const resHTML = nearest.map((r, i) => {
    return `${i + 1}) ${r.mx}νx + ${r.my}νy = ${r.p} ` +
           `(order ${r.order}, d = ${r.distance.toFixed(4)})`;
  }).join("<br>");

  infoDiv.innerHTML =
    `<b>Working Point:</b> (${x.toFixed(4)}, ${y.toFixed(4)})<br>` +
    `<b>Nearest Resonances:</b><br>${resHTML}<br>` +
    `<b>Stability Metric:</b> ${stability.score.toFixed(1)}/100 ` +
    `(min distance = ${stability.dMin.toFixed(4)})`;
}

function updatePlot() {
  const plotDiv = getElem("tune-map");
  if (!plotDiv) return;

  const maxOrder = tuneMapState.maxOrder;
  const x = tuneMapState.workingPoint.x;
  const y = tuneMapState.workingPoint.y;

  const lines = generateResonanceLines(maxOrder);
  const traces = buildResonanceTraces(lines, maxOrder);
  traces.push(buildWorkingPointTrace(x, y, tuneMapState.editMode));

  const layout = {
    title: { text: "Fractional Tune Resonance Map" },
    xaxis: {
      title: "νx",
      range: [-0.02, 1.02],
      zeroline: false,
    },
    yaxis: {
      title: "νy",
      range: [-0.02, 1.02],
      zeroline: false,
      scaleanchor: "x",
      scaleratio: 1,
    },
    legend: {
      title: { text: "Resonance Order" },
      x: 1.02,
      y: 0.5,
    },
    margin: {
      l: 70,
      r: 150,
      t: 60,
      b: 70,
    },
    hovermode: "closest",
  };

  Plotly.react(plotDiv, traces, layout, { responsive: true });
  updateInfoPanel(lines);
}

function setEditMode(enabled) {
  tuneMapState.editMode = enabled;

  const nuxInput = getElem("nux-input");
  const nuyInput = getElem("nuy-input");
  const btn = getElem("set-working-point-btn");

  if (nuxInput) nuxInput.disabled = !enabled;
  if (nuyInput) nuyInput.disabled = !enabled;

  if (btn) {
    btn.textContent = enabled ? "Cancel" : "Set Working Point";
  }

  updatePlot();

  if (enabled && nuxInput) {
    nuxInput.focus();
    nuxInput.select();
  }
}

function applyWorkingPointFromInputs() {
  const nuxInput = getElem("nux-input");
  const nuyInput = getElem("nuy-input");
  if (!nuxInput || !nuyInput) return;

  const nux = parseFloat(nuxInput.value);
  const nuy = parseFloat(nuyInput.value);

  if (!Number.isFinite(nux) || !Number.isFinite(nuy)) return;
  if (nux < 0 || nux > 1 || nuy < 0 || nuy > 1) return;

  tuneMapState.workingPoint.x = nux;
  tuneMapState.workingPoint.y = nuy;
  setEditMode(false);
}

function initTuneMap() {
  const plotDiv = getElem("tune-map");
  if (!plotDiv) return;

  const btn = getElem("set-working-point-btn");
  const nuxInput = getElem("nux-input");
  const nuyInput = getElem("nuy-input");

  updatePlot();

  if (btn) {
    btn.addEventListener("click", function () {
      setEditMode(!tuneMapState.editMode);
    });
  }

  function onEnterApply(event) {
    if (event.key === "Enter" && tuneMapState.editMode) {
      applyWorkingPointFromInputs();
    }
  }

  if (nuxInput) nuxInput.addEventListener("keydown", onEnterApply);
  if (nuyInput) nuyInput.addEventListener("keydown", onEnterApply);
}

document.addEventListener("DOMContentLoaded", initTuneMap);