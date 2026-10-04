# ECG Reader (offline, browser-based)

*Part of the [EM Toolkit](../): open it from **S7 Cardiovascular › ECG reader** in the toolkit (embedded panel with an "Open full screen" link), or directly at `ecg/`. Published at <https://carqisan-prog.github.io/em-toolkit/ecg/>.*

A static HTML/JS ECG reader for emergency use: load an ECG, filter it, detect QRS complexes
(Pan-Tompkins), delineate P / QRS / T, measure intervals and produce a **rule-based draft read**
with a signal-quality indicator, a printable report and a beat-by-beat CSV.

> ⚠ **Automated draft, not a diagnosis.** The output comes from simple rules and can be wrong
> (noise, lead choice, unusual morphology, P waves buried in T waves). A clinician must confirm every
> finding against the original tracing and the patient. This is not a medical device. **It does not
> detect STEMI.** The per-lead ST measurement is labelled *screening only*.

## Run it

* **Simplest:** open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari, including
  phones). It needs no server, no build step and no network; everything runs on the device.
* **Single file:** `ecg-reader-standalone.html` has everything inlined (≈735 KB). You can copy it to a
  phone or AirDrop/Share it and open it offline. To rebuild it after edits, run `python3 tools/build_single.py`.
* **Local server (optional):** `cd ecg-reader && python3 -m http.server 8000`, then open <http://localhost:8000/>.
* To deep-link a demo, use `index.html#sample=syn_af` (any sample id listed below).

Files:

| File | Purpose |
|---|---|
| `index.html` | UI and styles (dark/light theme, same palette as the EM toolkit) |
| `ecg.js` | Processing core: parsers, filters, Pan-Tompkins, delineation, rules, digitizer, CSV. Works in the browser and in Node (`require('./ecg.js')`) |
| `app.js` | UI: loading, canvas ECG paper, zoom/pan, report, exports, photo digitizer |
| `samples.js` | Embedded demo data (so it works from `file://` without fetch) |
| `samples/` | The same demo data as uploadable files: CSV, TXT, JSON, WFDB 212 and WFDB 16, plus a test strip photo |
| `tools/gen_samples.py` | Regenerates the synthetic samples and pulls the PhysioNet excerpts (needs numpy, scipy, wfdb, pillow) |
| `tools/build_single.py` | Builds `ecg-reader-standalone.html` |
| `tools/node_check.js`, `tools/noise_check.js` | Quick algorithm checks in Node (the noise check adds noise, wander and mains) |
| `tests/run_tests.py` | Headless Chromium/Playwright end-to-end test. Writes `tests/results.md` and `.json` plus `shots/` |

## Input formats

All inputs go through the **Load ECG** card. Under *Import options* you can override the sampling rate,
units, ADC gain and the maximum number of seconds to load (default 120 s).

| Input | Details |
|---|---|
| **CSV / TXT / TSV** | One column per lead. The delimiter (comma, semicolon, tab or whitespace) is auto-detected. An optional header row supplies lead names. An optional **time column** is detected by its name (`time`, `t`, `sec`, `ms`…) or as a monotonic, evenly spaced first column. **fs is auto-detected** from the time step (seconds, or milliseconds if the header says `ms` or the step is 1–20). A `sample`/`index` column is treated as an index, not as time. Lines starting with `#`, `%` or `;` are ignored. |
| **Paste** | Raw numbers: one per line, comma/space separated, or multi-column (same parser as CSV). Set fs in Import options; it defaults to 250 Hz if unknown. |
| **JSON** | `{"fs":500,"units":"uV","leads":{"II":[…],"V1":[…]}}`. Also accepted: `sampling_rate`/`samplingRate`, `signals`/`data` as an array of arrays plus `lead_names`, a bare array, or `time` (fs derived from it). |
| **WFDB (PhysioNet)** | Select the **`.hea` and `.dat` files together**. Supported formats: **16, 212**, 61 and 80. Gain/baseline/units come from the header, and several `.dat` files per record are allowed. Not supported: multi-segment and multi-frequency records, or formats 310/311/24/32. |
| **Photo (EXPERIMENTAL)** | Single-lead rhythm strip on a red/pink grid. See below. |

