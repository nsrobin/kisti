# Kisti (কিস্তি): Loan & EMI Calculator
## Final spec for product, design and build

- **App name:** Kisti / কিস্তি (store title: "Kisti: Loan EMI Calculator BD"; full naming and store listing in §31)
- **Version:** 1.1, 29 October 2026 (changes since 1.0 are listed in §0.1)
- **Replaces:** `loan_emi_calculator_react_native_spec.md`. Every rule from that file is carried over here. Where the two differ, this file wins.
- **Design tool:** Claude Design
- **Build tool:** Claude Code (bare React Native CLI, TypeScript)

---

## 0. How to use this file

| Step | Tool | What you do | Sections used |
|---|---|---|---|
| 1 | Claude Design | Start a new project and attach this file. Paste prompts D1 to D8 from §16 one at a time. Review each result before sending the next prompt. | Part 1 and Part 2 |
| 2 | Claude Design | When the design is final, export it as a handoff bundle for Claude Code (prompt D8). | §16, §17 |
| 3 | Claude Code | In a new repo folder, save this file as `docs/SPEC.md` and the handoff bundle in `docs/design-handoff/`. Paste the master prompt from §29 and approve each phase gate. | Part 1 and Part 3 |

**Order of authority:** Part 1 (product truth) > Part 3 (build rules) > design handoff bundle > Part 2 (design intent). If a design or a line of code disagrees with Part 1, Part 1 wins.

- **Part 1, Product (§1 to §9):** what the app does, every calculation rule, every screen's behaviour, and all copy in both languages.
- **Part 2, Design brief (§10 to §17):** visual direction, tokens, components, motion and sound, and the Claude Design prompts.
- **Part 3, Build spec (§18 to §31):** stack, architecture, storage, tests, performance, the Claude Code master prompt, acceptance criteria, and the app name and store listing.

### 0.1 Changes in v1.1

This version adds what the earlier planning summary contained and v1.0 did not:

- **§3.1 (new):** the seven rules from the earlier planning, each mapped to the section that enforces it, plus two reference installments the calculator must reproduce.
- **§5.6, §5.12, §6 F and G:** the total repayment estimate now has a small "EMI × n" caption, for example ৳19,60,980 next to the schedule total of ৳19,60,934.72. This lets the user match a bank's "EMI × 60" figure, and the formula section explains the difference.
- **§2:** a loan that is refinanced or closed early is handled by deleting it and adding the new loan.
- **§9.3, §20, §28.1, §30 and prompt D3:** the strings, result fields, test and acceptance item for these changes.

Everything else, including the calculation rules, design, stack and build phases, is unchanged from v1.0.

---

# PART 1: PRODUCT

## 1. Product summary

A lightweight, offline Android and iOS app for people in Bangladesh who have a bank loan or are planning one. It has two features:

1. **EMI Calculator.** Try any loan amount, rate and duration. See the bank EMI (rounded up to the next taka), money deducted at disbursement, cash in hand, repayment totals, the formula with the user's own numbers, and the full installment schedule.
2. **My Loans.** Save a real loan with its bank name, amount, rate, duration and first installment month. Pick any month on a month calendar to see that month's installment, the interest and principal parts, how much has been paid, and how much is left.

### 1.1 Name

The app is called **Kisti** (কিস্তি, "installment"). It is short, easy to say in both languages, and it is the exact word Bangladeshi borrowers use for their EMI. The store title adds the search keywords: **Kisti: Loan EMI Calculator BD**. Splash, onboarding, the app icon and the About screen use the Kisti / কিস্তি wordmark. The calculator screen title stays "Loan & EMI Calculator" / "লোন ও কিস্তি ক্যালকুলেটর". See §31 for store and SEO details.

There is no login, server, cloud database, internet requirement, ads or analytics. Everything stays on the phone.

The app supports বাংলা and English, plus light, dark and follow-phone themes.

**Product principles**

- The most important number on every screen is the biggest thing on it, shown in its money colour (§11.3).
- Every number can be explained, because the formula and schedule are always one tap away.
- Results update while the user types, so there are no spinners anywhere.
- Words are plain, especially in Bengali (§9.1).

## 2. Scope

**In scope (v1)**

- EMI calculator with presets, deductions, repayment summary, formula and schedule
- Adding, editing and deleting saved loans, with undo after delete
- A loan detail screen with a month calendar and per-month breakdown
- Bengali and English, with Bengali digits as an option in Bengali mode
- Light, dark and follow-phone themes
- Animation, subtle UI sounds and haptics, each of which can be turned off
- Local storage only

**Out of scope (v1).** Do not design or build any of these:

- Reminders or notifications
- Marking individual installments as paid or unpaid. Status is assumed from the current month (§5.10).
- Prepayment, partial payment, interest-rate changes during a loan, or grace periods
- Fees or insurance added to the financed principal (§3)
- Cloud backup, export, import or sharing
- Bank logos, home-screen widgets, currencies other than BDT, and day-level dates (months only)
- Recording that a saved loan was closed early or refinanced. When a top-up settles an old loan, the user deletes the old loan and adds the new one.

## 3. Decisions resolved during planning

| Topic | Decision |
|---|---|
| App type | A standalone bare React Native CLI app. It works fully offline, with no login and no backend. |
| Total repayment | The **sum of the actual schedule**, where the last installment is adjusted. This is not `bankEmi × n`. The last installment is shown separately, and `bankEmi × n` appears only as a small caption so the user can match it against a bank's figure (§5.6). |
| Paisa rounding | Each month's interest is rounded to the paisa (half up). Schedule money is kept in **integer paisa**. |
| Ceiling tolerance | `Math.ceil(exactEmi - 1e-6)`. The old `1e-9` value is smaller than floating-point noise for very large EMIs. |
| Precision library | None. The formula uses normal numbers and the schedule uses integer paisa. Both are exact enough and keep the app light. |
| Financed fees and insurance | Not supported. Deductions only change net cash in hand. If a bank adds fees to the loan, the user enters the larger loan amount. |
| Number grouping | Lakh and crore grouping in both languages, for example ৳15,21,595.95 and ৳১৫,২১,৫৯৫.৯৫. |
| Digits | Bengali digits in Bengali mode by default. A setting switches them to English digits. |
| Duration | Stored in **months**. The UI offers a Years/Months toggle. The calculator default is 5 years. |
| Early payoff | If rounding the EMI up finishes the loan before month *n*, the schedule ends early and the UI says so. |
| Persistence | Local only (MMKV) for saved loans, settings, the calculator's last inputs, and recently used bank names. |
| Saved data | Only the loan **inputs** are stored. The EMI and schedule are recalculated from them every time, so stored data can never disagree with the formula. |
| Status of past months | Shown as paid, on the assumption that the user paid every installment on time. The UI states this assumption. |
| Calendar | A month-and-year grid only, with no day dates. |
| Default language | Bengali if the phone's locale is Bengali, otherwise English. The user confirms the choice on first launch. |

### 3.1 Rules carried over from the earlier planning

| # | Rule | Where this spec enforces it |
|---|---|---|
| 1 | Keep the approved loan amount separate from the cash received after deductions. | §5.8, §6 E, labels in §9.3 |
| 2 | Use the reducing-balance formula unless the bank states another method. | §5.3 |
| 3 | Show both the exact EMI and the bank EMI. | §6 B, §7.4 |
| 4 | Round the bank EMI up (ceiling), never to the nearest taka. | §5.4, §28.1, §30 |
| 5 | State the assumptions behind total repayment and interest. | §5.6 (schedule total, with EMI × n as a caption), estimate note in §9.3 |
| 6 | Insurance and fees reduce the cash received. They change the EMI only if the bank adds them to the loan. | §3 (financed fees not supported), §5.8 |
| 7 | A real bank schedule can differ because of daily interest, payment dates or a last-installment adjustment. | Estimate note (§9.3), disclaimer (§8) |

**Reference points.** The calculator must reproduce two reference installments exactly:

- ৳15,21,595.95 at 10.47% for 60 months gives a bank EMI of **৳32,683**.
- ৳12,00,000 at 12% for 60 months gives a bank EMI of **৳26,694**.

These are the "My current loan" and "Original loan" presets. The "Top-up example" preset illustrates a refinance: ৳13,00,000 at 10.57%, with ৳8,51,000 settling an existing loan, a ৳30,000 insurance premium and ৳5,000 in fees.

## 4. Navigation and screens

The bottom tab bar has three tabs: **Calculator** (ক্যালকুলেটর), **My Loans** (আমার লোন) and **Settings** (সেটিংস).

| ID | Screen | Type |
|---|---|---|
| S1 | Splash | Native splash, kept brief |
| S2 | Language choice | Shown on first launch only |
| S3 | Calculator | Tab |
| S4 | My Loans list | Tab |
| S5 | Add or edit loan | Full-screen stack screen |
| S6 | Month picker | Bottom sheet, used by S5 |
| S7 | Loan detail | Stack screen |
| S8 | Settings | Tab |
| S9 | Full schedule (all months) | Stack screen, opened from S3 or S7 |

**Flows**

- First launch: S1 → S2 → S3.
- From the calculator: S3 → "Save as my loan" → S5, prefilled with the calculator's values → Save → S7, with the success moment.
- Adding a loan: S4 → "+" → S5 → Save → S7, with the success moment.
- Viewing a loan: tap a card on S4 → S7. The "⋯" menu on S7 offers Edit (opens S5) and Delete (asks for confirmation, returns to S4, and shows an Undo snackbar for 5 seconds).
- Full schedule: "Show all months" on S3 or S7 → S9.

## 5. Calculation rules (authoritative)

### 5.1 Inputs and units

| Field | Unit | Rule |
|---|---|---|
| `principal` | Taka, up to 2 decimals | Greater than 0 and at most 10,00,00,00,000 (1,000 crore) |
| `annualRatePercent` | % per year, up to 3 decimals | From 0 to 50 |
| `tenureMonths` | Whole months | From 1 to 360 |
| `settlement`, `insurance`, `bankFees`, `other` | Taka, up to 2 decimals | 0 or more. An empty field counts as 0. |

### 5.2 Monthly rate and number of installments

```
r = annualRatePercent / 100 / 12
n = tenureMonths
```

### 5.3 Exact EMI (reducing balance)

```
exactEmi = P × r × (1 + r)^n / ((1 + r)^n − 1)      when r > 0
exactEmi = P / n                                     when r = 0
```

### 5.4 Bank EMI (ceiling rule)

The bank EMI always rounds **up** to the next whole taka whenever there is a fractional part. It never uses nearest-integer rounding.

```ts
bankEmi = Math.ceil(exactEmi - 1e-6)
```

| exactEmi | bankEmi |
|---|---|
| 32682.00 | 32682 |
| 32682.0000000001 (floating-point noise) | 32682 |
| 32682.01 | 32683 |
| 32682.15 | 32683 |
| 32682.95 | 32683 |

### 5.5 Schedule (integer paisa)

```
balance = round(P × 100)                  // paisa
emi     = bankEmi × 100                   // paisa
for k = 1 … n, while balance > 0:
    interest = round(balance × r)         // half-up to the paisa
    payment  = emi
    if k == n  or  balance + interest ≤ emi:
        payment = balance + interest      // final installment, or early payoff
    principalPart = payment − interest
    closing       = balance − principalPart
    row k = { opening: balance, interest, principalPart, payment, closing }
    balance = closing
```

- The last installment is usually a little smaller than the bank EMI, because rounding up overpays slightly every month. For the default loan it is ৳32,637.72.
- `actualInstallmentCount` can be smaller than `n` when rounding up pays the loan off early (see the edge case in §5.12). When that happens, show this note: "Rounding up finishes this loan in X installments."
- Closing balances are never negative, the final closing balance is exactly 0, and the principal parts add up exactly to `P`.

### 5.6 Totals

