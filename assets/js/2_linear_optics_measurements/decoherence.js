/* Minimal BPM decoherence demo
   Mirrors the Python idea:
   - Twiss Gaussian initial distribution
   - Tune spread Q_i
   - z_{n+1} = z_n * exp(i 2π Q_i)
   - phase space scatter + centroid trail
   - BPM centroid history
*/

(() => {
  // ---------------------------
  // Parameters (match your Python defaults)
  // ---------------------------
  const N = 5000;
  const alpha = 0.0;
  const beta = 1.0;
  const eps = 0.005;
  const nTurns = 200;
  const meanKeepPoints = 15;

  // Axis ranges (like your matplotlib limits)
  const qMin = -0.5, qMax = 0.5;
  const pMin = -0.5, pMax = 0.5;

  // BPM y-range
  const bpmYMin = -0.3, bpmYMax = 0.3;

  // ---------------------------
  // DOM
  // ---------------------------
  const phaseCanvas = document.getElementById("phaseCanvas");
  const bpmCanvas = document.getElementById("bpmCanvas");
  const ctxPhase = phaseCanvas.getContext("2d");
  const ctxBPM = bpmCanvas.getContext("2d");

  const playPauseBtn = document.getElementById("playPauseBtn");
  const stepBtn = document.getElementById("stepBtn");
  const resetBtn = document.getElementById("resetBtn");

  const Q0Slider = document.getElementById("Q0");
  const sigmaQSlider = document.getElementById("sigmaQ");
  const kickSlider = document.getElementById("kick");
  const Q0Val = document.getElementById("Q0Val");
  const sigmaQVal = document.getElementById("sigmaQVal");
  const kickVal = document.getElementById("kickVal");

  // ---------------------------
  // RNG helpers
  // ---------------------------
  // Box-Muller standard normal
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // ---------------------------
  // Coordinate transforms
  // ---------------------------
  const sqrtBeta = Math.sqrt(beta);
  const invSqrtBeta = 1.0 / sqrtBeta;

  // Map physical (q,p) -> normalized (u, up)
  // In your Python you used:
  // u  = q / sqrt(beta)
  // up = alpha*q/sqrt(beta) + p*sqrt(beta)
  function physToNorm(q, p) {
    const u = q * invSqrtBeta;
    const up = alpha * q * invSqrtBeta + p * sqrtBeta;
    return [u, up];
  }

  // Map normalized (u,up) -> physical (q,p)
  // q = sqrt(beta)*u
  // p = -alpha/sqrt(beta)*u + 1/sqrt(beta)*up
  function normToPhys(u, up) {
    const q = sqrtBeta * u;
    const p = (-alpha * invSqrtBeta) * u + invSqrtBeta * up;
    return [q, p];
  }

  function drawGrid(ctx, width, height, xMin, xMax, yMin, yMax, dx, dy) {
    ctx.save();
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;

    // Vertical grid lines
    for (let x = Math.ceil(xMin / dx) * dx; x <= xMax; x += dx) {
        const xp = (x - xMin) / (xMax - xMin) * width;
        ctx.beginPath();
        ctx.moveTo(xp, 0);
        ctx.lineTo(xp, height);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = Math.ceil(yMin / dy) * dy; y <= yMax; y += dy) {
        const yp = height - (y - yMin) / (yMax - yMin) * height;
        ctx.beginPath();
        ctx.moveTo(0, yp);
        ctx.lineTo(width, yp);
        ctx.stroke();
    }

    ctx.restore();
  }

  function drawAxesWithTicks(ctx, width, height, xMin, xMax, yMin, yMax, xLabel, yLabel, xTick, yTick) {
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 1;
    ctx.font = "12px system-ui";

    // Axis positions
    const x0 = (0 - xMin) / (xMax - xMin) * width;
    const y0 = height - (0 - yMin) / (yMax - yMin) * height;

    // ---- Draw axes ----
    ctx.beginPath();
    if (xMin < 0 && xMax > 0) {
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, height);
    }
    if (yMin < 0 && yMax > 0) {
        ctx.moveTo(0, y0);
        ctx.lineTo(width, y0);
    }
    ctx.stroke();

    // ---- X ticks & labels ----
    for (let x = Math.ceil(xMin / xTick) * xTick; x <= xMax; x += xTick) {
        const xp = (x - xMin) / (xMax - xMin) * width;
        ctx.beginPath();
        ctx.moveTo(xp, y0 - 4);
        ctx.lineTo(xp, y0 + 4);
        ctx.stroke();
        ctx.fillText(x.toFixed(2), xp - 10, y0 + 15);
    }

    // ---- Y ticks & labels ----
    for (let y = Math.ceil(yMin / yTick) * yTick; y <= yMax; y += yTick) {
        const yp = height - (y - yMin) / (yMax - yMin) * height;
        ctx.beginPath();
        ctx.moveTo(x0 - 4, yp);
        ctx.lineTo(x0 + 4, yp);
        ctx.stroke();
        ctx.fillText(y.toFixed(2), x0 + 6, yp + 4);
    }

    // ---- Axis labels ----
    ctx.font = "14px system-ui";
    ctx.fillText(xLabel, width / 2 - 20, height - 6);

    ctx.save();
    ctx.translate(12, height / 2 + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // ---------------------------
  // Simulation state arrays (preallocated)
  // We'll store z = u + i up as (zr, zi)
  // and phaseStep = exp(i 2π Q_i) as (pr, pi)
  // ---------------------------
  let zr = new Float32Array(N);
  let zi = new Float32Array(N);
  let pr = new Float32Array(N);
  let pi = new Float32Array(N);

  // For drawing (physical coords)
  let qArr = new Float32Array(N);
  let pArr = new Float32Array(N);

  // centroid histories
  let meanQHist = [];
  let meanPHist = [];
  let turnHist = [];
  let qMeanHist = [];

  let turn = 0;
  let playing = false;
  let rafId = null;

  // ---------------------------
  // Init / Reset
  // ---------------------------
  function initState() {
    const Q0 = parseFloat(Q0Slider.value);
    const sigmaQ = parseFloat(sigmaQSlider.value);
    const kick = parseFloat(kickSlider.value);

    // Generate initial distribution in normalized phase space:
    // u  ~ sqrt(eps) N(0,1)
    // up ~ sqrt(eps) N(0,1)
    // Then map back to (q,p) with p offset (kick)
    // Then convert back to (u,up) as z0 (like your Python)
    const sqrtEps = Math.sqrt(eps);

    for (let i = 0; i < N; i++) {
      const u = sqrtEps * randn();
      const up = sqrtEps * randn();

      // physical (q,p) from Twiss (alpha=0,beta=1 reduces nicely)
      const q = Math.sqrt(beta) * u;
      const p = (-alpha / Math.sqrt(beta)) * u + (1 / Math.sqrt(beta)) * up + kick;

      // normalize back (matches your Python approach)
      const [u0, up0] = physToNorm(q, p);

      zr[i] = u0;
      zi[i] = up0;

      // tune for each particle
      const Qi = Q0 + sigmaQ * randn();
      const omega = 2.0 * Math.PI * Qi;
      pr[i] = Math.cos(omega);
      pi[i] = Math.sin(omega);
    }

    // clear histories
    meanQHist = [];
    meanPHist = [];
    turnHist = [];
    qMeanHist = [];
    turn = 0;

    // draw initial frame
    computePhysAndCentroidAndStore();
    drawAll();
  }

  // ---------------------------
  // Advance one turn: z <- z * phaseStep
  // complex multiply: (a+ib)(c+id) = (ac - bd) + i(ad + bc)
  // ---------------------------
  function stepOnce() {
    for (let i = 0; i < N; i++) {
      const a = zr[i], b = zi[i];
      const c = pr[i], d = pi[i];
      zr[i] = a * c - b * d;
      zi[i] = a * d + b * c;
    }
    turn = Math.min(turn + 1, nTurns - 1);
    computePhysAndCentroidAndStore();
    drawAll();
  }

  function computePhysAndCentroidAndStore() {
    let sumQ = 0.0;
    let sumP = 0.0;

    for (let i = 0; i < N; i++) {
      const [q, p] = normToPhys(zr[i], zi[i]);
      qArr[i] = q;
      pArr[i] = p;
      sumQ += q;
      sumP += p;
    }

    const qMean = sumQ / N;
    const pMean = sumP / N;

    meanQHist.push(qMean);
    meanPHist.push(pMean);

    turnHist.push(turn);
    qMeanHist.push(qMean);
  }

  // ---------------------------
  // Drawing helpers
  // ---------------------------
  function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function mapToCanvas(x, xMin, xMax, w) {
    return (x - xMin) / (xMax - xMin) * w;
  }

  function mapToCanvasY(y, yMin, yMax, h) {
    // flip y for canvas coordinates
    return h - (y - yMin) / (yMax - yMin) * h;
  }

  function drawAxesPhase() {
    const w = phaseCanvas.width, h = phaseCanvas.height;
    ctxPhase.save();
    ctxPhase.lineWidth = 1;

    // grid-ish axes through 0
    const x0 = mapToCanvas(0, qMin, qMax, w);
    const y0 = mapToCanvasY(0, pMin, pMax, h);

    ctxPhase.strokeStyle = "#000";
    ctxPhase.globalAlpha = 0.35;

    ctxPhase.beginPath();
    ctxPhase.moveTo(x0, 0);
    ctxPhase.lineTo(x0, h);
    ctxPhase.stroke();

    ctxPhase.beginPath();
    ctxPhase.moveTo(0, y0);
    ctxPhase.lineTo(w, y0);
    ctxPhase.stroke();

    ctxPhase.restore();
  }

  function drawPhaseSpace() {
    const w = phaseCanvas.width, h = phaseCanvas.height;

    clearCanvas(ctxPhase, phaseCanvas);
    drawAxesPhase();
    drawGrid(ctxPhase, phaseCanvas.width, phaseCanvas.height, qMin, qMax, pMin, pMax, 0.1, 0.1);   // grid spacing
    drawAxesWithTicks(ctxPhase, phaseCanvas.width, phaseCanvas.height, qMin, qMax, pMin, pMax, "q", "p", 0.2, 0.2);

    // particle cloud
    ctxPhase.save();
    ctxPhase.fillStyle = "navy";
    ctxPhase.globalAlpha = 0.6;

    // Draw points (minimal approach: tiny rectangles)
    // For 5000 pts this is fine.
    for (let i = 0; i < N; i++) {
      const x = mapToCanvas(qArr[i], qMin, qMax, w);
      const y = mapToCanvasY(pArr[i], pMin, pMax, h);
      ctxPhase.fillRect(x, y, 1, 1);
    }
    ctxPhase.restore();

    // centroid trail (last meanKeepPoints)
    const start = Math.max(0, meanQHist.length - meanKeepPoints);

    ctxPhase.save();
    ctxPhase.fillStyle = "red";
    ctxPhase.globalAlpha = 0.9;

    for (let k = start; k < meanQHist.length; k++) {
      const x = mapToCanvas(meanQHist[k], qMin, qMax, w);
      const y = mapToCanvasY(meanPHist[k], pMin, pMax, h);
      ctxPhase.beginPath();
      ctxPhase.arc(x, y, 3, 0, 2 * Math.PI);
      ctxPhase.fill();
    }
    ctxPhase.restore();

    // title text
    ctxPhase.save();
    ctxPhase.fillStyle = "#111";
    ctxPhase.font = "14px system-ui";
    ctxPhase.fillText(`Turn ${turn}`, 10, 20);
    ctxPhase.restore();
  }

  function drawBPM() {
    const w = bpmCanvas.width, h = bpmCanvas.height;
    clearCanvas(ctxBPM, bpmCanvas);
    drawGrid(ctxBPM, bpmCanvas.width, bpmCanvas.height, 0, nTurns, bpmYMin, bpmYMax, 20, 0.05);
    drawAxesWithTicks(ctxBPM, bpmCanvas.width, bpmCanvas.height, 0, nTurns, bpmYMin, bpmYMax, "Turn", "⟨q⟩", 50, 0.05);

    // axes box
    ctxBPM.save();
    ctxBPM.strokeStyle = "#000";
    ctxBPM.globalAlpha = 0.25;
    ctxBPM.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctxBPM.restore();

    // map turn -> x pixel, qMean -> y pixel
    function xTurn(t) {
      return mapToCanvas(t, 0, nTurns - 1, w);
    }
    function yQ(q) {
      return mapToCanvasY(q, bpmYMin, bpmYMax, h);
    }

    // draw line
    if (qMeanHist.length > 1) {
      ctxBPM.save();
      ctxBPM.strokeStyle = "#1a1a1a";
      ctxBPM.lineWidth = 2;
      ctxBPM.globalAlpha = 0.85;

      ctxBPM.beginPath();
      ctxBPM.moveTo(xTurn(turnHist[0]), yQ(qMeanHist[0]));
      for (let i = 1; i < qMeanHist.length; i++) {
        ctxBPM.lineTo(xTurn(turnHist[i]), yQ(qMeanHist[i]));
      }
      ctxBPM.stroke();
      ctxBPM.restore();
    }

    // current point
    const qCur = qMeanHist[qMeanHist.length - 1];
    ctxBPM.save();
    ctxBPM.fillStyle = "red";
    ctxBPM.globalAlpha = 0.9;
    ctxBPM.beginPath();
    ctxBPM.arc(xTurn(turn), yQ(qCur), 4, 0, 2 * Math.PI);
    ctxBPM.fill();
    ctxBPM.restore();

    // labels
    ctxBPM.save();
    ctxBPM.fillStyle = "#111";
    ctxBPM.font = "14px system-ui";
    ctxBPM.fillText("Centroid q vs turn", 10, 20);
    ctxBPM.font = "12px system-ui";
    ctxBPM.fillText(`q̄ = ${qCur.toFixed(4)}`, 10, 38);
    ctxBPM.restore();
  }

  function drawAll() {
    drawPhaseSpace();
    drawBPM();
  }

  // ---------------------------
  // Animation loop (requestAnimationFrame)
  // Use a simple timer to control speed ~60ms per step (your interval)
  // ---------------------------
  let lastTime = 0;
  const stepIntervalMs = 60;

  function animate(t) {
    if (!playing) return;

    if (!lastTime) lastTime = t;
    const dt = t - lastTime;

    if (dt >= stepIntervalMs) {
      lastTime = t;
      if (turn < nTurns - 1) {
        stepOnce();
      } else {
        // stop at end
        playing = false;
        playPauseBtn.textContent = "Play";
        return;
      }
    }

    rafId = requestAnimationFrame(animate);
  }

  // ---------------------------
  // UI wiring
  // ---------------------------
  function syncLabels() {
    Q0Val.textContent = parseFloat(Q0Slider.value).toFixed(3);
    sigmaQVal.textContent = parseFloat(sigmaQSlider.value).toFixed(4);
    kickVal.textContent = parseFloat(kickSlider.value).toFixed(3);
  }

  function stopAnimation() {
    playing = false;
    playPauseBtn.textContent = "Play";
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    lastTime = 0;
  }

  playPauseBtn.addEventListener("click", () => {
    if (playing) {
      stopAnimation();
    } else {
      playing = true;
      playPauseBtn.textContent = "Pause";
      rafId = requestAnimationFrame(animate);
    }
  });

  stepBtn.addEventListener("click", () => {
    stopAnimation();
    if (turn < nTurns - 1) stepOnce();
  });

  resetBtn.addEventListener("click", () => {
    stopAnimation();
    initState();
  });

  // If parameters change, reset (simple + minimal)
  for (const el of [Q0Slider, sigmaQSlider, kickSlider]) {
    el.addEventListener("input", () => {
      syncLabels();
    });
    el.addEventListener("change", () => {
      stopAnimation();
      initState();
    });
  }

  // ---------------------------
  // Boot
  // ---------------------------
  syncLabels();
  initState();
})();