Units are auto-detected per lead from the robust peak-to-peak: below 20 is read as mV, below 20 000 as
µV, and offset integers as ADC counts (divided by the gain, 200 by default). You can override this.

## Features

**Display.** ECG paper grid at 25 mm/s and 10 mm/mV (switchable to 50 mm/s and 5/20 mm/mV), with a
1 mV calibration pulse and second ticks. Choose one lead or all leads stacked, and show raw or filtered
signal. Drag to pan. Zoom with the +/− buttons, ctrl/⌘ + wheel or a pinch. There is also a Fit button
and a position slider. Tap a beat to see its measurements. Markers: **P onset/peak** (green), **QRS
onset/offset** (red), **R-peak ▼** labelled N / V (PVC-like) / S (premature narrow) with the RR in ms,
and **T peak/end** (blue). An RR tachogram sits below the trace and a beat table below that (click a row
to jump to the beat). Note that the on-screen "mm" is a nominal pixel scale; it is not physically
calibrated to the screen.

**Processing (`ecg.js`).**
* Baseline wander: zero-phase 0.5 Hz high-pass (default), a two-stage median filter (200/600 ms), or none.
* Mains: zero-phase **notch at 60 Hz (PH default)** or 50 Hz, plus its 2nd harmonic. Low-pass at 40 Hz (monitor), 100 Hz or 150 Hz.
* **Pan-Tompkins QRS detection:** 5–15 Hz band-pass, 5-point derivative, squaring, 150 ms moving-window
  integration, adaptive signal/noise thresholds (SPKI/NPKI), 200 ms refractory period, search-back at
  1.66 × mean RR with the half threshold, and T-wave slope discrimination below 360 ms. Detections are
  refined to the dominant QRS peak on the filtered lead.
* **Delineation:** QRS onset and offset from a smoothed slope envelope. The threshold is the larger of
  5 % of the QRS max slope and 4× the slope noise floor. With more than one lead, the default is
  **multi-lead global boundaries** (earliest onset and latest offset across leads, with a ±40 ms outlier
  guard). The isoelectric level is the median of the PR window. The **P wave** is the largest deflection
  in the window before the QRS (limited by the previous T end). Its onset is where it falls to 10 % of
  its amplitude, and it is accepted only if its amplitude is 0.04 mV or more and it lasts 40–180 ms.
  **T end** uses the tangent method: the steepest descent after the T peak, intersected with the
  isoelectric line.
* **Beat classes:** N / V (premature or followed by a pause, plus wide or morphology correlation < 0.75
  with no P wave, or wider than the dominant beat by 25 ms or more and ≥120 ms with correlation < 0.8)
  / S (premature narrow beat with normal morphology).
* **Measurements:** HR (median NN), mean HR, RR mean/min/max, SDNN, RMSSD, pNN50, CV and normalised
  RMSSD. PR, QRS, QT, **QTc Bazett** (QT/√RR) and **QTc Fridericia** (QT/∛RR), all taken as the median
  of dominant beats. P-wave presence %, PR SD and R amplitude.

**Rule-based interpretation.** Each finding carries a severity and a confidence (high/moderate/low,
scaled by signal quality).
* Rhythm is **sinus** when P waves appear before ≥70 % of beats with PR SD ≤30 ms and consistent
  polarity. It is then **normal sinus rhythm** (60–100), **sinus bradycardia** (<60) or **sinus
  tachycardia** (>100). Inverted P in II is flagged.