```
totalRepaymentEstimate = Σ payment          (sum of every row)
totalInterestEstimate  = Σ interest         (= totalRepaymentEstimate − P, exact in paisa)
lastInstallment        = payment of the last row
interestShare          = totalInterestEstimate / totalRepaymentEstimate
```

```
emiTimesN                 = bankEmi × n
lastInstallmentAdjustment = emiTimesN − totalRepaymentEstimate
```

`emiTimesN` is never the main total. It appears only as a small caption under the total repayment estimate, because banks and earlier calculations often quote it, and the user should be able to match the two numbers. Hide the caption when the loan finishes early (`actualInstallmentCount < n`), because the difference then comes from fewer installments, not from an adjusted last one.

Label these values as estimates, because a bank may use daily interest, different payment dates, or its own rounding.

### 5.7 First installment

`firstMonthInterest`, `firstMonthPrincipal` and `balanceAfterFirstPayment` come from row 1 of the schedule.

### 5.8 Deductions at disbursement

```
totalDeductions = settlement + insurance + bankFees + other
netCashReceived = P − totalDeductions
deductionsExceedPrincipal = totalDeductions > P
```

Show every deduction on its own row. If the deductions are larger than the loan amount, show a warning and display the **negative** net cash. Never clamp it to 0. Deductions do not change the EMI.

### 5.9 Month snapshot (My Loans)

For installment *k* (1-based) of a saved loan:

| Value | Definition |
|---|---|
| This month's installment | `row[k].payment` |
| Interest part | `row[k].interest` |
| Principal part | `row[k].principalPart` |
| Remaining principal after this month | `row[k].closing` |
| Paid so far, including this month | Σ payment of rows 1…k |
| Interest paid so far | Σ interest of rows 1…k |
| Principal paid so far | Σ principalPart of rows 1…k |
| Still to pay | Σ payment of rows k+1…end |
| Installments left | `actualInstallmentCount − k` |

### 5.10 Mapping months to installments, and status

The first installment month is **F**, stored as `YYYY-MM`. Installment *k* falls in month `F + (k − 1)`. The final month is `F + (actualInstallmentCount − 1)`. **C** is the phone's current month.

| Month M | Status | Label (EN / বাংলা) |
|---|---|---|
| Before F | Outside the loan | Disabled in the calendar |
| After the final month | Outside the loan | Disabled in the calendar |
| Inside the loan and M < C | `paid` | Paid / শোধ হয়েছে |
| Inside the loan and M = C | `due` | This month / এই মাসে দিতে হবে |
| Inside the loan and M > C | `upcoming` | Upcoming / সামনে আসছে |

Loan-level states:

- `notStarted` applies when C < F, with the text "Starts in X months" / "X মাস পরে শুরু".
- `completed` applies when C is after the final month, with the text "All installments done" / "সব কিস্তি শেষ".
- `running` applies otherwise.

The calendar legend always shows this note: "Past months are shown as paid, assuming every installment was paid on time." / "সময়মতো কিস্তি দেওয়া ধরে আগের মাসগুলো শোধ দেখানো হচ্ছে।"

### 5.11 Validation

| Field | Problem | Message (EN) | Message (বাংলা) |
|---|---|---|---|
| Loan amount | Empty | Enter the loan amount | লোনের পরিমাণ লিখুন |
| Loan amount | 0 or less | Loan amount must be more than 0 | লোনের পরিমাণ ০-এর বেশি হতে হবে |
| Loan amount | Above the maximum | Amount is too large | পরিমাণ অনেক বেশি |
| Interest rate | Empty | Enter the interest rate | সুদের হার লিখুন |
| Interest rate | Below 0 or above 50 | Rate must be between 0% and 50% | সুদের হার ০% থেকে ৫০%-এর মধ্যে হতে হবে |
| Duration | Below 1 month or above 360 | Duration must be 1 month to 30 years | মেয়াদ ১ মাস থেকে ৩০ বছরের মধ্যে হতে হবে |
| Any number field | Not a number | Enter a valid number | সঠিক সংখ্যা লিখুন |
| Deductions | Total is above the loan amount | Deductions are more than the loan. You would get nothing and owe {amount}. | কেটে রাখা টাকা লোনের চেয়ে বেশি। হাতে কিছুই পাবেন না, উল্টো {amount} দিতে হবে। |
| Bank name (S5) | Empty | Enter the bank name | ব্যাংকের নাম লিখুন |

- Inputs accept both English digits (0–9) and Bengali digits (০–৯). Grouping commas are ignored while parsing.
- While any required field is invalid, every derived number shows "—" next to the message. Old results must never stay on screen.
- Tiny floating-point leftovers are shown as 0 (for display only).

### 5.12 Expected values (test oracle)

All presets use 60 months. Amounts are in taka.

| | My current loan | Top-up example | Original loan |
|---|---|---|---|
| Principal | 15,21,595.95 | 13,00,000.00 | 12,00,000.00 |
| Rate | 10.47% | 10.57% | 12% |
| Monthly rate r | 0.008725 | 0.0088083333… | 0.01 |
| Exact EMI | 32,682.423279 | 27,987.171319 | 26,693.337222 |
| **Bank EMI** | **32,683** | **27,988** | **26,694** |
| First month interest | 13,275.92 | 11,450.83 | 12,000.00 |
| First month principal | 19,407.08 | 16,537.17 | 14,694.00 |
| Balance after 1st installment | 15,02,188.87 | 12,83,462.83 | 11,85,306.00 |
| Last installment | 32,637.72 | 27,922.86 | 26,639.88 |
| Total repayment estimate | 19,60,934.72 | 16,79,214.86 | 16,01,585.88 |
| Total interest estimate | 4,39,338.77 | 3,79,214.86 | 4,01,585.88 |
| EMI × n (caption only) | 19,60,980.00 | 16,79,280.00 | 16,01,640.00 |
| Last installment adjustment (EMI × n − total) | 45.28 | 65.14 | 54.12 |
| Deductions | settlement 0, insurance 0, fees 0, other 0 | settlement 8,51,000, insurance 30,000, fees 5,000, other 0 | all 0 |
| Total deductions | 0 | 8,86,000.00 | 0 |
| Net cash received | 15,21,595.95 | 4,14,000.00 | 12,00,000.00 |

**Month 12 snapshot, "My current loan":**

| Value | Expected |
|---|---|
| Installment | 32,683.00 |
| Interest part | 11,329.91 |
| Principal part | 21,353.09 |
| Opening balance | 12,98,557.06 |
| Remaining principal | 12,77,203.97 |
| Paid so far | 3,92,196.00 |
| Interest paid so far | 1,47,804.02 |
| Principal paid so far | 2,44,391.98 |
| Still to pay | 15,68,738.72 |
| Installments left | 48 |

**Edge cases:**

| Case | Expected |
|---|---|
| 6,00,000 at 0% for 60 months | exactEmi = 10,000 exactly, bankEmi = 10,000 (unchanged), last installment = 10,000 |
| 15,21,595.95 at 0% for 60 months | exactEmi = 25,359.9325, bankEmi = 25,360, last installment = 25,355.95, total = principal |
| 1,000 at 12% for 360 months (early payoff) | exactEmi = 10.286126, bankEmi = 11, schedule ends after **242** installments, last installment = 0.03 |
| 10,00,00,00,000 at 30% for 360 months (large amount) | No NaN or Infinity, 360 rows, final closing balance = 0, principal parts add up exactly to the principal |

## 6. Feature 1: EMI Calculator (S3)

This is a single scrollable screen. On first launch it uses preset 1. After that it restores the user's last inputs.

| # | Section | Content |
|---|---|---|
| A | Header | Title "Loan & EMI Calculator" / "লোন ও কিস্তি ক্যালকুলেটর". Subtitle "Reducing-balance method, in taka" / "রিডিউসিং ব্যালেন্স পদ্ধতি, টাকায় হিসাব". |
| B | Hero EMI card | Label "Bank EMI". The **bank EMI is huge**, in the EMI colour. Below it, the exact calculated EMI appears as small secondary text. Then the note "Bank rounds the installment up to the next taka". Then two pills: "60 installments" and "0.8725% per month". |
| C | Quick examples | Three horizontally scrollable chips, one for each preset in §5.12. Tapping a chip sets **every** field and recalculates immediately. The active chip is highlighted until the user edits a field. |
| D | Loan details | Fields for loan amount, yearly interest rate, and duration (a stepper plus a Years/Months toggle). Read-only rows show the monthly interest rate and the number of installments. |
| E | Deductions at disbursement | Inputs for existing loan settlement, one-time insurance premium, bank fees and other deductions. Then the approved loan amount; each deduction on its own row; total deductions; a stacked bar (deductions in pink, cash in hand in green); and **estimated net cash received in big green**. Shows the warning banner when deductions exceed the loan. |
| F | Repayment summary | Total installments; **total repayment estimate (big)**; **total interest estimate (big, interest colour)**; principal; last installment; first month interest; first month principal; balance after the first installment. Under the total repayment estimate, a small muted caption: "EMI × 60 would be ৳19,60,980. The last installment is ৳45.28 lower." (hidden when the loan finishes early, §5.6). Also an interest-share bar ("22% of what you repay is interest") and the estimate note. |
| G | How it's calculated (accordion) | The formula; what P, r and n mean; the user's own numbers substituted (with `(1+r)^n` to 6 decimals); the exact EMI; the ceiling rule with a worked example, such as 32,682.42 → 32,683; and a short note on why the total is slightly less than EMI × n (`formula.whyTotal`). |
| H | Installment schedule (accordion) | Months 1 to 12, a gap row "…", and the final month. Each row is a compact card showing the month number, installment (large), interest, principal repaid and closing balance. A "Show all months" button opens S9. |
| I | Save as my loan | A secondary button that opens S5 prefilled with these values. |

**Sticky mini EMI bar.** Once the hero card scrolls out of view, a compact pill slides in under the status bar showing "Bank EMI ৳32,683". Tapping it scrolls back to the top.

**Live behaviour.** Results recalculate on every valid keystroke. The hero's number-roll animation runs only when the value settles, meaning on blur or after 250 ms with no typing.

**Keyboards.** Amount and rate fields use `decimal-pad`. The focused field scrolls above the keyboard. Commas are added when the field loses focus and removed when it gains focus.

## 7. Feature 2: My Loans

### 7.1 Loans list (S4)

- **Summary strip** (shown only when at least one loan is running): "This month's installments ৳X across N loans" / "এই মাসে মোট কিস্তি ৳X (Nটি লোন)", and "Total remaining principal ৳Y" / "মোট বাকি মূল টাকা ৳Y". The total remaining principal adds the closing balance after this month's installment for running loans to the full principal of loans that have not started yet. Completed loans are excluded.
- **Loan card:**
  - An avatar in the loan's accent colour with the bank's initials.
  - The bank name, plus the nickname if there is one.
  - The **bank EMI, big**, in the EMI colour.
  - A stitch progress bar showing "13 of 60" / "৬০টির মধ্যে ১৩".
  - The remaining principal, in the principal colour.
  - A status chip.
  - The next installment month, meaning the earliest installment month that is on or after the current month. For a loan due this month, that is the current month.
- **Sort order:** running loans first (by next due month), then loans that have not started, then completed loans.
- **Empty state:** an illustration in the stitch motif, the title "No loans yet" / "এখনো কোনো লোন যোগ করা হয়নি", the body text "Add a loan to see every month's installment, interest and remaining balance." / "লোন যোগ করুন, প্রতি মাসের কিস্তি, সুদ আর বাকি টাকা দেখুন।", and a primary button.
- **Floating "+" button:** "Add loan" / "লোন যোগ করুন".

### 7.2 Add or edit loan (S5)

