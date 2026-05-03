// assets/js/4_phase_space_particle_tracking/2D_henon_map.js

function getElem(id) {
    return document.getElementById(id);
}

function safeFixed(val, digits = 5) {
    return Number.isFinite(val) ? val.toFixed(digits) : "N/A";
}

function henon2DStep(z, mux, muy) {
    let x = z.x;
    let px = z.px;
    let y = z.y;
    let py = z.py;

    // Normalized sextupole kick
    const pxBar = px + x * x - y * y;
    const pyBar = py - 2.0 * x * y;

    const cx = Math.cos(mux);
    const sx = Math.sin(mux);
    const cy = Math.cos(muy);
    const sy = Math.sin(muy);

    // Linear rotations
    const xNext  =  x * cx + pxBar * sx;
    const pxNext = -x * sx + pxBar * cx;

    const yNext  =  y * cy + pyBar * sy;
    const pyNext = -y * sy + pyBar * cy;

    return {
        x: xNext,
        px: pxNext,
        y: yNext,
        py: pyNext
    };
}

// Dynamic Aperture Calculations
function survivesHenon2D(x0, y0, nux, nuy, nTurn, rMax) {
    const mux = 2.0 * Math.PI * nux;
    const muy = 2.0 * Math.PI * nuy;

    let z = {
        x: x0,
        px: 0.0,
        y: y0,
        py: 0.0
    };

    for (let i = 0; i < nTurn; i++) {
        z = henon2DStep(z, mux, muy);

        if (
            !Number.isFinite(z.x) ||
            !Number.isFinite(z.px) ||
            !Number.isFinite(z.y) ||
            !Number.isFinite(z.py)
        ) {
            return false;
        }

        const r = Math.sqrt(z.x * z.x + z.y * z.y);
        if (r > rMax) {
            return false;
        }
    }

    return true;
}

function maxYGivenX(x0, nux, nuy, nTurn, rMax, tol) {
    function survivesY(y0) {
        return survivesHenon2D(x0, y0, nux, nuy, nTurn, rMax);
    }

    if (!survivesY(0.0)) {
        return NaN;
    }

    let yHi = 0.05;
    let count = 0;
    const maxExpand = 50;

    while (survivesY(yHi) && count < maxExpand) {
        yHi *= 1.5;
        count += 1;

        if (yHi >= rMax) {
            return rMax;
        }
    }

    if (survivesY(yHi)) {
        return yHi;
    }

    let yLo = 0.0;

    while ((yHi - yLo) > tol) {
        const yMid = 0.5 * (yLo + yHi);
        if (survivesY(yMid)) {
            yLo = yMid;
        } else {
            yHi = yMid;
        }
    }

    return yLo;
}

function maxXGivenY(y0, nux, nuy, nTurn, rMax, tol) {
    function survivesX(x0) {
        return survivesHenon2D(x0, y0, nux, nuy, nTurn, rMax);
    }

    if (!survivesX(0.0)) {
        return NaN;
    }

    let xHi = 0.05;
    let count = 0;
    const maxExpand = 50;

    while (survivesX(xHi) && count < maxExpand) {
        xHi *= 1.5;
        count += 1;

        if (xHi >= rMax) {
            return rMax;
        }
    }

    if (survivesX(xHi)) {
        return xHi;
    }

    let xLo = 0.0;

    while ((xHi - xLo) > tol) {
        const xMid = 0.5 * (xLo + xHi);
        if (survivesX(xMid)) {
            xLo = xMid;
        } else {
            xHi = xMid;
        }
    }

    return xLo;
}

function computeBoundary(nux, nuy, nTurn, rMax, nPoints, tol) {
    const xEnd = maxXGivenY(0.0, nux, nuy, nTurn, rMax, tol);

    const xs = [];
    const ys = [];

    if (!Number.isFinite(xEnd)) {
        return {
            xs,
            ys,
            xEnd: NaN,
            yEnd: NaN
        };
    }

    for (let i = 0; i <= nPoints; i++) {
        const x0 = xEnd * i / nPoints;
        const yMax = maxYGivenX(x0, nux, nuy, nTurn, rMax, tol);
        xs.push(x0);
        ys.push(yMax);
    }

    return {
        xs,
        ys,
        xEnd,
        yEnd: ys.length > 0 ? ys[0] : NaN
    };
}

