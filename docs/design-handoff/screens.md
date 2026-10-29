# Screens and states (§13)

Frames are 390 × 844 pt (plus a 360 pt check). "Today" in every design is October 2026. Each state lists the design-source board that shows it (`design-source/<Board>.dc.html`). Boards whose name has no "Light"/"En" suffix are dark, Bengali.

Layout constants: safe top 52 (stack screens 44 + header), side padding 20, gap 16 between sections (14 on lists). Tab screens end with the TabBar; stack screens (S5, S7, S9) have no TabBar.

## S1 Splash — `S1Splash`, `S1SplashLight`
Centred 260 pt stitched aurora ring (r 112, stroke 7, plus an 18 pt glow copy at 14% / 8%) around the কিস্তি wordmark (64 ExtraBold Expanded) with "Kisti" (26, `text.secondary`) beneath. Native splash via react-native-bootsplash; keep brief. Asset: `assets/splash.svg`.

## S2 Language choice — `S2Language` (default), `S2LanguageBn` (বাংলা selected), `S2LanguageLight`
Top: 44 pt ring-and-৳ mark + wordmark. Title "ভাষা বেছে নিন" (28 Bold) with "Choose your language" under it. Two LanguageCards. Helper line `onboarding.changeLater` in both languages. Bottom: full-width Primary "ঠিক আছে  Done", disabled until a card is picked. Default state pre-selects nothing (the phone locale only decides the S3 language if the user skips).

## S3 Calculator — 12 boards
Order top to bottom (§6):
1. Header: `app.title` (title), `app.subtitle` (caption).
2. HeroEmiCard.
3. "দ্রুত উদাহরণ" label + PresetChip row (3).
4. SectionCard "লোনের তথ্য" (Coins icon, teal): AmountInput, RateInput, DurationInput, then a hairline and two read-only rows (monthly rate, number of installments).
5. SectionCard "লোন দেওয়ার সময় যা কেটে রাখবে" (Receipt, pink): four AmountInputs (settlement, insurance, fees, other), WarningBanner when exceeded, breakdown rows (approved loan in violet, four DeductionRows, total), StackedBar + legend, net cash block (14 pt radius box, cash 10% fill — error 10% when negative; HandCoins icon; `figure.xl` green, red when negative).
6. SectionCard "পরিশোধের হিসাব" (ChartPieSlice, marigold): number of installments row; emphasised total repayment (teal) + EMI × n caption; emphasised total interest (marigold); five SummaryRows (principal, last installment, first month interest, first month principal, balance after first); InterestShareBar; early-payoff note when it applies; estimate note with Info icon.
7. Accordion "কীভাবে হিসাব হয়" (MathOperations, violet).
8. Accordion "কিস্তির তালিকা" (ListNumbers, teal).
9. Secondary button "আমার লোন হিসেবে রাখুন" (Bank icon) → S5 prefilled.
10. TabBar.

States:
| State | Board | Data |
|---|---|---|
| Default (preset 1) | `S3Calculator`, `S3CalculatorLight`, `S3CalculatorEn` | ৳১৫,২১,৫৯৫.৯৫, 10.47%, 5 years → ৳৩২,৬৮৩ |
| Top-up preset with deductions | `S3Topup`, `S3TopupLight` | 13,00,000 @ 10.57%; deductions 8,51,000 / 30,000 / 5,000 → net ৳৪,১৪,০০০.০০ |
| Validation error | `S3Error` | Amount empty → hero `—`, every derived value `—`, InlineError "লোনের পরিমাণ লিখুন" |
| Deductions exceed loan | `S3Exceed` | Top-up with settlement 12,69,000 → total 13,04,000, net −৳৪,০০০.০০, banner, all-pink bar |
| Formula expanded | `S3Formula` | Formula box; P, r, n definitions; "আপনার সংখ্যা দিয়ে": P, r = 10.47 ÷ 12 ÷ 100 = 0.008725, n, (1+r)ⁿ = 1.684097, EMI = ৳32,682.423279; ceiling box 32,682.42 → ৳32,683; `formula.whyTotal` |
| Schedule expanded | `S3Schedule` | Months 1–12, gap row, month 60 (৳৩২,৬৩৭.৭২, highlighted), "সব মাস দেখুন" → S9 |
| Sticky mini EMI bar | `S3Sticky` | Scrolled ~1,260 pt; compact hero pill at top |
| Keyboard open | `S3Keyboard` | Amount focused, raw "1521595.95", field scrolled above a decimal pad, TabBar hidden |
| 360 pt check | `S3Android` | Default at 360 wide; nothing truncates; Duration row wraps if needed |

