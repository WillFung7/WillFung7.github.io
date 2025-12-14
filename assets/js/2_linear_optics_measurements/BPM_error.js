// Simple Gaussian RNG (mean 0, std 1)
function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function exponential_sinusoid_func(n, a, b, c, d) {
    // n is an array
    let result = new Array(n.length);
    for (let i = 0; i < n.length; i++) {
        result[i] = a * Math.exp(-b * n[i] * n[i]) *
                    Math.sin(2 * Math.PI * c * n[i] + d);
    }
    return result;
}

function Add_BPM_errors(X, BPM_Errors, currentXNoise = null, currentYNoise = null) {
    let theta = BPM_Errors[0];
    let C = BPM_Errors[1];
    let g_x = BPM_Errors[2];
    let g_y = BPM_Errors[3];
    let s_x = BPM_Errors[4];
    let s_y = BPM_Errors[5];

    let n_turns = X[0].length;

    // Matrices
    let C_mat = [
        [1,  C],
        [C,  1]
    ];

    let G_mat = [
        [g_x, 0],
        [0,   g_y]
    ];

    let R_mat = [
        [ Math.cos(theta),  Math.sin(theta)],
        [-Math.sin(theta),  Math.cos(theta)]
    ];

    // Matrix multiply helper
    function matMult(A, B) {
        return [
            [
                A[0][0] * B[0][0] + A[0][1] * B[1][0],
                A[0][0] * B[0][1] + A[0][1] * B[1][1]
            ],
            [
                A[1][0] * B[0][0] + A[1][1] * B[1][0],
                A[1][0] * B[0][1] + A[1][1] * B[1][1]
            ]
        ];
    }

    let M = matMult(R_mat, matMult(C_mat, G_mat));
    let scale = 1 / Math.sqrt(1 - C*C);

    // Apply transformation
    let X_error = [new Array(n_turns), new Array(n_turns)];

    for (let i = 0; i < n_turns; i++) {
        X_error[0][i] = scale * (M[0][0] * X[0][i] + M[0][1] * X[1][i]);
        X_error[1][i] = scale * (M[1][0] * X[0][i] + M[1][1] * X[1][i]);
    }

    // Add Gaussian BPM noise (p5.js)
    let x_error = new Array(n_turns);
    let y_error = new Array(n_turns);

    for (let i = 0; i < n_turns; i++) {
        const z_x = currentXNoise ? currentXNoise[i] : randn();
        const z_y = currentYNoise ? currentYNoise[i] : randn();
        x_error[i] = X_error[0][i] + s_x * z_x;
        y_error[i] = X_error[1][i] + s_y * z_y;
  }

    return [x_error, y_error];
}

const DEFAULTS = {
  Ampx: -0.3,
  Ampy: -0.3,
  dnux: 0.0,
  dnuy: 0.0,
  tilt: 0.0,
  coup: 0.0,
  gx: 0.0,
  gy: 0.0,
  sx: 0.0,
  sy: 0.0
};

const N_TURNS = 200;

// persistent noise realization
let CURRENT_X_NOISE = null;
let CURRENT_Y_NOISE = null;

function resampleNoise(nTurns) {
  CURRENT_X_NOISE = Array.from({ length: nTurns }, () => randn());
  CURRENT_Y_NOISE = Array.from({ length: nTurns }, () => randn());
}

function getElem(id) {
  return document.getElementById(id);
}