* **Irregularly irregular / possible AF:** normalised RMSSD > 0.10, at least 50 % of successive RR
  differences > 8 % of the mean, CV > 0.08 and ≥6 beats, **and** no consistent P waves (PVC-like beats
  must be under 25 %). The read adds RVR (mean >110) or slow response (<60) where relevant.
* Without consistent P waves: **regular narrow-complex** (junctional / SVT / flutter considerations) or
  **regular wide-complex**. When wide and fast, it says "treat as VT until proven otherwise".
* **Pauses:** RR ≥ 2.0 s, marked urgent at ≥ 3 s. **PVC-like** wide/early beats are reported with a
  rate and a bigeminy/trigeminy/couplet pattern. Premature narrow beats are reported as possible PAC.
* **1st-degree AV block** (PR > 200 ms), **short PR** (< 120 ms, consider pre-excitation), **wide QRS**
  (≥ 120 ms) and borderline QRS (110–119 ms).
* **Prolonged QTc:** above 460 ms if sex is unspecified, above 450 ms for male and above 470 ms for
  female (set in the Processing card). ≥500 ms is urgent. Fridericia is used for the flag when HR is
  >90 or <50. There are notes for wide-QRS QT and for QTc in AF.
* **ST deviation at J+60 ms per lead: SCREENING ONLY.** This is the median ST level against the PR
  segment, flagged at ≥0.1 mV elevation or ≥0.05 mV depression. It has no territorial or reciprocal
  logic and is **not STEMI detection**.
* **Signal quality (0–100: Good/Fair/Poor):** built from the QRS-to-HF-noise ratio, beat template
  correlation, delineation completeness, rate plausibility, raw baseline wander, clipping, duration and
  flat-line detection. **If quality is below 40, all rhythm rules are suppressed** and the read says
  "Uninterpretable".

**Exports.** **Report (print / PDF):** a one-page A4 draft with blank patient fields, recording and
filter details, quality, rhythm, a measurement table with adult reference ranges, findings, the ST
screening line, 10-s strips of every lead with markers, data attribution, and a clinician
sign-off/interpretation line. Use the browser's *Print → Save as PDF*. **Beats CSV:** per-beat type,
times of R, P onset, QRS on/off, T peak/end, RR, PR, QRS, QT, QTcB, QTcF, amplitudes and template
correlation. **Signal CSV:** the filtered signal, which is useful after photo digitizing.

**Photo/scan digitizer: EXPERIMENTAL (included because it worked on the test image).**
1. Load the image.
2. Click two corners of a rectangle on the grid that spans *W × H* **large** boxes (default 5 × 2, which is 1 s × 1 mV).
3. Click two corners around the single trace to digitize.
4. Press Digitize.

The digitizer uses an Otsu threshold on luminance, excludes reddish grid pixels, follows the trace
column by column with continuity, keeps peaks on steep strokes and interpolates gaps. It resamples to
250 Hz and then runs the normal pipeline. A blue overlay of the extracted trace appears on the image so
you can check it. On the bundled test strip (`samples/strip_photo.jpg`: 5 s of synthetic NSR 72, rotated
0.6°, blurred JPEG) it returned **HR 72, sinus, PR 152, QRS 108**. Treat its output as **rate/rhythm
only**: amplitudes and intervals are approximate. It is not designed for 12-lead layouts, curved,
shadowed or skewed photos, blue/green grids, or overlapping leads.

## Demo samples (dropdown)

Synthetic signals (10 s, 500 Hz, leads II/V1/V5) come from a McSharry/ECGSYN-style sum-of-Gaussians beat
model with explicit per-beat timing, so the true RR, PR, QRS and QT are known. Each one includes 0.15 mV
of baseline wander, **60 Hz mains** and white noise. The samples are: NSR 72, sinus brady 45, sinus
tachy 120, AF-like (irregular RR, no P, f-waves), sinus 75 with PVCs every 4th beat, 1st-degree AVB
(PR 280), wide QRS (150 ms), long QTc (~520), sinus pause (2.8 s) and short PR (100 ms).