| Field | Notes |
|---|---|
| Bank name | Required. Free text, with suggestions drawn from bank names the user entered before. No hard-coded bank list and no logos. |
| Loan name | Optional, for example "Home loan". |
| Loan amount | Required. |
| Interest rate (yearly) | Required. |
| Duration | Required. A stepper with a Years/Months toggle. |
| First installment month | Required. Opens S6. The allowed range is 30 years ago to 5 years ahead, so loans that are already running can be added. |
| Deductions | A collapsed section, "Add deductions (no need to fill)", with the same four fields as the calculator. |
| Colour | Five accent swatches. The default is chosen in rotation. |

- A **sticky footer** shows a live preview of the bank EMI and the last installment month, plus the "Save loan" button. The button is disabled until every field is valid.
- After saving, the app shows a success moment (§15) and opens S7.

### 7.3 Month picker (S6)

A bottom sheet with a year header (‹ 2027 ›), a 4 × 3 grid of months, and a "Done" button. The selected month is filled in the EMI colour. Months outside the allowed range are disabled. This uses the same `MonthGrid` component as the calendar in S7.

### 7.4 Loan detail (S7)

From top to bottom:

1. **Header.** A back button, the bank name and nickname, and a "⋯" menu with Edit and Delete.
2. **Hero with the stitch ring (§10).** In the centre: "13/60" in big type and "installments done" / "কিস্তি শেষ" below it. Under the ring: the bank EMI (big, EMI colour) and the remaining principal (principal colour). For loans that have not started or are completed, show the matching text from §5.10.
3. **Month calendar.**
   - A year header (‹ 2027 ›) and a 4 × 3 month grid. Swiping left or right changes the year. The arrows are disabled beyond the loan's range.
   - Cell states:
     - Paid: a filled green stitch mark.
     - Due: a glowing EMI-colour ring with a slow pulse.
     - Upcoming: an outlined principal-colour mark.
     - Final installment: a small knot mark.
     - Outside the loan: dimmed and not tappable.
     - Selected: raised and outlined.
   - A "This month" / "এই মাস" button jumps to the current month.
   - Below the grid: the legend and the assumption note from §5.10.
   - The month selected by default is the current month if it falls inside the loan; otherwise the first month if the loan has not started, or the final month if it is completed.
4. **Selected month breakdown.**
   - Title: "March 2027", with "Installment 13 of 60" and the status chip.
   - **This month's installment, huge, in the EMI colour.**
   - The interest part (interest colour) and principal part (principal colour), side by side with a split bar.
   - **Remaining principal after this month, big, in the principal colour.**
   - Still to pay (EMI colour), paid so far (green), interest paid so far (interest colour), and installments left.
5. **Loan overview.**
   - Approved loan amount, each deduction, total deductions, and **net cash received (green)**.
   - Bank EMI and exact EMI.
   - Total repayment estimate, total interest estimate, and the interest-share bar.
   - Last installment amount and month.
   - The early-payoff note, if it applies.
6. **"How it's calculated" accordion** (the same component as on S3).
7. **Schedule accordion.** Rows show real month names, for example "Mar 2027". Tapping a row selects that month in the calendar and scrolls up to it. A "Show all months" button opens S9.

### 7.5 Delete and undo

The "⋯" menu has a Delete option. It asks for confirmation ("Delete this loan?" / "এই লোন মুছে ফেলবেন?"), returns to S4, and shows a snackbar ("Loan deleted" / "লোন মুছে ফেলা হয়েছে") with an Undo button ("Undo" / "ফিরিয়ে আনুন") for 5 seconds.

## 8. Settings (S8)

| Setting | Options | Default |
|---|---|---|
| Language / ভাষা | বাংলা, English | Chosen on S2 |
| Theme / থিম | Same as phone / ফোনের মতো, Light / লাইট, Dark / ডার্ক | Same as phone |
| Numbers in Bengali / সংখ্যা বাংলায় দেখান | On or off (shown only in Bengali mode) | On |
| Sound / সাউন্ড | On or off | On (soft) |
| Vibration / ভাইব্রেশন | On or off | On |
| Delete all saved loans / সব সেভ করা লোন মুছুন | Asks for confirmation twice | — |
| About / অ্যাপ সম্পর্কে | Version and disclaimer | — |

Disclaimer: "This app gives estimates. Confirm final figures with your bank." / "এই অ্যাপ আনুমানিক হিসাব দেয়। চূড়ান্ত হিসাব ব্যাংক থেকে মিলিয়ে নিন।"

## 9. Language and copy

### 9.1 Rules for Bengali words

Use the everyday words that bank customers in Bangladesh actually say. Use familiar English loanwords (লোন, ব্যাংক ফি, প্রিমিয়াম, টপ-আপ, সেটিংস, থিম) instead of formal or coined Bengali terms. Keep sentences short and use the polite "আপনি" form.

| Use | Avoid | Meaning |
|---|---|---|
| লোন | ঋণ | loan |
| কিস্তি, মাসিক কিস্তি | সমমাসিক কিস্তি | EMI |
| সুদ | — | interest |
| মূল টাকা | মূলধন, আসল | principal ("আসল" also means "exact", so avoid it) |
| মেয়াদ | সময়কাল | duration |
| বাকি | অবশিষ্ট, বকেয়া | remaining |
| শোধ হয়েছে | পরিশোধিত | paid (status) |
| কেটে রাখা টাকা | কর্তনকৃত অর্থ | deductions |
| হাতে পাবেন | নিট প্রাপ্য অর্থ | net cash received |
| আনুমানিক | প্রাক্কলিত | estimate |
| সেভ করুন | সংরক্ষণ করুন | save |
| এডিট করুন | সম্পাদনা করুন | edit |
| মুছে ফেলুন | অপসারণ করুন | delete |
| বেছে নিন | নির্বাচন করুন | choose |

### 9.2 Numbers and months

| Item | English | বাংলা (Bengali digits on) |
|---|---|---|
| Currency, detailed | ৳15,21,595.95 | ৳১৫,২১,৫৯৫.৯৫ |
| Bank EMI (whole taka) | ৳32,683 | ৳৩২,৬৮৩ |
| Compact (cards and chips only, ≥ 1 lakh) | 15.22 lakh, 1.5 crore | ১৫.২২ লাখ, ১.৫ কোটি |
| Negative | −৳4,000.00 (true minus sign U+2212) | −৳৪,০০০.০০ |
| Yearly rate | 10.47% | ১০.৪৭% |
| Monthly rate | 0.8725% | ০.৮৭২৫% |
| Month and year | March 2027 | মার্চ ২০২৭ |
| Installment position | 13 of 60 | ৬০টির মধ্যে ১৩ |

- Full month names: জানুয়ারি, ফেব্রুয়ারি, মার্চ, এপ্রিল, মে, জুন, জুলাই, আগস্ট, সেপ্টেম্বর, অক্টোবর, নভেম্বর, ডিসেম্বর
- Short month names (for grid cells): জানু, ফেব্রু, মার্চ, এপ্রি, মে, জুন, জুলাই, আগ, সেপ্টে, অক্টো, নভে, ডিসে / Jan … Dec
- Screen-reader labels spell out the currency instead of using "৳", for example "32,683 taka" and "৩২,৬৮৩ টাকা".

### 9.3 String table

| Key | English | বাংলা |
|---|---|---|
| app.name | Kisti | কিস্তি |
| app.title | Loan & EMI Calculator | লোন ও কিস্তি ক্যালকুলেটর |
| app.subtitle | Reducing-balance method, in taka | রিডিউসিং ব্যালেন্স পদ্ধতি, টাকায় হিসাব |
| tab.calculator | Calculator | ক্যালকুলেটর |
| tab.loans | My Loans | আমার লোন |
| tab.settings | Settings | সেটিংস |
| onboarding.title | Choose your language | ভাষা বেছে নিন |
| calc.bankEmi | Bank EMI | ব্যাংকের মাসিক কিস্তি |
| calc.exactEmi | Exact calculated EMI | হিসাবের কিস্তি (পয়সাসহ) |
| calc.ceilingNote | Bank rounds the installment up to the next taka | পয়সা থাকলে ব্যাংক কিস্তি পরের পূর্ণ টাকায় ধরে |
| calc.installmentsPill | {n} installments | {n}টি কিস্তি |
| calc.monthlyRatePill | {rate}% per month | মাসে {rate}% |
| calc.presets | Quick examples | দ্রুত উদাহরণ |
| preset.current | My current loan | আমার বর্তমান লোন |
| preset.topup | Top-up example | টপ-আপ উদাহরণ |
| preset.original | Original loan | শুরুর লোন |
| loan.details | Loan details | লোনের তথ্য |
| loan.amount | Loan amount | লোনের পরিমাণ |
| loan.rate | Interest rate (yearly) | সুদের হার (বছরে) |
| loan.duration | Duration | মেয়াদ |
| unit.years | Years | বছর |
| unit.months | Months | মাস |
| loan.monthlyRate | Monthly interest rate | মাসিক সুদের হার |
| loan.installmentCount | Number of installments | কিস্তির সংখ্যা |
| ded.title | Deductions at disbursement | লোন দেওয়ার সময় যা কেটে রাখবে |
| ded.approved | Approved loan amount | অনুমোদিত লোন |
| ded.settlement | Existing loan settlement | আগের লোন শোধ |
| ded.insurance | One-time insurance premium | বীমার প্রিমিয়াম (এককালীন) |
| ded.fees | Bank fees | ব্যাংক ফি |
| ded.other | Other deductions | অন্যান্য খরচ |
| ded.total | Total deductions | মোট কেটে রাখা টাকা |
| ded.netCash | Estimated net cash received | হাতে পাবেন (আনুমানিক) |
| sum.title | Repayment summary | পরিশোধের হিসাব |
| sum.totalRepayment | Total repayment estimate | মোট পরিশোধ (আনুমানিক) |
| sum.totalInterest | Total interest estimate | মোট সুদ (আনুমানিক) |
| sum.principal | Principal | মূল টাকা |
| sum.lastInstallment | Last installment | শেষ কিস্তি |
| sum.firstInterest | First month's interest | প্রথম মাসের সুদ |
| sum.firstPrincipal | First month's principal repayment | প্রথম মাসে মূল টাকা শোধ |
| sum.balanceAfterFirst | Balance after first installment | প্রথম কিস্তির পর বাকি |
| sum.interestShare | {pct}% of what you repay is interest | মোট পরিশোধের {pct}% সুদ |
| sum.emiTimesN | EMI × {n} would be {amount}. The last installment is {diff} lower. | সব কিস্তি পুরো ধরলে মোট {amount} হতো। শেষ কিস্তি {diff} কম। |
| sum.estimateNote | These are estimates. Your bank may adjust the last installment or use its own rules. | এগুলো আনুমানিক হিসাব। ব্যাংক শেষ কিস্তি বা নিজের নিয়মে কিছুটা বদলাতে পারে। |
| formula.title | How it's calculated | কীভাবে হিসাব হয় |
| formula.P | P = loan amount | P = লোনের পরিমাণ |
| formula.r | r = monthly interest rate (yearly rate ÷ 12 ÷ 100) | r = মাসিক সুদের হার (বছরের হার ÷ ১২ ÷ ১০০) |
| formula.n | n = number of installments | n = কিস্তির সংখ্যা |
| formula.whyTotal | The bank rounds every installment up, so you pay a little extra each month. The last installment is made smaller to balance it out. | ব্যাংক প্রতিটি কিস্তি উপরের টাকায় ধরে, তাই প্রতি মাসে সামান্য বেশি দেওয়া হয়। শেষ কিস্তি কমিয়ে সেটা মিলিয়ে দেওয়া হয়। |
| sched.title | Installment schedule | কিস্তির তালিকা |
| sched.month | Month | মাস |
| sched.opening | Opening balance | মাসের শুরুতে বাকি |
| sched.interest | Interest | সুদ |
| sched.principal | Principal repaid | মূল টাকা শোধ |
| sched.installment | Installment | কিস্তি |
| sched.closing | Closing balance | মাস শেষে বাকি |
| sched.showAll | Show all months | সব মাস দেখুন |
| sched.earlyPayoff | Rounding up finishes this loan in {n} installments | উপরে রাউন্ড করায় লোন {n}টি কিস্তিতেই শেষ হবে |
| action.saveAsLoan | Save as my loan | আমার লোন হিসেবে রাখুন |
| loans.add | Add loan | লোন যোগ করুন |
| loans.emptyTitle | No loans yet | এখনো কোনো লোন যোগ করা হয়নি |
| loans.emptyBody | Add a loan to see every month's installment, interest and remaining balance. | লোন যোগ করুন, প্রতি মাসের কিস্তি, সুদ আর বাকি টাকা দেখুন। |
| loans.thisMonthTotal.one | This month's installments {amount} across 1 loan | এই মাসে মোট কিস্তি {amount} (১টি লোন) |
| loans.thisMonthTotal.other | This month's installments {amount} across {count} loans | এই মাসে মোট কিস্তি {amount} ({count}টি লোন) |
| loans.totalRemaining | Total remaining principal | মোট বাকি মূল টাকা |
| form.bankName | Bank name | ব্যাংকের নাম |
| form.nickname | Loan name (optional) | লোনের নাম (না দিলেও চলবে) |
| form.firstMonth | First installment month | প্রথম কিস্তির মাস |
| form.addDeductions | Add deductions (optional) | কেটে রাখা টাকা যোগ করুন (না দিলেও চলবে) |
| form.colour | Card colour | কার্ডের রং |
| form.save | Save loan | লোন সেভ করুন |
| form.saved | Loan saved | লোন সেভ হয়েছে |
| form.editTitle | Edit loan | লোন এডিট করুন |
| detail.done | installments done | কিস্তি শেষ |
| detail.installmentOf | Installment {k} of {n} | {n}টির মধ্যে {k} নম্বর কিস্তি |
| detail.thisInstallment | This month's installment | এই মাসের কিস্তি |
| detail.interestPart | Interest | সুদ |
| detail.principalPart | Principal | মূল টাকা |
| detail.remainingPrincipal | Remaining principal after this month | এই মাসের পর বাকি মূল টাকা |
| detail.stillToPay | Still to pay | সামনে আরও দিতে হবে |
| detail.paidSoFar | Paid so far | এ পর্যন্ত দেওয়া হয়েছে |
| detail.interestPaidSoFar | Interest paid so far | এ পর্যন্ত সুদ দেওয়া হয়েছে |
| detail.installmentsLeft | Installments left | বাকি কিস্তি |
| detail.lastMonth | Last installment month | শেষ কিস্তির মাস |
| detail.overview | Loan overview | লোনের সারসংক্ষেপ |
| cal.thisMonth | This month | এই মাস |
| status.paid | Paid | শোধ হয়েছে |
| status.due | This month | এই মাসে দিতে হবে |
| status.upcoming | Upcoming | সামনে আসছে |
| status.notStarted | Starts in {n} months | {n} মাস পরে শুরু |
| status.completed | All installments done | সব কিস্তি শেষ |
| status.assumption | Past months are shown as paid, assuming every installment was paid on time. | সময়মতো কিস্তি দেওয়া ধরে আগের মাসগুলো শোধ দেখানো হচ্ছে। |
| menu.edit | Edit | এডিট করুন |
| menu.delete | Delete | মুছে ফেলুন |
| delete.confirm | Delete this loan? | এই লোন মুছে ফেলবেন? |
| delete.done | Loan deleted | লোন মুছে ফেলা হয়েছে |
| action.undo | Undo | ফিরিয়ে আনুন |
| action.done | Done | ঠিক আছে |
| action.cancel | Cancel | বাতিল |
| settings.language | Language | ভাষা |
| settings.theme | Theme | থিম |
| settings.themeSystem | Same as phone | ফোনের মতো |
| settings.themeLight | Light | লাইট |
| settings.themeDark | Dark | ডার্ক |
| settings.bengaliDigits | Numbers in Bengali | সংখ্যা বাংলায় দেখান |
| settings.sound | Sound | সাউন্ড |
| settings.vibration | Vibration | ভাইব্রেশন |
| settings.clearAll | Delete all saved loans | সব সেভ করা লোন মুছুন |
| settings.about | About | অ্যাপ সম্পর্কে |
| settings.disclaimer | This app gives estimates. Confirm final figures with your bank. | এই অ্যাপ আনুমানিক হিসাব দেয়। চূড়ান্ত হিসাব ব্যাংক থেকে মিলিয়ে নিন। |