Behaviour: recalc on every valid keystroke; roll animation on settle; editing any field clears the active preset; first launch uses preset 1, later launches restore last inputs (MMKV).

## S4 My Loans — `S4Loans`, `S4LoansLight`, `S4Empty`, `S4EmptyLight`, `S4Undo`
Title "আমার লোন" (28 Bold SemiExpanded). SummaryStrip. LoanCards sorted running → not started → completed. Extended FAB. TabBar.

| State | Data |
|---|---|
| Three loans | A Kantha Bank (running, due, ১৩ of ৬০, remaining ৳১২,৫৫,৬৬৪.৫৭, next অক্টোবর ২০২৬); B Dhanshiri Bank (starts in 3 months, ৳২৭,৯৮৮, remaining ৳১৩,০০,০০০.০০, next জানুয়ারি ২০২৭); C Moyna Bank (completed, ৳৯,১৩৭, remaining ৳০.০০, next —). Strip: ৳৩২,৬৮৩ (১টি লোন), remaining ৳২৫,৫৫,৬৬৪.৫৭ |
| Empty | EmptyState, no FAB |
| After delete | A removed → no running loan → SummaryStrip hidden; Snackbar "লোন মুছে ফেলা হয়েছে" + "ফিরিয়ে আনুন" for 5 s |

## S5 Add or edit loan — `S5LoanForm` (empty), `S5Filled`, `S5FilledLight`, `S5Error`, `S5Deductions`, `S5Edit`
Header: Close (X) + title (`loans.add` or `form.editTitle`). Fields: bank name (Bank icon; when empty, "আগে লেখা ব্যাংক" suggestion chips from previously used names), nickname (PencilSimple, placeholder), AmountInput, RateInput, DurationInput, MonthField, collapsible deductions card (Receipt; four inputs + live net cash), card colour (five 48 pt round swatches, selected = 3 pt `text.primary` ring + check). Sticky glass footer: left "ব্যাংকের মাসিক কিস্তি" + live bank EMI (22 ExtraBold teal, `—` while invalid) + "শেষ কিস্তির মাস: …"; right Primary "লোন সেভ করুন" (disabled until valid).

| State | Data |
|---|---|
| Empty | Duration 5 years, colour rotated to slot 4, Save disabled, preview `—` |
| Filled (Loan A) | কাঁথা ব্যাংক / বাড়ির লোন / 15,21,595.95 / 10.47 / 5 years / অক্টোবর ২০২৫ → ৳৩২,৬৮৩, last month সেপ্টেম্বর ২০৩০ |
| Errors | Bank empty, rate 55 (range error), month missing → three inline errors, preview `—` |
| Deductions expanded | Loan B values, deductions filled, net ৳৪,১৪,০০০.০০ |
| Edit | Loan A, title "লোন এডিট করুন" |
Save → SuccessMoment → S7.

## S6 Month picker — `S6MonthPicker`, `S6MonthPickerLight`
BottomSheet over S5: handle, title `form.firstMonth`, ‹ ২০২৫ › with 48 pt arrow buttons, MonthGrid picker mode with অক্টো selected, Primary "ঠিক আছে". Range: 30 years back to 5 years ahead of the current month; out-of-range cells disabled. Same `MonthGrid` component as S7.

## S7 Loan detail — 11 boards
Order (§7.4): header (Back, avatar + bank + nickname, ⋯); hero (StitchRing 200, then two raised tiles side by side: bank EMI 26 ExtraBold teal | remaining principal 20 Bold violet; StatusChip under the ring for not started / completed); calendar card (MonthGrid header, grid, legend, assumption note); selected month breakdown card; loan overview card; formula accordion; schedule accordion.

Breakdown card: title month + year (`title`), "৬০টির মধ্যে ১৩ নম্বর কিস্তি", StatusChip right; "এই মাসের কিস্তি" + hero teal (largest number); interest | principal values with SplitBar; hairline; remaining principal `figure.xl` violet (second largest); 2 × 2 tiles (`bg.base`, radius 14): still to pay (teal), paid so far (green), interest paid so far (marigold), installments left.

