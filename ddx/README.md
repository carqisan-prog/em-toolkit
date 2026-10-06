# DDx Assist: offline ED differential diagnosis support

> **Decision support only. It does not make a diagnosis and is not a medical device.** The output is a transparent list of possibilities produced by fixed rules. Clinical judgment overrides it. Every dose is marked **⚠ VERIFY**, so check each one against current references and local protocols.

A static HTML/JS app built phone-first for Philippine emergency departments.
- No server, no external API, no analytics and no network requests. The CSP sets `connect-src 'none'`.
- No patient data is stored. The only thing kept in `localStorage` is the dark/light preference, under the same key the EM Toolkit uses (`em_dark`).

## Files
| Path | What |
|---|---|
| `index.html` | App shell (loads `css/` and `js/`) |
| `ddx-standalone.html` | **Single-file version.** Everything is inlined, so you can copy it to a phone and open it offline. Rebuild with `python3 build_standalone.py`. |
| `js/findings.js` | Finding dictionary (form chips by section), derived findings, and the English + Tagalog/Taglish lexicon with negation cues |
| `js/kb.js` | Knowledge base: 70 conditions (42 must-not-miss), tagged by Tintinalli 9e section |
| `js/engine.js` | Text extraction, derivation from vitals and labs, scoring, clinical scores, chart note |
| `js/cases.js` | 16 fictional example cases with Taglish narratives |
| `js/app.js` | UI |
| `css/app.css` | Styling: EM Toolkit palette and dark/light mode, phone-first, 2 columns at ≥ 1000 px, print styles |
| `tests/node_rank.js` | Ranking test in Node (`node tests/node_rank.js`) |
| `tests/test_ui.py` | Headless Chromium test with Playwright (`python3 tests/test_ui.py`). Writes `tests/results.json` and `shots/*.png`. |

## How it works
1. **Input.** The form takes:
   - age, sex, pregnancy status and gestational age
   - chief complaint, onset, duration and fever day
   - HPI chips, PMH and medication chips
   - vitals (HR, BP, RR, T, SpO₂, on O₂, GCS, glucose in mg/dL or mmol/L)
   - PE chips by system
   - optional bedside results (WBC, neutrophil %, platelets, Hct, urea/BUN, lactate, ECG/troponin/UA/hCG/POCUS/NS1/Xpert chips)

   Each chip has three states: **unknown → present (+) → absent (−)**. Tap to cycle through them. An unmarked chip is never treated as negative.
2. **Free text.** Regex keywords pick findings out of English, Tagalog and Taglish text. Examples:
   - *lagnat/nilalagnat, ubo, hirap huminga, pananakit ng dibdib, pagtatae/LBM, sakit ng ulo*
   - *lumusong sa baha, tuklaw, likod ng mata, dumudugo ang gilagid*

   Negation is detected from a cue (*walang, wala, hindi, di, no, denies, without*) that appears in the same clause shortly before the term. Durations are read from phrases like "3 araw", "tatlong araw", "1 linggo", "kahapon" and "kaninang umaga". Extracted items appear as chips. **Apply** copies them into the form. Form chips always override text.
3. **Derived findings.** Numbers become findings that count as present or absent once you enter a value. Examples: HR > 100, SBP < 90, shock index ≥ 1, narrow pulse pressure, SpO₂ < 94/90, T ≥ 38/39/40, GCS < 15, glucose bands, WBC, platelets ≤ 100k, urea, lactate ≥ 2/4, age bands, and pregnancy ≥ 20 wk.
4. **Scoring for each condition.**
   - **Score = prior + Σ weights of present findings + Σ "absent" weights of findings explicitly marked absent.**
   - Weights are on a log₂-likelihood-ratio-style scale: +1 ≈ LR 2, +3 ≈ LR 8, −2 ≈ LR 0.25. They are **expert estimates, not values from a validated model.**
   - **Gate:** a condition is only considered if at least one of its key findings is present. For example, appendicitis needs abdominal pain or RLQ findings.
   - **Hard exclusions** carry a stated reason and are listed under "Excluded". Examples: ectopic pregnancy in a male, testicular torsion in a female.
   - Tiers: **High ≥ 8, Moderate 5–7.9, Low < 5**. The number is a score, **not a probability**.
5. **Output.**
   - **Critical alerts**: SBP < 90, SpO₂ < 90, GCS ≤ 8, glucose < 70, extreme RR/HR/T.
   - **🚩 Must not miss**: dangerous conditions that score ≥ 2, so the current data does not exclude them. Shown even when they rank low.
   - **Ranked differential**, top 10 with score ≥ 2. Each card shows:
     - score, tier and the Tintinalli 9e section/topic tag
     - red flags present
     - **why**: supporting and opposing findings, with their weights
     - **ask/check next**: unassessed high-weight findings
     - prioritised **PH-available diagnostics**, **initial ED treatment** and **disposition**, each with a **Source** line
     - the EM Toolkit card
