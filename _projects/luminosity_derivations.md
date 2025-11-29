---
title: Luminosity (Derivations)
parent: Luminosity
nav_order: 1
layout: default
---

# Luminosity in Accelerator Physics (Derivations)

Derivations from Luminosity Page

## 1a. Luminosity of Round, Gaussian Beams

Starting from this definition of Luminosity:

$$ \mathcal{L} = KfN_1N_2N_b\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}\int_{-\infty}^{\infty} \rho_1(x, y, s, -s_0) \rho_2(x, y, s, s_0) dx dy ds ds_0$$

For a gaussian distribution for one beam:\
$$\rho(x, y, z) = \frac{1}{(2\pi)^{3/2}\sigma_x\sigma_y\sigma_z}\exp(-\frac{1}{2}((\frac{x}{\sigma_x})^2 + (\frac{y}{\sigma_y})^2 + (\frac{z}{\sigma_z})^2))$$

For two beams heading toward each other ($$v_1 = - v_2$$), then $$K = 2$$

And assumming a round beam:\
$$\sigma_{x1} = \sigma_{x2} = \sigma_{x}$$ = constant\
$$\sigma_{y1} = \sigma_{y2} = \sigma_{y}$$ = constant\
$$\sigma_{z1} = \sigma_{z2} = \sigma_{z}$$ = constant

Then:\
$$\rho_1\rho_2 = \frac{1}{(2\pi)^3(\sigma_x\sigma_y\sigma_z)^2}\exp(-(\frac{x}{\sigma_x})^2 + (\frac{y}{\sigma_y})^2 + \frac{1}{2}((\frac{z_1}{\sigma_{z}})^2 + (\frac{z_2}{\sigma_{z}})^2))$$

$$2s = z_1 - z_2$$\
$$2s_0 = -z_1 - z_2$$\
$$\Rightarrow z_2 = -s - s_0 $$ and $$ z_1 = s - s_0$$

$$ \Rightarrow \rho_1\rho_2 = \frac{1}{(2\pi)^3(\sigma_x\sigma_y\sigma_z)^2}\exp(-(\frac{x}{\sigma_x})^2 + (\frac{y}{\sigma_y})^2 + \frac{(s + s_0)^2 + (s - s_0)^2}{2\sigma_z^2})$$\
$$= \frac{1}{(2\pi)^3(\sigma_x\sigma_y\sigma_z)^2}\exp(-(\frac{x}{\sigma_x})^2 + (\frac{y}{\sigma_y})^2 + \frac{s^2 + 2ss_0 + s_0^2 + s^2 - 2ss_0 + s_0^2}{2\sigma_z^2})$$\
$$= \frac{1}{(2\pi)^3(\sigma_x\sigma_y\sigma_z)^2}\exp(-(\frac{x}{\sigma_x})^2 + (\frac{y}{\sigma_y})^2 + (\frac{s}{\sigma_z})^2 + (\frac{s_0}{\sigma_z})^2)$$

And:\
$$\Rightarrow \mathcal{L} = 
2fN_1N_2N_b\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}\int_{-\infty}^{\infty}
\frac{1}{(2\pi)^3(\sigma_x\sigma_y\sigma_z)^2}\exp(-(\frac{x}{\sigma_x})^2 + (\frac{y}{\sigma_y})^2 + (\frac{s}{\sigma_z})^2 + (\frac{s_0}{\sigma_z})^2) dx dy ds ds_0$$\
$$\Rightarrow \mathcal{L}  = \frac{fN_1N_2N_b}{4\pi\sigma_x\sigma_y}$$

## 1b. Luminosity of two different short bunches:
$$\sigma_{x1} \neq \sigma_{x2}$$\
$$\sigma_{y1} \neq \sigma_{y2}$$\
$$\sigma_{z1} = \sigma_{z2} = \sigma_{z}$$

RMS = $$\sqrt{\frac{1}{n}\sum_ix_i^2}$$\
$$\Rightarrow \sigma_i = \sqrt{\frac{1}{2}(\sigma_{i1}^2 + \sigma_{i2}^2)}$$

Then from 1:\
$$\Rightarrow \mathcal{L} = \frac{fN_1N_2N_b}{4\pi\sqrt{\frac{1}{2}(\sigma_{x1}^2 + \sigma_{x2}^2)}\sqrt{\frac{1}{2}(\sigma_{y1}^2 + \sigma_{y2}^2)}}$$
$$= \frac{fN_1N_2N_b}{2\pi\sqrt{\sigma_{x_1}^2 + \sigma_{x_2}^2}\sqrt{\sigma_{y_1}^2 + \sigma_{y_2}^2}}$$

Sources: 
[https://cds.cern.ch/record/941318/files/p361.pdf](https://cds.cern.ch/record/941318/files/p361.pdf)