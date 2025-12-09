// assets/js/luminosity/luminosity.js

function integrand(s, f, N1, N2, ssx, ssy, bsx, bsy, ex, ey, sz, phi) {
  const beta_x = bsx*(1 + ((s - ssx)/bsx)**2);
  const beta_y = bsy*(1 + ((s - ssy)/bsy)**2);
  const sx = Math.sqrt(ex*beta_x);
  const sy = Math.sqrt(ey*beta_y);

  const denom = 4*Math.PI**1.5*sx*sy*sz;

  const num = Math.exp(
    -1*s**2*(
      Math.sin(phi/2)**2/sx**2 +
      Math.cos(phi/2)**2/sz**2
    )
  );

  return f*N1*N2*Math.cos(phi/2)*(num/denom);
}

function integrateSimpson(func, a, b, n = 800) {
  if (n%2 !== 0) n += 1; // Simpson requires even n
  const h = (b - a)/n;

  let sum = func(a) + func(b);

  for (let i = 1; i < n; i++) {
    const x = a + i*h;
    sum += func(x) * (i % 2 === 0 ? 2 : 4);
  }

  return (h/3)*sum;
}

function LuminosityIntegral(
  f, N1, N2, ssx, ssy, bsx, bsy, ex, ey, sz, phi, a, b
) {
  const func = (s) => integrand(s, f, N1, N2, ssx, ssy, bsx, bsy, ex, ey, sz, phi);
  return integrateSimpson(func, a, b, 400);
}

const FREQ = 78000;      // Hz
const N1 = 2e11;
const N2 = 2e11;
const EX = 1e-7;         // m
const EY = 1e-7;         // m
const NEG_INF = -10;
const POS_INF =  10;
const CONVERSION = 1 / (100 ** 2);

const DEFAULTS = {
  bsx: 0.70,
  bsy: 0.70,
  ssx: 0.0,
  ssy: 0.0,
  sig: 0.20,
  phi: 0.002,
  activeParam: "phi"
};

let savedState = null; // { bsx, bsy, ssx, ssy, sig, phi, x, y }

let activeParam = "phi"; // which param we’re scanning over

function getElem(id) {
  return document.getElementById(id);
}

function saveState() {
  const bsx = parseFloat(getElem("bsx-input").value);
  const bsy = parseFloat(getElem("bsy-input").value);
  const ssx = parseFloat(getElem("ssx-input").value);
  const ssy = parseFloat(getElem("ssy-input").value);
  const sig = parseFloat(getElem("sig-input").value);
  const phi = parseFloat(getElem("phi-input").value);

  const N = 100;
  const x = [];
  const y = [];

  // Recompute current plot data based on activeParam
  const computeData = () => {
    if (activeParam === "phi" || !activeParam) {
      const min = 0.00, max = 0.005;
      for (let i = 0; i <= N; i++) {
        const phi_i = min + (max - min) * i / N;
        const L = LuminosityIntegral(FREQ, N1, N2, ssx, ssy, bsx, bsy, EX, EY, sig, phi_i, NEG_INF, POS_INF) * CONVERSION;
        x.push(phi_i);
        y.push(L);
      }
    } else if (activeParam === "bsx") {
      const min = 0.10, max = 5.00;
      for (let i = 0; i <= N; i++) {
        const bsx_i = min + (max - min) * i / N;
        const L = LuminosityIntegral(FREQ, N1, N2, ssx, ssy, bsx_i, bsy, EX, EY, sig, phi, NEG_INF, POS_INF) * CONVERSION;
        x.push(bsx_i);
        y.push(L);
      }
    } else if (activeParam === "bsy") {
      const min = 0.10, max = 5.00;
      for (let i = 0; i <= N; i++) {
        const bsy_i = min + (max - min) * i / N;
        const L = LuminosityIntegral(FREQ, N1, N2, ssx, ssy, bsx, bsy_i, EX, EY, sig, phi, NEG_INF, POS_INF) * CONVERSION;
        x.push(bsy_i);
        y.push(L);
      }
    } else if (activeParam === "ssx") {
      const min = -1.0, max = 1.0;
      for (let i = 0; i <= N; i++) {
        const ssx_i = min + (max - min) * i / N;
        const L = LuminosityIntegral(FREQ, N1, N2, ssx_i, ssy, bsx, bsy, EX, EY, sig, phi, NEG_INF, POS_INF) * CONVERSION;
        x.push(ssx_i);
        y.push(L);
      }
    } else if (activeParam === "ssy") {
      const min = -1.0, max = 1.0;
      for (let i = 0; i <= N; i++) {
        const ssy_i = min + (max - min) * i / N;
        const L = LuminosityIntegral(FREQ, N1, N2, ssx, ssy_i, bsx, bsy, EX, EY, sig, phi, NEG_INF, POS_INF) * CONVERSION;
        x.push(ssy_i);
        y.push(L);
      }
    } else if (activeParam === "sig") {
      const min = 0.1, max = 0.5;
      for (let i = 0; i <= N; i++) {
        const sig_i = min + (max - min) * i / N;
        const L = LuminosityIntegral(FREQ, N1, N2, ssx, ssy, bsx, bsy, EX, EY, sig_i, phi, NEG_INF, POS_INF) * CONVERSION;
        x.push(sig_i);
        y.push(L);
      }
    }
  };

  computeData();
  savedState = { bsx, bsy, ssx, ssy, sig, phi, x, y, activeParam: activeParam || "phi" };
  updateSavedStateLabel();
  updatePlot();
}

