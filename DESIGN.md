# UniStay — Design Language

A precise spec for reproducing the UniStay look. Hand this whole file to Claude Code. The visual quality lives in the **details in §8** — if a build looks "off," it's almost always one of those being skipped.

---

## 1. Fonts (non-negotiable — this is 50% of the look)

Two families, loaded from Google Fonts:

- **Bricolage Grotesque** — display font. Used ONLY for: the H1 hero headline, card titles ("Find your flat"), button labels, and big numbers (stats like "1200+", "4.8"). Weights 700–800.
- **Manrope** — everything else (UI, body, labels, inputs, chips). Weights 400–800.

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Rule: **never** put body text or input text in Bricolage, and never put the headline in Manrope. The contrast between the two is the brand.

---

## 2. Color tokens (exact hex — do not approximate)

```
/* Brand */
--brand:            #6d28d9   /* primary purple — buttons, focus, active icons */
--brand-top:        #7c3aed   /* lighter purple — top of button gradient */
--brand-ink:        #2a1259   /* deep purple — wordmark */
--uni-accent:       #3b51c4   /* indigo — university icon (differentiates from cities) */

/* Purple tints (backgrounds) */
--tint:             #f3effe   /* icon tiles, chip hover fill */
--tint-hover:       #f6f3fd   /* row / segment hover */
--tint-indigo:      #eef0fb   /* university icon tile */

/* Text */
--text:             #1c1530   /* primary text */
--text-body:        #3a3646   /* nav links / body */
--text-muted:       #6b6675   /* captions */
--text-label:       #8a8499   /* uppercase field labels */
--text-soft:        #9a94a8   /* "Popular:" / secondary row line */
--placeholder:      #9aa0ad
--chip-text:        #4a3d6b

/* Lines & surfaces */
--border:           #e6e2ef   /* input / chip borders (1.5px) */
--divider:          #efecf5   /* hairline dividers */
--divider-soft:     #f0edf7
--page:             #faf9fc   /* page bg + input fill */
--white:            #ffffff
--dark:             #0d0a14   /* trust band */

/* Status (3rd-party logos only) */
--trustpilot:       #00b67a
--google-gold:      #fbbc05
```

**Overlay on hero photo** (so white text stays legible): a left→right dark gradient over the image —
`linear-gradient(100deg, rgba(20,14,32,.82) 0%, rgba(20,14,32,.5) 42%, rgba(20,14,32,.18) 72%, rgba(20,14,32,.32) 100%)`. On mobile use a top+bottom version: `linear-gradient(180deg, rgba(20,14,32,.55) 0%, rgba(20,14,32,.35) 40%, rgba(20,14,32,.85) 100%)`.

---

## 3. Type scale

| Use | Font | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| H1 hero (desktop) | Bricolage | 78px | 800 | -0.03em | 0.98 |
| H1 hero (mobile) | Bricolage | 44px | 800 | -0.03em | 0.98 |
| Card title | Bricolage | 22px | 700 | -0.02em | 1 |
| Stat number | Bricolage | 20–34px | 800 | normal | 1 |
| Button label | Bricolage | 16–17px | 700 | normal | 1 |
| Eyebrow ("THE BEST WAY TO") | Manrope | 14px | 700 | **0.22em** | uppercase |
| Field label ("WHERE") | Manrope | 11px | 700 | **0.12em** | uppercase |
| Input text / value | Manrope | 15px | 600 | normal | — |
| Body / sub | Manrope | 15–18px | 400–500 | normal | 1.5 |
| Chip / small | Manrope | 13px | 600 | normal | — |

The two uppercase + wide-tracking labels (eyebrow at 0.22em, field labels at 0.12em) are a signature — keep the tracking.

---

## 4. Radius & spacing

```
Radius:  pills/chips/avatars 999px · search bar 18px · cards 18–22px
         inputs/buttons/segments 12–14px · icon tiles 10px
Outer page padding (desktop): 56px ·  max content width: 1500px
Field height: 50–52px (desktop) · button height: 54–56px
Standard gaps: 4 / 7 / 9 / 12 / 26px
```

---

## 5. Shadows (copy exactly — vague shadows are the #1 reason rebuilds look flat)

```
Search bar:    0 24px 50px -16px rgba(34,18,68,.40), 0 2px 8px rgba(34,18,68,.08)
Floating card: 0 30px 70px -20px rgba(34,18,68,.45), 0 2px 8px rgba(34,18,68,.08)
Dropdown:      0 24px 50px -18px rgba(34,18,68,.40), 0 2px 8px rgba(34,18,68,.06)
Button:        0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22)
Focus ring:    0 0 0 4px rgba(109,40,217,.13)
```

Note the shadow color is **purple-tinted ink (34,18,68)**, never neutral grey. That's what makes it feel branded.

---

## 6. Component recipes

### Text input / select
```
height: 52px; padding: 0 16px (44–46px left if it has a leading icon);
border: 1.5px solid #e6e2ef; border-radius: 14px; background: #faf9fc;
font: 600 15px Manrope; color: #1c1530;
:focus → border-color: #6d28d9; background: #fff; box-shadow: 0 0 0 4px rgba(109,40,217,.13);
```
- Leading magnifier/pin icon, 18px, sits inside on the left; it turns from `#b0aabf` → `#6d28d9` on focus.
- Selects: hide native arrow (`appearance:none`) and draw your own chevron-down in `#6d28d9`, `stroke-width:2.4`.
- Date inputs: tint the native picker icon purple via the filter in §8.

