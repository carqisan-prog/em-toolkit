// Robustness check: re-analyze synthetic samples with extra noise (Node).
const fs = require('fs'), path = require('path'); const ECG = require('../ecg.js');
global.window = {}; eval(fs.readFileSync(path.join(__dirname, '../samples.js'), 'utf8'));
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
for (const lvl of [0.03, 0.06]) {
  console.log(`--- extra white noise ${lvl} mV RMS + 0.4 mV wander + 0.1 mV 60 Hz`);
  for (const s of window.ECG_SAMPLES.filter((x) => x.group === 'Synthetic')) {
    const leads = {}; for (const [k, v] of Object.entries(s.leads)) leads[k] = v.map((u, i) => u / 1000 + lvl * gauss() + 0.4 * Math.sin(2 * Math.PI * 0.15 * i / s.fs) + 0.1 * Math.sin(2 * Math.PI * 60 * i / s.fs));
    const r = ECG.analyze({ fs: s.fs, leads }, { notch: 60 });
    const m = r.measures, f = (v) => (Number.isFinite(v) ? Math.round(v) : '–');
    console.log(s.id.padEnd(13), 'HR', f(m.hr), '/', s.truth.hr, 'PR', f(m.pr), 'QRS', f(m.qrs), 'QTcB', f(m.qtcB), 'Q', r.quality.grade, r.quality.score, '|', r.rhythm.code, '|', r.findings.map((x) => x.code).filter((c) => /af|pvc|avb1|wide_qrs|long_qtc|pause|short_pr|pac/.test(c)).join(','));
  }
}
