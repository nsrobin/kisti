# Component inventory (§12)

Names match SPEC §12 exactly. Every value is a token from `tokens/tokens.json` unless it is a raw number in pt. "BN/EN" means the Bengali and English type sizes from `type`. Visual reference: `design-source/DSComponents.dc.html` (dark) and `DSComponentsLight.dc.html`.

General rules
- Touch targets are at least 48 × 48 (`size.touchMin`). Chips, segments and icon buttons all meet this.
- No status relies on colour alone. Every status has a shape (stitch mark) and/or an icon plus a text label.
- Accessibility: buttons are real buttons; icon-only buttons carry `accessibilityLabel` from `a11y.*` strings; money read aloud as "32,683 taka" / "৩২,৬৮৩ টাকা" (§9.2).
- Money colours never change meaning (§11.3). Text on a 10% tint of a money colour is the only tinted-text case.

## MoneyValue
- Sizes: `hero` 48, `figure.xl` 32, `figure.lg` 22, `figure.md` 17. Weights 800 / 700 / 700 / 600. Width axis 125 / 112.5 / 100 / 100.
- ৳ is a separate Text at 70% of the figure size, same colour, baseline-aligned. Negative: true minus U+2212 *before* ৳ (`−৳৪,০০০.০০`).
- Placeholder: `—` in `text.muted`, no ৳.
- Digits: Bengali when `lang=bn` and `bengaliDigits` on. Tabular numerals always.
- Hero shrink: 48 → 40 when the figure string exceeds 8 glyphs (e.g. last installment ৳৩২,৬৩৭.৭২); above font scale 1.0 use `adjustsFontSizeToFit` inside 360 pt.
- Roll animation: `motion.json → numberRoll`. Only on settle.

## AmountInput / RateInput
- Label above (caption, `text.secondary`), gap 6. Field height 52, radius 14, `bg.sunken`, 1px `line`, horizontal padding 14.
- Prefix ৳ (AmountInput) or suffix % (RateInput) in `text.secondary`, 17 SemiBold. Value 17 SemiBold `text.primary` (never a money colour inside inputs: teal fails 4.5:1 on sunken in light).
- States: empty (placeholder `০`/`0` in `text.muted`), focused (1px `money.emi` outer + inner ring, commas removed, caret `money.emi`), filled (lakh commas added on blur), error (same ring in `status.error` + InlineError below + shake), disabled (opacity 0.45).
- Keyboard `decimal-pad`. Accept ০-৯ and 0-9; strip commas when parsing (`reference/kisti-engine.js → parseNumberInput`).
- Optional helper text (13, `text.muted`): `form.amountHelp`.

## DurationInput
- Row: stepper box (52 high, radius 14, sunken) with − and + buttons 48 × 48 and value text min-width 56, then SegmentedControl Years/Months on the right (wraps under at narrow widths).
- Step: 12 months in Years mode, 1 in Months mode. Range 1–360. Switching to Years rounds to whole years (min 12).
- Value text: "৫ বছর" / "60 Months".

## MonthField
- Same box as AmountInput; CalendarBlank icon in `money.principal`, value 17 SemiBold, CaretRight in `text.secondary`. Placeholder `form.chooseMonth` in `text.muted`. Error state like inputs. Opens S6.

## PresetChip
- Height 48, pill, padding 0 16, body size Medium. Default: `bg.raised` + 1.5px `line`. Active: `money.emi` 10% fill + 1.5px `money.emi` border + leading check icon (16, `money.emi`); label stays `text.primary`. Pressed: scale 0.96 on `bg.sunken`.
- Row scrolls horizontally, bleeding to the screen edges (negative margin 20, padding 20).

## SectionCard and Accordion
- SectionCard: radius 20, `bg.raised`, 1px `line`, light-mode shadow, padding 16, gap 14. Title row: 24 icon (money colour of the section, duotone) + `section` text.
- Accordion header: full-width button, min-height 64, padding 0 16, icon + title + CaretDown (rotates 180° when open). Body padding 0 16 18.

## SummaryRow
- Normal: min-height 38, 8 pt colour dot + label (body, `text.secondary`) left; value `figure.md` in the row's money colour right.
- Emphasised: caption label above a `figure.xl` value; optional caption below in `text.muted` (used for the EMI × n caption).

## DeductionRow
- As SummaryRow but a 20 pt icon in `money.deduction` replaces the dot; value always `money.deduction`.

## StackedBar, InterestShareBar, SplitBar
- Track `bg.sunken`, height 12 (10 for SplitBar), pill ends, 2 pt gap between segments, each segment pill-capped.
- StackedBar: deductions `money.deduction` | cash `money.cash`, legend row of two 10 × 4 swatches. At or over 100% deductions the bar is all pink.
- InterestShareBar: interest `money.interest` | principal `money.principal`, text below "২২% …" SemiBold.
- SplitBar: one month's interest vs principal, under the two values.

