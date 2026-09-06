# ITCS333 — Assignment 2: CSS Styling & Layout (2.5%)

Style a provided page (form + table + card grid) using **one external stylesheet**. You must demonstrate selectors, the box model, Flexbox/Grid layout, and a responsive breakpoint.

## Learning outcomes
CILO 1, 2 — CSS selectors, cascade/specificity, box model, modern layout, responsive design.

## What you must build
- `css/style.css` — your stylesheet. This is the **only** file you need to create/edit for styling.
- Do **not** edit `index.html` except to link your stylesheet in the `<head>`.
- **No inline `style=` attributes.**

## Requirements (graded — see rubric)
1. External stylesheet linked; no inline styles.
2. At least 3 selector kinds: class, id, descendant or pseudo-class.
3. Box model: visible margin, padding, and border applied per the design spec (see `index.html` comments).
4. The card grid uses `display: grid` or `display: flex` with correct track/gap values.
5. Form controls styled, including a `:focus` state.
6. A `@media` query: the card grid collapses to a single column at ≤ 700px.
7. No `!important`; stylesheet parses without errors.

## Rubric (100 points = 2.5%)
| # | Check | Points |
|---|---|---|
| 1 | External stylesheet linked; no inline `style=` attributes | 10 |
| 2 | ≥3 selector kinds used (class, id, descendant/pseudo-class) | 15 |
| 3 | Box model: margin/padding/border per spec | 15 |
| 4 | Card grid uses flex/grid with correct gap/track values | 20 |
| 5 | Form controls styled; `:focus` state exists | 10 |
| 6 | `@media` query collapses grid under 700px | 20 |
| 7 | No `!important`; CSS parses without errors | 10 |

## How to work
Fork → enable Actions → clone → edit `css/style.css` → push → submit fork URL in Blackboard (Sunday 23:59, Week 5).

## Run the tests locally
```bash
npm ci --prefix tests   # first time only
./run_tests.sh
```

## Rules
Individual assignment. Do not modify `tests/` or `.github/`. Official grading uses the instructor's pristine test copy.
