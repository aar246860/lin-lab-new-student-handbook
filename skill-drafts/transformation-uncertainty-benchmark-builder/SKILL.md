---
name: transformation-uncertainty-benchmark-builder
description: Use when designing groundwater pumping-test transformation-uncertainty benchmarks, model-comparison cases, parameter-transfer audits, or decision-propagation examples.
---

# Transformation Uncertainty Benchmark Builder

Draft skill for building benchmark cases from observed response to model-conditioned decision impact.

## When to Use

Use when comparing:

- Theis and Cooper-Jacob.
- Leaky, unconfined, boundary, well-storage, or Lagging Darcy models.
- Target-only and transferred parameter interpretations.
- Parameter uncertainty and engineering decision endpoints.

## Required Output

1. Dataset card.
2. Candidate analytical models.
3. Parameter definitions.
4. Fit and residual diagnostics.
5. Model-conditioned parameter table.
6. Decision endpoint comparison.
7. Claim boundary.

## Evidence Boundary

If data are synthetic, label them synthetic. If a curve is schematic, label it schematic. If a parameter is model-conditioned, do not call it a true aquifer property without qualification.

## Do Not

- Treat model mismatch as random noise only.
- Compare models only by RMSE.
- Ignore parameter identifiability.
- Claim practical importance without showing a decision endpoint.
