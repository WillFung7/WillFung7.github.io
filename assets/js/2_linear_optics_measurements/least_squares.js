// Helper: Gaussian random number (Box-Muller)
function randomGaussian(mean = 0, std = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Helper: linspace
function linspace(start, end, N) {
  const arr = [];
  for (let i = 0; i < N; i++) {
    arr.push(start + (end - start) * i / (N - 1));
  }
  return arr;
}

// Helper: mean of array
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Helper: subtract scalar from array
function subtract(arr, val) {
  return arr.map(x => x - val);
}

function ordinary_least_squares(X, y) {
  const N = X.length;
  const sumX = X.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = X.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = X.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / N;
  
  return [slope, intercept];
}

function total_least_squares(X, y) {
  // A = [X, y] stacked (N x 2)
  const A = X.map((xi, i) => [xi, y[i]]);
  
  // Center: subtract mean of each column
  const meanX = mean(X);
  const meanY = mean(y);
  const A_centered = A.map(row => [row[0] - meanX, row[1] - meanY]);
  
  // SVD using numeric.js
  const svd = numeric.svd(A_centered);
  const V = svd.V; // right singular vectors
  
  // direction = last column of V (smallest singular value)
  const numCols = V[0].length;
  const direction = V.map(row => row[numCols - 1]);
  
  const slope = -direction[0] / direction[1];
  const intercept = meanY - slope * meanX;
  
  return [slope, intercept];
}

const DEFAULTS = {
  xn: 0.5,
  yn: 0.5,
  m: 2.0,
  N: 200
};

// persistent noise realization
let CURRENT_X_NOISE = null;
let CURRENT_Y_NOISE = null;

function resampleNoise(N, xn, yn) {
  CURRENT_X_NOISE = Array.from({ length: N }, () => randomGaussian(0, xn));
  CURRENT_Y_NOISE = Array.from({ length: N }, () => randomGaussian(0, yn));
}

function getElem(id) {
  return document.getElementById(id);
}

function initLSPlot() {
  const plotDiv = getElem("LS-plot");
  const xnInput = getElem("xn-input");
  const ynInput = getElem("yn-input");
  const mInput = getElem("m-input");
  const NInput = getElem("N-input"); // may be null on the page

  const xnValueSpan = getElem("xn-value");
  const ynValueSpan = getElem("yn-value");
  const mValueSpan = getElem("m-value");
  const NValueSpan = getElem("N-value");

  // require the essentials; N-input is optional (we use DEFAULTS.N if missing)
  if (!plotDiv || !xnInput || !ynInput || !mInput ||
      !xnValueSpan || !ynValueSpan || !mValueSpan || !NValueSpan) {
    console.warn("LS: missing required DOM elements, aborting initLSPlot");
    return;
  }

  // slider listeners – ALWAYS call updatePlot()
  function wireSlider(input, span, isInt = false) {
    input.addEventListener("input", () => {
      if (isInt) {
        const v = parseInt(input.value, 10) || 0;
        span.textContent = v.toString();
      } else {
        span.textContent = parseFloat(input.value).toFixed(2);
      }
      updatePlot();
    });
    // initialize label
    if (isInt) {
      span.textContent = (parseInt(input.value, 10) || 0).toString();
    } else {
      span.textContent = parseFloat(input.value).toFixed(2);
    }
  }

  wireSlider(xnInput, xnValueSpan);
  wireSlider(ynInput, ynValueSpan);
  wireSlider(mInput, mValueSpan);
  if (NInput) {
    wireSlider(NInput, NValueSpan, true);
  } else {
    // no N-input on page: show default
    NValueSpan.textContent = DEFAULTS.N.toString();
  }

  // reset button 
  const resetButton = getElem("reset-button");
  const resampleButton = getElem("resample-button");

  if (resampleButton) {
    resampleButton.addEventListener("click", () => {
      // use current sliders to resample with correct N/xn/yn
      const xn = parseFloat(getElem("xn-input").value);
      const yn = parseFloat(getElem("yn-input").value);
      let N = DEFAULTS.N;
      const NInputLocal = getElem("N-input");
      if (NInputLocal) N = Math.max(1, parseInt(NInputLocal.value, 10) || DEFAULTS.N);
      resampleNoise(N, xn, yn);
      updatePlot();
    });
  }
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Reset sliders (only set those that exist)
      if (getElem("xn-input")) getElem("xn-input").value = DEFAULTS.xn;
      if (getElem("yn-input")) getElem("yn-input").value = DEFAULTS.yn;
      if (getElem("m-input")) getElem("m-input").value = DEFAULTS.m;
      if (getElem("N-input")) getElem("N-input").value = DEFAULTS.N;

      // Update text spans
      if (getElem("xn-value")) getElem("xn-value").textContent = DEFAULTS.xn.toFixed(2);
      if (getElem("yn-value")) getElem("yn-value").textContent = DEFAULTS.yn.toFixed(2);
      if (getElem("m-value")) getElem("m-value").textContent = DEFAULTS.m.toFixed(2);
      if (getElem("N-value")) getElem("N-value").textContent = DEFAULTS.N.toString();

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
    const plotDiv = getElem("LS-plot");
    if (!plotDiv) return;

    // Read current slider values
    const xn = parseFloat(getElem("xn-input").value);
    const yn = parseFloat(getElem("yn-input").value);
    const m = parseFloat(getElem("m-input").value);

    let N = DEFAULTS.N;
    const NInput = getElem("N-input");
    if (NInput) {
        N = Math.max(1, parseInt(NInput.value, 10) || DEFAULTS.N);
    }

    // Generate or reuse persistent noise
    if (!CURRENT_X_NOISE || CURRENT_X_NOISE.length !== N) {
      // if no saved realization, sample once and keep it until resample or reset
      resampleNoise(N, xn, yn);
    } else {
      // If noise exists but stds changed, regenerate to reflect new stds
      // (optional) regenerate when stds change — decide behavior:
      // Here we regenerate only when user explicitly resamples; to regenerate automatically when std changed, uncomment below:
      resampleNoise(N, xn, yn);
    }

    const x_noise = CURRENT_X_NOISE;
    const y_noise = CURRENT_Y_NOISE;
    
    // True data
    const X_true = linspace(0, 10, N);
    const X_obs = X_true.map((xi, i) => xi + x_noise[i]);
    
    const y_true = X_true.map(xi => m * xi);
    const y_obs = y_true.map((yi, i) => yi + y_noise[i]);
    
    // OLS
    const [slope_OLS, intercept_OLS] = ordinary_least_squares(X_obs, y_obs);
    const y_pred = X_true.map(xi => slope_OLS * xi + intercept_OLS);
    
    // TLS
    const [slope_TLS, intercept_TLS] = total_least_squares(X_obs, y_obs);
    const y_pred_TLS = X_true.map(xi => slope_TLS * xi + intercept_TLS);

    // Update slope display
    const slopeDisplay = getElem("slope-display");
    if (slopeDisplay) {
      slopeDisplay.innerHTML = `
        <strong>True slope:</strong> ${m.toFixed(4)}<br>
        <strong style="color: red;">OLS slope:</strong> ${slope_OLS.toFixed(4)}<br>
        <strong style="color: green;">TLS slope:</strong> ${slope_TLS.toFixed(4)}
      `;
    }

    // Plot with Plotly
    const trace_obs = {
        x: X_obs,
        y: y_obs,
        mode: 'markers',
        name: 'Noisy observations',
        marker: { opacity: 0.6 }
    };
    const trace_true = {
        x: X_true,
        y: y_true,
        mode: 'lines',
        name: 'True line',
        line: { dash: 'dash', color: 'black' }
    };
    const trace_ols = {
        x: X_true,
        y: y_pred,
        mode: 'lines',
        name: 'Fitted OLS',
        line: { color: 'red' }
    };
    const trace_tls = {
        x: X_true,
        y: y_pred_TLS,
        mode: 'lines',
        name: 'Fitted TLS',
        line: { color: 'green' }
    };

    const layout = {
        title: 'OLS vs TLS',
        xaxis: { title: 'X' },
        yaxis: { title: 'y' },
        width: 800,
        height: 500
    };

    Plotly.react(plotDiv, [trace_obs, trace_true, trace_ols, trace_tls], layout);
}

document.addEventListener("DOMContentLoaded", initLSPlot);