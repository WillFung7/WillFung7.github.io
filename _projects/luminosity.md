---
title: Luminosity
parent: Projects
has_children: true
nav_order: 1
layout: default
toc: false
---

# Luminosity in Accelerator Physics

Colliders drive physics experiments with high energy collisions from two beams traveling at near light speeds. Luminosity is an important measurement of performance in colliders. It is defined as the number of useful interaction events during collision. At the Interaction Region (IR), two beam bunches collide like so:

![colliding_beams](/assets/images/luminosity/colliding_beams.png)

From this, we can calulate the number of useful interactions by summing up where the particles meet (product) over space and time (4-dimensional integral):

$$ \mathcal{L} = KfN_1N_2N_b\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}\int_{-\infty}^{\infty} \rho_1(x, y, s, -s_0) \rho_2(x, y, s, s_0) dx dy ds ds_0$$

Where:
- $$\mathcal{L}$$: Luminosity in units of $$cm^{−2}s^{−1}$$
- $$K$$: Relativistic Kinematic factor:

$$ K = \sqrt{ (\vec{v_1} − \vec{v_2})^2 − \frac{ (\vec{v_1} \times \vec{v_2})^2 }{c^2} }$$

- $$\rho$$: Beam density
- $$f$$: Revolution frequency ($$Hz$$)
- $$N_1, N_2$$: Number of Particles for both beams
- $$N_b$$: Number of bunches
- $$s_0 = ct$$: Time axis in space units ($$m$$)

## 1. Head on Collisions

Assuming round gaussian beams and head on collisions, the luminosity can be derived as:

$$ \mathcal{L_0} = \frac{fN_1N_2 N_b} {4\pi \sigma_x \sigma_y}$$

And for two different gaussian short bunches (different $$\sigma_x$$ and $$\sigma_y$$ but same $$\sigma_z$$):

$$\mathcal{L_{0xy}} = \frac{fN_1N_2N_b}{2\pi\sqrt{\sigma_{x_1}^2 + \sigma_{x_2}^2}\sqrt{\sigma_{y_1}^2 + \sigma_{y_2}^2}}$$

## 2. Crossing Angle

To avoid unwanted collisions and/or because of machine error, the beams can come at an angles with respect to the beam trajectory:

![colliding_beams](/assets/images/luminosity/colliding_beams_CA.png)

A change of coordinates is used via the rotation matrix in the tilted ($$xs$$) plane. The plane is rotated by $$\frac{\phi}{2}$$ for beam 1 which yields the ($$x_1s_1$$) plane, and $$-\frac{\phi}{2}$$ for beam 2 which yields the ($$x_2s_2$$) plane:

$$ 
\begin{bmatrix}

x_1 \\ s_1 

\end{bmatrix}
= 
\begin{bmatrix}

\cos(\frac{\phi}{2}) & -\sin(\frac{\phi}{2}) \\ \sin(\frac{\phi}{2}) &  \cos(\frac{\phi}{2}) 

\end{bmatrix}

\begin{bmatrix}

x \\ s 

\end{bmatrix}

$$

$$ 
\begin{bmatrix}

x_2 \\ s_2

\end{bmatrix}
= 
\begin{bmatrix}

  \cos(\frac{\phi}{2}) & \sin(\frac{\phi}{2}) \\ 
- \sin(\frac{\phi}{2}) & \cos(\frac{\phi}{2}) 

\end{bmatrix}

\begin{bmatrix}

x \\ s 

\end{bmatrix}

$$

The luminosity then becomes:

$$ \mathcal{L_{CA}} = L_0 S(\phi)$$

Where:

$$S(\phi) = \frac{1}{\sqrt{1 + (\frac{\sigma_s}{\sigma_x})^2\tan^2(\frac{\phi}{2})}}$$






<!-- $$ \frac{dR}{dt} = \mathcal{L} \sigma_p$$

Where:
- $$\frac{dR}{dt}$$: Number of events per second
- $$\mathcal{L}$$: Luminosity in units of $$cm^{−2}s^{−1}$$
- $$\sigma_p$$: Production cross section of the two beams -->



Sources: 
[https://cds.cern.ch/record/941318/files/p361.pdf](https://cds.cern.ch/record/941318/files/p361.pdf)