6. **Scores**, calculated automatically when the data allows:
   - NEWS2, shock index, qSOFA, CURB-65
   - **PCAP 2016 risk class** (approximate, see limitations)
   - Wells PE (tick "PE most likely" for the +3) and PERC
   - HEART (history component auto-estimated), ADD-RS
   - Centor/McIsaac, Alvarado
   - **DOH/WHO 2009 dengue group A/B/C**
7. **Chart note.** **📋 Copy as chart note** copies the following to the clipboard (with a fallback textarea):
   - patient, CC, HPI (positives and negatives), narrative, PMH, meds, vitals, PE, results, scores
   - assessment/differential, must-not-miss list, and the plan for the diagnoses you tick (top 2 by default), with sources and ⚠VERIFY
   - disposition and the disclaimer

   **🖨 Print** prints the same note.

## Sources policy (Tintinalli 9e + PH CPGs)
- **Organisation:** every condition is tagged with its **Tintinalli's Emergency Medicine 9e section and topic** (S3 Resuscitation … S24 Psychosocial). Only the book's section/topic map is used. **No text from the book is reproduced.** All content is original summary.
- **Diagnostics and treatment:**
  - Where a Philippine CPG exists, it is preferred and cited by name and year, marked **🇵🇭 PH**. Examples:
    - PCAP 2016, PAPP-PIDSP 2021
    - 2023 DOH-approved Dengue CPG and DOH 2011/WHO 2009 dengue management
    - PH Leptospirosis CPG 2010, PSMID Typhoid 2017, PSMID UTI 2013/2015
    - DOH NTP MOP 6th ed. 2020
    - PHA 2014 CAD CPG, 2020 PH Hypertension CPG, 2024 PH CPG on Acute Severe BP Elevation
    - SSP 2024 Stroke CPG, POGS 2022 Hypertension in Pregnancy
    - DOH AO 2018-0013 / AO 2026-0010 rabies
    - UP-PGH NPMCC, RITM PCAV
  - Otherwise the international guideline is used and labelled **(intl)**.
  - Sources marked "recalled, verify" were written from memory and **must be checked against the source document**.
- 26 of the 70 conditions cite a PH source.

## EM Toolkit integration
- The styling reuses the toolkit's CSS variables and `body.dark` theme, and shares the `em_dark` preference.
- Each plan names the matching toolkit location ("EM Toolkit: S13 Infectious Diseases › Dengue … · search 'dengue'") and links to `index.html#o-<cardId>`. The base is `../index.html` when the app is served from the toolkit's `ddx/` folder (GitHub Pages, a local server or file://); otherwise it is the absolute toolkit URL (`https://carqisan-prog.github.io/em-toolkit/index.html`).
- **Deep links:** the toolkit's `nav.js` handles `#o-<cardId>` on load and on `hashchange` (opens the card's section and scrolls the card to just below the sticky bar), and `?q=<term>` on load (pre-fills the search box with results).
- **Published inside the toolkit** at `ddx/` (https://carqisan-prog.github.io/em-toolkit/ddx/) and embedded as an iframe panel: drawer/sidebar › 🛠 🩺 DDx Assist, searchable ("DDx", "differential", "diagnosis"), with an "Open full screen ↗" link. Opened full screen, a "← EM Toolkit" back link appears (hidden inside the iframe and when the file is not under `ddx/`).
- Inside the toolkit iframe, a toolkit link opens the card **in the parent toolkit** (same-origin `window.EMTK.openCard`), with a "← Back to DDx Assist" button; full screen, or if the parent is not reachable, it opens in a new tab.

## Limitations
- Weights are hand-set estimates of likelihood ratios. They have **not been validated on patient data**. Rankings show which findings point where. They are not probabilities.
- The KB covers 70 conditions, mostly adult ED presentations. The following are not covered or not tuned:
  - paediatrics (other than doses mentioned in passing)
  - trauma, burns, most toxidromes
  - psychiatric emergencies other than alcohol withdrawal and panic
  - many dermatologic, ophthalmologic and ENT conditions
  - rare tropical diseases (e.g. scrub typhus, melioidosis, chikungunya)
- Conditional dependence is ignored. Correlated findings, such as fever and chills, add up, which can overstate the score for findings-rich conditions. Some shared findings show as "red flags" for more than one condition, e.g. petechiae for both dengue and meningitis.
- The keyword extractor is regex-based. It can miss spelling variants, regional languages (Bisaya, Ilocano and others), double negatives, and negation scope beyond about 25 characters. Always review the extracted chips.
- Some scores need judgement that the app cannot capture:
  - HEART history is auto-estimated.
  - Wells needs the "PE most likely" tick.
  - PCAP risk class omits aspiration, decompensated comorbidity and CXR extent.
  - Dengue grouping depends on which warning signs are entered.
- Doses and regimens can be out of date or differ locally. **Everything marked ⚠ VERIFY must be checked.** Antibiograms vary by hospital.
- Toolkit deep links need the toolkit's `#o-<cardId>` handler (added in the published toolkit); an older toolkit copy just opens at its last section.
- This is not a regulated medical device and is not intended for autonomous use.
