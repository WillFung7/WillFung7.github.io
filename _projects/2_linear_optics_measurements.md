---
title: 2. Linear Optics Measurements
parent: 0. Projects
has_children: true
nav_order: 2
layout: default
toc: true
---

# Linear Optics Measuremenets

Measuring the optics allows accelerator physicists to estimate how the beam behaves around the ring. Measurements are done using turn by turn data from beam position monitors (BPMs). These BPMs keep track of transverse ($$x, y$$) beam centroid positions (average values), and a measurement is done using numerous different methods developed throughout the years.

## Twiss parameters
A lattice has many magnets to help steer and focus the beam around a ring. Dipoles and Quadrupoles bend and focus the beam to first order, respectively. We can tell what is happening to the beam when passing through such elements by knowing the twiss parameters (Courant-Snyder parameters) at that location. These quantities help describe the phase space (position-momentum space) of the beam at linear regions of the accelerator.

<figure>
  <img src="/assets/images/2_linear_optics_measurements/twiss_ellipse.png" alt="Twiss ellipse" width="400">
  <figcaption><strong>Figure 1.</strong> Twiss ellipse illustrating the phase–space boundary.</figcaption>
</figure>

These parameters are good indicators of the beam's phase space properties:\
$$\beta$$: Width of the ellipse\
$$\alpha$$: Tilt of the ellipse\
$$\gamma$$: Height of the ellipse\
$$\epsilon$$: Area of the ellipse

$$\epsilon$$ is not a twiss parameter, but an invariant containing all the twiss parameters. This invariant describes the equation of an ellipse:

$$\epsilon = \gamma x^2 + 2\alpha x x' + \beta x'^2 $$

<hr />

## Twiss Plot
This is an interactive plot of the twiss parameters in relationship to the phase space of the beam. The user can also choose between distribution types.

<div id="twiss" style="width: 100%; max-width: 700px; height: 600px;"></div>

<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<script src="/assets/js/2_linear_optics_measurements/twiss.js"></script>

<div style="max-width: 600px;">
    <label>
        \( \alpha \):
        <input id="alf-input" type="range" min="-5" max="5" step="0.05" value="0.0">
        <span id="alf-value">0.00</span>
    </label>
    <br>
    <label>
        \( \beta \):
        <input id="bet-input" type="range" min=".1" max="2" step="0.1" value="0.5">
        <span id="bet-value">0.5</span>
    </label>
    <br>
    <strong>\( \gamma = \frac{1 + \alpha^2}{\beta} = \) <span id="gam-value"></span></strong>
    <br>
    <label>
        \( \epsilon \):
        <input id="eps-input" type="range" min="0.0005" max=".01" step="0.0005" value="0.001">
        <span id="eps-value">0.001</span>
    </label>
    <br>
    <label>
        Number of Particles:
        <input id="N-input" type="range" min="100" max="5000" step="100" value="2500">
        <span id="N-value">2500</span>
    </label>
    <br>
    <button id="reset-button" style="margin-top: 10px;">
    RESET
    </button>
<div>

<hr />

The linear optics we are then measuring will mostly refer to the beta function. This is the beta value at every point of the ring, and it depends on the placement of the magnets as well as the beam quality.

At interaction regions, the beta function before and after are large so that in between them (interaction point), the beta function is relatively small compared to the rest of the ring. This makes the transverse beam size small, and thus the luminosity larger.