function makeSymmetricBoundary(xs, ys) {
    const xFull = [];
    const yFull = [];

    // Q1
    for (let i = 0; i < xs.length; i++) {
        xFull.push(xs[i]);
        yFull.push(ys[i]);
    }

    // Q2
    for (let i = xs.length - 1; i >= 0; i--) {
        xFull.push(-xs[i]);
        yFull.push(ys[i]);
    }

    // Q3
    for (let i = 0; i < xs.length; i++) {
        xFull.push(-xs[i]);
        yFull.push(-ys[i]);
    }

    // Q4
    for (let i = xs.length - 1; i >= 0; i--) {
        xFull.push(xs[i]);
        yFull.push(-ys[i]);
    }

    // Close curve
    if (xs.length > 0) {
        xFull.push(xs[0]);
        yFull.push(ys[0]);
    }

    return { x: xFull, y: yFull };
}

function estimateArea(xs, ys) {
    let areaQ1 = 0.0;

    for (let i = 0; i < xs.length - 1; i++) {
        const dx = xs[i + 1] - xs[i];
        const avgY = 0.5 * (ys[i] + ys[i + 1]);
        areaQ1 += dx * avgY;
    }

    return 4.0 * areaQ1;
}

function makeCircleTrace(rMax) {
    const x = [];
    const y = [];
    const nCircle = 300;

    for (let i = 0; i <= nCircle; i++) {
        const theta = 2.0 * Math.PI * i / nCircle;
        x.push(rMax * Math.cos(theta));
        y.push(rMax * Math.sin(theta));
    }

    return {
        x,
        y,
        mode: "lines",
        type: "scatter",
        name: "r_max",
        line: {
            color: "gray",
            width: 1,
            dash: "dash"
        }
    };
}

// 4D Phase Space Calculations
function linspace(start, end, n) {
    if (n <= 1) return [start];
    const arr = [];
    const step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) {
        arr.push(start + i * step);
    }
    return arr;
}

function trackHenon2DParticles(x0Arr, y0Arr, px0Arr, py0Arr, nux, nuy, nTurn, rMax = Infinity) {
    const mux = 2.0 * Math.PI * nux;
    const muy = 2.0 * Math.PI * nuy;

    const nPart = x0Arr.length;

    // Data[turn][particle] = {x, px, y, py, alive}
    const data = new Array(nTurn);

    data[0] = new Array(nPart);
    for (let p = 0; p < nPart; p++) {
        data[0][p] = {
            x: x0Arr[p],
            px: px0Arr[p],
            y: y0Arr[p],
            py: py0Arr[p],
            alive: true
        };
    }

    for (let t = 1; t < nTurn; t++) {
        data[t] = new Array(nPart);

        for (let p = 0; p < nPart; p++) {
            const prev = data[t - 1][p];

            if (!prev.alive) {
                data[t][p] = {
                    x: NaN,
                    px: NaN,
                    y: NaN,
                    py: NaN,
                    alive: false
                };
                continue;
            }

            const next = henon2DStep(prev, mux, muy);

            const finite =
                Number.isFinite(next.x) &&
                Number.isFinite(next.px) &&
                Number.isFinite(next.y) &&
                Number.isFinite(next.py);

            const r = Math.sqrt(next.x * next.x + next.y * next.y);
            const alive = finite && (r <= rMax);

            data[t][p] = {
                x: alive ? next.x : NaN,
                px: alive ? next.px : NaN,
                y: alive ? next.y : NaN,
                py: alive ? next.py : NaN,
                alive: alive
            };
        }
    }

    return data;
}