Validation messages are listed in §5.11.

---

# PART 2: DESIGN BRIEF (Claude Design)

## 10. Design concept: "Neon Kantha"

**Where the idea comes from.** Nakshi kantha embroidery builds a story out of thousands of small running stitches. A loan works the same way: it is a long line of monthly installments, and Kisti makes every one of those stitches visible. The colours come from rickshaw art: rich teal, violet, marigold, pink and parrot green. The futuristic part is the treatment. The threads glow on a deep indigo night in dark mode, and sit sharp and clean on lilac-white in light mode.

**Spend the boldness in two places only:**

1. **Money numbers.** These are huge, heavy, and coloured by what they mean (§11.3). On each screen, the EMI or the selected month's installment is the loudest element.
2. **The stitch motif.** It appears as the stitch ring on S7, the stitch progress bars, and the calendar stitch marks. Progress uses this one running-stitch style everywhere in the app.

Everything else stays quiet: calm surfaces, generous spacing, few borders, and no decoration that doesn't carry information.

**Mood:** luminous, precise, friendly, local, trustworthy.

**Avoid.** These look templated or hurt this app:

- A near-black background with a single acid-green or neon accent
- A warm cream background with a terracotta accent and a serif display face
- Turning every block into an identical rounded card with the same radius and the same grey shadow
- Decorative gradient washes on every surface, or gradient-filled text
- ALL-CAPS tracked labels, eyebrow labels above every heading, monospace data labels, meta strings joined by middle dots, or "→" appended to button text
- Stock 3D coins, piggy banks, cartoon bankers, or generic finance illustrations
- Real bank names, logos or brand marks. Use the fictional sample banks in §13.1.
- Real background blur or glassmorphism, which is expensive on Android. Use faux glass instead (§11.6).

## 11. Design tokens

### 11.1 Base colours

| Token | Dark | Light | Use |
|---|---|---|---|
| bg.base | #120F2E (Indigo Night) | #F5F4FF (Lilac Mist) | Screen background |
| bg.raised | #1B1744 | #FFFFFF | Cards, sheets, tab bar |
| bg.sunken | #0C0A21 | #ECEAFB | Inputs, bar tracks |
| line | #2C2760 | #DDD9F5 | Hairlines, input borders |
| text.primary | #F4F2FF | #1A1640 | Main text |
| text.secondary | #B7B2E0 | #4B4680 | Labels |
| text.muted | #8C86BC | #6A6696 | Notes, placeholders |

### 11.2 Aurora thread (accent gradient)

- Dark: #2EE6D0 → #A78BFA → #FF5C9A
- Light: #0FB5A3 → #7C4DFF → #E83E8C

Use the gradient **only** for the hero card border and glow, the active tab indicator, the glow on the stitch ring's current stitch, the success moment, the app icon and the splash. Never put it behind text.

The primary button is a solid fill, not the gradient. In dark mode it is money.emi with #120F2E text. In light mode it is money.emi with white text.

### 11.3 Money colours

Each colour has a fixed meaning across the whole app.

| Token | Name | Meaning | Dark | Light | Contrast on bg.base (dark / light) |
|---|---|---|---|---|---|
| money.emi | Rickshaw Teal | EMI, installments, payments, still to pay | #2EE6D0 | #087A6F | ≈11.8 / 4.8 |
| money.principal | Jarul Violet | Principal, balances, remaining principal | #A78BFA | #6D3FE0 | ≈6.8 / 5.6 |
| money.interest | Marigold | Interest, warnings | #FFC234 | #8F5F00 | ≈11.5 / 5.1 |
| money.deduction | Rani Pink | Deductions | #FF5C9A | #C8235F | ≈6.4 / 5.0 |
| money.cash | Parrot Green | Net cash, paid, success | #4BE38A | #0F7A45 | ≈11.1 / 4.9 |
| status.error | Signal Red | Errors, negative net cash | #FF6B6B | #C62828 | ≈6.7 / 5.2 |

Text must reach at least 4.5:1 on both bg.base and bg.raised. Large figures (24 pt and up) must reach at least 3:1. Verify every pair and adjust if needed. If a value changes, log it in the design system.

### 11.4 Status marks

| Status | Mark |
|---|---|
| Paid | A filled stitch in money.cash |
| Due (this month) | A ring in money.emi with an aurora glow and a slow pulse |
| Upcoming | An outlined stitch in money.principal at 45% opacity |
| Final installment | A small knot dot in money.interest |
| Outside the loan | text.muted at 30% opacity, not tappable |

Every status also has an icon and a text label. Colour is never the only signal.

### 11.5 Typography

- **Family:** **Anek Bangla** for Bengali UI and **Anek Latin** for English UI. This is one design family across both scripts, with a width axis. Hero numbers use the Expanded width; text uses Normal width.
- **Fallback:** Hind Siliguri, if Anek renders badly on Android during the build.
- **Wordmark:** "Kisti" is set in Anek Latin Expanded ExtraBold and "কিস্তি" in Anek Bangla Expanded ExtraBold.

| Style | Size EN / BN (pt) | Weight and width | Line height EN / BN | Use |
|---|---|---|---|---|
| hero | 48 / 48 | ExtraBold, Expanded | 1.10 / 1.25 | Bank EMI, selected month's installment |
| figure.xl | 32 / 32 | Bold, SemiExpanded | 1.15 / 1.30 | Net cash, remaining principal, totals |
| figure.lg | 22 / 22 | Bold | 1.20 / 1.35 | Card EMI, secondary totals |
| figure.md | 17 / 17 | SemiBold | 1.30 / 1.45 | Row values |
| title | 22 / 23 | SemiBold | 1.30 / 1.45 | Screen titles |
| section | 17 / 18 | SemiBold | 1.35 / 1.50 | Section titles |
| body | 15 / 16 | Regular | 1.45 / 1.60 | Text |
| caption | 13 / 14 | Medium | 1.40 / 1.55 | Notes, labels |

**Type rules**

- Use sentence case and no all-caps.
- Figures use tabular numerals.
- The "৳" sign is 70% of the figure size, baseline-aligned, in the same colour as the figure.
- Bengali needs extra line height so vowel signs and conjuncts don't clip. Test with কিস্তি, অনুমোদিত, প্রিমিয়াম and ক্যালকুলেটর.
- The hero number must fit 360 pt width at font scale 1.0. Above that scale it may shrink to fit.

### 11.6 Shape, space and depth

- **Spacing** follows a 4 pt grid: 4, 8, 12, 16, 20, 24, 32, 40. Side padding on screens is 20.
- **Radius follows hierarchy** (not one value everywhere):

  | Element | Radius |
  |---|---|
  | Hero card | 28 |
  | Section card | 20 |
  | Month cell | 16 |
  | Input and row card | 14 |
  | Chips and pills | Fully round |
  | Bottom sheet top corners | 28 |

- **Depth in dark mode.** There are no grey shadows. A raised surface is bg.raised plus a 1 px line. The hero card has a 1.5 px aurora border and a soft teal glow (20% opacity, 24 blur).
- **Depth in light mode.** Shadows are tinted indigo: `rgba(46,32,140,0.10)`, y 4, blur 16. The hero card uses `0.14`, y 8, blur 24.
- **Faux glass,** for the tab bar and the sticky EMI bar: `rgba(27,23,68,0.86)` in dark mode or `rgba(255,255,255,0.88)` in light mode, plus a 1 px line. No live blur.
- **Stitch geometry:** dash 8, gap 6, stroke 3, round caps. Scale these with the ring's diameter.

