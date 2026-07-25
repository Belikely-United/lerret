---
name: Lerret
description: Calm, factual, builder-to-builder.
colors:
  brand: "#B85B33"
  on-brand: "#FFFFFF"
  accent: "#F1EDE5"
  neutralDark: "#1A1714"
typography:
  display:
    fontFamily: Geist
    fontSize: 72px
    fontWeight: "700"
    lineHeight: 76px
    letterSpacing: -0.03em
  body:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
spacing:
  unit: 8px
  gutter: 48px
rounded:
  DEFAULT: 12px
  full: 9999px
---

# Design System — Lerret (dogfood fixture)

The canonical brand authority for this project. The AI reads this FIRST when
resolving any brand-token reference ("our orange", "the brand font"). Values
here WIN over `config.json` `vars`.

## Overview

Calm and technical. The work should look considered, never loud.

## Colors

`{colors.brand}` carries the piece — let it breathe. Text on brand uses
`{colors.on-brand}`.

## Typography

Display for one idea per asset; never more than two levels on a card.

## Layout

Everything lands on the `{spacing.unit}` grid.

## Voice

- Calm, factual, builder-to-builder. No hype, no exclamation marks.
- Lowercase product nouns; never shout the brand name.
- Default to specifics over adjectives.

<!-- scope: social-media/ -->

## Social-media overrides

For anything under `social-media/`, tighten the voice further:

- One idea per post. Lead with the verb.
- Hashtags are off unless explicitly asked.
- The brand orange `#B85B33` carries the post — let it breathe; do not crowd it
  with secondary colors.

<!-- scope: social-media/twitter/ -->

## Twitter-only overrides

Closer scope wins: for anything under `social-media/twitter/` these rules
REPLACE the broader social-media section above.

- Tweet copy stays under 200 characters end-to-end.