function initBPMErrorPlot() {
  const plotDiv = getElem("BPMError-plot");
  const AmpxInput = getElem("Ampx-input");
  const AmpyInput = getElem("Ampy-input");
  const dnuxInput = getElem("dnux-input");
  const dnuyInput = getElem("dnuy-input");
  const tiltInput = getElem("tilt-input");
  const coupInput = getElem("coup-input");
  const gxInput = getElem("gx-input");
  const gyInput = getElem("gy-input");
  const sxInput = getElem("sx-input");
  const syInput = getElem("sy-input");

  const AmpxValueSpan = getElem("Ampx-value");
  const AmpyValueSpan = getElem("Ampy-value");
  const dnuxValueSpan = getElem("dnux-value");
  const dnuyValueSpan = getElem("dnuy-value");
  const tiltValueSpan = getElem("tilt-value");
  const coupValueSpan = getElem("coup-value");
  const gxValueSpan = getElem("gx-value");
  const gyValueSpan = getElem("gy-value");
  const sxValueSpan = getElem("sx-value");
  const syValueSpan = getElem("sy-value");

  // require the essentials; N-input is optional (we use DEFAULTS.N if missing)
  if (!plotDiv || !AmpxInput || !AmpyInput || !dnuxInput || !dnuyInput || !tiltInput || !coupInput || !gxInput || !gyInput || !sxInput || !syInput ||
      !AmpxValueSpan || !AmpyValueSpan || !dnuxValueSpan || !dnuyValueSpan || !tiltValueSpan || !coupValueSpan || !gxValueSpan || !gyValueSpan || !sxValueSpan || !syValueSpan) {
    console.warn("BPMError: missing required DOM elements, aborting initBPMErrorPlot");
    return;
  }

  // slider listeners – ALWAYS call updatePlot()
  function wireSlider(input, span, isInt = false) {
    input.addEventListener("input", () => {
        span.textContent = parseFloat(input.value).toFixed(3);
        updatePlot();
    });
    // initialize label
    span.textContent = parseFloat(input.value).toFixed(3);
  }

  wireSlider(AmpxInput, AmpxValueSpan);
  wireSlider(AmpyInput, AmpyValueSpan);
  wireSlider(dnuxInput, dnuxValueSpan);
  wireSlider(dnuyInput, dnuyValueSpan);
  wireSlider(tiltInput, tiltValueSpan);
  wireSlider(coupInput, coupValueSpan);
  wireSlider(gxInput, gxValueSpan);
  wireSlider(gyInput, gyValueSpan);
  wireSlider(sxInput, sxValueSpan);
  wireSlider(syInput, syValueSpan);

  // reset button 
  const resetButton = getElem("reset-button");
  const resampleButton = getElem("resample-button");

  if (resampleButton) {
    resampleButton.addEventListener("click", () => {
      resampleNoise(N_TURNS);  // new realization of N(0,1) for each turn
      updatePlot();
    });
  }
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Reset sliders (only set those that exist)
      if (getElem("Ampx-input")) getElem("Ampx-input").value = DEFAULTS.Ampx;
      if (getElem("Ampy-input")) getElem("Ampy-input").value = DEFAULTS.Ampy;
      if (getElem("dnux-input")) getElem("dnux-input").value = DEFAULTS.dnux;
      if (getElem("dnuy-input")) getElem("dnuy-input").value = DEFAULTS.dnuy;
      if (getElem("tilt-input")) getElem("tilt-input").value = DEFAULTS.tilt;
      if (getElem("coup-input")) getElem("coup-input").value = DEFAULTS.coup;
      if (getElem("gx-input")) getElem("gx-input").value = DEFAULTS.gx;
      if (getElem("gy-input")) getElem("gy-input").value = DEFAULTS.gy;
      if (getElem("sx-input")) getElem("sx-input").value = DEFAULTS.sx;
      if (getElem("sy-input")) getElem("sy-input").value = DEFAULTS.sy;

      // Update text spans
      if (getElem("Ampx-value")) getElem("Ampx-value").textContent = DEFAULTS.Ampx.toFixed(3);
      if (getElem("Ampy-value")) getElem("Ampy-value").textContent = DEFAULTS.Ampy.toFixed(3);
      if (getElem("dnux-value")) getElem("dnux-value").textContent = DEFAULTS.dnux.toFixed(3);
      if (getElem("dnuy-value")) getElem("dnuy-value").textContent = DEFAULTS.dnuy.toFixed(3);
      if (getElem("tilt-value")) getElem("tilt-value").textContent = DEFAULTS.tilt.toFixed(3);
      if (getElem("coup-value")) getElem("coup-value").textContent = DEFAULTS.coup.toFixed(3);
      if (getElem("gx-value")) getElem("gx-value").textContent = DEFAULTS.gx.toFixed(3);
      if (getElem("gy-value")) getElem("gy-value").textContent = DEFAULTS.gy.toFixed(3);
      if (getElem("sx-value")) getElem("sx-value").textContent = DEFAULTS.sx.toFixed(3);
      if (getElem("sy-value")) getElem("sy-value").textContent = DEFAULTS.sy.toFixed(3);
      // clear persistent noise so default behavior regenerates
      CURRENT_X_NOISE = null;
      CURRENT_Y_NOISE = null;

      // Redraw plot
      updatePlot();
    });
  }

  // initial draw
  updatePlot();
}


