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

function integrateSimpson(func, a, b, n = 400) {
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

function initLuminosityPlot() {
  const plotDiv = document.getElementById("luminosity");
  // const phiInput = document.getElementById("phi-input");
  const bsxInput = document.getElementById("bsx-input");
  const bsyInput = document.getElementById("bsy-input");
  const ssxInput = document.getElementById("ssx-input");
  const ssyInput = document.getElementById("ssy-input");
  const sigInput = document.getElementById("sig-input");

  const bsxValueSpan = document.getElementById("bsx-value");
  const bsyValueSpan = document.getElementById("bsy-value");
  const ssxValueSpan = document.getElementById("ssx-value");
  const ssyValueSpan = document.getElementById("ssy-value");
  const sigValueSpan = document.getElementById("sig-value");

  if (!plotDiv || !bsxInput || !bsyInput || !ssxInput || !ssyInput || !sigInput) return;

  function updatePlot() {
    const bsx = parseFloat(bsxInput.value);
    const bsy = parseFloat(bsyInput.value);
    const ssx = parseFloat(ssxInput.value);
    const ssy = parseFloat(ssyInput.value);
    const sig = parseFloat(sigInput.value);
    // const a = -2 * eps / gamma;

    bsxValueSpan.textContent = bsx.toFixed(2);
    bsyValueSpan.textContent = bsy.toFixed(2);
    ssxValueSpan.textContent = ssx.toFixed(2);
    ssyValueSpan.textContent = ssy.toFixed(2);
    sigValueSpan.textContent = sig.toFixed(2);
    // aValueSpan.textContent = a.toFixed(3);

    const N = 100;
    const f = 78000; //Hz
    const N1 = 2E11;
    const N2 = 2E11;
    const ex = 1E-7; //1E-8 //m
    const ey = 1E-7; //1E-8 //m
    const sz = sig //m
    const conversion = 1/100**2
    const beta_star_x = bsx
    const beta_star_y = bsy
    const s_star_x = ssx
    const s_star_y = ssy

    // Approximate infinite limits: ±10 σ_z
    const neg_inf = -10;
    const pos_inf =  10;

    // Phi: 0 → π/100, N+1 samples (like np.linspace)
    const Phi = Array.from({ length: N + 1 }, (_, i) =>
      (i * (Math.PI / 100)) / N  // effectively 0..π/100
    );
    console.log(Phi[1])
    const Luminosities = new Array(N + 1);

    // Loop over phi values
    for (let i = 0; i <= N; i++) {
      const phi = Phi[i];

      Luminosities[i] =
        LuminosityIntegral(
          f, N1, N2,
          s_star_x, s_star_y,
          beta_star_x, beta_star_y,
          ex, ey, sz,
          phi,
          neg_inf, pos_inf
        ) * conversion;
    }

    const trace = {
      x: Phi,
      y: Luminosities,
      mode: "lines",
      name: "Luminosity"
    };

    const layout = {
      title: "Luminosity With Respect To Crossing Angle",
      xaxis: { title: "$\\phi_c\\text{ (radians)}$" },
      yaxis: { title: "Luminosity (cm⁻¹ s⁻¹)",
       }
    };

    Plotly.react(plotDiv, [trace], layout);
  }

  bsxInput.addEventListener("input", updatePlot);
  bsyInput.addEventListener("input", updatePlot);
  ssxInput.addEventListener("input", updatePlot);
  ssyInput.addEventListener("input", updatePlot);
  sigInput.addEventListener("input", updatePlot);

  // initial draw
  updatePlot();
}

document.addEventListener("DOMContentLoaded", initLuminosityPlot);