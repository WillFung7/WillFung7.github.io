function generate_ellipse_from_twiss(alpha, beta, eps, N, p0 = 0.0){
    const q = new Array(N);
    const p = new Array(N);

    for (let i = 0; i < N; i++) {
        // uniform random point inside unit disk
        const theta = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random());

        const u  = Math.sqrt(eps) * r * Math.cos(theta);
        const up = Math.sqrt(eps) * r * Math.sin(theta);

        q[i] = Math.sqrt(beta) * u;
        p[i] = (-alpha / Math.sqrt(beta)) * u + (1 / Math.sqrt(beta)) * up + p0;
    }

    // return both arrays as a pair
    return [q, p];
}

const DEFAULTS = {
  alf: 0.0,
  bet: 0.5,
  eps: 0.005,
  N: 2500
};

function getElem(id) {
  return document.getElementById(id);
}

function initTwissPlot() {
  const plotDiv = getElem("twiss");
  const alfInput = getElem("alf-input");
  const betInput = getElem("bet-input");
  const epsInput = getElem("eps-input");
  const NInput = getElem("N-input"); // may be null on the page

  const alfValueSpan = getElem("alf-value");
  const betValueSpan = getElem("bet-value");
  const gamValueSpan = getElem("gam-value");
  const epsValueSpan = getElem("eps-value");
  const NValueSpan = getElem("N-value");

  // require the essentials; N-input is optional (we use DEFAULTS.N if missing)
  if (!plotDiv || !alfInput || !betInput || !epsInput ||
      !alfValueSpan || !betValueSpan || !gamValueSpan || !epsValueSpan || !NValueSpan) {
    console.warn("twiss: missing required DOM elements, aborting initTwissPlot");
    return;
  }

  // slider listeners – ALWAYS call updatePlot()
  function wireSlider(input, span, isInt = false) {
    input.addEventListener("input", () => {
      if (isInt) {
        const v = parseInt(input.value, 10) || 0;
        span.textContent = v.toString();
      } else {
        span.textContent = parseFloat(input.value).toFixed(4);
      }
      updatePlot();
    });
    // initialize label
    if (isInt) {
      span.textContent = (parseInt(input.value, 10) || 0).toString();
    } else {
      span.textContent = parseFloat(input.value).toFixed(4);
    }
  }

  wireSlider(alfInput, alfValueSpan);
  wireSlider(betInput, betValueSpan);
  wireSlider(epsInput, epsValueSpan);
  if (NInput) {
    wireSlider(NInput, NValueSpan, true);
  } else {
    // no N-input on page: show default
    NValueSpan.textContent = DEFAULTS.N.toString();
  }

  // reset button 
  const resetButton = getElem("reset-button");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      // Reset sliders (only set those that exist)
      if (getElem("alf-input")) getElem("alf-input").value = DEFAULTS.alf;
      if (getElem("bet-input")) getElem("bet-input").value = DEFAULTS.bet;
      if (getElem("eps-input")) getElem("eps-input").value = DEFAULTS.eps;
      if (getElem("N-input")) getElem("N-input").value = DEFAULTS.N;

      // Update text spans
      if (getElem("alf-value")) getElem("alf-value").textContent = DEFAULTS.alf.toFixed(4);
      if (getElem("bet-value")) getElem("bet-value").textContent = DEFAULTS.bet.toFixed(4);
      if (getElem("eps-value")) getElem("eps-value").textContent = DEFAULTS.eps.toFixed(4);
      if (getElem("N-value")) getElem("N-value").textContent = DEFAULTS.N.toString();

      // compute and update gamma display
      const gam = (1 + (DEFAULTS.alf * DEFAULTS.alf)) / DEFAULTS.bet;
      if (getElem("gam-value")) getElem("gam-value").textContent = gam.toFixed(4);

      // Redraw plot
      updatePlot();
    });
  }

  // initial draw
  updatePlot();
}

function updatePlot() {
  const plotDiv = getElem("twiss");
  if (!plotDiv) return;

  // Read current slider values
  const alf = parseFloat(getElem("alf-input").value);
  const bet = parseFloat(getElem("bet-input").value);
  const eps = parseFloat(getElem("eps-input").value);

  let N = DEFAULTS.N;
  const NInput = getElem("N-input");
  if (NInput) {
    N = Math.max(1, parseInt(NInput.value, 10) || DEFAULTS.N);
  }

  // correct gamma formula: gamma = (1 + alpha^2) / beta
  const gam = (1 + (alf * alf)) / bet;
  const gamSpan = getElem("gam-value");
  if (gamSpan) gamSpan.textContent = gam.toFixed(4);

  const [q, p] = generate_ellipse_from_twiss(alf, bet, eps, N, 0.0);

  const trace = {
    x: q,
    y: p,
    mode: 'markers',
    type: 'scatter',
    name: "Twiss Ellipse"
  };
  
  const layout = {
    title: { text: "Twiss Ellipse" },
    xaxis: {
      title: "q",
      autorange: false,    // disable autoscale
      range: [-0.1, 0.1],
      fixedrange: false    // set true to disable zoom/pan
    },
    yaxis: {
      title: "p",
      autorange: false,
      range: [-0.5, 0.5],
      fixedrange: false
    },
  };

  Plotly.react(plotDiv, [trace], layout);
}

document.addEventListener("DOMContentLoaded", initTwissPlot);