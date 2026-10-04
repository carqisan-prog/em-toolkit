// quick algorithm check in Node against embedded samples
const fs = require('fs'); const path = require('path');
const ECG = require('../ecg.js');
global.window = {}; eval(fs.readFileSync(path.join(__dirname, '../samples.js'), 'utf8'));
for (const s of window.ECG_SAMPLES) {
  const rec = ECG.parseJSON({ fs: s.fs, units: 'uV', leads: s.leads });
  const r = ECG.analyze(rec, { notch: 60 });
  const m = r.measures, f = (v) => (Number.isFinite(v) ? Math.round(v) : '–');
  console.log(s.id.padEnd(13), 'lead', r.lead.padEnd(4), 'HR', f(m.hr), 'n', m.nBeats, 'V', m.nV, 'S', m.nS, 'PR', f(m.pr), 'QRS', f(m.qrs), 'QT', f(m.qt), 'QTcB', f(m.qtcB), 'Pfr', m.pFrac.toFixed(2), 'prSD', f(m.prSD), 'nRMSSD', m.nRMSSD.toFixed(2), 'irr', m.fracIrreg.toFixed(2), 'Q', r.quality.score, '|', r.rhythm.code, '|', r.findings.map((x) => x.code).filter(Boolean).join(','), '| truth', JSON.stringify({ hr: s.truth.hr, pr: s.truth.pr, qrs: s.truth.qrs, qtc: s.truth.qtc, fl: s.truth.flags }));
}