function buildPhaseSpaceTraces(trackData) {
    const nTurn = trackData.length;
    const nPart = trackData[0].length;

    const traces = [];

    for (let p = 0; p < nPart; p++) {
        const xVals = [];
        const pxVals = [];
        const yVals = [];
        const pyVals = [];

        for (let t = 0; t < nTurn; t++) {
            const z = trackData[t][p];
            xVals.push(z.x);
            pxVals.push(z.px);
            yVals.push(z.y);
            pyVals.push(z.py);
        }

        // left subplot: x vs px
        traces.push({
            x: xVals,
            y: pxVals,
            mode: "markers",
            type: "scatter",
            xaxis: "x",
            yaxis: "y",
            showlegend: false,
            marker: {
                size: 1.5,
                opacity: 0.7
            },
            hovertemplate: "x=%{x:.4f}<br>px=%{y:.4f}<extra></extra>"
        });

        // right subplot: y vs py
        traces.push({
            x: yVals,
            y: pyVals,
            mode: "markers",
            type: "scatter",
            xaxis: "x2",
            yaxis: "y2",
            showlegend: false,
            marker: {
                size: 1.5,
                opacity: 0.7
            },
            hovertemplate: "y=%{x:.4f}<br>py=%{y:.4f}<extra></extra>"
        });
    }

    return traces;
}

function updatePhaseSpacePlot(nux, nuy, nTurn, nPart, xBound, yBound, rMax) {
    const phaseDiv = getElem("2D_henon_phase_space");
    if (!phaseDiv) return;

    if (!Number.isFinite(xBound) || !Number.isFinite(yBound) || xBound <= 0 || yBound <= 0) {
        Plotly.react(
            phaseDiv,
            [],
            {
                title: "2D Hénon Map Phase Space",
                annotations: [{
                    text: "No valid x_bound / y_bound available for tracking.",
                    x: 0.5,
                    y: 0.5,
                    xref: "paper",
                    yref: "paper",
                    showarrow: false
                }]
            }
        );
        return;
    }

    const x0 = linspace(0.0, xBound, nPart);
    const y0 = linspace(0.0, yBound, nPart);
    const px0 = new Array(nPart).fill(0.0);
    const py0 = new Array(nPart).fill(0.0);

    const trackData = trackHenon2DParticles(x0, y0, px0, py0, nux, nuy, nTurn, rMax);
    const traces = buildPhaseSpaceTraces(trackData);

    const layout = {
        title: `Tracked 2D Hénon Map Phase Space (N_traj = ${nPart}, N_turn = ${nTurn})`,
        grid: { rows: 1, columns: 2, pattern: "independent" },

        xaxis: {
            title: "$x$",
            zeroline: true
        },
        yaxis: {
            title: "$p_x$",
            zeroline: true
        },

        xaxis2: {
            title: "$y$",
            zeroline: true
        },
        yaxis2: {
            title: "$p_y$",
            zeroline: true
        },

        margin: {
            l: 60,
            r: 30,
            t: 60,
            b: 60
        }
    };

    Plotly.react(phaseDiv, traces, layout);
}

