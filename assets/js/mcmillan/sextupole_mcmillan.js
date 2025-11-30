// assets/js/mcmillan/sextupole_mcmillan.js

function K0(p, q, a) {
  return p * p - a * p * q + q * q;
}

function KSX(p, q, a) {
  return K0(p, q, a) + p * p * q + p * q * q;
}

// Build 1D linspace
function linspace(min, max, n) {
  const arr = new Array(n);
  const step = (max - min) / (n - 1);
  for (let i = 0; i < n; i++) {
    arr[i] = min + step * i;
  }
  return arr;
}

// Compute K grid for given a, p,q ranges
function computeGrid(a, pMin, pMax, qMin, qMax, n) {
  const P = linspace(pMin, pMax, n);
  const Q = linspace(qMin, qMax, n);

  // Z will be a 2D array Z[i][j] = K(p_i, q_j)
  const Z = new Array(n);
  for (let i = 0; i < n; i++) {
    Z[i] = new Array(n);
    const p = P[i];
    for (let j = 0; j < n; j++) {
      const q = Q[j];
      Z[i][j] = KSX(p, q, a);
    }
  }

  return { P, Q, Z };
}

function initMcMillanPlot() {
  const plotDiv = document.getElementById("mcmillan-plot");
  const gammaInput = document.getElementById("gamma-input");
  const epsInput = document.getElementById("eps-input");
  const ncontoursInput = document.getElementById("ncontours-input")

  const gammaValueSpan = document.getElementById("gamma-value");
  const epsValueSpan = document.getElementById("eps-value");
  const ncontoursValueSpan = document.getElementById("ncontours-value");
  const aValueSpan = document.getElementById("a-value");

  if (!plotDiv || !gammaInput || !epsInput || !ncontoursInput) return;

  function updatePlot() {
    const gamma = parseFloat(gammaInput.value);
    const eps = parseFloat(epsInput.value);
    const ncontours = parseInt(ncontoursInput.value, 10);
    const a = -2 * eps / gamma;

    gammaValueSpan.textContent = gamma.toFixed(2);
    epsValueSpan.textContent = eps.toFixed(2);
    ncontoursValueSpan.textContent = ncontours;
    aValueSpan.textContent = a.toFixed(3);

    const { P, Q, Z } = computeGrid(a, -1.5, 1.5, -1.5, 1.5, 80);

    // --- compute zmin, zmax ---
    let zmin = Infinity;
    let zmax = -Infinity;
    for (let i = 0; i < Z.length; i++) {
        for (let j = 0; j < Z[i].length; j++) {
        const v = Z[i][j];
        if (v < zmin) zmin = v;
        if (v > zmax) zmax = v;
        }
    }
    const size = (zmax - zmin) / ncontours;

    const contour = {
      x: Q,         // x-axis = q
      y: P,         // y-axis = p
      z: Z,
      type: "contour",
      contours: {
        start: zmin,
        end: zmax,
        size: size,
        coloring: "heatmap",
        showlines: true
      },
      colorbar: { title: "K_SX" }
    };

    const layout = {
      title: `Sextupole McMillan Map, a = ${a.toFixed(3)}`,
      xaxis: { title: "q", scaleanchor: "y", scaleratio: 1 },
      yaxis: { title: "p" },
      margin: { t: 40, r: 10, l: 60, b: 50 }
    };

    Plotly.react(plotDiv, [contour], layout);
  }

  gammaInput.addEventListener("input", updatePlot);
  epsInput.addEventListener("input", updatePlot);
  ncontoursInput.addEventListener("input", updatePlot);

  // initial draw
  updatePlot();
}

document.addEventListener("DOMContentLoaded", initMcMillanPlot);