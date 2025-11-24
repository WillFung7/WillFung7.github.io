---
title: McMillan Map
parent: Projects
nav_order: 1
layout: default
---

# Sextupole McMillan Map

Interactive contours of

$$
K_{SX}(p,q,a) = p^2 - a p q + q^2 + p^2 q + p q^2,
$$

with 

$$
a = -\frac{2 \epsilon}{\gamma}.
$$

---

## Controls

<div style="max-width: 600px;">
  <label>
    γ:
    <input id="gamma-input" type="range" min="-2.0" max="2.0" step="0.05" value="-2.0">
    <span id="gamma-value">1.00</span>
  </label>
  <br>
  <label>
    ε:
    <input id="eps-input" type="range" min="-2.0" max="2.0" step="0.05" value="-0.75">
    <span id="eps-value">-0.75</span>
  </label>
  <br>
  <label>
    contour number:
    <input id="ncontours-input" type="range" min="10" max="50" step="1" value="30">
    <span id="ncontours-value">30</span>
  </label>
  <br>
  <strong>a = <span id="a-value"></span></strong>
</div>

---

## Contour plot

<div id="mcmillan-plot" style="width: 100%; max-width: 700px; height: 600px;"></div>

<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<script src="/assets/js/mcmillan.js"></script>