function updateSavedStateLabel() {
  const label = getElem("saved-state-label");
  if (!label) return;

  if (!savedState) {
    label.textContent = "No saved state";
    return;
  }

  const { bsx, bsy, ssx, ssy, sig, phi } = savedState;
  label.textContent = `Saved: $\\beta^*_x$=${bsx.toFixed(2)}, $\\beta^*_y$=${bsy.toFixed(2)}, $s^*_x$=${ssx.toFixed(2)}, $s^*_y$=${ssy.toFixed(2)}, $\\sigma_s$=${sig.toFixed(2)}, $\\phi$=${phi.toFixed(4)}`;
}

function initLuminosityPlot() {
  const plotDiv = getElem("luminosity");
  const phiInput = getElem("phi-input");
  const bsxInput = getElem("bsx-input");
  const bsyInput = getElem("bsy-input");
  const ssxInput = getElem("ssx-input");
  const ssyInput = getElem("ssy-input");
  const sigInput = getElem("sig-input");
  const resetButton = getElem("reset-button");
  const saveButton = getElem("save-button");

  const bsxValueSpan = getElem("bsx-value");
  const bsyValueSpan = getElem("bsy-value");
  const ssxValueSpan = getElem("ssx-value");
  const ssyValueSpan = getElem("ssy-value");
  const sigValueSpan = getElem("sig-value");
  const phiValueSpan = getElem("phi-value");

  if (!plotDiv || !bsxInput || !bsyInput || !ssxInput || !ssyInput || !sigInput || !phiInput) return;

  // slider listeners – ALWAYS call updatePlot()
  function wireSlider(input, span) {
    input.addEventListener("input", () => {
      span.textContent = parseFloat(input.value).toFixed(4);
      updatePlot();
    });
    // initialize label
    span.textContent = parseFloat(input.value).toFixed(4);
  }

  wireSlider(bsxInput, bsxValueSpan);
  wireSlider(bsyInput, bsyValueSpan);
  wireSlider(ssxInput, ssxValueSpan);
  wireSlider(ssyInput, ssyValueSpan);
  wireSlider(sigInput, sigValueSpan);
  wireSlider(phiInput, phiValueSpan);

  // radio buttons to choose scan variable (phi, bsx, bsy, ssx, ssy, sig, ...)
  const radios = document.querySelectorAll('input[name="scan-param"]');
  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        activeParam = radio.value;  // e.g. "phi", "bsx", "bsy", ...
        savedState = null;  // clear saved state
        updateSavedStateLabel();
        updatePlot();
      }
    });
  });

  // Reset button
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      bsxInput.value = DEFAULTS.bsx;
      bsyInput.value = DEFAULTS.bsy;
      ssxInput.value = DEFAULTS.ssx;
      ssyInput.value = DEFAULTS.ssy;
      sigInput.value = DEFAULTS.sig;
      phiInput.value = DEFAULTS.phi;

      bsxValueSpan.textContent = DEFAULTS.bsx.toFixed(4);
      bsyValueSpan.textContent = DEFAULTS.bsy.toFixed(4);
      ssxValueSpan.textContent = DEFAULTS.ssx.toFixed(4);
      ssyValueSpan.textContent = DEFAULTS.ssy.toFixed(4);
      sigValueSpan.textContent = DEFAULTS.sig.toFixed(4);
      phiValueSpan.textContent = DEFAULTS.phi.toFixed(4);

      activeParam = DEFAULTS.activeParam;
      savedState = null;

      const phiRadio = document.querySelector('input[name="scan-param"][value="phi"]');
      if (phiRadio) phiRadio.checked = true;

      updateSavedStateLabel();
      updatePlot();
    });
  }

  // Save state button
  if (saveButton) {
    saveButton.addEventListener("click", saveState);
  }

  // make sure phi is selected by default
  const phiRadio = document.querySelector('input[name="scan-param"][value="phi"]');
  if (phiRadio) phiRadio.checked = true;
  activeParam = "phi";
  updateSavedStateLabel();

  updatePlot();
}