Overview card: approved loan, non-zero deductions only, total deductions, net cash block (green 10% box, 26 Bold green), bank EMI, exact EMI, total repayment, total interest, last installment, last installment month, InterestShareBar, EMI × n caption, early-payoff note, estimate note.

| State | Board | Data |
|---|---|---|
| (a) Oct 2026 due | `S7LoanDetail`, `S7LoanDetailLight`, `S7LoanDetailEn` (schedule open) | ১৩/৬০; ৳৩২,৬৮৩; interest ৳১১,১৪৩.৬০; principal ৳২১,৫৩৯.৪০; remaining ৳১২,৫৫,৬৬৪.৫৭; still ৳১৫,৩৬,০৫৫.৭২; paid ৳৪,২৪,৮৭৯.০০; interest paid ৳১,৫৮,৯৪৭.৬২; left ৪৭ |
| (b) Sep 2026 paid | `S7Paid` | Month 12 snapshot from §5.12 |
| (c) Sep 2030 final | `S7Final` | ৳৩২,৬৩৭.৭২ (hero shrinks to 40), remaining ৳০.০০ |
| (d) Loan B not started | `S7NotStarted` | ০/৬০, chip "৩ মাস পরে শুরু", January 2027 selected, "এই মাস" disabled, deductions in overview |
| (e) Loan C completed | `S7Completed` | ২৪/২৪, chip "সব কিস্তি শেষ", May 2025 selected |
| (f) Early payoff | `S7EarlyPayoff` | Fictional Shapla Bank ৳১,০০০ @ 12% for 30 years from Jan 2010: 242 installments, ring in year stitches (21, last one half), early-payoff note, no EMI × n caption |
| ⋯ menu | `S7Menu` | Popover (220 wide, radius 20) at top-right: Edit (PencilSimple) → S5 edit, Delete (Trash, red) |
| Delete confirmation | `S7Delete` | ConfirmDialog "এই লোন মুছে ফেলবেন?" with bank + nickname → S4 Undo |
| Success moment | `S7Success` | SuccessMoment overlay after Save |

Interactions: tapping a cell or a schedule row selects that month (schedule row also scrolls up to the calendar); arrows/swipe change year within the loan's range; "এই মাস" jumps to today.

## S8 Settings — `S8Settings`, `S8SettingsLight`, `S8Confirm`, `S8Confirm2`
Title. Card 1: Language segmented (বাংলা | English, each in its own script), Theme segmented with icons (ফোনের মতো | লাইট | ডার্ক), "সংখ্যা বাংলায় দেখান" switch (Bengali mode only). Card 2: Sound and Vibration SwitchRows (speaker icon swaps to SpeakerSlash when off). Delete-all ListRow in red. About card: label + version, small wordmark, disclaimer. TabBar.
Delete all: first ConfirmDialog (`clear.confirm1.*`, "ধাপ ১/২") → second (`clear.confirm2.*`, Warning icon, "ধাপ ২/২") → S4 empty.

## S9 Full schedule — `S9Schedule` (calculator), `S9ScheduleLoan`, `S9ScheduleLoanLight`
Header (Back, title, subtitle: "৬০টি কিস্তি, ৳১৫,২১,৫৯৫.৯৫, ১০.৪৭%" or bank + nickname), FlatList of ScheduleRowCards (`bg.raised`), sticky glass footer with total repayment (teal) | total interest (marigold). Loan mode inserts year headers (20 Bold SemiExpanded + hairline), uses real short month names, shows status marks and tags the current month.

## Overlays
Success moment (`S7Success`), delete confirmation (`S7Delete`), Undo snackbar (`S4Undo`), month picker sheet (`S6MonthPicker`), ⋯ menu (`S7Menu`), delete-all dialogs (`S8Confirm`, `S8Confirm2`).

## Prototype flows (§4)
First launch S1 → S2 → S3. S3 "Save as my loan" → S5 filled → Save → success → S7. S4 card → S7; S4 FAB → S5 → Save → success → S7. S7 ⋯ → Edit → S5 edit, or Delete → confirm → S4 with Undo. Tabs link S3, S4, S8; S8 switches language and theme live.
