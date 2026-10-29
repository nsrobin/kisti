# Kisti (কিস্তি): design handoff for Claude Code

Design: "Neon Kantha", built from SPEC v1.1 (29 October 2026). Target: bare React Native CLI app, TypeScript, New Architecture. This is a native app handoff, not a website: rebuild every screen with React Native views and the tokens below. Do not port the HTML.

Order of authority (SPEC §0): Part 1 product truth > Part 3 build rules > **this bundle** > Part 2 design intent.

## Where things go
Unzip at the repo root. You get:

```
docs/
  SPEC.md                      the spec (unchanged copy of v1.1)
  design-handoff/
    README.md                  this file: start here
    tokens/tokens.json         colours (both themes), contrast ratios, aurora, loan accents,
                               type scale, spacing, radius, sizes, depth, stitch geometry, motion
    tokens/motion.json         every §15.2 moment with duration, easing, sound, haptic, reduce-motion fallback; §15.3 sounds
    copy/strings.json          all §9.3 + §5.11 strings verbatim (status "spec") plus design additions (status "added")
    copy/months.json           full and short month names, bn and en
    components.md              §12 inventory: measurements and every state
    screens.md                 §13 screens: layout order, every state, the exact sample data, flows
    reference/kisti-engine.js  calculation, month mapping, formatting and ring-geometry logic the designs run
    reference/oracle.test.js   checks the engine against every number in §5.12 and §13.1 (all pass)
    assets/app-icon/           ios-1024.svg, android-foreground/background/monochrome.svg
    assets/splash.svg, assets/empty-state.svg
    assets/icons/              35 icon stand-ins (SVG) + icons.json mapping each to its Phosphor name
    design-source/             the 55 Claude Design canvas files (*.dc.html + canvas.json)
```

## Suggested addition to the §29 master prompt
> Before P1, read `docs/design-handoff/README.md`, then `tokens/tokens.json`, `components.md` and `screens.md`. Generate `src/theme/` from `tokens.json` and `src/i18n/` from `copy/strings.json`. Port `reference/kisti-engine.js` to typed modules in `src/domain/` and turn `reference/oracle.test.js` into Jest tests. Use `design-source/*.dc.html` only as a visual and layout reference.

## How to read `design-source/`
Each `.dc.html` is one artboard from the canvas. It runs only inside Claude Design, so open them as text: the markup holds the exact layout (flex, gaps, paddings, radii, font sizes), and the `<script>` block at the bottom holds the data and logic. The main screen files take `theme`, `lang` and `variant` props. The small files (for example `S7Paid.dc.html`) just mount a main file with one state:

| Main file | States it renders |
|---|---|
| `S3Calculator` | default, topup, error, exceed, formula, schedule, sticky, keyboard (`w=360` for the Android check) |
| `S4Loans` | list, empty, undo |
| `S5LoanForm` | empty, filled, error, ded, picker (= S6), edit |
| `S7LoanDetail` | a, b, c, d, e, f, menu, delete, success (`sched=true` opens the schedule) |
| `S8Settings` | default, confirm, confirm2 |
| `S9Schedule` | `mode=calc`, `mode=loan` |
| `S1Splash`, `S2Language`, `DSComponents` | theme (and `picked` on S2) |

Foundations and references: `Main` (colour + contrast + type), `DSStitch` (stitch language, MoneyValue, space, radius, depth, icons), `DSComponents`, `AppIcon`, `Motion`.

## Deviations from the spec, and why
1. **text.muted (light) is #625E8F, not #6A6696.** The old value was 4.48:1 on bg.sunken, where input placeholders sit. The new value is 5.04:1; every other text pair passes as specified (see `tokens.contrast`).
2. **Money colours never sit inside inputs.** Light-mode teal is 4.41:1 on bg.sunken, so input values use text.primary and teal figures stay on base or raised surfaces.
3. **Loan accent swatches** (§7.2 doesn't define them): five new colours, Nil, Shimul, Orchid, Kadam and Akash, chosen apart from the money colours so those keep their meanings. Light Kadam is #5E6C0A so initials pass contrast.
4. **Stitch stroke** is scaled for legibility: about 3.9 pt on the 200 pt, 60-installment ring (the spec's base is 3 at dash 8). The formula is in `tokens.stitch`.
5. **StitchProgress on cards** uses one stitch per installment up to 60, then one per year, so it stays readable at card width. The ring keeps the spec's 120 threshold.
6. **Loan overview (S7)** lists only deductions above zero, plus the total, so a loan without deductions doesn't show four ৳0.00 rows. The calculator (S3) still shows all four, as §5.8 requires.
7. **Hero shrink rule:** the hero drops 48 → 40 pt when the figure has more than 8 glyphs (the final ৳৩২,৬৩৭.৭২ has to fit inside a card at 360 pt).
8. **Early-payoff example (S7 f)** uses the fictional "Shapla Bank" loan, starting January 2010, so the §13.1 example (৳1,000 @ 12% for 30 years, 242 installments) can be shown running.
9. **Added screen:** `S5Edit` (Edit mode of S5), so the ⋯ → Edit flow has a target.
10. **First-month validation:** S5 shows "Choose the first installment month" when the month is missing (the spec marks the field as required but gives no message).
11. **Icons** in the designs are hand-drawn stand-ins. Ship `phosphor-react-native` using the names in `assets/icons/icons.json` (regular weight for controls, duotone at 30% money colour for feature icons).
12. **App icon and splash SVGs** set ৳ and the wordmark as live Anek text. Convert them to outlines before exporting PNGs or Android vector drawables.

## New copy to add to §9.3
All of these are in `copy/strings.json` with `"status": "added"`: loan.progressOf, card.remaining, card.next, ded.cashShort, formula.yourNumbers, formula.ceiling, form.chooseMonth, form.recentBanks, form.nicknamePlaceholder, form.amountHelp, err.firstMonthEmpty, onboarding.changeLater, settings.version, clear.confirm1.title/body/yes, clear.confirm2.title/body/yes, clear.step, and a11y.back/close/more/prevYear/nextYear/outsideLoan.

## Checklist status (§17)
- Money colours are applied by meaning on every screen. Bank EMI is the largest element on S3; the month's installment is the largest in the S7 breakdown, and remaining principal is second.
- Both themes pass the contrast targets after deviation 1.
- Bengali uses the §11.5 line heights. Clipping test words are on the `Main` board; 360 pt check: `S3Android`.
- Lakh grouping everywhere; Bengali digits in Bengali designs; English versions of S3 and S7.
- Every §13 state is present. All numbers come from the engine and match §5.12 and §13.1 (`reference/oracle.test.js`).
- Touch targets are ≥ 48 pt. No status relies on colour alone (shape + icon + label).
- Nothing from the §10 avoid list: no gradient text, no all-caps, no real bank names, no live blur.
- Motion is annotated with reduce-motion fallbacks (`tokens/motion.json`, `Motion` board).
- No out-of-scope features.

Not done in the design tool: rendered screenshots. Board heights are estimates, and the designs weren't visually QA'd in a renderer, so check spacing on device during P-phase reviews.
