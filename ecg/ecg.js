/* ECG Reader – signal processing, parsing and rule-based interpretation core.
 * Pure JS, no dependencies. Works in the browser (window.ECG) and in Node (module.exports).
 * NOT A MEDICAL DEVICE. Output is an automated draft that must be confirmed by a clinician.
 */
(function (root) {
  'use strict';
  const VERSION = '1.0.0';

  /* ------------------------------------------------------------------ utils */
  const median = (a) => { const b = Array.from(a).filter(Number.isFinite).sort((x, y) => x - y); if (!b.length) return NaN; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const mean = (a) => { let s = 0, n = 0; for (const v of a) if (Number.isFinite(v)) { s += v; n++; } return n ? s / n : NaN; };
  const sd = (a) => { const m = mean(a); let s = 0, n = 0; for (const v of a) if (Number.isFinite(v)) { s += (v - m) ** 2; n++; } return n > 1 ? Math.sqrt(s / (n - 1)) : NaN; };
  const pct = (a, p) => { const b = Array.from(a).filter(Number.isFinite).sort((x, y) => x - y); if (!b.length) return NaN; const i = Math.min(b.length - 1, Math.max(0, Math.round(p / 100 * (b.length - 1)))); return b[i]; };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mad = (a) => { const m = median(a); return median(Array.from(a, (v) => Math.abs(v - m))); };

  /* ---------------------------------------------------------------- filters */
  // RBJ audio-EQ-cookbook biquads
  function biquad(type, f0, fs, Q) {
    const w = 2 * Math.PI * f0 / fs, c = Math.cos(w), s = Math.sin(w), al = s / (2 * Q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else if (type === 'notch') { b0 = 1; b1 = -2 * c; b2 = 1; }
    a0 = 1 + al; a1 = -2 * c; a2 = 1 - al;
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  function lfilter(cf, x) {
    const [b0, b1, b2, a1, a2] = cf, n = x.length, y = new Float64Array(n);
    // initialise state to steady-state for a constant input = x[0]
    const dc = (b0 + b1 + b2) / (1 + a1 + a2);
    let x1 = x[0], x2 = x[0], y1 = Number.isFinite(dc) ? x[0] * dc : 0, y2 = y1;
    for (let i = 0; i < n; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }
  // zero-phase forward-backward filtering with odd reflection padding
  function filtfilt(cf, x, padLen) {
    const n = x.length; if (n < 4) return Float64Array.from(x);
    const p = Math.min(n - 1, padLen || 0);
    const z = new Float64Array(n + 2 * p);
    for (let i = 0; i < p; i++) { z[i] = 2 * x[0] - x[p - i]; z[n + p + i] = 2 * x[n - 1] - x[n - 2 - i]; }
    z.set(x, p);
    let y = lfilter(cf, z); y.reverse(); y = lfilter(cf, y); y.reverse();
    return y.slice(p, p + n);
  }
  const Q2 = Math.SQRT1_2;
  function highpass(x, fs, fc) { return filtfilt(biquad('hp', fc, fs, Q2), x, Math.round(fs * 2)); }
  function lowpass(x, fs, fc) { if (fc >= fs * 0.49) return Float64Array.from(x); return filtfilt(biquad('lp', fc, fs, Q2), x, Math.round(fs * 0.5)); }
  function notch(x, fs, f0, Q) { if (!f0 || f0 >= fs * 0.48) return Float64Array.from(x); return filtfilt(biquad('notch', f0, fs, Q || 20), x, Math.round(fs)); }
  // running median, O(n*w) with a sorted window
  function medfilt(x, w) {
    w = Math.max(3, w | 1); const h = w >> 1, n = x.length, y = new Float64Array(n), win = [];
    const ins = (v) => { let lo = 0, hi = win.length; while (lo < hi) { const m = (lo + hi) >> 1; if (win[m] < v) lo = m + 1; else hi = m; } win.splice(lo, 0, v); };
    const del = (v) => { let lo = 0, hi = win.length; while (lo < hi) { const m = (lo + hi) >> 1; if (win[m] < v) lo = m + 1; else hi = m; } win.splice(lo, 1); };
    const get = (i) => x[clamp(i, 0, n - 1)];
    for (let i = -h; i <= h; i++) ins(get(i));
    for (let i = 0; i < n; i++) { y[i] = win[win.length >> 1]; del(get(i - h)); ins(get(i + h + 1)); }
    return y;
  }
  function removeBaseline(x, fs, method) {
    if (method === 'median') { const b = medfilt(medfilt(x, Math.round(0.2 * fs)), Math.round(0.6 * fs)); return x.map((v, i) => v - b[i]); }
    if (method === 'none') { const m = median(x); return x.map((v) => v - m); }
    return highpass(x, fs, 0.5);
  }
  function preprocess(x, fs, o) {
    o = o || {};
    let y = Float64Array.from(x, (v) => (Number.isFinite(v) ? v : 0));
    y = removeBaseline(y, fs, o.baseline || 'hp');
    if (o.notch) { y = notch(y, fs, o.notch, 25); if (2 * o.notch < fs * 0.48) y = notch(y, fs, 2 * o.notch, 25); }
    y = lowpass(y, fs, Math.min(o.lp || 40, fs * 0.45));
    return y;
  }

  /* ------------------------------------------------------- Pan-Tompkins QRS */
  function panTompkins(x, fs) {
    const n = x.length;
    let bp = highpass(x, fs, 5); bp = lowpass(bp, fs, 15);
    const d = new Float64Array(n);
    for (let i = 2; i < n - 2; i++) d[i] = (2 * bp[i + 2] + bp[i + 1] - bp[i - 1] - 2 * bp[i - 2]) * fs / 8;
    const sq = d.map((v) => v * v);
    const W = Math.max(1, Math.round(0.15 * fs)), h = W >> 1, mwi = new Float64Array(n);
    let acc = 0; const cs = new Float64Array(n + 1); for (let i = 0; i < n; i++) { acc += sq[i]; cs[i + 1] = acc; }
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - h), b = Math.min(n, i + h + 1); mwi[i] = (cs[b] - cs[a]) / (b - a); }
    // candidate peaks: local maxima of MWI separated by >= 200 ms
    const ref = Math.round(0.2 * fs), cand = [];
    for (let i = 1; i < n - 1; i++) if (mwi[i] > mwi[i - 1] && mwi[i] >= mwi[i + 1]) {
      if (cand.length && i - cand[cand.length - 1] < ref) { if (mwi[i] > mwi[cand[cand.length - 1]]) cand[cand.length - 1] = i; } else cand.push(i);
    }
    const init = mwi.slice(0, Math.min(n, 2 * fs));
    let spki = 0.25 * Math.max(...init), npki = 0.5 * mean(init);
    const thr = () => npki + 0.25 * (spki - npki);
    const qrs = [], rrs = []; let lastSlope = 0;
    const slopeAt = (i) => { let m = 0; for (let k = Math.max(0, i - Math.round(0.075 * fs)); k < Math.min(n, i + Math.round(0.075 * fs)); k++) m = Math.max(m, Math.abs(d[k])); return m; };
    const rrAvg = () => (rrs.length ? mean(rrs.slice(-8)) : fs);
    let lastNoise = [];
    for (let ci = 0; ci < cand.length; ci++) {
      const i = cand[ci], v = mwi[i];
      const last = qrs.length ? qrs[qrs.length - 1] : -Infinity;
      // search-back for missed beats
      if (qrs.length && i - last > 1.66 * rrAvg()) {
        const t2 = 0.5 * thr();
        let best = -1;
        for (const j of lastNoise) if (j - last > ref && i - j > ref && mwi[j] > t2 && (best < 0 || mwi[j] > mwi[best])) best = j;
        if (best >= 0) { rrs.push(best - last); qrs.push(best); spki = 0.25 * mwi[best] + 0.75 * spki; lastSlope = slopeAt(best); }
        lastNoise = [];
      }
      const last2 = qrs.length ? qrs[qrs.length - 1] : -Infinity;
      if (v > thr() && i - last2 > ref) {
        const s = slopeAt(i);
        if (i - last2 < 0.36 * fs && s < 0.5 * lastSlope) { npki = 0.125 * v + 0.875 * npki; lastNoise.push(i); continue; } // T-wave
        if (qrs.length) rrs.push(i - last2);
        qrs.push(i); spki = 0.125 * v + 0.875 * spki; lastSlope = s; lastNoise = [];
      } else { npki = 0.125 * v + 0.875 * npki; lastNoise.push(i); }
    }
    return { qrs, mwi, bp };
  }

  // refine MWI locations to the dominant QRS peak on the filtered signal
  function refinePeaks(x, fs, locs) {
    const w = Math.round(0.09 * fs), out = [];
    for (const l of locs) {
      const a = Math.max(0, l - w), b = Math.min(x.length - 1, l + w);
      const base = median(x.subarray ? x.subarray(Math.max(0, l - Math.round(0.25 * fs)), Math.min(x.length, l + Math.round(0.25 * fs))) : x.slice(l - w, l + w));
      let bi = a, bv = -1;
      for (let i = a; i <= b; i++) { const v = Math.abs(x[i] - base); if (v > bv) { bv = v; bi = i; } }
      if (!out.length || bi - out[out.length - 1] > 0.2 * fs) out.push(bi);
      else if (Math.abs(x[bi]) > Math.abs(x[out[out.length - 1]])) out[out.length - 1] = bi;
    }
    return out;
  }

  /* ------------------------------------------------------------ delineation */
  function delineate(x, fs, rpk) {
    const n = x.length, ms = (m) => Math.round(m * fs / 1000);
    const xs = lowpass(x, fs, 18);                       // smoother copy for P/T
    const dx = new Float64Array(n); for (let i = 1; i < n - 1; i++) dx[i] = (x[i + 1] - x[i - 1]) * fs / 2;
    // slope envelope smoothed over ~10 ms
    const e = new Float64Array(n), k = Math.max(1, ms(5));
    { let s = 0; const c = new Float64Array(n + 1); for (let i = 0; i < n; i++) { s += Math.abs(dx[i]); c[i + 1] = s; } for (let i = 0; i < n; i++) { const a = Math.max(0, i - k), b = Math.min(n, i + k + 1); e[i] = (c[b] - c[a]) / (b - a); } }
    // noise floor of the slope envelope: low percentile (flat TP/PR segments), not the median (which includes P/T slopes)
    const noiseSlope = pct(e, 15);
    const beats = [];
    for (let bi = 0; bi < rpk.length; bi++) {
      const r = rpk[bi], prevR = bi ? rpk[bi - 1] : -Infinity, nextR = bi < rpk.length - 1 ? rpk[bi + 1] : Infinity;
      const rrPrev = Number.isFinite(prevR) ? (r - prevR) / fs : NaN, rrNext = Number.isFinite(nextR) ? (nextR - r) / fs : NaN;
      const b = { r, rAmp: x[r], rr: rrPrev, rrNext };
      // --- QRS onset / offset from slope envelope
      const lo = Math.max(1, r - ms(160), Number.isFinite(prevR) ? Math.round((prevR + r) / 2) : 1);
      const hi = Math.min(n - 2, r + ms(200), Number.isFinite(nextR) ? Math.round((nextR + r) / 2) : n - 2);
      let emax = 0; for (let i = Math.max(lo, r - ms(100)); i <= Math.min(hi, r + ms(100)); i++) emax = Math.max(emax, e[i]);
      const th = Math.max(0.05 * emax, 4 * noiseSlope);
      const sus = Math.max(2, ms(8));
      // start from the steepest point on each side of R
      let iL = r, mL = 0; for (let i = r; i >= Math.max(lo, r - ms(90)); i--) if (e[i] > mL) { mL = e[i]; iL = i; }
      let iR = r, mR = 0; for (let i = r; i <= Math.min(hi, r + ms(110)); i++) if (e[i] > mR) { mR = e[i]; iR = i; }
      let on = NaN, off = NaN;
      for (let i = iL, c = 0; i >= lo; i--) { if (e[i] < th) { if (++c >= sus) { on = i + c - 1; break; } } else c = 0; }
      for (let i = iR, c = 0; i <= hi; i++) { if (e[i] < th) { if (++c >= sus) { off = i - c + 1; break; } } else c = 0; }
      b.qrsOn = on; b.qrsOff = off;
      // --- isoelectric level: median of the P-R window
      const prevT = beats.length && Number.isFinite(beats[beats.length - 1].tEnd) ? beats[beats.length - 1].tEnd : -Infinity;
      const qOn = Number.isFinite(on) ? on : r - ms(50);
      const pwA = Math.max(0, qOn - ms(330), Number.isFinite(prevT) ? prevT + ms(20) : 0, Number.isFinite(prevR) ? prevR + ms(220) : 0);
      const pwB = qOn - ms(15);
      let iso = NaN;
      if (pwB - pwA > ms(40)) iso = median(xs.slice(pwA, qOn));
      else iso = median(xs.slice(Math.max(0, qOn - ms(40)), qOn));
      if (!Number.isFinite(iso)) iso = 0;
      b.iso = iso;
      // --- P wave
      b.pPresent = false;
      if (pwB - pwA > ms(40)) {
        let pi = -1, pv = 0;
        for (let i = pwA; i <= pwB; i++) { const v = xs[i] - iso; if (Math.abs(v) > Math.abs(pv)) { pv = v; pi = i; } }
        // must be a local extremum (not the edge of the window / QRS upstroke)
        if (pi > pwA + ms(10) && pi < pwB - ms(5)) {
          const amp = Math.abs(pv), thr = 0.1 * amp;
          let pOn = NaN, pOff = NaN;
          for (let i = pi; i >= Math.max(0, pi - ms(120)); i--) if (Math.abs(xs[i] - iso) < thr || Math.sign(xs[i] - iso) !== Math.sign(pv)) { pOn = i; break; }
          for (let i = pi; i <= Math.min(qOn, pi + ms(120)); i++) if (Math.abs(xs[i] - iso) < thr || Math.sign(xs[i] - iso) !== Math.sign(pv)) { pOff = i; break; }
          const dur = (pOff - pOn) / fs * 1000;
          b.pPeak = pi; b.pAmp = pv; b.pOn = pOn; b.pOff = pOff;
          b.pPresent = Number.isFinite(pOn) && Number.isFinite(pOff) && amp >= 0.04 && amp < 0.6 * Math.abs(x[r] - iso) && dur >= 40 && dur <= 180;
        }
      }
      // --- T wave
      const qOff = Number.isFinite(off) ? off : r + ms(60);
      const rrT = Number.isFinite(rrNext) ? rrNext : rrPrev;
      const twA = qOff + ms(60);
      let twB = Math.min(n - 2, (Number.isFinite(on) ? on : r) + Math.round(Math.min(0.68, 0.72 * (Number.isFinite(rrT) ? rrT : 1)) * fs));
      if (Number.isFinite(nextR)) twB = Math.min(twB, nextR - ms(130));
      if (twB - twA > ms(60)) {
        let ti = -1, tv = 0;
        for (let i = twA; i <= twB; i++) { const v = xs[i] - iso; if (Math.abs(v) > Math.abs(tv)) { tv = v; ti = i; } }
        if (ti > twA && ti < twB && Math.abs(tv) >= 0.05) {
          b.tPeak = ti; b.tAmp = tv;
          // tangent method: steepest descent after the peak, intersect isoelectric line
          let mi = -1, mv = 0;
          for (let i = ti + 1; i <= Math.min(twB + ms(120), n - 2); i++) {
            const s = (xs[i + 1] - xs[i - 1]) * fs / 2, toward = -Math.sign(tv) * s;
            if (toward > mv) { mv = toward; mi = i; }
            if (Math.abs(xs[i] - iso) < 0.05 * Math.abs(tv)) break;
          }
          if (mi > 0 && mv > 0) {
            const slope = (xs[mi + 1] - xs[mi - 1]) * fs / 2;
            const te = mi + (iso - xs[mi]) / slope * fs;
            if (te > ti && te < n) b.tEnd = Math.round(te);
          }
        }
      }
      beats.push(b);
    }
    return { beats, xs };
  }

  /* ------------------------------------------------------ beat classification */
  function corr(a, b) { const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < a.length; i++) { const u = a[i] - ma, v = b[i] - mb; s += u * v; sa += u * u; sb += v * v; } return sa && sb ? s / Math.sqrt(sa * sb) : 0; }
  function classify(x, fs, beats) {
    const w = Math.round(0.1 * fs);
    const seg = (r) => { const s = new Float64Array(2 * w + 1); for (let i = -w; i <= w; i++) s[i + w] = x[clamp(r + i, 0, x.length - 1)]; return s; };
    const segs = beats.map((b) => seg(b.r));
    // median template
    const tpl = new Float64Array(2 * w + 1);
    for (let i = 0; i < tpl.length; i++) tpl[i] = median(segs.map((s) => s[i]));
    beats.forEach((b, i) => { b.corr = corr(segs[i], tpl); b.qrsMs = Number.isFinite(b.qrsOn) && Number.isFinite(b.qrsOff) ? (b.qrsOff - b.qrsOn) / fs * 1000 : NaN; });
    const medW = median(beats.map((b) => b.qrsMs));
    const medRR = median(beats.map((b) => b.rr));
    beats.forEach((b, i) => {
      b.type = 'N';
      const local = median(beats.slice(Math.max(1, i - 4), i + 5).map((q) => q.rr).filter((v) => v > 0.25)) || medRR;
      const premature = Number.isFinite(b.rr) && b.rr < 0.85 * local;
      const comp = Number.isFinite(b.rrNext) && b.rrNext > 1.1 * local;
      const wide = b.qrsMs >= 120 && b.qrsMs > medW + 25;
      const odd = b.corr < 0.75;
      b.premature = premature;
      if ((premature || comp) && (wide || odd) && !b.pPresent) b.type = 'V';
      else if (wide && b.corr < 0.8) b.type = 'V';                      // wider than the dominant beat and different shape
      else if (premature && !wide && !odd) b.type = 'S';
    });
    return { template: tpl, medW };
  }

  /* --------------------------------------------------------------- analysis */
  function chooseLead(rec) {
    const names = Object.keys(rec.leads);
    const pref = ['II', 'MLII', 'ii', 'Lead II', 'ECG II', 'ECG'];
    for (const p of pref) if (names.includes(p)) return p;
    // best QRS-to-noise ratio
    let best = names[0], bs = -1;
    for (const nm of names) {
      const y = preprocess(rec.leads[nm], rec.fs, { notch: 60 });
      const s = (pct(y, 99.5) - pct(y, 0.5)) / (mad(y.map((v, i) => (i ? v - y[i - 1] : 0))) + 1e-6);
      if (s > bs) { bs = s; best = nm; }
    }
    return best;
  }

  function analyze(rec, opts) {
    opts = Object.assign({ notch: 60, baseline: 'hp', lp: 40, sex: 'u', lead: null }, opts || {});
    const fs = rec.fs, names = Object.keys(rec.leads);
    const lead = opts.lead && rec.leads[opts.lead] ? opts.lead : chooseLead(rec);
    const filtered = {};
    for (const nm of names) filtered[nm] = preprocess(rec.leads[nm], fs, opts);
    const x = filtered[lead], n = x.length, dur = n / fs;
    const res = { version: VERSION, fs, lead, leads: names, duration: dur, filtered, opts, beats: [], findings: [], measures: {}, quality: {} };
    if (dur < 2.5) { res.findings.push(F('crit', 'Recording too short for analysis (< 2.5 s).', 'n/a')); res.rhythm = { code: 'insufficient', label: 'Insufficient data' }; res.quality = { score: 0, grade: 'Poor', notes: ['too short'] }; return res; }
    const pt = panTompkins(x, fs);
    const rpk = refinePeaks(x, fs, pt.qrs);
    const del = delineate(x, fs, rpk);
    const beats = del.beats;
    res.beats = beats; res.smooth = del.xs;
    if (beats.length < 3) { res.findings.push(F('crit', 'Fewer than 3 QRS complexes detected – cannot interpret. Check lead, units and sampling rate.', 'n/a')); res.rhythm = { code: 'insufficient', label: 'Insufficient beats detected' }; res.quality = qualityOf(rec, res, x, fs, null); return res; }
    // global (multi-lead) QRS boundaries: earliest onset / latest offset across leads, robust to outliers
    if (opts.globalQRS !== false && names.length > 1) {
      const others = names.filter((nm) => nm !== lead).map((nm) => delineate(filtered[nm], fs, rpk).beats);
      const tol = Math.round(0.04 * fs);
      beats.forEach((b, i) => {
        b.qrsOnLead = b.qrsOn; b.qrsOffLead = b.qrsOff;
        if (!Number.isFinite(b.qrsOn) || !Number.isFinite(b.qrsOff)) return;
        for (const ob of others) {
          const o = ob[i]; if (!o) continue;
          if (Number.isFinite(o.qrsOn) && o.qrsOn < b.qrsOn && b.qrsOnLead - o.qrsOn <= tol) b.qrsOn = o.qrsOn;
          if (Number.isFinite(o.qrsOff) && o.qrsOff > b.qrsOff && o.qrsOff - b.qrsOffLead <= tol) b.qrsOff = o.qrsOff;
        }
      });
      res.globalQRS = true;
    }
    const cls = classify(x, fs, beats);
    beats.forEach((b) => {
      b.prMs = b.pPresent && Number.isFinite(b.qrsOn) ? (b.qrsOn - b.pOn) / fs * 1000 : NaN;
      b.qtMs = Number.isFinite(b.tEnd) && Number.isFinite(b.qrsOn) ? (b.tEnd - b.qrsOn) / fs * 1000 : NaN;
      const rr = Number.isFinite(b.rr) ? b.rr : b.rrNext;
      b.qtcB = b.qtMs / Math.sqrt(rr); b.qtcF = b.qtMs / Math.cbrt(rr);
    });
    // ---- RR statistics
    const rrAll = beats.slice(1).map((b) => b.rr);
    const nn = [];
    for (let i = 1; i < beats.length; i++) if (beats[i].type === 'N' && beats[i - 1].type === 'N') nn.push(beats[i].rr);
    const rrUse = nn.length >= 3 ? nn : rrAll;
    const mRR = median(rrUse);
    const hr = 60 / mRR;
    const diffs = []; for (let i = 1; i < rrAll.length; i++) diffs.push(rrAll[i] - rrAll[i - 1]);
    const rmssd = Math.sqrt(mean(diffs.map((d) => d * d)));
    const nnd = []; for (let i = 1; i < nn.length; i++) nnd.push(nn[i] - nn[i - 1]);
    const meanRR = mean(rrAll);
    const m = res.measures;
    m.hr = hr; m.hrMean = 60 / meanRR; m.rrMean = meanRR * 1000; m.rrMin = Math.min(...rrAll) * 1000; m.rrMax = Math.max(...rrAll) * 1000;
    m.sdnn = sd(rrUse) * 1000; m.rmssd = rmssd * 1000; m.cvRR = sd(rrAll) / meanRR; m.nRMSSD = rmssd / meanRR;
    m.pnn50 = diffs.length ? diffs.filter((d) => Math.abs(d) > 0.05).length / diffs.length : NaN;
    m.fracIrreg = diffs.length ? diffs.filter((d) => Math.abs(d) > 0.08 * meanRR).length / diffs.length : 0;
    m.nBeats = beats.length; m.nV = beats.filter((b) => b.type === 'V').length; m.nS = beats.filter((b) => b.type === 'S').length;
    // ---- intervals (median of normal beats)
    const N = beats.filter((b) => b.type === 'N');
    const nb = N.length >= 2 ? N : beats;
    const pFrac = nb.filter((b) => b.pPresent).length / nb.length;
    const prs = nb.map((b) => b.prMs).filter(Number.isFinite);
    m.pFrac = pFrac; m.prSD = sd(prs);
    const pPos = nb.filter((b) => b.pPresent && b.pAmp > 0).length, pNeg = nb.filter((b) => b.pPresent && b.pAmp < 0).length;
    m.pPolarity = pPos >= pNeg ? 1 : -1;
    const consistentP = pFrac >= 0.7 && prs.length >= 2 && (m.prSD <= 30 || !Number.isFinite(m.prSD)) && Math.max(pPos, pNeg) >= 0.8 * (pPos + pNeg);
    m.consistentP = consistentP;
    m.pr = consistentP ? median(prs) : NaN;
    m.qrs = median(nb.map((b) => b.qrsMs));
    m.qt = median(nb.map((b) => b.qtMs));
    m.qtcB = m.qt / Math.sqrt(mRR); m.qtcF = m.qt / Math.cbrt(mRR);
    m.pDur = consistentP ? median(nb.filter((b) => b.pPresent).map((b) => (b.pOff - b.pOn) / fs * 1000)) : NaN;
    m.rAmp = median(nb.map((b) => b.rAmp));
    // ---- ST deviation at J+60 per lead (screening only)
    const j60 = Math.round(0.06 * fs);
    res.st = names.map((nm) => {
      const y = filtered[nm];
      const v = nb.filter((b) => Number.isFinite(b.qrsOn) && Number.isFinite(b.qrsOff)).map((b) => {
        const iso = median(y.slice(Math.max(0, b.qrsOn - Math.round(0.03 * fs)), Math.max(1, b.qrsOn - Math.round(0.005 * fs))));
        const j = b.qrsOff + j60; return j < y.length ? y[j] - iso : NaN;
      });
      const st = median(v);
      return { lead: nm, st, flag: st >= 0.1 ? 'elevation ≥1 mm' : st <= -0.05 ? 'depression ≥0.5 mm' : '' };
    });
    // ---- quality
    res.quality = qualityOf(rec, res, x, fs, cls);
    // ---- interpretation
    interpret(res, opts);
    return res;
  }

  function F(sev, text, conf, code) { return { sev, text, conf, code: code || '' }; }

  function qualityOf(rec, res, x, fs, cls) {
    const notes = [];
    const xs = lowpass(x, fs, 15);
    const hf = mad(x.map((v, i) => v - xs[i])) * 1.4826;
    const beats = res.beats || [];
    const ramp = beats.length ? median(beats.map((b) => Math.abs(b.rAmp - (b.iso || 0)))) : pct(x.map(Math.abs), 99);
    const snr = ramp / (hf + 1e-4);
    let score = 100;
    const p2p = pct(x, 99.5) - pct(x, 0.5);
    if (p2p < 0.05) { score -= 60; notes.push('flat line / no signal'); }
    else if (snr < 8) { score -= 30; notes.push('high-frequency noise / EMG'); } else if (snr < 20) { score -= 12; notes.push('some noise'); }
    if (beats.length >= 3) {
      const mc = mean(beats.filter((b) => b.type === 'N').map((b) => b.corr));
      if (mc < 0.8) { score -= 25; notes.push('inconsistent QRS morphology'); } else if (mc < 0.9) { score -= 10; }
      const comp = beats.filter((b) => Number.isFinite(b.qrsOn) && Number.isFinite(b.qrsOff) && Number.isFinite(b.tEnd)).length / beats.length;
      if (comp < 0.6) { score -= 20; notes.push('incomplete delineation'); } else if (comp < 0.85) score -= 8;
      const hr = 60 / median(beats.slice(1).map((b) => b.rr));
      if (hr < 25 || hr > 250) { score -= 30; notes.push('implausible rate – check sampling rate'); }
    } else { score -= 60; notes.push('too few beats'); }
    // raw baseline wander and clipping
    const raw = rec.leads[res.lead];
    const lowf = lowpass(Float64Array.from(raw), fs, 0.7);
    const wander = pct(lowf, 98) - pct(lowf, 2);
    if (wander > 1.0) { score -= 10; notes.push('marked baseline wander (filtered)'); }
    let flat = 0, mx = -Infinity, mn = Infinity; for (const v of raw) { if (v > mx) mx = v; if (v < mn) mn = v; }
    for (const v of raw) if (v === mx || v === mn) flat++;
    if (flat / raw.length > 0.01) { score -= 20; notes.push('possible clipping/saturation'); }
    if (res.duration < 8) { score -= 10; notes.push('short recording (<8 s)'); }
    score = clamp(Math.round(score), 0, 100);
    return { score, grade: score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Poor', snr, notes };
  }

  function interpret(res, opts) {
    const m = res.measures, f = res.findings, beats = res.beats, q = res.quality.score;
    if (q < 40) {
      res.rhythm = { code: 'poor_quality', label: 'Uninterpretable – signal quality too poor for an automated read' };
      f.push(F('crit', 'Signal quality poor (' + q + '/100: ' + res.quality.notes.join(', ') + '). Rhythm rules suppressed; measurements shown are unreliable. Re-acquire the ECG or read manually.', 'n/a', 'quality'));
      return;
    }
    const conf = (base) => { const c = Math.round(clamp(base * (0.4 + 0.6 * q / 100), 5, 99)); return c >= 75 ? 'high' : c >= 50 ? 'moderate' : 'low'; };
    const hr = m.hr, ectFrac = (m.nV + m.nS) / m.nBeats;
    const irregular = m.nRMSSD > 0.1 && m.fracIrreg >= 0.5 && m.cvRR > 0.08 && beats.length >= 6;
    const wide = m.qrs >= 120;
    let rhythm;
    const rate = (h) => (h < 60 ? 'brady' : h > 100 ? 'tachy' : '');
    const isAF = irregular && !m.consistentP && m.nV / m.nBeats < 0.25;
    if (isAF) { beats.forEach((b) => { if (b.type === 'S') b.type = 'N'; }); m.nS = 0; }   // 'premature' is meaningless in AF
    if (isAF) {
      rhythm = { code: 'af', label: 'Irregularly irregular rhythm without consistent P waves – possible atrial fibrillation' + (m.hrMean > 110 ? ' with rapid ventricular response' : m.hrMean < 60 ? ' with slow ventricular response' : '') };
      f.push(F('crit', `Possible atrial fibrillation: irregularly irregular RR (nRMSSD ${m.nRMSSD.toFixed(2)}, CV ${m.cvRR.toFixed(2)}) and no consistent P waves (P-like deflections before ${Math.round(m.pFrac * 100)}% of beats but with unstable PR${Number.isFinite(m.prSD) ? ', SD ' + Math.round(m.prSD) + ' ms' : ''} – likely f-waves/noise). Consider flutter/MAT/frequent ectopy as differentials.`, conf(80), 'af'));
    } else if (m.consistentP) {
      const r = rate(hr);
      rhythm = r === 'brady' ? { code: 'sinus_brady', label: 'Sinus bradycardia' } : r === 'tachy' ? { code: 'sinus_tachy', label: 'Sinus tachycardia' } : { code: 'sinus', label: 'Normal sinus rhythm' };
      if (irregular && ectFrac < 0.2) { rhythm.label = rhythm.label.replace('Normal sinus rhythm', 'Sinus rhythm') + ' with marked RR irregularity (sinus arrhythmia / ectopy?)'; f.push(F('info', 'RR irregularity with consistent P waves – sinus arrhythmia or ectopy; AF unlikely on this criterion.', conf(60), 'irregular_sinus')); }
      if (m.pPolarity < 0 && /^(ML)?II$/.test(res.lead)) f.push(F('warn', `P waves appear inverted in lead ${res.lead}: consider ectopic atrial/junctional rhythm or lead reversal.`, conf(55), 'p_inverted'));
      f.push(F(r ? 'warn' : 'ok', `${rhythm.label}, rate ${Math.round(hr)} bpm. P waves before ${Math.round(m.pFrac * 100)}% of QRS complexes with stable PR (SD ${Number.isFinite(m.prSD) ? Math.round(m.prSD) : '–'} ms).`, conf(85), rhythm.code));
    } else {
      rhythm = wide ? { code: 'wide_noP', label: 'Regular wide-complex rhythm without clear P waves' } : { code: 'narrow_noP', label: 'Regular narrow-complex rhythm without clear P waves' };
      if (irregular) rhythm.label = rhythm.label.replace('Regular', 'Irregular');
      f.push(F(wide && hr > 100 ? 'crit' : 'warn', rhythm.label + `, rate ${Math.round(hr)} bpm. ` + (wide ? (hr > 100 ? 'Treat as VT until proven otherwise; urgent clinician review.' : 'Consider idioventricular / junctional with BBB / hyperkalaemia.') : (hr > 100 ? 'Consider SVT/atrial flutter.' : 'Consider junctional rhythm; P waves may be hidden or low amplitude in this lead.')), conf(55), rhythm.code));
    }
    if (m.nV || m.nS) rhythm.label += m.nV && m.nS ? ' with PVC-like and premature narrow beats' : m.nV ? ' with PVC-like ectopic beats' : ' with premature narrow beat' + (m.nS > 1 ? 's' : '');
    res.rhythm = rhythm;
    // pauses
    const pauses = beats.filter((b) => b.rr >= 2.0);
    if (pauses.length) f.push(F(pauses.some((b) => b.rr >= 3) ? 'crit' : 'warn', `Pause${pauses.length > 1 ? 's' : ''}: ${pauses.map((b) => b.rr.toFixed(2) + ' s at ' + (b.r / res.fs).toFixed(1) + ' s').join(', ')} (RR ≥ 2.0 s). Consider sinus arrest/exit block or blocked PAC/AV block.`, conf(90), 'pause'));
    // ectopy
    if (m.nV) {
      const ix = beats.map((b, i) => (b.type === 'V' ? i : -1)).filter((i) => i >= 0);
      let pattern = '';
      if (m.nV >= 3) { const g = ix.slice(1).map((v, i) => v - ix[i]); if (g.every((v) => v === 2)) pattern = ' (bigeminal pattern)'; else if (g.every((v) => v === 3)) pattern = ' (trigeminal pattern)'; else if (g.some((v) => v === 1)) pattern = ' (couplets present)'; }
      f.push(F('warn', `${m.nV} wide/premature ectopic beat${m.nV > 1 ? 's' : ''} – PVC-like${pattern} (${(m.nV / res.duration * 60).toFixed(0)}/min).`, conf(70), 'pvc'));
    }
    if (m.nS && rhythm.code !== 'af') f.push(F('info', `${m.nS} premature narrow beat${m.nS > 1 ? 's' : ''} – possible PAC/PJC.`, conf(55), 'pac'));
    // intervals
    if (m.consistentP && Number.isFinite(m.pr)) {
      if (m.pr > 200) f.push(F('warn', `PR ${Math.round(m.pr)} ms (> 200 ms): first-degree AV block.`, conf(80), 'avb1'));
      else if (m.pr < 120) f.push(F('warn', `Short PR ${Math.round(m.pr)} ms (< 120 ms): consider pre-excitation (look for delta wave) or junctional/low atrial rhythm.`, conf(70), 'short_pr'));
    }
    if (Number.isFinite(m.qrs)) {
      if (m.qrs >= 120) f.push(F('warn', `Wide QRS ${Math.round(m.qrs)} ms (≥ 120 ms): bundle branch block, IVCD, ventricular rhythm, pre-excitation, hyperkalaemia or Na-channel blockade. Correlate with 12-lead.`, conf(80), 'wide_qrs'));
      else if (m.qrs >= 110) f.push(F('info', `QRS ${Math.round(m.qrs)} ms (110–119 ms): borderline / incomplete conduction delay.`, conf(55), 'qrs_borderline'));
    }
    if (Number.isFinite(m.qtcB)) {
      const lim = opts.sex === 'm' ? 450 : opts.sex === 'f' ? 470 : 460;
      const useF = hr > 90 || hr < 50; const qc = useF ? m.qtcF : m.qtcB;
      if (qc >= 500) f.push(F('crit', `Markedly prolonged QTc: Bazett ${Math.round(m.qtcB)} ms, Fridericia ${Math.round(m.qtcF)} ms (≥ 500 ms) – torsades risk; review drugs/electrolytes.`, conf(70), 'long_qtc'));
      else if (qc > lim) f.push(F('warn', `Prolonged QTc: Bazett ${Math.round(m.qtcB)} ms, Fridericia ${Math.round(m.qtcF)} ms (limit ${lim} ms${opts.sex === 'u' ? ', sex unspecified' : ''}).`, conf(65), 'long_qtc'));
      else if (qc < 340) f.push(F('info', `Short QTc (${Math.round(qc)} ms).`, conf(50), 'short_qtc'));
      if (wide) f.push(F('info', 'QT/QTc is overestimated when QRS is wide (consider JT interval).', 'n/a', 'qt_wide_note'));
      if (isAF) f.push(F('info', 'QTc in AF is approximate (computed from median RR); average several beats manually.', 'n/a', 'qtc_af_note'));
      if (useF) f.push(F('info', `Heart rate ${Math.round(hr)} bpm: Fridericia preferred (Bazett over/under-corrects at extremes).`, 'n/a', 'qtc_note'));
    }
    if (res.quality.grade === 'Poor') f.push(F('warn', 'Signal quality poor – automated measurements unreliable: ' + res.quality.notes.join(', ') + '.', 'n/a', 'quality'));
    const order = { crit: 0, warn: 1, info: 2, ok: 3 };
    f.sort((a, b) => order[a.sev] - order[b.sev]);
  }

  /* ---------------------------------------------------------------- parsing */
  function guessUnits(arr) {
    const p2p = pct(arr, 99.5) - pct(arr, 0.5), md = Math.abs(median(arr));
    if (md > 200 && p2p < 0.3 * md) return 'adc';     // offset ADC counts
    if (p2p < 20) return 'mV';
    if (p2p < 20000) return 'uV';
    return 'adc';
  }
  function scaleLead(arr, units, gain) {
    if (units === 'auto') units = guessUnits(arr);
    if (units === 'uV') return { data: Float64Array.from(arr, (v) => v / 1000), units };
    if (units === 'V') return { data: Float64Array.from(arr, (v) => v * 1000), units };
    if (units === 'adc') { const m = median(arr), g = gain || 200; return { data: Float64Array.from(arr, (v) => (v - m) / g), units: 'adc/' + g }; }
    return { data: Float64Array.from(arr), units: 'mV' };
  }
  function finalize(leads, fs, opts, info) {
    opts = opts || {}; const out = {}; const unitsUsed = {};
    for (const [k, v] of Object.entries(leads)) { const s = scaleLead(v, opts.units || 'auto', opts.gain); out[k] = s.data; unitsUsed[k] = s.units; }
    let fsU = Number(opts.fs) > 0 ? Number(opts.fs) : fs;
    const notes = (info && info.notes) || [];
    if (!(fsU > 0)) { fsU = 250; notes.push('Sampling rate unknown – assumed 250 Hz. Set it manually if timing looks wrong.'); }
    if (opts.maxSec) { const lim = Math.round(opts.maxSec * fsU); for (const k in out) if (out[k].length > lim) { out[k] = out[k].slice(0, lim); } }
    return { fs: fsU, leads: out, info: Object.assign({}, info, { units: unitsUsed, notes }) };
  }
  function parseText(text, opts) {
    opts = opts || {};
    const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter((l) => l && !/^[#%;]/.test(l));
    if (!lines.length) throw new Error('No data found.');
    const sample = lines.slice(0, 20).join('\n');
    const delim = /\t/.test(sample) ? /\t/ : /;/.test(sample) && !/,\d/.test(sample.replace(/;/g, '')) ? /;/ : /,/.test(sample) ? /,/ : /\s+/;
    let rows = lines.map((l) => l.split(delim).map((s) => s.trim().replace(/^"|"$/g, '')));
    // single line of comma/space separated numbers => single lead
    if (rows.length === 1 && rows[0].length > 10) rows = rows[0].map((v) => [v]);
    const isNum = (s) => s !== '' && Number.isFinite(Number(s));
    let header = null;
    let start = 0;
    while (start < Math.min(rows.length, 5) && !rows[start].every(isNum)) { if (!header && rows[start].some((s) => /[a-z]/i.test(s))) header = rows[start]; start++; }
    rows = rows.slice(start).filter((r) => r.length && r.some(isNum));
    const nc = Math.max(...rows.slice(0, 50).map((r) => r.length));
    const cols = Array.from({ length: nc }, (_, c) => rows.map((r) => Number(r[c])));
    let names = header && header.length >= nc ? header.slice(0, nc) : Array.from({ length: nc }, (_, i) => (nc === 1 ? 'Lead' : 'Ch' + (i + 1)));
    let fs = NaN, timeCol = -1; const notes = [];
    // detect time column
    for (let c = 0; c < nc && timeCol < 0; c++) {
      const nm = (names[c] || '').toLowerCase(), v = cols[c];
      const d = []; for (let i = 1; i < Math.min(v.length, 400); i++) d.push(v[i] - v[i - 1]);
      const md = median(d), mono = d.every((x) => x > 0), steady = d.length > 5 && mono && sd(d) < 0.05 * md + 1e-9;
      const named = /^(time|t|sec|secs|seconds|s|ms|msec|elapsed|timestamp|time_s|time_ms|time \(s\)|time \(ms\)|sample|samples|index|idx|n)\b/.test(nm) || /time/.test(nm);
      if ((named && mono) || (c === 0 && steady && nc > 1)) {
        timeCol = c;
        const isMs = /ms|msec|milli/.test(nm), isIdx = /sample|index|idx|^n$/.test(nm) || (Number.isInteger(md) && md === 1 && !/time|sec/.test(nm));
        if (isIdx) notes.push('First column looks like a sample index (not time).');
        else if (isMs) fs = 1000 / md;
        else if (md < 0.1 || /sec|_s|\(s\)/.test(nm)) fs = 1 / md;
        else if (md >= 1 && md <= 20) { fs = 1000 / md; notes.push('Time column assumed to be in milliseconds.'); }
        else fs = 1 / md;
        fs = Math.round(fs * 100) / 100;
      }
    }
    const leads = {};
    for (let c = 0; c < nc; c++) if (c !== timeCol) { let nm = names[c] || 'Ch' + (c + 1); while (leads[nm]) nm += "'"; leads[nm] = cols[c].map((v) => (Number.isFinite(v) ? v : 0)); }
    if (!Object.keys(leads).length) throw new Error('No signal columns found.');
    return finalize(leads, fs, opts, { format: 'text', timeColumn: timeCol >= 0 ? names[timeCol] : null, fsDetected: Number.isFinite(fs) ? fs : null, notes });
  }
  function parseJSON(obj, opts) {
    if (typeof obj === 'string') obj = JSON.parse(obj);
    opts = Object.assign({}, opts);
    let fs = obj && (obj.fs || obj.sampling_rate || obj.samplingRate || obj.sample_rate || obj.frequency || obj.hz);
    if (!opts.units || opts.units === 'auto') { const u = obj && (obj.units || obj.unit); if (u) opts.units = /µ|u/i.test(u) ? 'uV' : /^mv$/i.test(u) ? 'mV' : /^v$/i.test(u) ? 'V' : 'auto'; }
    let leads = {};
    if (Array.isArray(obj)) {
      if (typeof obj[0] === 'number') leads.Lead = obj;
      else if (Array.isArray(obj[0])) { // rows or columns
        if (obj.length < obj[0].length) obj.forEach((c, i) => (leads['Ch' + (i + 1)] = c)); else obj[0].forEach((_, c) => (leads['Ch' + (c + 1)] = obj.map((r) => r[c])));
      }
    } else {
      const L = obj.leads || obj.signals || obj.data || obj.ecg || obj.samples || obj.signal;
      const nm = obj.lead_names || obj.leadNames || obj.sig_name || obj.channels;
      if (Array.isArray(L) && typeof L[0] === 'number') leads[(nm && nm[0]) || obj.lead || 'Lead'] = L;
      else if (Array.isArray(L) && Array.isArray(L[0])) {
        const colMajor = nm ? L.length === nm.length : L.length < L[0].length;
        if (colMajor) L.forEach((c, i) => (leads[(nm && nm[i]) || 'Ch' + (i + 1)] = c)); else L[0].forEach((_, c) => (leads[(nm && nm[c]) || 'Ch' + (c + 1)] = L.map((r) => r[c])));
      } else if (L && typeof L === 'object') { for (const [k, v] of Object.entries(L)) if (Array.isArray(v)) leads[k] = v; }
      else for (const [k, v] of Object.entries(obj)) if (Array.isArray(v) && typeof v[0] === 'number' && v.length > 50) leads[k] = v;
      if (!fs && Array.isArray(obj.time || obj.t)) { const t = obj.time || obj.t; fs = 1 / median(t.slice(1, 200).map((v, i) => v - t[i])); }
    }
    if (!Object.keys(leads).length) throw new Error('JSON: could not find signal arrays (expected {fs, leads:{II:[...]}} or similar).');
    return finalize(leads, Number(fs), opts, { format: 'json', fsDetected: fs || null });
  }

  /* ------------------------------------------------------------------- WFDB */
  function parseHea(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    const rl = lines[0].trim().split(/\s+/);
    if (rl[0].includes('/')) throw new Error('Multi-segment WFDB records are not supported.');
    const nsig = parseInt(rl[1], 10); const fs = parseFloat((rl[2] || '250').split('/')[0]); const nsamp = rl[3] ? parseInt(rl[3], 10) : 0;
    const sigs = [];
    for (let i = 0; i < nsig; i++) {
      const t = lines[1 + i].trim().split(/\s+/);
      const fm = t[1].match(/^(\d+)(?:x(\d+))?(?::(\d+))?(?:\+(\d+))?/);
      const gm = (t[2] || '').match(/^([-\d.eE+]+)?(?:\(([-\d]+)\))?(?:\/(\S+))?/) || [];
      const gain = gm[1] && parseFloat(gm[1]) !== 0 ? parseFloat(gm[1]) : 200;
      const adczero = t[4] !== undefined ? parseInt(t[4], 10) : 0;
      const baseline = gm[2] !== undefined ? parseInt(gm[2], 10) : adczero;
      sigs.push({ file: t[0], fmt: parseInt(fm[1], 10), samplesPerFrame: fm[2] ? parseInt(fm[2], 10) : 1, offset: fm[4] ? parseInt(fm[4], 10) : 0, gain, baseline, units: gm[3] || 'mV', desc: t.slice(8).join(' ') || 'sig' + i });
    }
    return { name: rl[0], nsig, fs, nsamp, sigs };
  }
  function parseWFDB(heaText, files, opts) {
    opts = opts || {};
    const h = parseHea(heaText);
    const groups = {}; h.sigs.forEach((s, i) => { (groups[s.file] = groups[s.file] || []).push(i); });
    const leads = {}; const maxN = opts.maxSec ? Math.round(opts.maxSec * h.fs) : Infinity;
    for (const [file, idx] of Object.entries(groups)) {
      const buf = files[file] || files[file.split('/').pop()];
      if (!buf) throw new Error('Missing WFDB data file: ' + file);
      const fmt = h.sigs[idx[0]].fmt, ns = idx.length;
      if (idx.some((i) => h.sigs[i].fmt !== fmt)) throw new Error('Mixed formats in one .dat not supported');
      if (idx.some((i) => h.sigs[i].samplesPerFrame !== 1)) throw new Error('Multi-frequency WFDB records not supported');
      const u8 = new Uint8Array(buf, h.sigs[idx[0]].offset || 0);
      let total;
      if (fmt === 16 || fmt === 61) total = Math.floor(u8.length / 2 / ns);
      else if (fmt === 212) total = Math.floor(u8.length * 2 / 3 / ns);
      else if (fmt === 80) total = Math.floor(u8.length / ns);
      else throw new Error('WFDB format ' + fmt + ' not supported (supported: 16, 61, 80, 212).');
      if (h.nsamp) total = Math.min(total, h.nsamp);
      total = Math.min(total, maxN);
      const out = idx.map(() => new Float64Array(total));
      const getS = (k) => { // k-th sample in interleaved stream
        if (fmt === 16) { const v = u8[2 * k] | (u8[2 * k + 1] << 8); return v > 32767 ? v - 65536 : v; }
        if (fmt === 61) { const v = (u8[2 * k] << 8) | u8[2 * k + 1]; return v > 32767 ? v - 65536 : v; }
        if (fmt === 80) return u8[k] - 128;
        const p = (k >> 1) * 3; let v;
        if (k % 2 === 0) v = u8[p] | ((u8[p + 1] & 0x0f) << 8); else v = u8[p + 2] | ((u8[p + 1] & 0xf0) << 4);
        return v > 2047 ? v - 4096 : v;
      };
      for (let t = 0; t < total; t++) for (let j = 0; j < ns; j++) out[j][t] = getS(t * ns + j);
      idx.forEach((si, j) => {
        const s = h.sigs[si]; const mul = /^uV$/i.test(s.units) ? 0.001 : /^V$/.test(s.units) ? 1000 : 1;
        let nm = s.desc; while (leads[nm]) nm += "'";
        leads[nm] = out[j].map((v) => (v === -32768 && fmt === 16 ? NaN : ((v - s.baseline) / s.gain) * mul));
      });
    }
    return { fs: Number(opts.fs) > 0 ? Number(opts.fs) : h.fs, leads, info: { format: 'wfdb', record: h.name, fsDetected: h.fs, fmt: h.sigs.map((s) => s.fmt), units: 'mV (from header gain)', notes: [] } };
  }

  /* ------------------------------------------- photo digitizer (EXPERIMENTAL) */
  // img: {width,height,data:RGBA}; cal: {pxPerSec, pxPerMv, x0,y0,x1,y1 (crop, image px), thr?}
  function digitize(img, cal) {
    const { width: W, data } = img;
    const x0 = Math.max(0, Math.round(Math.min(cal.x0, cal.x1))), x1 = Math.min(img.width - 1, Math.round(Math.max(cal.x0, cal.x1)));
    const y0 = Math.max(0, Math.round(Math.min(cal.y0, cal.y1))), y1 = Math.min(img.height - 1, Math.round(Math.max(cal.y0, cal.y1)));
    const L = (x, y) => { const p = (y * W + x) * 4; return 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]; };
    const red = (x, y) => { const p = (y * W + x) * 4; return data[p] - (data[p + 1] + data[p + 2]) / 2; };
    // Otsu threshold on luminance of non-reddish pixels
    const hist = new Array(256).fill(0); let tot = 0;
    for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 2) { hist[Math.round(L(x, y))]++; tot++; }
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, thr = 100;
    for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; thr = t; } }
    if (cal.thr) thr = cal.thr;
    thr = Math.min(thr, 160);
    const isTrace = (x, y) => L(x, y) < thr && red(x, y) < 45;
    const ys = []; let prev = NaN; const runsLen = [];
    for (let x = x0; x <= x1; x++) {
      const runs = []; let s = -1;
      for (let y = y0; y <= y1 + 1; y++) { const t = y <= y1 && isTrace(x, y); if (t && s < 0) s = y; if (!t && s >= 0) { runs.push([s, y - 1]); s = -1; } }
      if (!runs.length) { ys.push(NaN); continue; }
      runs.forEach((r) => runsLen.push(r[1] - r[0] + 1));
      let r = runs[0];
      if (Number.isFinite(prev)) { let bd = Infinity; for (const q of runs) { const dd = Math.min(Math.abs(q[0] - prev), Math.abs(q[1] - prev), prev >= q[0] && prev <= q[1] ? 0 : Infinity); if (dd < bd) { bd = dd; r = q; } } }
      else r = runs.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
      ys.push(r); prev = (r[0] + r[1]) / 2;
    }
    const thick = Math.max(1, median(runsLen));
    // resolve steep strokes: long runs => take the end farther from the previous point (keeps peaks)
    const yv = []; let py = NaN;
    for (const r of ys) {
      if (!Array.isArray(r)) { yv.push(NaN); continue; }
      let y = (r[0] + r[1]) / 2;
      if (r[1] - r[0] + 1 > 2.5 * thick && Number.isFinite(py)) y = Math.abs(r[0] - py) > Math.abs(r[1] - py) ? r[0] + thick / 2 : r[1] - thick / 2;
      yv.push(y); py = y;
    }
    // interpolate gaps
    const good = yv.map(Number.isFinite); if (!good.some(Boolean)) throw new Error('No trace pixels found – adjust crop/threshold.');
    let last = -1;
    for (let i = 0; i < yv.length; i++) if (good[i]) { if (last < 0) for (let k = 0; k < i; k++) yv[k] = yv[i]; else for (let k = last + 1; k < i; k++) yv[k] = yv[last] + (yv[i] - yv[last]) * (k - last) / (i - last); last = i; }
    for (let k = last + 1; k < yv.length; k++) yv[k] = yv[last];
    const base = median(yv);
    const fsOut = 250, dur = yv.length / cal.pxPerSec, nOut = Math.floor(dur * fsOut), out = new Float64Array(nOut);
    for (let i = 0; i < nOut; i++) { const px = i / fsOut * cal.pxPerSec, a = Math.floor(px), f = px - a; const v = a + 1 < yv.length ? yv[a] * (1 - f) + yv[a + 1] * f : yv[yv.length - 1]; out[i] = -(v - base) / cal.pxPerMv; }
    return { fs: fsOut, leads: { Strip: out }, info: { format: 'image (experimental)', threshold: thr, basePx: base, x0px: x0, coverage: good.filter(Boolean).length / good.length, notes: ['Digitized from image – amplitudes and intervals are approximate.'] } };
  }

  /* ------------------------------------------------------------- CSV export */
  function beatsCSV(res) {
    const fs = res.fs, t = (i) => (Number.isFinite(i) ? (i / fs).toFixed(3) : ''), r0 = (v) => (Number.isFinite(v) ? Math.round(v) : '');
    const head = ['beat', 'type', 'r_time_s', 'rr_ms', 'hr_bpm', 'p_present', 'p_onset_s', 'qrs_onset_s', 'qrs_offset_s', 't_peak_s', 't_end_s', 'pr_ms', 'qrs_ms', 'qt_ms', 'qtc_bazett_ms', 'qtc_fridericia_ms', 'r_amp_mV', 'p_amp_mV', 't_amp_mV', 'template_corr'];
    const rows = res.beats.map((b, i) => [i + 1, b.type, t(b.r), Number.isFinite(b.rr) ? Math.round(b.rr * 1000) : '', Number.isFinite(b.rr) ? (60 / b.rr).toFixed(1) : '', b.pPresent ? 1 : 0, b.pPresent ? t(b.pOn) : '', t(b.qrsOn), t(b.qrsOff), t(b.tPeak), t(b.tEnd), r0(b.prMs), r0(b.qrsMs), r0(b.qtMs), r0(b.qtcB), r0(b.qtcF), Number.isFinite(b.rAmp) ? (b.rAmp - (b.iso || 0)).toFixed(3) : '', b.pPresent ? b.pAmp.toFixed(3) : '', Number.isFinite(b.tAmp) ? b.tAmp.toFixed(3) : '', Number.isFinite(b.corr) ? b.corr.toFixed(3) : '']);
    return '# ECG Reader ' + VERSION + ' beat measurements – automated draft, not a diagnosis. Lead ' + res.lead + ', fs ' + fs + ' Hz\n' + [head].concat(rows).map((r) => r.join(',')).join('\n') + '\n';
  }

  const ECG = { VERSION, median, mean, sd, pct, biquad, filtfilt, highpass, lowpass, notch, medfilt, preprocess, panTompkins, refinePeaks, delineate, classify, analyze, chooseLead, parseText, parseJSON, parseHea, parseWFDB, digitize, beatsCSV, guessUnits };
  if (typeof module !== 'undefined' && module.exports) module.exports = ECG; else root.ECG = ECG;
})(typeof window !== 'undefined' ? window : globalThis);
