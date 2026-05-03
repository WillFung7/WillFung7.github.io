// assets/js/4_phase_space_particle_tracking/1D_henon_map.js

function trackMaxRadius(q0, p0, nu, N_turn, r_stop = 5.0) {
  let q = q0;
  let p = p0;
  let rmax = 0.0;

  const Q = [];
  const P = [];

  const phi = 2 * Math.PI * nu;
  const c = Math.cos(phi);
  const s = Math.sin(phi);

  for (let i = 0; i < N_turn; i++) {
    // nonlinear kick
    p -= q * q;

    // linear rotation
    const qNew = c * q + s * p;
    const pNew = -s * q + c * p;

    q = qNew;
    p = pNew;

    Q.push(q);
    P.push(p);

    const r = Math.hypot(q, p);
    rmax = Math.max(rmax, r);

    if (!Number.isFinite(r) || r > r_stop) {
      return [null, null, Infinity];
    }
  }

  return [Q, P, rmax];
}

function findDynamicAperture(
    nu,
    N_turn,
    p0 = 0.0,
    q_lo = 0.0,
    q_hi = 5.0,
    r_stop = 5.0,
    tol = 1e-4
) {
    // ensure q_hi is unstable (expand if needed)
    let [Q, P, rmax] = trackMaxRadius(q_hi, p0, nu, N_turn, r_stop);

    while (Number.isFinite(rmax)) {
        q_hi *= 1.5;
        [Q, P, rmax] = trackMaxRadius(q_hi, p0, nu, N_turn, r_stop);

        if (q_hi > 1e3) {
            break;
        }
    }

    // bisection
    while ((q_hi - q_lo) > tol) {
        const qm = 0.5 * (q_lo + q_hi);
        [Q, P, rmax] = trackMaxRadius(qm, p0, nu, N_turn, r_stop);

        if (Number.isFinite(rmax)) {
            q_lo = qm; // survived => can go higher
        } else {
            q_hi = qm; // blew up => too high
        }
    }

    return q_lo;
}

function linspace(min, max, n) {
  if (n <= 0) return [];
  if (n === 1) return [min];

  const arr = new Array(n);
  const step = (max - min) / (n - 1);
  for (let i = 0; i < n; i++) {
    arr[i] = min + step * i;
  }
  return arr;
}

const DEFAULTS = {
  nu: 0.2493,
  r_max: 0.5,
  N_part: 10,
  N_turn: 500
};

function getElem(id) {
  return document.getElementById(id);
}

// function wireSliderAndNumber(slider, numberInput, span, isInt = false) {
//   if (!slider || !numberInput || !span) return;

//   const formatValue = (v) => {
//     if (isInt) return (parseInt(v, 10) || 0).toString();
//     return parseFloat(v).toFixed(4);
//   };

//   const clampToRange = (val, input) => {
//     const min = parseFloat(input.min);
//     const max = parseFloat(input.max);
//     let v = parseFloat(val);

//     if (!Number.isFinite(v)) v = parseFloat(input.value);
//     if (Number.isFinite(min)) v = Math.max(v, min);
//     if (Number.isFinite(max)) v = Math.min(v, max);

//     return v;
//   };

//   // slider -> number
//   slider.addEventListener("input", () => {
//     numberInput.value = slider.value;
//     span.textContent = formatValue(slider.value);
//     updatePlot();
//   });

//   // number -> slider
//   numberInput.addEventListener("input", () => {
//     const v = clampToRange(numberInput.value, numberInput);
//     slider.value = v;
//     numberInput.value = v;
//     span.textContent = formatValue(v);
//     updatePlot();
//   });

//   // initialize
//   numberInput.value = slider.value;
//   span.textContent = formatValue(slider.value);
// }