## HeroEmiCard
- Radius 28, 1.5 pt aurora border (gradient border over `bg.raised`), depth per theme (`depth.*.hero`), padding 22/22/20.
- Content: caption label; hero MoneyValue in `money.emi`; "Exact calculated EMI ৳32,682.42" (body, value `text.primary` SemiBold); ArrowUp 16 + ceiling note (caption, `text.muted`); two pills (radius full, `bg.sunken`, caption) "৬০টি কিস্তি", "মাসে ০.৮৭২৫%".
- Invalid: hero shows `—` in `text.muted`, pills and exact line hidden, InlineError line with the first validation message.
- Compact (sticky mini bar): centred pill, min-height 48, faux glass + 1px line, caption label + `figure.lg` 800 SemiExpanded teal value. Appears 10 pt below the safe area once the hero leaves the viewport. Tap scrolls to top.

## StitchRing
- 200 pt (S7 hero) and 120 pt. Geometry in `tokens.stitch.ring`; implementation in `reference/kisti-engine.js → ringSegments`. Draw with react-native-svg `Path` arcs.
- One stitch per installment when n ≤ 120, else one per year, last partial year at half length. Uses `actualInstallmentCount`, not tenure (242 for the early-payoff loan → 21 stitches).
- Layers: 1px `line` track circle; upcoming `money.principal` @ 0.45; paid `money.cash`; due stitch in `money.emi` + aurora glow stroke at 2.8× width. Due pulse: 2 s loop, opacity 0.6↔1 (glow 0.25↔0.55).
- Centre: "১৩/৬০" (hero ExtraBold Expanded, 40 pt; 30 pt when the count string has more than 4 digits) + caption `detail.done`.
- States: running, not started (all upcoming, 0/n), completed (all paid, n/n).
- Draw animation on open: mask the paid + due layer with a circle stroke whose dashoffset animates from C to C·(1 − dueK/n) over 600 ms.

## StitchProgress
- Linear ring equivalent for LoanCard: height 10, stretches full card width. Units n ≤ 60 per installment, else per year. Label below right: `loan.progressOf` ("৬০টির মধ্যে ১৩").

## MonthGrid and MonthCell
- Grid 4 × 3, gap 8. Calendar mode cell: height 72, radius 16, month short name (caption) above the status mark, gap 10. Picker mode cell: height 56, name only.
- Calendar states (marks from `tokens.stitch.calendarMarks`):
  - paid: filled 22 × 6 green bar; due: 16 pt teal ring with aurora glow, cell tinted `money.emi` 10% with 45% teal border; upcoming: 22 × 6 outlined violet @ 0.45; final: extra 8 pt marigold knot after the mark; outside: whole cell opacity 0.3, disabled.
  - selected: `bg.raised`, 2 pt `text.primary` border, lifted (translateY −2 + `depth.*.selectedCell`), label Bold. Pressed: scale 0.96, `bg.sunken`.
- Picker states: default (`bg.base` + line), selected (solid `money.emi`, `onEmi` text, Bold), disabled (0.3, outside 30 years ago … 5 years ahead).
- Header: CaretLeft / year (20 Bold SemiExpanded) / CaretRight as 48 pt buttons (disabled at 0.3 beyond loan range) and a "এই মাস" outline pill button on the right (disabled when the loan is not running). Horizontal swipe changes year.
- Below: 2 × 2 legend (paid, due, upcoming, final) and the assumption note in a `bg.base` box with Info icon.

## StatusChip
- Min-height 32 (28–30 on cards), pill, padding 0 10, 13 SemiBold. Fill = status colour 10%, text + 15 pt icon in status colour.
- paid: CheckCircle, `money.cash`. due: Target, `money.emi`. upcoming: Clock, `money.principal`. notStarted: HourglassMedium, `money.principal`, "{n} মাস পরে শুরু". completed: CheckCircle, `money.cash`.

## LoanCard
- Whole card is one pressable (radius 20, raised, padding 16, gap 12) → S7.
- Row 1: 44 pt avatar (loan accent at 16% fill, initials in accent, 15 Bold), bank name (`section`, ellipsis) + nickname (caption), StatusChip right.
- Row 2: caption "ব্যাংকের মাসিক কিস্তি" + bank EMI 28 ExtraBold SemiExpanded teal.
- Row 3: StitchProgress + "১৩ of 60" label.
- Row 4 (top hairline): two columns, `card.remaining` (`figure.md` violet) | `card.next` (month, or `—` when completed).
- Variants: running, not started, completed. Sort: running (by next due), not started, completed.

