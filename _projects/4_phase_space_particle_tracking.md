---
title: 4. Phase Space Particle Tracking
has_children: true
nav_order: 4
layout: default
toc: true
---

# Phase Space Particle Tracking

In accelerator physics, particle tracking is used to model the accelerator inside the beam. Programs like MAD-X and Elegant are used to build a virtual accelerator, then to build a beam and see what happens to it in said accelerator. In this model, the accelerator's linear and nonlinear optics can be calculated, and quantities such as dynamic aperture and beam loss can also be obtained.

However, if one needs to study the general transverse dynamics of an accelerator and not a specific complexity of an accelerator, it can be tedious to study a such a complicated model with many moving parts, and a more basic model of an accelerator will suffice. One might want to study a general property, or where maybe one or two elements are used while.

In the linear case, the whole lattice can be described using a matrix, a mathematically linear structure, to describe phase space transports. One example of such a linear lattice is a FODO Lattice. 

In this section, we will explore nonlinear yet transverse cases that I have used for machine learning purposes. These cases show more expressivity than a linear accelerator, yet are less complicated than an actual accelerator model such as RHIC or the LHC. 