function init1DHenonPlot() {
  const plotDiv = getElem("1D_henon_map");
  const nuInput = getElem("nu-input");
  const nuNumberInput = getElem("nu-number-input");
  const r_maxInput = getElem("r_max-input");
  const N_partInput = getElem("N_part-input");
  const N_turnInput = getElem("N_turn-input");

  const r_maxValueSpan = getElem("r_max-value");
  const DAValueSpan = getElem("DA-value");
  const N_partValueSpan = getElem("N_part-value");
  const N_turnValueSpan = getElem("N_turn-value");

  if (!plotDiv || !nuInput || !nuNumberInput || !r_maxInput || !N_partInput || !N_turnInput ||
      !r_maxValueSpan || !DAValueSpan || !N_partValueSpan || !N_turnValueSpan) {
    console.warn("1DHenon: missing required DOM elements, aborting init1DHenonPlot");
    return;
  }

  function wireSlider(input, span, isInt = false) {
    if (!input || !span) return;

    const updateLabel = () => {
      if (isInt) {
        span.textContent = (parseInt(input.value, 10) || 0).toString();
      } else {
        span.textContent = parseFloat(input.value).toFixed(4);
      }
    };

    input.addEventListener("input", () => {
      updateLabel();
      updatePlot();
    });

    updateLabel();
  }

  // nu slider -> number input, update plot immediately
  nuInput.addEventListener("input", () => {
    nuNumberInput.value = parseFloat(nuInput.value).toFixed(4);
    updatePlot();
  });

  // nu number input -> apply only on Enter
  nuNumberInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    let v = parseFloat(nuNumberInput.value);
    if (!Number.isFinite(v)) {
      nuNumberInput.value = parseFloat(nuInput.value).toFixed(4);
      return;
    }

    const min = parseFloat(nuNumberInput.min);
    const max = parseFloat(nuNumberInput.max);
    v = Math.min(Math.max(v, min), max);

    nuInput.value = v.toString();
    nuNumberInput.value = v.toFixed(4);
    updatePlot();
  });

  nuNumberInput.value = parseFloat(nuInput.value).toFixed(4);

  wireSlider(r_maxInput, r_maxValueSpan, false);
  wireSlider(N_partInput, N_partValueSpan, true);
  wireSlider(N_turnInput, N_turnValueSpan, true);

  const resetButton = getElem("reset-button");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      nuInput.value = DEFAULTS.nu;
      nuNumberInput.value = DEFAULTS.nu.toFixed(4);
      r_maxInput.value = DEFAULTS.r_max;
      N_partInput.value = DEFAULTS.N_part;
      N_turnInput.value = DEFAULTS.N_turn;

      r_maxValueSpan.textContent = DEFAULTS.r_max.toFixed(4);
      N_partValueSpan.textContent = DEFAULTS.N_part.toString();
      N_turnValueSpan.textContent = DEFAULTS.N_turn.toString();

      updatePlot();
    });
  }

  const matchDAButton = getElem("match-DA-button");
  if (matchDAButton) {
    matchDAButton.addEventListener("click", () => {
      if (!r_maxInput || !DAValueSpan || !r_maxValueSpan) return;

      const da = parseFloat(DAValueSpan.textContent);
      if (!Number.isFinite(da)) return;

      const min = parseFloat(r_maxInput.min);
      const max = parseFloat(r_maxInput.max);
      const value = Math.min(Math.max(da, min), max);

      r_maxInput.value = value.toString();
      r_maxValueSpan.textContent = value.toFixed(4);

      updatePlot();
    });
  }

  updatePlot();
}

function updatePlot() {
  const plotDiv = getElem("1D_henon_map");
  if (!plotDiv) return;

  // Read current slider values
  const nu = parseFloat(getElem("nu-input").value);
  const r_max = parseFloat(getElem("r_max-input").value);
  const N_part = parseInt(getElem("N_part-input").value, 10);
  const N_turn = parseInt(getElem("N_turn-input").value, 10);

  const q0 = linspace(0, r_max, N_part);
  const p0 = linspace(0, 0, N_part);

  const Q_arr = [];
  const P_arr = [];

  // Track each particle and collect their trajectories
  for (let i = 0; i < N_part; i++) {
    const [Q, P, rmax] = trackMaxRadius(q0[i], p0[i], nu, N_turn);

    if (!Q || !P || !Number.isFinite(rmax)) {
      firstUnstableIndex = i;
      break;
    }

    Q_arr.push(...Q);
    P_arr.push(...P);
  }

  // correct DA display:
  const DA = findDynamicAperture(nu, N_turn);
  const DASpan = getElem("DA-value");
  if (DASpan && Number.isFinite(DA)) {
    DASpan.textContent = DA.toFixed(4);
  }

  // Update the plot
  const trace = {
    x: Q_arr,
    y: P_arr,
    mode: "markers",
    type: "scatter",
    name: "1D Hénon Map",
    marker: {
      size: 3,
    },
  };

  const layout = {
    title: { text: "1D Hénon Map" },
    xaxis: {
      title: "q",
    },
    yaxis: {
      title: "p",
      scaleanchor: "x",
      scaleratio: 1,
    },
  };

  Plotly.react(plotDiv, [trace], layout);
}

document.addEventListener("DOMContentLoaded", init1DHenonPlot);