function updatePlot() {
    const plotDiv = getElem("2D_henon_map");

    const nux = parseFloat(getElem("nux-input").value);
    const nuy = parseFloat(getElem("nuy-input").value);
    const rMax = parseFloat(getElem("rmax-input").value);
    const nTurn = parseInt(getElem("nturn-input").value);
    const nPart = parseInt(getElem("npart-input").value);
    const nPoints = parseInt(getElem("npoints-input").value);
    const tol = parseFloat(getElem("tol-input").value);

    const xQuery = parseFloat(getElem("xquery-input").value);
    const yQuery = parseFloat(getElem("yquery-input").value);

    const result = computeBoundary(nux, nuy, nTurn, rMax, nPoints, tol);
    const boundary = makeSymmetricBoundary(result.xs, result.ys);
    const area = estimateArea(result.xs, result.ys);

    const yBound = Number.isFinite(xQuery)
        ? maxYGivenX(Math.abs(xQuery), nux, nuy, nTurn, rMax, tol)
        : NaN;

    const xBound = Number.isFinite(yQuery)
        ? maxXGivenY(Math.abs(yQuery), nux, nuy, nTurn, rMax, tol)
        : NaN;

    const pointInside = (
        Number.isFinite(xQuery) &&
        Number.isFinite(yQuery) &&
        survivesHenon2D(xQuery, yQuery, nux, nuy, nTurn, rMax)
    );

    getElem("da-area-value").textContent = safeFixed(area);
    getElem("x-da-value").textContent = safeFixed(result.xEnd);
    getElem("y-da-value").textContent = safeFixed(result.yEnd);
    getElem("y-bound-value").textContent = safeFixed(yBound);
    getElem("x-bound-value").textContent = safeFixed(xBound);
    getElem("point-status-value").textContent = pointInside ? "inside" : "outside";

    const warnings = [];
    if (!Number.isFinite(yBound)) {
        warnings.push("Chosen x does not produce a valid DA intersection.");
    }
    if (!Number.isFinite(xBound)) {
        warnings.push("Chosen y does not produce a valid DA intersection.");
    }
    getElem("warning-text").textContent = warnings.join(" ");

    const plotLimit = 1.1 * rMax;

    const boundaryTrace = {
        x: boundary.x,
        y: boundary.y,
        mode: "lines",
        type: "scatter",
        name: "DA boundary",
        fill: "toself",
        fillcolor: "rgba(173, 216, 230, 0.35)", // light blue
        line: {
            color: "blue",
            width: 2
        }
    };

    const circleTrace = makeCircleTrace(rMax);

    const verticalLineTrace = {
        x: [xQuery, xQuery],
        y: [-plotLimit, plotLimit],
        mode: "lines",
        type: "scatter",
        name: "x = const",
        line: {
            color: "black",
            width: 1.5
        }
    };

    const horizontalLineTrace = {
        x: [-plotLimit, plotLimit],
        y: [yQuery, yQuery],
        mode: "lines",
        type: "scatter",
        name: "y = const",
        line: {
            color: "black",
            width: 1.5
        }
    };

    const verticalDotsTrace = {
        x: Number.isFinite(yBound) ? [xQuery, xQuery] : [],
        y: Number.isFinite(yBound) ? [yBound, -yBound] : [],
        mode: "markers",
        type: "scatter",
        name: "Vertical intersections",
        marker: {
            color: "red",
            size: 9
        }
    };

    const horizontalDotsTrace = {
        x: Number.isFinite(xBound) ? [xBound, -xBound] : [],
        y: Number.isFinite(xBound) ? [yQuery, yQuery] : [],
        mode: "markers",
        type: "scatter",
        name: "Horizontal intersections",
        marker: {
            color: "red",
            size: 9
        }
    };

    const selectedPointTrace = {
        x: [xQuery],
        y: [yQuery],
        mode: "markers",
        type: "scatter",
        name: "Selected point",
        marker: {
            color: pointInside ? "black" : "darkred",
            size: 8,
            symbol: "x"
        }
    };

    const layout = {
        title: `2D Hénon Map DA Slice: νx = ${nux.toFixed(4)}, νy = ${nuy.toFixed(4)}`,
        xaxis: {
            title: "$x$",
            range: [-plotLimit, plotLimit],
            zeroline: true,
        },
        yaxis: {
            title: "$y$",
            range: [-plotLimit, plotLimit],
            zeroline: true
        },
        margin: {
            l: 60,
            r: 30,
            t: 60,
            b: 60
        },
        showlegend: true
    };

    Plotly.react(
        plotDiv,
        [
            boundaryTrace,
            circleTrace,
            verticalLineTrace,
            horizontalLineTrace,
            verticalDotsTrace,
            horizontalDotsTrace,
            selectedPointTrace
        ],
        layout
    );

    updatePhaseSpacePlot(nux, nuy, nTurn, nPart, xBound, yBound, rMax);
}

function resetInputs() {
    getElem("nux-input").value = 0.2493;
    getElem("nuy-input").value = 0.2517;
    getElem("rmax-input").value = 2.0;
    getElem("nturn-input").value = 500;
    getElem("npart-input").value = 25;
    getElem("npoints-input").value = 100;
    getElem("tol-input").value = 0.001;
    getElem("xquery-input").value = 0.05;
    getElem("yquery-input").value = 0.05;

    updatePlot();
}

function init2DHenonPlot() {
    const updateButton = getElem("update-button");
    const resetButton = getElem("reset-button");

    updateButton.addEventListener("click", updatePlot);
    resetButton.addEventListener("click", resetInputs);

    [
        "nux-input",
        "nuy-input",
        "rmax-input",
        "nturn-input",
        "npart-input",
        "npoints-input",
        "tol-input",
        "xquery-input",
        "yquery-input"
    ].forEach(function(id) {
        getElem(id).addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                updatePlot();
            }
        });
    });

    updatePlot();
}

document.addEventListener("DOMContentLoaded", init2DHenonPlot);