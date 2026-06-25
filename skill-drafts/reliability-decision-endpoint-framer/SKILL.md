---
name: reliability-decision-endpoint-framer
description: Use when translating groundwater model parameters, uncertainty, or scenario results into engineering decision endpoints such as pumping limits, recovery time, risk margin, or failure probability.
---

# Reliability Decision Endpoint Framer

Draft skill for turning model outputs into decision language.

## When to Use

Use after parameter estimation, uncertainty analysis, or scenario simulation when the result needs engineering meaning.

## Output

Return:

1. Decision question.
2. Input parameters and uncertainty.
3. Assumptions and limits.
4. Endpoint calculation.
5. Sensitivity to model choice.
6. Management interpretation.

## Evidence Boundary

Decision endpoints depend on assumptions, thresholds, stakeholder needs, and model scope. State those conditions before giving recommendations.

## Do Not

- Present a parameter estimate as a decision.
- Hide large uncertainty behind a single best estimate.
- Recommend pumping or construction actions without a stated scenario and boundary.
- Overclaim policy relevance from a teaching example.