### Primary button
```
height: 56px; border-radius: 14px; border: none; color: #fff;
font: 700 17px Bricolage Grotesque;
background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%);
box-shadow: 0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22);
:hover → transform: translateY(-1px); filter: brightness(1.05);
:active → transform: translateY(0);
```
Leading icon (magnifier) 18–19px, `gap: 10px`, centered. The **`inset 0 1px 0 rgba(255,255,255,.22)` top highlight + the vertical gradient** are what give it depth — a flat solid-purple button is the most common downgrade.

### Secondary / outline button (Login, chips)
```
border: 1.5px solid #6d28d9; color: #6d28d9; background: #fff; border-radius: 999px;
:hover → background: #6d28d9; color: #fff;   (chips: background #f3effe, keep purple text)
```

### Chip
```
font: 600 13px Manrope; color: #4a3d6b; background: #fff;
border: 1.5px solid #e6e2ef; padding: 5–8px 13–15px; border-radius: 999px;
:hover → border-color #6d28d9; background #f3effe; color #6d28d9;
```

### Icon tile (in dropdown rows)
```
34×34px; border-radius: 10px; display: grid; place-items: center;
cities/recent → background #f3effe, icon #6d28d9
universities  → background #eef0fb, icon #3b51c4
```

### Dropdown / autocomplete
```
panel: background #fff; border-radius: 18px; border: 1px solid rgba(109,40,217,.08);
       padding: 8px; shadow = Dropdown shadow above.
group header: uppercase, 800 11px Manrope, 0.12em tracking, #8a8499,
              followed by a hairline #f0edf7 filling the row.
row: flex; gap 13px; padding 11px 12px; border-radius 11px;
     icon tile · two-line text (name #1c1530 600 15px / sub #9a94a8 500 12.5px) · chevron #cfc8dd
     :hover → background #f6f3fd
long text → white-space:nowrap; overflow:hidden; text-overflow:ellipsis
```

---

## 7. Layout patterns

- **Desktop hero:** full-bleed photo + gradient; left-aligned headline column (max-width 620px); the horizontal search bar floats over the bottom edge using a negative top margin (`margin-top: -56px`). Popular-city chips sit directly below the bar.
- **Horizontal search bar:** white pill, `padding: 10px`, flex row of segments separated by 1px `#efecf5` dividers. Each segment = tiny uppercase label over a 15px/600 value; hover tints the segment `#f6f3fd`. Search button is the last flex item, full height.
- **Mobile:** nav collapses to logo + hamburger; headline 44px; search **restacks vertically** into an overlapping card (Where full-width → Type + Max-rent two-up → dates two-up → full-width button). Popular cities become a horizontal-scroll chip strip. Trust proof condenses to one dark strip.

---

## 8. The details that make or break a rebuild  ⚠️

If the build "isn't as good," check these in order:

1. **Both fonts actually loaded**, and used in the right places (Bricolage for display/buttons, Manrope for UI). A single-font build loses the brand instantly.
2. **Button depth** = the `linear-gradient(180deg,#7c3aed,#6d28d9)` + `inset 0 1px 0 rgba(255,255,255,.22)` highlight + the purple drop shadow. Don't flatten to one solid color.
3. **Focus ring** on every input/select/date: `box-shadow: 0 0 0 4px rgba(109,40,217,.13)` + border turns `#6d28d9` + background `#faf9fc`→`#fff`. Missing focus states read as "unfinished."
4. **Purple-tinted shadows** (`rgba(34,18,68,…)`), never grey. And use the exact large negative-spread values — generic `0 2px 8px` shadows look cheap.
5. **Uppercase labels keep their letter-spacing** (eyebrow 0.22em, field labels 0.12em). Without tracking they look like plain bold text.
6. **1.5px borders** (not 1px) in `#e6e2ef`; **14px** input radius (not 8px). Small numbers, big effect.
7. **Custom select chevron** in brand purple — never the default OS arrow.
8. **Input fill is `#faf9fc`** (a hair off-white), white only on focus. All-white inputs lose the soft layering.
9. **Hover states everywhere**: segments/rows tint `#f6f3fd`, chips go purple, button lifts 1px. Static = lifeless.
10. **Icon weight**: SVG strokes at `stroke-width: 2` (2.4 for chevrons/buttons), rounded caps & joins. Thin or sharp icons break the friendly tone.

### Date-input icon tint (often forgotten)
```css
input[type="date"]::-webkit-calendar-picker-indicator{
  opacity:.55; cursor:pointer;
  filter: invert(28%) sepia(73%) saturate(2400%) hue-rotate(255deg) brightness(85%) contrast(95%);
}
```

---

## 9. One-paragraph brief (paste at the top of a Claude Code prompt)

> Build in the **UniStay** design language: a warm, trustworthy student-housing brand on a near-white `#faf9fc` canvas with a single brand purple `#6d28d9` (gradient to `#7c3aed`). Pair **Bricolage Grotesque** (tight, bold display — headlines, card titles, buttons, big numbers) with **Manrope** (clean UI — body, labels, inputs). Inputs are soft-filled, 1.5px-bordered, 14px-radius, with a 4px purple focus ring; the primary button is a vertical purple gradient with an inset top highlight and a purple-tinted drop shadow. Labels are tiny uppercase Manrope with wide letter-spacing. Shadows are purple-tinted, soft, and large. Everything has a hover state. Keep it minimal, rounded, and friendly — no neutral-grey shadows, no flat solid buttons, no default OS form controls.
