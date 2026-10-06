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
| `js/kb.js` | Knowledge base: **143 conditions** (99 must-not-miss), tagged by Tintinalli 9e section: 70 adult medical, 31 trauma (S21–S22, `tr`) and 42 pediatric (S12, `pd`) |
| `js/engine.js` | Text extraction, derivation from vitals and labs, scoring, clinical scores, chart note |
| `js/cases.js` | 40 fictional example cases with Taglish narratives: 16 adult medical, 9 trauma, 15 pediatric |
| `js/app.js` | UI |
| `css/app.css` | Styling: EM Toolkit palette and dark/light mode, phone-first, 2 columns at ≥ 1000 px, print styles |
| `tests/node_rank.js` | Ranking test in Node (`node tests/node_rank.js`) |
| `tests/test_ui.py` | Headless Chromium test with Playwright (`python3 tests/test_ui.py`). Writes `tests/results.json` and `shots/*.png`. |
| `tests/node_trauma_scores.js` | Trauma score checks by hand (GCS/TBI, RTS, ATLS class, burn fluids, TXA window, PECARN head) |
| `tests/test_trauma_ui.py` | Trauma-mode UI test (primary-survey banner first, auto-on, mirrors, Taglish mechanisms) at 390 and 1280 px |
| `tests/node_peds.js` | Pediatric checks (`node tests/node_peds.js`): hand-calculated weight-based doses and adult caps, Holliday–Segar, APLS weight, age-specific vitals, pediatric scores, adult-only suppression, KB integrity, Taglish keywords |
| `tests/test_peds_ui.py` | Pediatric-mode UI test (auto-on / manual toggle, dose and home-care blocks, weight mirror, capped-dose badges) at 390 and 1280 px; writes `tests/peds_results.json` |
| `tests/check_toolkit_ids.py` | Checks that every toolkit card id resolves in the EM Toolkit and that trauma/pediatric links name the card's section |

## How it works
1. **Input.** The form takes:
   - age (years, months, weeks or days), sex, pregnancy status and gestational age
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
8. **🩻 Trauma mode** (toolbar button; switches on automatically when an injury or mechanism is recorded, e.g. *naaksidente sa motor, nahulog, sinaksak*, unless you switch it off).
   - Adds an **ATLS xABCDE primary survey** (exsanguinating hemorrhage, airway + C-spine, breathing, circulation with eFAST, disability with GCS E/V/M and pupils, exposure/burns) and a head-to-toe **secondary survey**. Trauma vitals are the same fields as 📈 Vital signs.
   - Results open with a **"Primary survey first" banner** listing life threats in order before any ranked list, plus adjuncts and trauma-centre / transfer criteria (DOH AO 2014-0002/0007, RA 10932).
   - 31 trauma conditions (tension/open pneumothorax, hemothorax, tamponade, hemorrhagic shock, pelvic fracture, solid/hollow organ, EDH/SDH/TBI, spine, burns and inhalation, crush/compartment, trauma in pregnancy, geriatric and pediatric trauma, drowning…) are considered only in trauma context.
   - Trauma scores: GCS/TBI category, ATLS hemorrhage class, ABC score, revised trauma score, Canadian C-spine and CT head rules (adults) / PECARN head (children), burn fluids (ATLS 10th/ABA), TXA window, trauma-centre criteria.
