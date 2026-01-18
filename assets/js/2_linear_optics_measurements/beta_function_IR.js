// Distance between bpms
const s1 = -8.3; // m
const s2 = 8.3; // m
const ds = s2 - s1; // distance between bpm1 and bpm2

function beta_function(bs, ss, N){
    const beta = new Array(N);
    const s = new Array(N);
    
    for (let i = 0; i < N; i++) {
      s[i] = s1 + i*ds/(N - 1);
      beta[i] = bs*(1 + ((s[i] - ss) ** 2) / (bs ** 2));
    }
    // return both arrays as a pair
    return [s, beta];
}

function star_errors(b1, b2, sb1, sb2, rho) {
  const db = b1 - b2;
  const ds = s2 - s1; // distance between bpm1 and bpm2

  const Q = Math.sqrt(b1 * b2 - ds * ds);
  const N = ds * ds * (b1 + b2 - 2 * Q);
  const D = db * db + 4 * ds * ds;
  const bstar = N / D;
  const dNdb1 = ds * ds * (1 - b2 / Q);
  const dNdb2 = ds * ds * (1 - b1 / Q);
  const dbstardb1 = (dNdb1 * D - 2 * N * db) / (D * D);
  const dbstardb2 = (dNdb2 * D + 2 * N * db) / (D * D);
  const dsstardb1 = -1 / (2 * ds) * ( bstar + db * dbstardb1);
  const dsstardb2 = 1 / (2 * ds) * ( bstar - db * dbstardb2);

  const cov_bstar = 2*dbstardb1*dbstardb2*rho*sb1*sb2;
  const cov_sstar = 2*dsstardb1*dsstardb2*rho*sb1*sb2;

  const sbstar = Math.sqrt( (dbstardb1 * sb1) ** 2 + (dbstardb2 * sb2) ** 2 + cov_bstar);
  const ssstar = Math.sqrt( (dsstardb1 * sb1) ** 2 + (dsstardb2 * sb2) ** 2 + cov_sstar);

  return [sbstar, ssstar];
}


const DEFAULTS = {
  bs: 0.9,
  ss: 0.0,
  sb1: 0.00,
  sb2: 0.00,
  rho: 0.00,
};

function getElem(id) {
  return document.getElementById(id);
}

function initBetaPlot() {
  const plotDiv = getElem("beta_function_IR");
  const bsInput = getElem("bs-input");
  const ssInput = getElem("ss-input");
  const sb1Input = getElem("sb1-input");
  const sb2Input = getElem("sb2-input");
  const rhoInput = getElem("rho-input");

  const bsValueSpan = getElem("bs-value");
  const ssValueSpan = getElem("ss-value");
  const sb1ValueSpan = getElem("sb1-value");
  const sb2ValueSpan = getElem("sb2-value");
  const rhoValueSpan = getElem("rho-value");
  // const gamValueSpan = getElem("gam-value");

  // require the essentials; N-input is optional (we use DEFAULTS.N if missing)
  if (!plotDiv || !bsInput || !ssInput || !sb1Input || !sb2Input || !rhoInput ||
    !bsValueSpan || !ssValueSpan || !sb1ValueSpan || !sb2ValueSpan || !rhoValueSpan) {
    console.warn("twiss: missing required DOM elements, aborting initBetaPlot");
    return;
  }

  // slider listeners – ALWAYS call updatePlot()
  function wireSlider(input, span, isInt = false) {
    input.addEventListener("input", () => {
      span.textContent = parseFloat(input.value).toFixed(2);
      updatePlot();
    });
    // initialize label
    span.textContent = parseFloat(input.value).toFixed(2);
  }

  wireSlider(bsInput, bsValueSpan);
  wireSlider(ssInput, ssValueSpan);
  wireSlider(sb1Input, sb1ValueSpan);
  wireSlider(sb2Input, sb2ValueSpan);
  wireSlider(rhoInput, rhoValueSpan);

  // reset button 
  const resetButton = getElem("reset-button");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Reset sliders (only set those that exist)
      if (getElem("bs-input")) getElem("bs-input").value = DEFAULTS.bs;
      if (getElem("ss-input")) getElem("ss-input").value = DEFAULTS.ss;
      if (getElem("sb1-input")) getElem("sb1-input").value = DEFAULTS.sb1;
      if (getElem("sb2-input")) getElem("sb2-input").value = DEFAULTS.sb2;
      if (getElem("rho-input")) getElem("rho-input").value = DEFAULTS.rho;

      // Update text spans
      if (getElem("bs-value")) getElem("bs-value").textContent = DEFAULTS.bs.toFixed(2);
      if (getElem("ss-value")) getElem("ss-value").textContent = DEFAULTS.ss.toFixed(2);
      if (getElem("sb1-value")) getElem("sb1-value").textContent = DEFAULTS.sb1.toFixed(2);
      if (getElem("sb2-value")) getElem("sb2-value").textContent = DEFAULTS.sb2.toFixed(2);
      if (getElem("rho-value")) getElem("rho-value").textContent = DEFAULTS.rho.toFixed(2);
      // compute and update gamma display
      // const gam = (1 + (DEFAULTS.alf * DEFAULTS.alf)) / DEFAULTS.bet;
      // if (getElem("gam-value")) getElem("gam-value").textContent = gam.toFixed(4);

      // Redraw plot
      updatePlot();
    });
  }

  // initial draw
  updatePlot();
}