function updatePlot() {
    const plotDiv = getElem("BPMError-plot");
    if (!plotDiv) return;

    // Read current slider values
    const Ampx = parseFloat(getElem("Ampx-input").value);
    const Ampy = parseFloat(getElem("Ampy-input").value);
    const dnux = parseFloat(getElem("dnux-input").value);
    const dnuy = parseFloat(getElem("dnuy-input").value);
    const tilt = parseFloat(getElem("tilt-input").value);
    const coup = parseFloat(getElem("coup-input").value);
    const gx = parseFloat(getElem("gx-input").value);
    const gy = parseFloat(getElem("gy-input").value);
    const sx = parseFloat(getElem("sx-input").value);
    const sy = parseFloat(getElem("sy-input").value);

    const b = 1.23287680e-4;
    const nu = 3.1e-1;
    const nux = dnux + nu;
    const nuy = dnuy + nu;

    const poptx = [Ampx, b, nux, 6.38e-3];
    const popty = [Ampy, b, nuy, -2.7e-3];

    const n_turns = N_TURNS;

    // Make array [0, 1, 2, ..., n_turns-1]
    const n_arr = Array.from({length: n_turns}, (_, i) => i);

    // if somehow noise arrays missing/short, regenerate
    if (!CURRENT_X_NOISE || CURRENT_X_NOISE.length !== n_turns) {
        resampleNoise(n_turns);
    }

    // ===============================
    // Generate BPM signals
    // ===============================
    const BPM_x = exponential_sinusoid_func(n_arr, ...poptx);
    const BPM_y = exponential_sinusoid_func(n_arr, ...popty);

    // BPM_data is 2×N
    const BPM_data = [BPM_x, BPM_y];
    // ===============================
    // BPM error (truth + random offsets)
    // ===============================
    const True_BPM_vals = [0, 0, 1, 1, 0, 0];

    const delta_BPM_Errors = [
        tilt,  // Tilt
        coup,  // Coupling
        gx,    // Gain x
        gy,    // Gain y
        sx,    // noise x
        sy     // noise y
    ];

    let BPM_Errors = True_BPM_vals.map((v, i) => v + delta_BPM_Errors[i]);

    // ===============================
    // Apply BPM errors
    // ===============================
    const [BPM_x_err, BPM_y_err] = Add_BPM_errors(BPM_data, BPM_Errors, CURRENT_X_NOISE, CURRENT_Y_NOISE);

    // Differences
    const x_diff = BPM_x.map((v, i) => v - BPM_x_err[i]);
    const y_diff = BPM_y.map((v, i) => v - BPM_y_err[i]);

    // Plot with Plotly
    const traces = [
    // Top-left: x true + error
    {
        x: n_arr,
        y: BPM_x,
        name: "True",
        mode: "lines",
        line: { color: "black" },
        showlegend: false,
        xaxis: "x",
        yaxis: "y",
    },
    {
        x: n_arr,
        y: BPM_x_err,
        name: "Error",
        mode: "lines",
        line: { color: "red"},
        showlegend: false,
        opacity: 0.6,
        xaxis: "x",
        yaxis: "y"
    },

    // Top-right: y true + error
    {
        x: n_arr,
        y: BPM_y,
        name: "True",
        mode: "lines",
        line: { color: "black" },
        xaxis: "x2",
        yaxis: "y2"
    },
    {
        x: n_arr,
        y: BPM_y_err,
        name: "Error",
        mode: "lines",
        line: { color: "red"},
        opacity: 0.6,
        xaxis: "x2",
        yaxis: "y2"
    },

    // Bottom-left: x difference
    {
        x: n_arr,
        y: x_diff,
        name: "x Difference",
        mode: "lines",
        line: { color: "black" },
        showlegend: false,
        xaxis: "x3",
        yaxis: "y3"
    },

    // Bottom-right: y difference
    {
        x: n_arr,
        y: y_diff,
        name: "y Difference",
        mode: "lines",
        line: { color: "black" },
        showlegend: false,
        xaxis: "x4",
        yaxis: "y4"
    }
    ];

    const layout = {
    grid: {
        rows: 2,
        columns: 2,
        pattern: "independent",   // each subplot has its own axes
        roworder: "top to bottom",
        xgap: 0.16,               // horizontal spacing (like constrained padding)
        ygap: 0.14                // vertical spacing
    },

    // axis titles (set per subplot)
    xaxis3: { title: "turn #" },
    xaxis4: { title: "turn #" },
    yaxis:  { title: "x [mm]" },
    yaxis2: { title: "y [mm]" },
    yaxis3: { title: "x Difference [mm]" },
    yaxis4: { title: "y Difference [mm]" },

    showlegend: true,
    legend: { orientation: "h", x: 0.85, xanchor: "center", y: 1.00 },
    margin: { l: 70, r: 20, t: 60, b: 60 },
    title: { text: "BPM Signals with Errors" }
    };

    // Make the plot
    Plotly.newPlot("BPMError-plot", traces, layout);
}

document.addEventListener("DOMContentLoaded", initBPMErrorPlot);