### 11.7 Icons

- **Family:** Phosphor. Feature icons use the **duotone** weight, with the duotone layer in the related money colour at 30% opacity. UI controls use the regular weight. Icons are 24 pt, or 20 pt inside rows.
- **Suggested icons:**

  | Where | Icons |
  |---|---|
  | Tabs | Calculator, Bank, Gear |
  | Loan fields | Coins (amount), Percent (rate), HourglassMedium (duration), CalendarBlank (month) |
  | Deductions | Receipt (deductions), ArrowsClockwise (settlement), ShieldCheck (insurance) |
  | Results | HandCoins (net cash), ChartPieSlice (repayment), MathOperations (formula), ListNumbers (schedule) |
  | Settings | Translate, Sun, Moon, SpeakerHigh, SpeakerSlash, Vibrate, Trash |
  | Controls and feedback | PencilSimple, Plus, CaretLeft, CaretRight, Warning, CheckCircle, Info, ArrowCounterClockwise |

- **App icon:** a stitched aurora ring around a bold "৳" on Indigo Night. Provide an Android adaptive icon (separate foreground and background layers plus a monochrome layer for themed icons) and an iOS 1024 px icon. It must still read clearly at 48 px.

## 12. Components

| Component | Variants and states |
|---|---|
| MoneyValue | Sizes hero, xl, lg and md. Any money colour. English or Bengali digits. Negative value. "—" placeholder. Roll animation. |
| AmountInput | Label, ৳ prefix, helper text, error. Empty, focused, filled, error and disabled states. Adds grouping commas on blur. |
| RateInput | A "%" suffix, otherwise the same as AmountInput |
| DurationInput | A − / + stepper and a Years/Months segmented control |
| MonthField | Shows a value like "March 2027" and opens S6 |
| PresetChip | Default, active and pressed |
| SectionCard and Accordion | Icon, title and content. Collapsed and expanded. |
| SummaryRow | Label, value and colour dot. A normal and an emphasised (big) variant. |
| DeductionRow | Label, icon and pink value |
| StackedBar, InterestShareBar, SplitBar | Deductions vs cash in hand; interest vs principal over the whole loan; interest vs principal for one month |
| HeroEmiCard | Valid, invalid ("—" plus message), and compact (the sticky mini bar) |
| StitchRing | One stitch per installment when n ≤ 120. One stitch per year when n > 120, with a partial year half-filled. Running, not started and completed states. 200 pt and 120 pt sizes. |
| StitchProgress | Linear version of the ring, used on loan cards |
| MonthGrid and MonthCell | Calendar mode and picker mode. Paid, due, upcoming, final, outside, selected and pressed states. |
| StatusChip | Paid, due, upcoming, not started and completed. Each has an icon, a label and a colour. |
| LoanCard | Running, not started and completed |
| SummaryStrip | One loan and several loans |
| ScheduleRowCard | Calculator mode ("Month 1") and loan mode ("Mar 2027"). A highlighted final row. A gap row. |
| Buttons | Primary, secondary, ghost, destructive, icon button and FAB, each with a pressed and a disabled state |
| SegmentedControl, SwitchRow, ListRow | For settings and forms |
| BottomSheet, ConfirmDialog | |
| Snackbar (with action), Toast | |
| WarningBanner, InlineError | |
| EmptyState | Uses the stitch motif |
| TabBar | Active indicator, faux glass |
| SuccessMoment | A check mark plus a burst of stitch sparks |
| LanguageCard | Used on S2. Shows "বাংলা" and "English" in large type. |

## 13. Screens to design

- **Frames:** 390 × 844 pt (a modern iPhone), plus a 360 × 800 check frame (common Android).
- **Language:** Bengali is the primary design language. English versions are needed for S3 and S7, to check text length.
- **Themes:** design **every screen in both dark and light**.

| Screen | States to show |
|---|---|
| S1 Splash | The Kisti / কিস্তি wordmark with the stitch ring |
| S2 Language choice | Default, and Bengali selected |
| S3 Calculator | Default (preset 1); the "Top-up" preset active with deductions and net cash; a validation error; the deductions-exceed-loan warning; formula expanded; schedule expanded; sticky mini EMI bar after scrolling; keyboard open |
| S4 My Loans | Empty; three loans (running, not started, completed) with the summary strip |
| S5 Add/Edit loan | Empty; filled and valid with the live preview; an error; deductions expanded |
| S6 Month picker | Open with a month selected |
| S7 Loan detail | Running with this month selected; a past month selected; the final month selected; not started; completed; the early-payoff note |
| S8 Settings | Default; delete-all confirmation |
| S9 Full schedule | Calculator mode; loan mode with year headers |
| Overlays | Success moment; delete confirmation; Undo snackbar |

### 13.1 Sample data for designs

Use this data so the designs match the maths exactly. "Today" in every design is **October 2026**. All bank names are fictional.

**Loan A: কাঁথা ব্যাংক / Kantha Bank, "বাড়ির লোন / Home loan" (running)**

- Uses the preset 1 values from §5.12. The first installment is October 2025.
- October 2026 is installment **13 of 60**, which is due this month:

  | Value | Amount |
  |---|---|
  | Installment | ৳32,683 |
  | Interest | ৳11,143.60 |
  | Principal | ৳21,539.40 |
  | Remaining principal after this month | ৳12,55,664.57 |
  | Paid so far | ৳4,24,879.00 |
  | Interest paid so far | ৳1,58,947.62 |
  | Still to pay | ৳15,36,055.72 |
  | Installments left | 47 |

- September 2026 is installment 12 (paid). Its values are in the month 12 snapshot in §5.12.
- The final installment is September 2030, for ৳32,637.72.

**Loan B: ধানসিঁড়ি ব্যাংক / Dhanshiri Bank, "টপ-আপ / Top-up" (not started)**

- Uses the preset 2 values, including deductions. The first installment is January 2027, so the status reads "Starts in 3 months". Bank EMI ৳27,988.

**Loan C: ময়না ব্যাংক / Moyna Bank, "বাইকের লোন / Bike loan" (completed)**

- ৳2,00,000 at 9% for 24 months, first installment June 2023, last installment May 2025.
- Bank EMI ৳9,137; last installment ৳9,135.66; total repayment ৳2,19,286.66; total interest ৳19,286.66.

**Summary strip on S4:** "This month's installments ৳32,683 across 1 loan" and "Total remaining principal ৳25,55,664.57".

**Early-payoff example:** ৳1,000 at 12% for 30 years finishes in 242 installments.

## 14. Wireframes

These show layout intent only, not visual style. Labels are in English to keep the columns aligned.

```
S3 CALCULATOR
┌──────────────────────────────────┐
│ Loan & EMI Calculator            │
│ Reducing-balance method, in taka │
│╭────────────────────────────────╮│
││ Bank EMI                       ││
││ ৳32,683            (hero, teal)││
││ Exact calculated EMI ৳32,682.42││
││ ↑ rounds up to the next taka   ││
││ (60 installments) (0.8725%/mo) ││
│╰────────────────────────────────╯│
│ (My current loan) (Top-up) (Orig…│
│ ┌ Loan details ────────────────┐ │
│ │ amount, rate, duration       │ │
│ │ monthly rate, installments   │ │
│ └──────────────────────────────┘ │
│ ┌ Deductions at disbursement ──┐ │
│ │ approved, 4 rows, total      │ │
│ │ ▓▓▓▓▓▓▓▓░░░░ deducted vs cash│ │
│ │ Net cash ৳4,14,000  (big grn)│ │
│ └──────────────────────────────┘ │
│ ┌ Repayment summary ───────────┐ │
│ │ totals (big), last, 1st month│ │
│ │ ▓▓▓▓▓▓▓▓▓░░ 22% is interest  │ │
│ └──────────────────────────────┘ │
│ ▸ How it's calculated            │
│ ▸ Installment schedule           │
│ [ Save as my loan ]              │
└──────────────────────────────────┘

S7 LOAN DETAIL
┌──────────────────────────────────┐
│ ‹  Kantha Bank, Home loan     ⋯  │
│          ╭─ stitch ring ─╮       │
│          │     13/60     │       │
│          ╰ installments ─╯       │
│     ৳32,683 a month  (teal, xl)  │
│     Remaining ৳12,55,664.57      │
│ ‹ 2026 ›             [This month]│
│ [Jan][Feb][Mar][Apr]             │
│ [May][Jun][Jul][Aug]             │
│ [Sep][Oct][Nov][Dec]             │
│ legend + assumption note         │
│ October 2026, 13 of 60    [Due]  │
│ ৳32,683                   (hero) │
│ Interest ৳11,143.60 ▓▓▓░░ ৳21,539│
│ Remaining principal (big violet) │
│ Still to pay, paid, interest paid│
│ Loan overview                    │
│ ▸ How it's calculated            │
│ ▸ Installment schedule           │
└──────────────────────────────────┘

S4 MY LOANS
┌──────────────────────────────────┐
│ My Loans                         │
│ ┌ ৳32,683 this month, 1 loan ──┐ │
│ └ Remaining ৳25,55,664.57 ─────┘ │
│ ┌──────────────────────────────┐ │
│ │ (KB) Kantha Bank, Home loan  │ │
│ │ ৳32,683 a month       [Due]  │ │
│ │ ▪▪▪▪▪▪▫▫▫▫▫▫▫▫  13 of 60     │ │
│ │ Remaining ৳12,55,664.57      │ │
│ │ Next: October 2026           │ │
│ └──────────────────────────────┘ │
│ ┌ Dhanshiri Bank, Top-up ──────┐ │
│ └ Moyna Bank, Bike loan ───────┘ │
│                              (+) │
└──────────────────────────────────┘
```

## 15. Motion, sound and haptics

### 15.1 Motion tokens

| Token | Value |
|---|---|
| micro | 120 ms |
| standard | 220 ms |
| emphasis | 420 ms |
| Standard easing | cubic-bezier(0.2, 0, 0, 1) |
| Spring | damping 18, stiffness 180, mass 1 |

### 15.2 Moments

**The stitch ring draw is the app's one orchestrated moment.** Everything else is a response to the user's own action.

| Moment | Trigger | Motion | Sound | Haptic |
|---|---|---|---|---|
| Stitch ring draw | Opening S7 | Stitches fill in order up to the current one over 600 ms in total. Then the current stitch pulses slowly (2 s loop, opacity 0.6 ↔ 1). | — | — |
| EMI number roll | A value settles | Digits roll vertically over 420 ms | — | — |
| Preset chip | Tap | Press scale 0.96, then the values roll | tap | light |
| Accordion | Tap | Height changes and the chevron rotates over 220 ms | toggle | light |
| Month change | Tapping a cell | The cell springs 1.0 → 1.06 → 1.0 and the breakdown cross-fades over 180 ms | stitch | selection |
| Year change | Swipe or arrow | The grid slides horizontally over 220 ms | stitch | selection |
| Sticky EMI bar | The hero leaves the screen | Slides down and fades in over 220 ms | — | — |
| Save loan | Tapping Save | A check mark draws over 300 ms, 8 stitch sparks burst out over 500 ms, then the app navigates to S7 | success | success |
| Validation error | Invalid input | The field shakes twice (6 pt, 200 ms) and the error fades in | warn | warning |
| Deductions exceed loan | The total crosses the loan amount | The warning banner slides in | warn | warning |
| Delete | Confirmed | The card collapses over 220 ms and the snackbar slides up | — | medium |
| Tab change | Tap | The icon switches to its duotone fill with one small bounce | tap | light |
| Theme switch | Changing the setting | Cross-fade over 200 ms | — | — |

**Reduce motion.** When the phone's reduce-motion setting is on, replace rolls, the ring draw, sparks, shakes and pulses with instant changes or 150 ms fades.

### 15.3 Sounds