function updatePlot() {
  const plotDiv = getElem("luminosity");
  if (!plotDiv) return;

  // Read current slider values
  const bsx = parseFloat(getElem("bsx-input").value);
  const bsy = parseFloat(getElem("bsy-input").value);
  const ssx = parseFloat(getElem("ssx-input").value);
  const ssy = parseFloat(getElem("ssy-input").value);
  const sig = parseFloat(getElem("sig-input").value);
  const phi = parseFloat(getElem("phi-input").value);

  const N = 100;
  const x = [];
  const y = [];
  let xLabel = "";
  let xvert = null;

  if (activeParam === "phi" || !activeParam) {
    // Default: scan over crossing angle φ
    xLabel = "$\\phi_c$ (radians)";
    xvert = phi;
    const min = 0.00, max = .005;
    for (let i = 0; i <= N; i++) {
      const phi_i = min + (max - min) * i / N;  // 0 .. π/100
      const L = LuminosityIntegral(
        FREQ, N1, N2,
        ssx, ssy,
        bsx, bsy,
        EX, EY,
        sig,
        phi_i,
        NEG_INF, POS_INF
      ) * CONVERSION;

      x.push(phi_i);
      y.push(L);
    }
    
  } else if (activeParam === "bsx") {
    xLabel = "$\\beta^*_x$ (m)";
    xvert = bsx;
    const min = 0.10, max = 5.00;
    for (let i = 0; i <= N; i++) {
      const bsx_i = min + (max - min) * i / N;
      const L = LuminosityIntegral(
        FREQ, N1, N2,
        ssx, ssy,
        bsx_i, bsy,
        EX, EY,
        sig,
        phi,               // fix phi here, or add a phi slider later
        NEG_INF, POS_INF
      ) * CONVERSION;
      x.push(bsx_i);
      y.push(L);
    }
  } else if (activeParam === "bsy") {
    xLabel = "$\\beta^*_y$ (m)";
    xvert = bsy;
    const min = 0.10, max = 5.00;
    for (let i = 0; i <= N; i++) {
      const bsy_i = min + (max - min) * i / N;
      const L = LuminosityIntegral(
        FREQ, N1, N2,
        ssx, ssy,
        bsx, bsy_i,
        EX, EY,
        sig,
        phi,
        NEG_INF, POS_INF
      ) * CONVERSION;
      x.push(bsy_i);
      y.push(L);
    }
  } else if (activeParam === "ssx") {
    xLabel = "$s^*_x$ (m)";
    xvert = ssx;
    const min = -1.0, max = 1.0;
    for (let i = 0; i <= N; i++) {
      const ssx_i = min + (max - min) * i / N;
      const L = LuminosityIntegral(
        FREQ, N1, N2,
        ssx_i, ssy,
        bsx, bsy,
        EX, EY,
        sig,
        phi,
        NEG_INF, POS_INF
      ) * CONVERSION;
      x.push(ssx_i);
      y.push(L);
    }
  } else if (activeParam === "ssy") {
    xLabel = "$s^*_y$ (m)";
    xvert = ssy;
    const min = -1.0, max = 1.0;
    for (let i = 0; i <= N; i++) {
      const ssy_i = min + (max - min) * i / N;
      const L = LuminosityIntegral(
        FREQ, N1, N2,
        ssx, ssy_i,
        bsx, bsy,
        EX, EY,
        sig,
        phi,
        NEG_INF, POS_INF
      ) * CONVERSION;
      x.push(ssy_i);
      y.push(L);
    }
  } else if (activeParam === "sig") {
    xLabel = "$\\sigma_s$ (m)";
    xvert = sig;
    const min = 0.05, max = 1.0;
    for (let i = 0; i <= N; i++) {
      const sig_i = min + (max - min) * i / N;
      const L = LuminosityIntegral(
        FREQ, N1, N2,
        ssx, ssy,
        bsx, bsy,
        EX, EY,
        sig_i,
        phi,
        NEG_INF, POS_INF
      ) * CONVERSION;
      x.push(sig_i);
      y.push(L);
    }
  };

  // Blue trace (current state)
  const trace = {
    x: x,
    y: y,
    mode: "lines",
    name: "Luminosity",
    line: { color: "blue", width: 2 }
  };

  const traces = [trace];

  // Grey trace (saved state, if exists)
  if (savedState) {
    const traceSaved = {
      x: savedState.x,
      y: savedState.y,
      mode: "lines",
      name: "Saved",
      line: { color: "grey", width: 2, dash: "dash" }
    };
    traces.push(traceSaved);
  }

  const shapes = [];
  if (xvert !== null) {
    shapes.push({
      type: "line",
      x0: xvert,
      x1: xvert,
      yref: "paper",
      y0: 0,
      y1: 1,
      line: {
        color: "red",
        width: 2,
        dash: "dot"
      }
    });
  }
  
  const layout = {
    title: { text: "Luminosity with Crossing Angle and Hourglass Effects" },
    xaxis: { title: xLabel },
    yaxis: { title: "Luminosity (cm⁻¹ s⁻¹)" },
    shapes: shapes
  };

  Plotly.react(plotDiv, traces, layout);
}

document.addEventListener("DOMContentLoaded", initLuminosityPlot);