## SummaryStrip
- Raised card, padding 16. Sentence from `loans.thisMonthTotal.one/other`, with the amount spliced in as a 22 Bold SemiExpanded teal span. Hairline, then `loans.totalRemaining` + `figure.lg`-ish (20 Bold) violet value.
- Shown only when at least one loan is running. Remaining = running loans' closing after this month + full principal of not-started loans.

## ScheduleRowCard
- Radius 14, `bg.base` inside cards (`bg.raised` on S9), 1px line, padding 10 12, gap 6.
- Top line: month label (calculator: "মাস ১"; loan: "অক্টো ২০২৫" with the status mark before it) + installment 20–22 Bold teal right.
- Three columns (12 pt `text.muted` labels): সুদ (marigold), মূল টাকা শোধ (violet), মাস শেষে বাকি (violet, right-aligned), values 14 SemiBold.
- Final row: border marigold @ 0.45 + knot dot + `sum.lastInstallment` tag. Current (due) row on S9: 2 pt teal border + `status.due` tag. Selected row on S7: 2 pt teal border. Gap row: centred "…" in `text.muted`.

## Buttons
- All pill-shaped. Primary: `money.emi` fill + `onEmi` text, 52 high (48 compact), 15–16 Bold. Secondary: 1.5 pt `money.emi` border + teal text. Ghost: no border, `text.primary`. Destructive: `status.error` fill + `onEmi` text.
- Pressed: scale 0.96 and fill at 82% (secondary/ghost: 10% tint). Disabled: `line` fill, `text.muted` text.
- IconButton 48 × 48 round, transparent (pressed: `text.primary` 10%). FAB: extended pill 56 high, Plus 24 + `loans.add`, teal with a 24-blur teal glow at 45%; sits 104 pt above the bottom, right 20.

## SegmentedControl, SwitchRow, ListRow
- SegmentedControl: track `bg.sunken` + line, padding 3, segments min-height 44, active segment `bg.raised` (+ 1px line in dark, soft shadow in light). Optional 16 pt leading icon.
- SwitchRow: min-height 56, 22 pt icon (`money.principal`), label body SemiBold, switch track 52 × 32 (on `money.emi`, off `line`), knob 26 (on `onEmi`; off `text.secondary` dark / white light). Whole touch area 56 × 48.
- ListRow: min-height 56, icon + label + CaretRight; destructive variant in `status.error`.

## BottomSheet, ConfirmDialog
- BottomSheet: top radius 28, `bg.raised`, 1px top line, padding 10 20 30, grab handle 40 × 5, scrim `color.*.scrim`. Drag to dismiss (gesture-handler).
- ConfirmDialog: centred, horizontal margin 24, radius 28, padding 24, 56 pt icon disc (error 10%), title (`title`), body, two equal buttons (Secondary cancel + Destructive). Two-step delete-all adds a "ধাপ ১/২" caption.

## Snackbar, Toast
- Snackbar: inverse surface (`text.primary` fill, `bg.base` text), radius 16, min-height 56, left 16 / right 16 / bottom 100 (above the tab bar). Action text in the *other* theme's teal (`#087A6F` on the dark-mode snackbar, `#2EE6D0` on light). 4 pt dashed countdown line along the bottom for the 5 s Undo window.
- Toast: inverse pill, CheckCircle + text, centred.

## WarningBanner, InlineError
- WarningBanner: `money.interest` 10% fill, 1px marigold @ 45% border, radius 14, Warning 22 icon, body text `text.primary`.
- InlineError: Warning 16 + caption in `status.error`, gap 6, fades in.

## EmptyState
- `assets/empty-state.svg` (stitch ring with an aurora arc, needle and dashed thread around a muted ৳), title (`title`), body (≤ 300 wide, centred), Primary button `loans.add`.

## TabBar
- Faux glass, 1px top line, padding 6 8 20, three equal items min-height 56: icon 24 + label 13. Active: icon `money.emi` with duotone fill (30%), label `text.primary` SemiBold, 36 × 3 aurora indicator 6 pt above the icon. Inactive: `text.secondary`.

## SuccessMoment
- Scrim over S7, centred 92 pt disc (`bg.raised`, 4 pt aurora stroke), green check (stroke 7, round), 8 aurora sparks radiating r 62 → 82, title `form.saved`. Tap anywhere or auto-dismiss after the animation.

## LanguageCard
- Min-height 132, radius 28, padding 20 22. Language name 44 ExtraBold Expanded in its own script + sample line ("লোন ও কিস্তি ক্যালকুলেটর" / "Loan & EMI Calculator"). 32 pt radio on the right. Selected: 2 pt teal border, teal 10% fill, filled teal radio with check.