The app uses five short, original sounds. They are generated in code (see §25), so there are no licensing issues. Each is mono, 44.1 kHz, under 30 KB, and played at no more than 35% volume.

| Name | Character | Length |
|---|---|---|
| tap | A soft wooden click | 30 ms |
| toggle | A soft two-tone blip | 80 ms |
| stitch | A tiny high tick, like a needle through cloth | 40 ms |
| success | A two-note rising chime | 280 ms |
| warn | A soft low double blip | 160 ms |

- Sounds never play on keystrokes.
- On iOS, sounds respect the silent switch and never stop the user's music.
- When Sound is off in Settings, the app is completely silent.

## 16. Claude Design prompts

**How to work**

- Send one prompt at a time. Review the result, use canvas comments for fixes, and only move on when the screen is right.
- Lock the design system (D1 and D2) before designing screens. It keeps every screen consistent and saves usage, because design generation is usage-heavy.
- Bengali first, because Bengali text is longer and taller. If it fits in Bengali, it usually fits in English.
- If something drifts from the tokens, say "Re-apply the locked tokens from D1" instead of describing the fix again.

**D1: Design system**

```text
You are the design lead for "Kisti" (কিস্তি), a native mobile app for iOS and Android that will be built in React Native. The attached file is the complete spec. Part 1 (§1–§9) is product truth and Part 2 (§10–§17) is your design brief. Read both fully before you design anything.

Task D1: create the design system only. No screens yet.

1. First write a short plan covering palette, type, shape, depth and the stitch motif. Check it against the avoid-list in §10. If any part looks like a generic finance-app default, revise it and tell me what you changed.
2. Build a design-system board containing:
   - All colour tokens from §11.1–§11.4 for dark and light. Label each swatch with its token name and its contrast ratio on bg.base and bg.raised. If any text colour falls below 4.5:1, fix it and report the new value.
   - The type scale from §11.5 in Anek Bangla and Anek Latin. Show it in Bengali and English using real strings from §9.3, including কিস্তি, অনুমোদিত, প্রিমিয়াম and ক্যালকুলেটর, to prove nothing clips.
   - The Kisti / কিস্তি wordmark.
   - MoneyValue in all four sizes and all six money/status colours, with English digits, Bengali digits, a negative value and the "—" placeholder. Use lakh grouping: ৳15,21,595.95 and ৳১৫,২১,৫৯৫.৯৫.
   - Spacing, the radius hierarchy and depth from §11.6, in both themes.
   - The stitch language: a ring with 60 installments (12 paid, 1 due), a linear stitch progress bar, and the five calendar marks from §11.4.
   - The icon set from §11.7.
3. Treat this board as the locked design system for every later prompt.
```

**D2: Components**

```text
Task D2: using only the locked design system from D1, design every component in §12 with all of its listed variants and states, in dark and light.

- Use Bengali labels everywhere. Add English versions of MoneyValue, AmountInput, LoanCard and StatusChip.
- Show pressed, focused, error and disabled states wherever they apply.
- Name each component exactly as in §12 so the handoff to code is unambiguous.
- Build StitchRing to the rule in §12: one stitch per installment up to 120, one stitch per year above that.
```

**D3: Calculator**

```text
Task D3: design S3 Calculator (§6) in a 390 × 844 frame. Make dark and light versions in Bengali, plus a dark version in English.

- The default state uses the "My current loan" values from §5.12. The deductions state uses "Top-up example", showing net cash ৳4,14,000 in big green.
- Produce every S3 state listed in §13.
- Use the S3 wireframe in §14 for layout intent only.

Rules:
- The bank EMI is the largest element on the screen.
- Every number uses its money colour from §11.3.
- The formula accordion shows the user's own numbers substituted into the formula.
- The schedule shows months 1–12, a gap row, and month 60 (৳32,637.72).
- Under the total repayment estimate, show the small caption from §6 F: "EMI × 60 would be ৳19,60,980. The last installment is ৳45.28 lower."
- Use copy from §9.3 word for word.

Finally, check the default state at 360 × 800 and fix anything that wraps badly.
```

**D4: My Loans list, add/edit form and month picker**

```text
Task D4: design S4 My Loans (§7.1), S5 Add/Edit loan (§7.2) and S6 Month picker (§7.3), in dark and light, in Bengali.

Use the sample data in §13.1 ("today" is October 2026):
- S4 empty state.
- S4 with all three sample loans (running, not started, completed) and the summary strip.
- S5 empty.
- S5 filled with Loan A, showing the live EMI preview in the sticky footer.
- S5 with an error.
- S5 with the deductions section expanded.
- S6 open with October 2025 selected.

Bank initials go in coloured avatars. Never use a real bank logo.
```

**D5: Loan detail and full schedule**

```text
Task D5: design S7 Loan detail (§7.4) and S9 Full schedule, in dark and light, in Bengali, plus a dark version of S7 in English. Use Loan A from §13.1.

S7 states:
(a) October 2026 selected, installment 13, due
(b) September 2026 selected, paid, using the month 12 snapshot in §5.12
(c) September 2030 selected, the final installment of ৳32,637.72
(d) Loan B, not started
(e) Loan C, completed
(f) the early-payoff note

Rules:
- The stitch ring is the hero.
- In the breakdown, the month's installment is the largest number, and the remaining principal is the second largest.
- Show the calendar legend and the assumption note from §5.10.
- S9 in loan mode uses year headers (2025, 2026, …) and real month names.
```

**D6: Settings, language choice, splash and app icon**

```text
Task D6: design S8 Settings (§8), S2 Language choice, S1 Splash, and the app icon (§11.7), in dark and light.

- S2 shows two large LanguageCards, "বাংলা" and "English".
- S8 includes the delete-all confirmation state.
- The splash uses the Kisti / কিস্তি wordmark with the stitch ring.
- The app icon follows §11.7. Show it at 1024, 180, 96 and 48 px, plus the Android adaptive foreground, background and monochrome layers.
```

**D7: Clickable prototype and motion**

```text
Task D7: link every screen into one clickable prototype covering the flows in §4:
- first launch
- calculator → save as my loan → loan detail
- add loan
- edit and delete with undo
- language and theme switching from Settings

Add an annotation layer for every moment in §15.2, giving its duration, easing or spring, sound and haptic, and its reduce-motion fallback. Prototype the stitch ring draw, the EMI number roll and the month change so they can be judged in motion.
```

**D8: Review and handoff to Claude Code**

```text
Task D8: review everything against the checklist in §17, fix every failure, and list what you changed.

Then prepare the handoff for Claude Code. The target is a bare React Native app, not a website, so make the bundle easy to re-implement natively. It must include:
1. All design tokens as structured data (colours for both themes, type scale, spacing, radius, shadows, motion), using the token names from §11.
2. A component inventory using the names from §12, with every state.
3. Every screen and state from §13.
4. All copy, matching §9.3.
5. The app icon layers and any illustration as SVG.
6. The motion annotations from D7.
7. A short README listing any deviations from this spec and why.

Then export it as a handoff to Claude Code.
```

Menu names in Claude Design can change. Use whichever export or handoff option your version offers for sending the design to Claude Code.

## 17. Design review checklist (before handoff)

- [ ] Every money value uses its colour from §11.3 on every screen
- [ ] The bank EMI is the largest element on S3, and the month's installment is the largest element in the S7 breakdown
- [ ] Both themes pass the contrast targets in §11.3
- [ ] No Bengali text clips at the line heights in §11.5, and long strings fit at 360 pt width
- [ ] Lakh grouping is used everywhere, and Bengali digits appear in the Bengali designs
- [ ] All states listed in §13 are present, and all numbers match §5.12 and §13.1
- [ ] Every touch target is at least 48 × 48
- [ ] No status relies on colour alone
- [ ] Nothing from the avoid-list in §10 appears
- [ ] All copy matches §9.3. Any new wording is added to §9.3 in both languages.
- [ ] Motion is annotated per §15, including reduce-motion fallbacks
- [ ] No out-of-scope features from §2 appear

---

# PART 3: BUILD SPEC (Claude Code)

## 18. Stack and dependency policy

**Every dependency must be:**

- free and open source;
- actively maintained;
- compatible with React Native's New Architecture;
- compatible with Android's 16 KB page size;
- justified by real use.

The pre-flight audit (P0 in §29) checks every item below against the current versions before anything is installed.

| Need | Choice | Notes |
|---|---|---|
| App | Bare React Native CLI, latest stable version; TypeScript in strict mode; Hermes; New Architecture | No Expo managed workflow |
| Navigation | `@react-navigation/native`, `bottom-tabs`, `native-stack`, `react-native-screens`, `react-native-safe-area-context` | |
| Animation | `react-native-reanimated` (current major) | Version 4 also needs `react-native-worklets` |
| Gestures | `react-native-gesture-handler` | For swiping years and dragging the bottom sheet |
| Vector graphics | `react-native-svg` | For the stitch ring, bars, icons and gradients |
| Icons | `phosphor-react-native`, importing each icon individually | Fallback: `lucide-react-native` |
| Storage | `react-native-mmkv` | Check whether the current major needs `react-native-nitro-modules` |
| State | `zustand` with its `persist` middleware and an MMKV adapter | |
| Sound | Chosen during P0. Candidates: `react-native-sound`, `react-native-audio-api`, `expo-audio` (which needs `expo-modules-core`) | Pick the smallest one that meets the policy above |
| Haptics | `react-native-haptic-feedback` | Verify New Architecture support |
| Splash | `react-native-bootsplash` | |
| i18n | A small custom typed dictionary | No i18next |
| Dates | Custom `YearMonth` helpers | No date library |
| Gradients | React Native's built-in gradient style if the chosen version supports it; otherwise `react-native-svg` | No separate gradient library |
| Blur | None | Faux glass only (§11.6) |
| Tests | Jest and `@testing-library/react-native` | |
| Lists | `FlatList` | 360 rows at most, so no FlashList unless profiling shows a need |

**Not allowed:** analytics, ads, crash-reporting SDKs, remote config, any network call, paid packages, or UI kits that pull in a large dependency tree.

## 19. Project structure

```text
docs/
  SPEC.md                    this file
  design-handoff/            the Claude Design bundle
scripts/
  generate-sounds.mjs        writes the §15.3 sounds as WAV files (Node, no dependencies)
src/
  app/                       App.tsx, navigation/, providers/
  core/                      pure TypeScript, no React Native imports
    loan/                    types.ts, parse.ts, validate.ts, calculate.ts, snapshot.ts
    months.ts                YearMonth helpers, status, loan state
    money.ts                 paisa helpers
  i18n/                      en.ts, bn.ts, index.ts (t, tp, useT), format.ts
  state/                     store.ts, storage.ts (MMKV adapter), migrations.ts, selectors.ts
  theme/                     tokens.ts, ThemeProvider.tsx, typography.ts, fonts.ts
  feedback/                  motion.ts, sound.ts, haptics.ts
  components/
    primitives/              Text, MoneyValue, Button, Chip, Card, Inputs, SegmentedControl…
    money/                   HeroEmiCard, StackedBar, InterestShareBar, SplitBar, StitchRing, StitchProgress
    calendar/                MonthGrid, MonthCell, MonthPickerSheet
    schedule/                ScheduleRowCard, ScheduleAccordion
    feedback/                Snackbar, Toast, WarningBanner, SuccessMoment
  screens/                   Calculator, LoansList, LoanForm, LoanDetail, FullSchedule, Settings, LanguageChoice
  assets/                    fonts/, sounds/
  dev/                       KitchenSink.tsx (__DEV__ only)
```

## 20. Calculation module API