function updatePlot() {
  const plotDiv = getElem("beta_function_IR");
  if (!plotDiv) return;

  // Read current slider values
  const bs = parseFloat(getElem("bs-input").value);
  const ss = parseFloat(getElem("ss-input").value);
  const sb1 = parseFloat(getElem("sb1-input").value);
  const sb2 = parseFloat(getElem("sb2-input").value);
  const rho = parseFloat(getElem("rho-input").value);

  // correct gamma formula: gamma = (1 + alpha^2) / beta
  // const gam = (1 + (alf * alf)) / bet;
  // const gamSpan = getElem("gam-value");
  // if (gamSpan) gamSpan.textContent = gam.toFixed(4);

  const [s, beta] = beta_function(bs, ss, 100);
  const [sbstar, ssstar] = star_errors(beta[0], beta[beta.length - 1], sb1, sb2, rho);

  const trace = {
    x: s,
    y: beta,
    mode: 'lines',
    name: "Beta Function",
  };

  const bpm1 = {
    x: [s[0]],
    y: [beta[0]],
    mode: 'markers',
    type: 'scatter',
    marker: {
        size: 12,
        color: 'black'
    },
    name: "BPM 1",
    error_y: {
        type: 'data',
        array: [sb1],
        visible: true,
        symmetric: true,
        color: 'red'
    }
  };

  const bpm2 = {
    x: [s[s.length - 1]],
    y: [beta[beta.length - 1]],
    mode: 'markers',
    type: 'scatter',
    marker: {
        size: 12,
        color: 'black'
    },
    name: "BPM 2",
    error_y: {
        type: 'data',
        array: [sb2],
        visible: true,
        symmetric: true,
        color: 'red'
    }
  };

  const star = {
    x: [ss],
    y: [bs],
    mode: 'markers',
    type: 'scatter',
    marker: {
        size: 12,
        color: 'blue'
    },
    name: "star",
    error_x: {
        type: 'data',
        array: [ssstar],
        color: 'red'
    },
    error_y: {
        type: 'data',
        array: [sbstar],
        color: 'red'
    }
  };
  
  const layout = {
    title: { text: "Beta Function" },
    uirevision: "beta_ir_v1",
    xaxis: {
      title: "s (m)",
    },
    yaxis: {
      title: "beta (m)",
    },
  };

  Plotly.react(plotDiv, [trace, bpm1, bpm2, star], layout);
}

document.addEventListener("DOMContentLoaded", initBetaPlot);