9. **🧒 Pediatric mode** (toolbar button; switches on automatically when the age is < 18, unless you switch it off; can be forced on at any age).
   - **Inputs:** age in days, weeks, months or years; weight (if blank, the APLS age-based estimate is used and flagged – **APLS formulas tend to overestimate the weight of Filipino children; weigh the child**); immunization (EPI), feeding/intake, urine output, activity/consolability; **Pediatric Assessment Triangle**; **IMCI general danger signs**; pediatric history/exam chips; Kawasaki criteria; optional ANC, CRP, procalcitonin, ESR, venous pH/HCO₃; pediatric GCS; Westley items.
   - **Age-specific vital signs** (APLS ranges, PALS hypotension, WHO IMCI / PAPP-PIDSP fast-breathing cut-offs) flag tachycardia, tachypnea and hypotension for age. The adult cut-off findings (HR > 100, RR ≥ 22, SBP < 90, shock index) are re-defined for age so shared rules keep working.
   - **42 pediatric conditions** following the Tintinalli 9e Pediatrics section topic map: febrile infant ≤ 60 d / SBI, neonatal sepsis, neonatal jaundice, bronchiolitis, croup, pediatric CAP (PAPP-PIDSP), asthma, foreign body aspiration, epiglottitis / bacterial tracheitis, AGE with dehydration (WHO plans A/B/C), intussusception, pyloric stenosis, malrotation/volvulus, appendicitis (PAS), NEC / Hirschsprung enterocolitis, UTI, febrile seizure, status epilepticus, meningitis/encephalitis, dengue (weight-based fluids), measles, HFMD, Kawasaki, MIS-C, DKA (ISPAD 2022, cerebral edema), hypoglycemia, anaphylaxis, testicular torsion, child maltreatment (RA 7610), iron / paracetamol / hydrocarbon poisoning, SVT, congenital heart disease (duct-dependent lesions, tet spells), AOM, strep pharyngitis, septic arthritis vs transient synovitis (Kocher), pediatric sepsis (Phoenix 2024, FEAST caveat), childhood TB (NTP), typhoid, leptospirosis.
   - **Adult-only conditions are suppressed:** adult entries with a pediatric counterpart (e.g. appendicitis, CAP, dengue, DKA, sepsis, UTI) are replaced by the pediatric version, and adult-only diagnoses (e.g. STEMI, aortic dissection, AAA, COPD, PE below 12 y) are not considered below a minimum age. Both are listed under "Excluded".
   - **Each pediatric plan** has diagnostics, ED treatment, disposition (admit / PICU / refer), **weight-based doses computed from the entered (or estimated) weight and capped at the usual adult maximum** (a "capped" badge shows when the cap applies; volumes in mL for common syrups), and **IMCI-style home-care and return advice** (Taglish) where suitable. Every dose is ⚠ VERIFY.
   - **Pediatric scores:** PAT, vital signs for age, IMCI danger signs, PEWS (Brighton, simplified), pediatric GCS, Holliday–Segar maintenance (capped at 100 mL/h), WHO dehydration assessment with plan A/B/C volumes, AAP 2021 febrile infant pathway, PECARN febrile infant rule, Step-by-Step, Westley, PAS, Kawasaki checklist (complete / incomplete), Kocher, PAPP-PIDSP CAP risk, ISPAD DKA severity and fluids, TWIST, DOH/WHO dengue fluids by weight. NEWS2, qSOFA, CURB-65, Wells/PERC and HEART are hidden for children.
   - **Taglish keywords** include *lagnat, ubo, sipon, kinukumbulsyon/nangingisay, ayaw dumede/kumain, matamlay, nagsusuka, pagtatae, hirap huminga, may rashes, namamaga, parang tahol ang ubo, nabulunan, nakainom ng gaas, walang bakuna*.

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
- Pediatric sources, PH first: DOH IMCI chart booklet, PAPP-PIDSP 2021 pediatric CAP, DOH 2011/WHO 2009 and the 2023 DOH-approved dengue CPG (pediatric fluids), DOH measles-rubella program / PIDSR, DOH NTP MOP 2020 (childhood TB), PSMID/PIDSP UTI, PSMID typhoid, PH Leptospirosis CPG 2010, rabies DOH AO, RA 7610 and DOH Women and Children Protection Units, UP-PGH NPMCC. International: AAP 2021 febrile infant CPG, PECARN, Step-by-Step, NICE NG143 fever, APLS / PALS 2020 (2025 update), ISPAD 2022 DKA, AHA 2017/2024 Kawasaki, ACR 2022 MIS-C, SSC pediatric 2020 / Phoenix 2024, WAO 2020 anaphylaxis, AAP bronchiolitis/AOM, IDSA/PIDS.
- 59 of the 143 conditions cite a PH source (adult 23/70, trauma 21/31, pediatric 15/42).

## EM Toolkit integration
- The styling reuses the toolkit's CSS variables and `body.dark` theme, and shares the `em_dark` preference.
- Each plan names the matching toolkit location ("EM Toolkit: S13 Infectious Diseases › Dengue … · search 'dengue'") and links to `index.html#o-<cardId>`. The base is `../index.html` when the app is served from the toolkit's `ddx/` folder (GitHub Pages, a local server or file://); otherwise it is the absolute toolkit URL (`https://carqisan-prog.github.io/em-toolkit/index.html`).
- **Deep links:** the toolkit's `nav.js` handles `#o-<cardId>` on load and on `hashchange` (opens the card's section and scrolls the card to just below the sticky bar), and `?q=<term>` on load (pre-fills the search box with results).
- **Published inside the toolkit** at `ddx/` (https://carqisan-prog.github.io/em-toolkit/ddx/) and embedded as an iframe panel: drawer/sidebar › 🛠 🩺 DDx Assist, searchable ("DDx", "differential", "diagnosis"), with an "Open full screen ↗" link. Opened full screen, a "← EM Toolkit" back link appears (hidden inside the iframe and when the file is not under `ddx/`).
- Inside the toolkit iframe, a toolkit link opens the card **in the parent toolkit** (same-origin `window.EMTK.openCard`), with a "← Back to DDx Assist" button; full screen, or if the parent is not reachable, it opens in a new tab.

## Limitations
- Weights are hand-set estimates of likelihood ratios. They have **not been validated on patient data**. Rankings show which findings point where. They are not probabilities.
- The KB covers 143 conditions (adult medical, trauma, pediatric). The following are not covered or not tuned:
  - neonatal resuscitation, inborn errors of metabolism, pediatric oncology/hematology emergencies, most pediatric rashes beyond measles/HFMD/Kawasaki, VP-shunt problems
  - most toxidromes
  - psychiatric emergencies other than alcohol withdrawal and panic
  - many dermatologic, ophthalmologic and ENT conditions
  - rare tropical diseases (e.g. scrub typhus, melioidosis, chikungunya)
- Pediatric mode: weight-based doses are a convenience calculation, not a prescription. The adult caps, syrup strengths and several PH-guideline details were written from memory (marked "recalled, verify"). The APLS weight estimate is only an estimate (and tends to overestimate in Filipino children); IMCI is designed for 2 months–5 years; PEWS is simplified; the PAPP-PIDSP risk class is approximate.
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