```ts
// src/core/loan/types.ts
export type Paisa = number; // always an integer

export type Deductions = {
  settlement: number; insurance: number; bankFees: number; other: number; // taka
};

export type LoanInputs = {
  principal: number;          // taka
  annualRatePercent: number;
  tenureMonths: number;       // integer
  deductions: Deductions;
};

export type RawLoanInputs = { // exactly what the user typed
  principal: string; annualRatePercent: string;
  tenureValue: string; tenureUnit: 'years' | 'months';
  settlement: string; insurance: string; bankFees: string; other: string;
};

export type InputField = keyof RawLoanInputs;
export type ErrorCode =
  | 'required' | 'notNumber' | 'mustBePositive' | 'tooLarge'
  | 'rateRange' | 'durationRange' | 'negative';

export type ScheduleRow = {
  index: number;              // 1-based
  openingPaisa: Paisa; interestPaisa: Paisa; principalPaisa: Paisa;
  paymentPaisa: Paisa; closingPaisa: Paisa;
};

export type LoanResults = {
  monthlyRate: number;
  installmentCount: number;          // n
  actualInstallmentCount: number;    // n or fewer (early payoff)
  exactEmi: number;                  // taka, unrounded
  bankEmi: number;                   // whole taka, ceiling (§5.4)
  lastInstallmentPaisa: Paisa;
  totalDeductionsPaisa: Paisa;
  netCashPaisa: Paisa;               // can be negative
  deductionsExceedPrincipal: boolean;
  totalRepaymentPaisa: Paisa;        // Σ payment
  totalInterestPaisa: Paisa;         // Σ interest
  emiTimesNPaisa: Paisa;             // bankEmi × n, caption only (§5.6)
  lastInstallmentAdjustmentPaisa: Paisa; // emiTimesN − total; caption hidden on early payoff
  interestShare: number;             // 0..1
  firstMonthInterestPaisa: Paisa;
  firstMonthPrincipalPaisa: Paisa;
  balanceAfterFirstPaisa: Paisa;
  schedule: ScheduleRow[];
};

export type MonthSnapshot = {
  index: number; row: ScheduleRow;
  paidSoFarPaisa: Paisa; interestPaidSoFarPaisa: Paisa; principalPaidSoFarPaisa: Paisa;
  stillToPayPaisa: Paisa; installmentsLeft: number;
};

// src/core/loan/*.ts
export function parseNumber(text: string): number | null;
// Accepts digits 0–9 and ০–৯ and ignores commas, spaces and "৳".
// Returns null for empty or invalid text.

export function validateInputs(raw: RawLoanInputs):
  | { ok: true; inputs: LoanInputs }
  | { ok: false; errors: Partial<Record<InputField, ErrorCode>> };

export function toBankEmi(exactEmi: number): number;  // Math.ceil(exactEmi - 1e-6)

export function calculateLoan(inputs: LoanInputs): LoanResults;  // implements §5.2–§5.8

export function monthSnapshot(results: LoanResults, index: number): MonthSnapshot;  // implements §5.9
```

**Rules**

- Money is converted to paisa once, with `Math.round(taka × 100)`, and stays as integer paisa all the way to the formatter.
- Only `exactEmi` and `monthlyRate` are floats.
- No function in `src/core` reads the clock, storage or the UI. Callers pass "today" in.

## 21. Month utilities (`src/core/months.ts`)

```ts
export type YearMonth = string; // 'YYYY-MM'

export function toIndex(ym: YearMonth): number;            // year × 12 + (month − 1)
export function fromIndex(i: number): YearMonth;
export function addMonths(ym: YearMonth, k: number): YearMonth;
export function diffMonths(a: YearMonth, b: YearMonth): number;   // a − b
export function currentYearMonth(now: Date): YearMonth;

export function monthForInstallment(first: YearMonth, k: number): YearMonth;
export function installmentIndexFor(first: YearMonth, ym: YearMonth, count: number): number | null;

export type MonthStatus = 'outside' | 'paid' | 'due' | 'upcoming';
export function monthStatus(first: YearMonth, count: number, ym: YearMonth, today: YearMonth): MonthStatus;

export type LoanState =
  | { kind: 'notStarted'; monthsUntil: number }
  | { kind: 'running'; currentIndex: number }
  | { kind: 'completed' };
export function loanState(first: YearMonth, count: number, today: YearMonth): LoanState;

export function defaultSelectedMonth(first: YearMonth, count: number, today: YearMonth): YearMonth;
export function nextInstallmentMonth(first: YearMonth, count: number, today: YearMonth): YearMonth | null;
```

Here `count` is always `actualInstallmentCount`.

## 22. Storage and state

```ts
type Settings = {
  language: 'bn' | 'en';
  theme: 'system' | 'light' | 'dark';
  bengaliDigits: boolean;
  sound: boolean;
  haptics: boolean;
  onboarded: boolean;
};

type Accent = 'emi' | 'principal' | 'interest' | 'deduction' | 'cash';

type SavedLoan = {
  id: string;                       // Date.now().toString(36) + random suffix (no uuid library)
  bankName: string;
  nickname?: string;
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
  tenureUnitShown: 'years' | 'months';
  firstInstallmentMonth: YearMonth;
  deductions: Deductions;
  accent: Accent;
  createdAt: number;
  updatedAt: number;
};

type PersistedStateV1 = {
  schemaVersion: 1;
  settings: Settings;
  loans: SavedLoan[];
  calculatorDraft: RawLoanInputs;
  recentBankNames: string[];        // at most 10, most recent first
};
```

- **Persistence.** Use zustand `persist` with the name `kisti-state` and `version: 1`, backed by MMKV. Include a `migrate` function, even though it has nothing to do in v1.
- **Writes.** Settings and loan changes are written immediately. Calculator draft writes are debounced by 300 ms.
- **Derived values are never stored.** A selector `getLoanResults(loan)` memoises `calculateLoan` by `id` and `updatedAt`.
- **Actions:** `addLoan`, `updateLoan`, `deleteLoan` (returns the removed loan so it can be undone), `restoreLoan`, `clearAllLoans`, `setSettings`, `setCalculatorDraft`.
- **Corrupt or missing data.** If stored data is corrupt or missing, fall back to the defaults (§6, §8) without crashing, and log the problem in `__DEV__` only.

## 23. i18n and formatting

- **Dictionaries.** `en.ts` exports `const en = { … } as const`. `bn.ts` is typed `Record<keyof typeof en, string>`, so a missing key fails type-checking.
- **Lookups.** `t(key, params)` interpolates `{name}` placeholders. `tp(baseKey, count, params)` picks the `.one` or `.other` key. English needs both; Bengali can use the same text for both.
- **No `Intl`.** All formatting is hand-written, so it looks the same on every Hermes version and stays tiny.

| Function | Behaviour |
|---|---|
| `groupLakh(intDigits)` | Groups the last 3 digits, then pairs of digits: 1960934 → 19,60,934 |
| `toBengaliDigits(s)` | Maps 0–9 to ০–৯ |
| `formatTaka(paisa, { lang, bengaliDigits, decimals: 0 \| 2 })` | Prefixes ৳. A negative value is written as U+2212 followed by ৳. |
| `formatCompact(paisa, lang)` | Gives "15.22 lakh" / "১৫.২২ লাখ" and "1.5 crore" / "১.৫ কোটি". Below 1 lakh it falls back to `formatTaka`. |
| `formatPercent(value, decimals)` | Formats yearly rates with 2 decimals and monthly rates with 4 |
| `formatMonth(ym, lang, 'long' \| 'short')` | Uses the month names in §9.2 |
| `speakTaka(paisa, lang)` | Builds the screen-reader label: "32,683 taka" / "৩২,৬৮৩ টাকা" |

**Language switching** is instant everywhere. It needs no restart and no layout direction change.

## 24. Theming

- `tokens.ts` exports `dark` and `light` objects with the same shape, built from the token map agreed in P0 (§11 aligned with the handoff).
- `ThemeProvider` resolves `settings.theme` together with `useColorScheme()`, and updates the status bar style and the Android navigation bar colour.
- Components read colours through `useTheme()`. Styles come from a memoised `makeStyles(theme => …)` per theme.
- **Font names.** Android uses the file name and iOS uses the PostScript name. Rename font files so the two match, link them through `react-native.config.js` assets, and map `fontFamily(lang, weight, width)` in `fonts.ts`.
- **Font files.** Ship only the static instances §11.5 uses. If the downloaded family has no static width instances, generate them from the variable font with `fonttools varLib.instancer`. Target 2 MB of fonts in total at most.

## 25. Animation, sound and haptics

**Animation**

- All motion runs on the UI thread with Reanimated, and no continuous animation runs on the JS thread.
- `useReducedMotion()` switches every moment to its fallback (§15.2).
- **Number roll.** Each digit is a column of the digits 0–9 shifted with `translateY`. No text is re-rendered on each frame.
- **Stitch ring.** Draw at most three SVG paths (paid, current and upcoming) using `strokeDasharray`. Animate the paid arc with one shared value. Do not use one animated component per stitch.
- **Accordion.** Measure the content once and animate its height. The schedule accordion renders at most 14 rows with a plain `map`. Never nest a virtualised list inside a ScrollView. "Show all months" opens S9, which uses a `FlatList` with `getItemLayout`.
- **Sticky EMI bar.** Driven by `useAnimatedScrollHandler`.

**Sound**

- `scripts/generate-sounds.mjs` writes the five §15.3 sounds as 16-bit mono 44.1 kHz WAV files. It uses sine and triangle waves with exponential-decay envelopes. File names are lowercase so they also work in Android's `res/raw`.
- Sounds are preloaded after the first render. Playback is fire-and-forget.
- The iOS audio session uses the ambient category, so it mixes with other audio and respects the silent switch.
- Nothing plays when Sound is off.

**Haptics**

- `haptics.ts` exposes `light`, `medium`, `selection`, `success` and `warning`.
- Each of these does nothing when Vibration is off.

## 26. Performance and size budget

| Metric | Target |
|---|---|
| Cold start to an interactive Calculator | Under 1.5 s (release build, mid-range Android with about 4 GB RAM) |
| `calculateLoan` for 360 months | Under 2 ms |
| Animations | 60 fps for the accordion, ring draw, month change and number roll |
| Release APK, per ABI | 15 MB or less (publish an AAB on Play) |
| Fonts | 2 MB or less |
| Sounds | 150 KB or less |

**Rendering**

- The Calculator is split into memoised sections that subscribe only to what they show, so typing in one field does not re-render the whole screen.

**Release configuration**

| Platform | Settings |
|---|---|
| Both | Hermes on. `console.*` stripped from release builds. |
| Android | R8 minification and resource shrinking on. Target SDK set to the current Play requirement, checked at build time. |
| Android | The INTERNET permission is removed from the release manifest unless the audit finds a dependency that truly needs it. Debug builds keep it for Metro. |
| Android | Every native library is 16 KB page-aligned. Verify with `zipalign -c -P 16 -v 4 app-release.apk` or the APK Analyzer. |
| iOS | Standard release build. |

## 27. Accessibility

- Touch targets are at least 48 × 48.
- Every input, icon button and chart has an `accessibilityLabel` in the current language. Money values use `speakTaka`.
- Status is never shown by colour alone.
- Contrast follows §11.3.
- Fonts scale with system settings. Hero figures use `maxFontSizeMultiplier` 1.3 and `adjustsFontSizeToFit`. The layout holds at a font scale of 1.3.
- Reduce motion is respected (§15.2).
- The focused input scrolls above the keyboard, and the return key moves to the next field.

## 28. Tests

### 28.1 Core (`src/core`, at least 95% line coverage)

