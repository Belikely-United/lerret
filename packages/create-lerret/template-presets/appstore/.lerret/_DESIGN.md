---
name: Lerret
description: App Store screenshots and marketing shots.
colors:
  brand: "#B85B33"
  on-brand: "#FFFFFF"
  accent: "#F1EDE5"
  neutral-dark: "#1A1714"
  neutral-light: "#F8F4EC"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 72px
    fontWeight: "700"
    lineHeight: 76px
    letterSpacing: -0.03em
  heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 34px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 13px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.08em
spacing:
  unit: 8px
  gutter: 48px
rounded:
  DEFAULT: 12px
  full: 9999px
---

# Design system

The brand authority for this project. Lerret reads this first, so every asset
it writes or edits lands on these values. Edit it like any other file —
it is plain Markdown in [Google's open DESIGN.md format](https://github.com/google-labs-code/design.md).

## Overview

Store shots sell one idea each. Big type, generous margins, nothing competing for attention.

## Colors

`{colors.brand}` carries the piece — let it breathe rather than crowding it
with a second accent. Every background token has a matching `on-` text color;
use the pair so contrast stays readable.

## Typography

Two levels per asset, at most: one `display` idea and one supporting `body`.
A third size is usually a sign the asset is trying to say two things.

## Layout

Everything lands on the `{spacing.unit}` grid. Margins are generous by
default — white space is the cheapest way to look considered.

## Voice

- Calm and factual. No hype, no exclamation marks.
- Lead with the specific thing; cut the adjectives.

## Do's and Don'ts

- Don't put `{colors.brand}` next to another saturated color.
- Don't stack more than two type sizes on one asset.
- Do keep copy short enough to read at thumbnail size.

<!-- Scope rules to a folder with a comment like the one below; the closest
     matching scope wins. Uncomment and edit to use it.

<!-- scope: social/ -->
## Social overrides
- One idea per post. Lead with the verb.
-->