Real excerpts come from the **MIT-BIH Arrhythmia Database**, record **100** (0–10 s: sinus with one
APC) and record **208** (20–30 s: sinus tachycardia with PVCs and a fusion beat). Attribution: Moody GB,
Mark RG. *The impact of the MIT-BIH Arrhythmia Database.* IEEE Eng Med Biol 2001;20(3):45-50. Goldberger
AL et al. *PhysioBank, PhysioToolkit, and PhysioNet.* Circulation 2000;101(23):e215-e220.
<https://physionet.org/content/mitdb/1.0.0/>. Licensed under the **Open Data Commons Attribution License
v1.0**. The samples are unmodified apart from the 10-s excerpting and the conversion to µV.

## Tests

```
pip install playwright numpy   # browser: uses /usr/bin/google-chrome if present, else `playwright install chromium`
python3 tests/run_tests.py     # → tests/results.md, tests/results.json, shots/*.png, shots/report_syn_pvc.pdf
node tools/node_check.js       # algorithm table in Node
node tools/noise_check.js      # robustness with extra noise
```

The test loads every sample through the dropdown. It checks HR (±6 %, or ±12 % for AF), rhythm, the
expected flags with no unexpected major flags, PR/QRS (±25 ms; ±30 ms for wide) and QTcB (±30 ms)
against the synthetic parameters, plausibility ranges, the PVC count, and, for MIT-BIH, beat Se/PPV and
PVC matching against the reference annotations. It also covers every upload format (CSV with time, TXT
µV, JSON, WFDB 212, WFDB 16, paste), the photo digitizer, drag-to-pan, the median-filter variant, CSV
export, report → PDF, the standalone build, console errors, and the layout at **390 px** and **1280 px**
(no horizontal overflow).

**Latest result:** 11/12 samples pass every check, along with every format, export and layout check
and 0 console errors. **Known failure:** MIT-BIH 208 (sinus tachycardia ~110 with PVCs). HR, beat
detection (Se/PPV 1.00) and all 4 reference PVCs are correct, but the rhythm is called "regular
narrow-complex rhythm without clear P waves". At 110 bpm the P waves sit on the preceding T wave and
the P search window, which is bounded by the previous T end, misses them. See `tests/results.md`.

## Limitations (read before use)

* **Not a diagnostic device. No STEMI, ischaemia, axis, hypertrophy, BBB-type, 2nd/3rd-degree AV
  block, flutter, WPW or VT/SVT discrimination logic.** The rhythm categories are deliberately coarse.
* Delineation runs on one analysis lead (by default II/MLII, otherwise the best QRS-to-noise lead), with
  optional multi-lead QRS boundaries. Small Q/S waves may be missed, so QRS is approximate (±10–20 ms on
  synthetic data). Expect larger errors on real tracings.
* **P waves:** low-amplitude P waves, P waves buried in T waves (sinus tachycardia), and atrial flutter
  can all lead to "no clear P waves". Coarse f-waves or noise can mimic P waves, which the PR-stability
  rule tries to reject.
* **AF rule** needs at least 6 beats and is unreliable with frequent ectopy, short strips, sinus
  arrhythmia without clear P waves, or MAT. Second-degree AV block with dropped beats may trigger "pause".
* QT uses the tangent method on one lead (12-lead machines use the longest lead or a global
  superimposition). Bazett overcorrects at high HR. QT is inflated by wide QRS.
* The 0.5 Hz high-pass baseline filter (zero-phase) can slightly distort the ST segment. Use "Median"
  for ST screening, and in every case read the 12-lead.
* The demo samples are mostly **synthetic**. The test pass rate shows internal consistency, not clinical
  accuracy. The algorithm has not been validated on a clinical database.
* Long WFDB records are cut to "Max seconds to load" (default 120 s) to keep phones responsive.
* The photo digitizer is experimental (see above).