1. Every value in §5.12 for all three presets: exact EMI (6 decimal places), bank EMI, first month split, balance after the first installment, last installment, totals, deductions and net cash.
2. `toBankEmi` returns the results in the §5.4 table.
3. An integer EMI stays unchanged (6,00,000 at 0% for 60 months gives 10,000).
4. Zero interest works for the default principal (25,360, with a last installment of 25,355.95).
5. Early payoff: 1,000 at 12% for 360 months gives 242 installments, with a last installment of 0.03.
6. Large amounts: 10,00,00,00,000 at 30% for 360 months produces no NaN, the final closing balance is 0, and the principal parts add up exactly.
7. For every case, the final closing balance is 0, no balance is negative, Σ principal equals P, and Σ interest equals the total minus P.
8. Deductions: they add up correctly, and when they exceed the principal, net cash is negative and the flag is set.
9. The month 12 snapshot of "My current loan" matches §5.12, and the month 13 snapshot matches §13.1.
10. Validation: empty, non-numeric, zero, negative and over-maximum values; a rate above 50; a duration of 0 or above 360; and Bengali-digit input "১৫,২১,৫৯৫.৯৫" parsing to 1521595.95.
11. Months: with today set to 2026-10, the three sample loans in §13.1 give the right states (running at installment 13, not started with 3 months to go, completed), the right statuses for each month, the right default selected month, and the right next installment month.
12. Reference points (§3.1): 15,21,595.95 at 10.47% for 60 months gives ৳32,683, and 12,00,000 at 12% for 60 months gives ৳26,694. The EMI × n values and adjustments in §5.12 match, and the caption is hidden in the early-payoff case.

### 28.2 Formatting and i18n

1. `groupLakh` gives 19,60,934.72, 4,39,338.77, 15,02,188.87 and 10,00,00,00,000.00.
2. Bengali digits work, and negative values start with U+2212.
3. Compact formatting gives "15.22 lakh", "১৫.২২ লাখ", "1.5 crore" and "১.৫ কোটি".
4. Month names are correct in both forms (long and short) in both languages.
5. Singular and plural forms are chosen correctly.
6. Both dictionaries have exactly the same keys.

### 28.3 State

1. Adding, editing, deleting and undoing a loan all work.
2. Data persists across a reload, using a mocked MMKV.
3. Corrupt or missing storage falls back to the defaults.
4. The calculator draft is restored on the next launch.
5. The recent bank names list is capped at 10.

### 28.4 Components

1. S3 shows ৳32,683 and ৳32,682.42 by default.
2. Tapping "Top-up" shows net cash ৳4,14,000.00.
3. An invalid loan amount shows "—" and the validation message.
4. S7 for Loan A, with today set to 2026-10, selects October 2026 and shows ৳12,55,664.57.

### 28.5 Manual QA matrix

Test on:

- Android: a 360 dp phone and a large phone.
- iOS: a 375 × 667 phone (SE size) and a large phone.

On each device, check: both themes, both languages, font scale 1.3, airplane mode, and killing then relaunching the app.

## 29. Claude Code master prompt

Before you start, put this file at `docs/SPEC.md` and the Claude Design handoff bundle in `docs/design-handoff/`. Then paste the prompt below into Claude Code.

```text
ROLE
You are a senior React Native engineer. Build "Kisti" (কিস্তি), a Loan & EMI Calculator app, from docs/SPEC.md and the Claude Design handoff bundle in docs/design-handoff/.

SOURCES OF TRUTH, highest priority first
1. docs/SPEC.md Part 1 (§1–§9): behaviour, calculation rules, copy. Never change these.
2. docs/SPEC.md Part 3 (§18–§31): stack, architecture, tests, budgets.
3. The design handoff bundle: visuals, tokens, components, layout. If it conflicts with Part 1, Part 1 wins and you log the conflict.
4. docs/SPEC.md Part 2 (§10–§17): design intent wherever the bundle is silent.

The handoff bundle is web code. Use it only as a visual, token and copy reference. Re-implement everything with React Native primitives. Never port DOM or CSS code or web-only libraries.

HARD RULES
- Bare React Native CLI, latest stable version, TypeScript strict, Hermes, New Architecture.
- Free, open-source, maintained dependencies only, each New-Architecture and Android 16 KB page-size compatible (§18). No analytics, ads, crash reporters, remote config or network calls.
- All money maths lives in src/core as pure TypeScript with no React Native imports, using integer paisa (§20).
- The bank EMI uses §5.4 exactly. Never use Math.round for it.
- Do not build anything listed as out of scope in §2.
- If a test from §28 fails, fix the code, never the expected value. If you believe the spec itself is wrong, stop, show your proof, and wait for my decision.
- Ask before deleting or rewriting anything you did not create in this session.

WORKING METHOD
Work strictly phase by phase. At the end of each phase, STOP and report in the format below, then wait until I reply "continue". Never start the next phase early.

REPORT FORMAT (every phase)
1. Summary of what was done.
2. Files created or changed (paths).
3. Commands run and their results (type-check, lint, tests, builds).
4. Deviations from the spec, and why.
5. Risk and conflict log: new or updated entries, each with ID, description, impact, mitigation and status.
6. Plan for the next phase.

PHASES AND GATES
P0  Pre-flight audit (read only, change nothing)
    - Read docs/SPEC.md completely and take an inventory of the handoff bundle.
    - Check the toolchain: Node, package manager, JDK, Android SDK and NDK, Xcode, CocoaPods, Ruby. Report versions and anything missing.
    - Confirm the current stable React Native version and its CLI template.
    - For every dependency in §18, report the exact version, license, New Architecture support, last release date, Android 16 KB support and size impact. Choose the sound library here.
    - Map the handoff tokens onto §11 (colours, type, radius, spacing, motion) and list every mismatch.
    - List every conflict between the bundle and Part 1.
    Gate: I approve the dependency table, the token map, the conflict list and the risk log.

P1  Scaffold
    - Initialise the app with display name "Kisti" (Bengali launcher label "কিস্তি") and the package/bundle ID I confirm in P0.
    - Strict tsconfig, ESLint and Prettier, the "@/" path alias, and the §19 structure.
    - Install the approved dependencies, link the fonts, and create the tokens file from the P0 map.
    Gate: debug builds run on the Android emulator and the iOS simulator, showing a themed placeholder in both themes. tsc and lint are clean.

P2  Calculation engine (§5, §20, §21) and the §28.1 tests
    Gate: every core test passes and src/core has at least 95% line coverage.

P3  Formatting and i18n (§9, §23) and the §28.2 tests
    Gate: the tests pass and dictionary key parity is enforced by types.

P4  State and storage (§22) and the §28.3 tests
    Gate: data persists after killing the app on a real device or emulator.

P5  UI kit (§11, §12, §24) and a __DEV__-only KitchenSink screen
    Gate: KitchenSink screenshots on Android and iOS in light and dark, in বাংলা and English, with no clipped Bengali text.

P6  Calculator screen S3 (§6)
    Gate: §28.4 items 1–3 pass, and screenshots match the design states in §13.

P7  My Loans list S4, Add/Edit S5 and Month picker S6 (§7.1–§7.3, §7.5)
    Gate: add, edit, delete and undo work, and the data survives an app restart.

P8  Loan detail S7 and Full schedule S9 (§7.4)
    Gate: §28.4 item 4 passes, statuses follow §5.10, and outside months are disabled.

P9  Settings S8, Language choice S2, splash S1 and the app icon (§8, §11.7)
    Gate: language and theme switch instantly everywhere, and S2 appears on first launch only.

P10 Motion, sound and haptics (§15, §25)
    - Generate the sounds with scripts/generate-sounds.mjs.
    Gate: 60 fps in a release build on a mid-range Android device (explain how you measured it). Reduce-motion, Sound and Vibration settings are all respected.

P11 Performance, size, release configuration and accessibility (§26, §27)
    Gate: report the measured numbers against every budget, the 16 KB alignment check output, and the accessibility checklist results.

P12 Final QA against §30 and the §28.5 matrix
    Gate: a pass/fail table for every acceptance criterion, plus short release build instructions for Android (AAB) and iOS.
```

## 30. Acceptance criteria

1. With default values, the app shows a bank EMI of ৳32,683 and an exact EMI of ৳32,682.42.
2. The bank EMI always uses ceiling rounding, never nearest-integer rounding.
3. Every value in §5.12 and §13.1 matches the app exactly.
4. Inputs update results immediately, and invalid input never shows stale or misleading numbers.
5. Deductions are itemised, net cash is correct, and a negative result is shown with a warning.
6. The formula and schedule sections expand, and every month is reachable in S9.
7. Presets set every field and recalculate immediately.
8. Loans can be added, edited, deleted and restored with undo. They persist across restarts and work in airplane mode.
9. The month calendar shows the correct snapshot (§5.9) for every month inside the loan. Months outside the loan are disabled, "This month" works, and statuses follow §5.10.
10. Bengali and English are complete. Switching language instantly updates all text, digits and month names, and no Bengali text clips.
11. Light, dark and follow-phone themes all work, and contrast meets §11.3.
12. Motion is smooth and respects reduce motion. Sound and haptics are subtle and can each be turned off.
13. The layout works from 360 × 640 up to 430 × 932, on Android and iOS, at a font scale of 1.3.
14. Release builds meet the §26 budgets and make no network calls.
15. The two reference installments in §3.1 (৳32,683 and ৳26,694) are reproduced exactly, and the repayment summary shows the EMI × n caption next to the schedule total.

## 31. App name, store listing and SEO

### 31.1 Name

- **Brand:** **Kisti** / **কিস্তি** ("installment").
- **Why this name:** it is short, easy to say in English and in Bengali, and it is the exact word people already use for EMI in Bangladesh. That makes it easy to remember and easy to search. Pairing the brand with keywords in the store title ("Loan", "EMI", "Calculator", "BD") lets it rank for the generic searches that crowd this category.
- **Before you lock the name:** search both stores for "Kisti" and confirm there is no confusingly similar app. The package ID is permanent once the app is published on Play.
- **Backup names:** **Kisti Khata** (কিস্তি খাতা, "installment ledger") or **Kisti Hisab** (কিস্তি হিসাব, "installment calculation").

### 31.2 Store fields

| Field | Value | Limit (used) |
|---|---|---|
| Play Store app name (English) | Kisti: Loan EMI Calculator BD | 30 (29) |
| Play Store app name (bn-BD listing) | কিস্তি: লোন ও EMI ক্যালকুলেটর | 30 (29) |
| Play short description (English) | Bank loan EMI calculator in taka. Track every month's kisti, interest & balance. | 80 (80) |
| Play short description (bn-BD) | টাকায় ব্যাংক লোনের কিস্তি হিসাব করুন, প্রতি মাসের সুদ আর বাকি টাকা দেখুন। | 80 (74) |
| App Store name | Kisti: Loan EMI Calculator BD | 30 (29) |
| App Store subtitle | Bank Loan Installment Tracker | 30 (29) |
| App Store keywords | bangladesh,taka,interest,schedule,repayment,home,personal,car,bike,topup,amortization,planner | 100 (93) |
| Launcher label under the icon | Kisti (English phones) / কিস্তি (Bengali phones) | Keep it short |
| Category | Finance | — |
| Package / bundle ID | `com.<yourdomain>.kisti` | Permanent on Play |

The App Store keyword string deliberately leaves out words already in the name and subtitle, because Apple indexes those separately.

### 31.3 Full description

- **Opening lines.** The first two lines must contain the main search phrases: "EMI calculator", "loan calculator", "কিস্তি", "Bangladesh" and "taka".
- **Features.** Then list the features: bank EMI rounded up like real banks, deductions and cash in hand, the monthly schedule, My Loans with a month calendar, Bengali and English, and dark mode.
- **Trust lines.** Say clearly: "Works offline. No login. No ads. Your data stays on your phone."
- **Disclaimer.** Include: "Kisti does not give loans. It only calculates estimates. Confirm final figures with your bank."

### 31.4 Store compliance

- **Play Console declarations.** Complete the financial features declaration and state that the app does not offer loans. In the Data safety form, declare that no data is collected or shared.
- **App Store privacy.** Set the App Privacy label to "Data Not Collected".

### 31.5 Screenshots

Provide 6 screenshots, each with a short caption in both languages:

1. The EMI hero
2. Deductions and cash in hand
3. The repayment summary
4. My Loans
5. The month calendar
6. Dark mode
