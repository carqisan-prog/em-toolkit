/* ECG Reader – UI layer. Depends on ecg.js (window.ECG) and samples.js (window.ECG_SAMPLES). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = { rec: null, res: null, name: '', source: '', sampleId: null, view: { lead: null, t0: 0, ppm: 4, gain: 10, speed: 25, raw: false, marks: true }, sel: -1, opts: { notch: 60, baseline: 'hp', lp: 40, sex: 'u', lead: null, globalQRS: true } };
  const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '–');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();

  /* ---------------------------------------------------------------- theme */
  const setTheme = (dark) => { document.body.classList.toggle('dark', dark); $('themeBtn').textContent = dark ? '☀️' : '🌙'; document.querySelector('meta[name=theme-color]').content = dark ? '#0d0f12' : '#ffffff'; try { localStorage.setItem('ecg-theme', dark ? 'dark' : 'light'); } catch (e) {} draw(); };
  $('themeBtn').onclick = () => setTheme(!document.body.classList.contains('dark'));
  let th = null; try { th = localStorage.getItem('ecg-theme'); } catch (e) {}
  document.body.classList.toggle('dark', th ? th === 'dark' : !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches));
  $('themeBtn').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';

  /* ---------------------------------------------------------------- tabs */
  document.querySelectorAll('#loadTabs button').forEach((b) => (b.onclick = () => {
    document.querySelectorAll('#loadTabs button').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('#loadCard .pane').forEach((p) => p.classList.toggle('on', p.id === b.dataset.p));
    $('photoCard').style.display = b.dataset.p === 'pPhoto' && P.img ? '' : 'none';
  }));
  const status = (msg, err) => { const s = $('status'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); };
  const importOpts = () => ({ fs: Number($('fsIn').value) || undefined, units: $('unitsIn').value, gain: Number($('gainIn').value) || 200, maxSec: Number($('maxSecIn').value) || 120 });

  /* ---------------------------------------------------------------- samples */
  const samples = window.ECG_SAMPLES || [];
  (function fillSamples() {
    const sel = $('sampleSel'); sel.innerHTML = '<option value="">— choose a sample —</option>';
    const groups = {};
    samples.forEach((s) => { (groups[s.group] = groups[s.group] || []).push(s); });
    for (const [g, list] of Object.entries(groups)) { const og = document.createElement('optgroup'); og.label = g; list.forEach((s) => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; og.appendChild(o); }); sel.appendChild(og); }
    sel.onchange = () => sel.value && loadSample(sel.value);
  })();
  function loadSample(id) {
    const s = samples.find((x) => x.id === id); if (!s) return;
    $('sampleSel').value = id;
    const rec = ECG.parseJSON({ fs: s.fs, units: s.units, leads: s.leads });
    $('sampleNote').innerHTML = esc(s.source) + (s.url ? ' <a href="' + s.url + '" target="_blank" rel="noopener">Source</a>' : '') + (s.truth && s.truth.note ? '<br><i>' + esc(s.truth.note) + '</i>' : '');
    S.sampleId = id;
    loadRecord(rec, s.name, s.source);
  }

  /* ---------------------------------------------------------------- file input */
  const readAs = (f, how) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); how === 'buf' ? r.readAsArrayBuffer(f) : r.readAsText(f); });
  $('fileIn').onchange = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    try {
      const o = importOpts(); let rec, name = files.map((f) => f.name).join(' + ');
      const hea = files.find((f) => /\.hea$/i.test(f.name));
      if (hea) {
        const bufs = {}; for (const f of files) if (!/\.hea$/i.test(f.name)) bufs[f.name] = await readAs(f, 'buf');
        rec = ECG.parseWFDB(await readAs(hea, 'text'), bufs, o);
      } else if (files.some((f) => /\.dat$/i.test(f.name))) throw new Error('WFDB .dat needs its .hea header – select both files together.');
      else {
        const f = files[0], txt = await readAs(f, 'text');
        if (/\.json$/i.test(f.name) || /^\s*[[{]/.test(txt)) rec = ECG.parseJSON(JSON.parse(txt), o); else rec = ECG.parseText(txt, o);
        name = f.name;
      }
      S.sampleId = null; $('sampleSel').value = '';
      loadRecord(rec, name, 'Uploaded file');
    } catch (err) { status('Could not load: ' + err.message, true); console.warn(err); }
    e.target.value = '';
  };
  $('pasteBtn').onclick = () => {
    try { const t = $('pasteTa').value; if (!t.trim()) throw new Error('Nothing pasted.'); const o = importOpts(); const rec = /^\s*[[{]/.test(t) ? ECG.parseJSON(JSON.parse(t), o) : ECG.parseText(t, o); S.sampleId = null; loadRecord(rec, 'Pasted samples', 'Pasted data'); }
    catch (err) { status('Could not parse: ' + err.message, true); }
  };

  /* ---------------------------------------------------------------- processing controls */
  document.querySelectorAll('#notchSeg button').forEach((b) => (b.onclick = () => { document.querySelectorAll('#notchSeg button').forEach((x) => x.classList.toggle('on', x === b)); S.opts.notch = Number(b.dataset.v); rerun(); }));
  $('baseSel').onchange = (e) => { S.opts.baseline = e.target.value; rerun(); };
  $('lpSel').onchange = (e) => { S.opts.lp = Number(e.target.value); rerun(); };
  $('sexSel').onchange = (e) => { S.opts.sex = e.target.value; rerun(); };
  $('leadSel').onchange = (e) => { S.opts.lead = e.target.value; rerun(); };
  $('globalQRS').onchange = (e) => { S.opts.globalQRS = e.target.checked; rerun(); };

  function loadRecord(rec, name, source) {
    const names = Object.keys(rec.leads);
    if (!names.length) return status('No leads found.', true);
    const n = rec.leads[names[0]].length;
    if (n < rec.fs * 2.5) return status('Recording too short (' + (n / rec.fs).toFixed(1) + ' s). Need ≥ 2.5 s – check the sampling rate.', true);
    S.rec = rec; S.name = name; S.source = source || ''; S.opts.lead = null; S.sel = -1;
    const notes = (rec.info && rec.info.notes) || [];
    status('Loaded ' + names.length + ' lead' + (names.length > 1 ? 's' : '') + ', ' + (n / rec.fs).toFixed(1) + ' s @ ' + rec.fs + ' Hz' + (rec.info && rec.info.units ? ' · units: ' + (typeof rec.info.units === 'string' ? rec.info.units : Object.values(rec.info.units)[0]) : '') + (notes.length ? ' · ' + notes.join(' ') : ''));
    rerun(true);
  }
  function rerun(fresh) {
    if (!S.rec) return;
    const t0 = performance.now();
    S.res = ECG.analyze(S.rec, S.opts);
    S.opts.lead = S.res.lead;
    const names = S.res.leads;
    $('leadSel').innerHTML = names.map((n) => `<option ${n === S.res.lead ? 'selected' : ''}>${esc(n)}</option>`).join('');
    const vl = $('viewLead'), prev = vl.value;
    vl.innerHTML = names.map((n) => `<option value="${esc(n)}">Lead ${esc(n)}</option>`).join('') + (names.length > 1 ? '<option value="__all">All leads (stacked)</option>' : '');
    S.view.lead = fresh ? S.res.lead : (prev && (names.includes(prev) || prev === '__all') ? prev : S.res.lead);
    vl.value = S.view.lead;
    if (fresh) { S.view.t0 = 0; S.view.ppm = defaultPpm(); }
    renderInterp(); renderBeats(); draw(); drawTacho();
    ['reportBtn', 'csvBtn', 'sigBtn'].forEach((id) => ($(id).disabled = false));
    S.ms = performance.now() - t0;
    document.body.dataset.analyzed = (Number(document.body.dataset.analyzed || 0) + 1).toString();
  }
  const defaultPpm = () => { const w = $('ecg').clientWidth || 800; return Math.max(3.6, Math.min(6, w / (25 * 8))); }; // ≥3.6 px/mm; ~8 s across on wide screens

  /* ---------------------------------------------------------------- interpretation panel */
  function renderInterp() {
    const r = S.res, m = r.measures, q = r.quality;
    $('recInfo').textContent = `${S.name} · analysis lead ${r.lead} · ${r.duration.toFixed(1)} s @ ${r.fs} Hz · ${r.beats.length} beats`;
    $('rhythm').textContent = r.rhythm ? r.rhythm.label : '–';
    const qb = $('qBadge'); qb.textContent = `Signal quality: ${q.grade} (${q.score}/100)`; qb.className = 'badge ' + (q.grade === 'Good' ? 'b-good' : q.grade === 'Fair' ? 'b-fair' : 'b-poor');
    $('qNotes').textContent = q.notes && q.notes.length ? q.notes.join(', ') : 'SNR ' + fmt(q.snr, 0);
    const lim = S.opts.sex === 'm' ? 450 : S.opts.sex === 'f' ? 470 : 460;
    const tiles = [
      ['HR', fmt(m.hr), 'bpm', m.hr < 50 || m.hr > 110], ['RR mean', fmt(m.rrMean), 'ms'], ['PR', fmt(m.pr), 'ms', m.pr > 200 || m.pr < 120], ['QRS', fmt(m.qrs), 'ms', m.qrs >= 120],
      ['QT', fmt(m.qt), 'ms'], ['QTc Bazett', fmt(m.qtcB), 'ms', m.qtcB > lim], ['QTc Frid.', fmt(m.qtcF), 'ms', m.qtcF > lim], ['SDNN', fmt(m.sdnn), 'ms'], ['RMSSD', fmt(m.rmssd), 'ms'],
      ['Beats N/V/S', m.nBeats ? `${m.nBeats - m.nV - m.nS}/${m.nV}/${m.nS}` : '–', ''], ['P waves', Number.isFinite(m.pFrac) ? Math.round(m.pFrac * 100) + '%' : '–', 'of beats'], ['RR range', Number.isFinite(m.rrMin) ? `${fmt(m.rrMin)}–${fmt(m.rrMax)}` : '–', 'ms'],
    ];
    $('metrics').innerHTML = tiles.map(([k, v, u, a]) => `<div class="m${a ? ' alert' : ''}" data-k="${esc(k)}"><div class="k">${k}</div><div class="v">${v} <span class="u">${u}</span></div></div>`).join('');
    const ic = { crit: '⛔', warn: '⚠️', info: 'ℹ️', ok: '✅' };
    $('findings').innerHTML = r.findings.map((f) => `<li class="${f.sev}" data-code="${esc(f.code)}">${ic[f.sev]} ${esc(f.text)} ${f.conf && f.conf !== 'n/a' ? `<span class="conf">· confidence: ${f.conf}</span>` : ''}</li>`).join('');
    $('stTbl').innerHTML = '<tr><th>Lead</th><th>ST @ J+60 (mV)</th><th>(mm)</th><th>Screen flag</th></tr>' + (r.st || []).map((s) => `<tr><td>${esc(s.lead)}</td><td>${fmt(s.st, 2)}</td><td>${fmt(s.st * 10, 1)}</td><td>${esc(s.flag || '–')}</td></tr>`).join('');
  }
  function renderBeats() {
    const r = S.res, fs = r.fs, t = (i) => (Number.isFinite(i) ? (i / fs).toFixed(2) : '–');
    const rows = r.beats.map((b, i) => `<tr class="${b.type}${i === S.sel ? ' sel' : ''}" data-i="${i}"><td>${i + 1}</td><td>${b.type}</td><td>${t(b.r)}</td><td>${Number.isFinite(b.rr) ? Math.round(b.rr * 1000) : '–'}</td><td>${fmt(b.prMs)}</td><td>${fmt(b.qrsMs)}</td><td>${fmt(b.qtMs)}</td><td>${fmt(b.qtcB)}</td><td>${b.pPresent ? '✓' : '–'}</td><td>${fmt(b.corr, 2)}</td></tr>`);
    $('beatTbl').innerHTML = '<tr><th>#</th><th>Type</th><th>R (s)</th><th>RR</th><th>PR</th><th>QRS</th><th>QT</th><th>QTcB</th><th>P</th><th>corr</th></tr>' + rows.join('');
    $('beatTbl').onclick = (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) selectBeat(Number(tr.dataset.i), true); };
  }
  function selectBeat(i, center) {
    S.sel = i; const b = S.res.beats[i]; if (!b) return;
    const fs = S.res.fs;
    $('beatInfo').textContent = `Beat ${i + 1} (${b.type === 'V' ? 'PVC-like' : b.type === 'S' ? 'premature narrow' : 'normal'}) at ${(b.r / fs).toFixed(2)} s · RR ${Number.isFinite(b.rr) ? Math.round(b.rr * 1000) + ' ms' : '–'} · PR ${fmt(b.prMs)} · QRS ${fmt(b.qrsMs)} · QT ${fmt(b.qtMs)} · QTcB ${fmt(b.qtcB)} ms · R ${fmt(b.rAmp - b.iso, 2)} mV`;
    if (center) { const span = viewSpan(); S.view.t0 = clampT0(b.r / fs - span / 2); }
    document.querySelectorAll('#beatTbl tr').forEach((tr) => tr.classList.toggle('sel', Number(tr.dataset.i) === i));
    draw();
  }

  /* ---------------------------------------------------------------- ECG canvas */
  const cv = $('ecg');
  const viewSpan = () => (cv.clientWidth || 800) / (S.view.speed * S.view.ppm);
  const clampT0 = (t) => { if (!S.res) return 0; return Math.max(0, Math.min(t, Math.max(0, S.res.duration - viewSpan()))); };
  function leadRange(y) { let lo = Infinity, hi = -Infinity; for (let i = 0; i < y.length; i += 2) { if (y[i] < lo) lo = y[i]; if (y[i] > hi) hi = y[i]; } const p = ECG.pct(y, 0.2), q = ECG.pct(y, 99.8); return [Math.max(lo, p - 0.3), Math.min(hi, q + 0.3)]; }
  function drawStrip(ctx, opt) {
    // opt: {W, H, ppm, gain, speed, t0, leads:[{name,y}], res, marks, colors, sel}
    const { W, ppm, gain, speed, t0, res, marks, col } = opt;
    const pxs = speed * ppm, pmv = gain * ppm, fs = res.fs;
    ctx.fillStyle = col.paper; ctx.fillRect(0, 0, W, opt.H);
    // grid
    const off = (t0 * pxs) % ppm, offL = (t0 * pxs) % (5 * ppm);
    if (ppm >= 2.2) { ctx.strokeStyle = col.gridS; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -off; x < W; x += ppm) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, opt.H); } for (let y = 0; y < opt.H; y += ppm) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); } ctx.stroke(); }
    ctx.strokeStyle = col.gridL; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = -offL; x < W; x += 5 * ppm) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, opt.H); }
    for (let y = 0; y < opt.H; y += 5 * ppm) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); }
    ctx.stroke();
    // second ticks
    ctx.fillStyle = col.muted; ctx.font = '10px system-ui,sans-serif';
    for (let s = Math.ceil(t0); s < t0 + W / pxs; s++) ctx.fillText(s + ' s', (s - t0) * pxs + 2, opt.H - 3);
    const tx = (i) => (i / fs - t0) * pxs;
    const i0 = Math.max(0, Math.floor(t0 * fs) - 1), i1 = Math.min(opt.leads[0].y.length - 1, Math.ceil((t0 + W / pxs) * fs) + 1);
    opt.leads.forEach((L, li) => {
      const yc = L.top + L.h * L.base;
      const ty = (v) => yc - v * pmv;
      // calibration pulse 1 mV x 0.2 s
      ctx.strokeStyle = col.trace; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(4, yc); ctx.lineTo(4 + 1 * ppm, yc); ctx.lineTo(4 + ppm, yc - pmv); ctx.lineTo(4 + 6 * ppm, yc - pmv); ctx.lineTo(4 + 6 * ppm, yc); ctx.lineTo(4 + 7 * ppm, yc); ctx.stroke();
      ctx.fillStyle = col.fg; ctx.font = 'bold 12px system-ui,sans-serif'; ctx.fillText(L.name, 4 + 8 * ppm, L.top + 14);
      // trace (min/max decimation when dense)
      ctx.strokeStyle = col.trace; ctx.lineWidth = opt.lw || 1.4; ctx.lineJoin = 'round'; ctx.beginPath();
      const spp = fs / pxs;
      if (spp > 2) {
        let px = Math.floor(tx(i0)), mn = Infinity, mx = -Infinity, first = true;
        for (let i = i0; i <= i1; i++) { const p = Math.floor(tx(i)); if (p !== px) { if (first) { ctx.moveTo(px, ty(mn)); first = false; } ctx.lineTo(px, ty(mn)); ctx.lineTo(px, ty(mx)); px = p; mn = Infinity; mx = -Infinity; } const v = L.y[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
      } else { for (let i = i0; i <= i1; i++) { const x = tx(i), y = ty(L.y[i]); i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } }
      ctx.stroke();
      if (!marks || !res.beats) return;
      const ys = L.y;
      for (let bi = 0; bi < res.beats.length; bi++) {
        const b = res.beats[bi]; const xr = tx(b.r); if (xr < -80 || xr > W + 80) continue;
        const vline = (i, c, dash) => { if (!Number.isFinite(i)) return; const x = Math.round(tx(i)) + 0.5; ctx.strokeStyle = c; ctx.setLineDash(dash ? [3, 3] : []); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, L.top + 4); ctx.lineTo(x, L.top + L.h - 4); ctx.stroke(); ctx.setLineDash([]); };
        const dot = (i, c, lab) => { if (!Number.isFinite(i)) return; const x = tx(i), y = ty(ys[i]); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); if (lab && li === 0 | opt.leads.length === 1) { ctx.font = 'bold 10px system-ui,sans-serif'; ctx.fillText(lab, x - 3, y - 7); } };
        if (b.pPresent && res.measures && res.measures.consistentP) { vline(b.pOn, col.p, true); dot(b.pPeak, col.p, 'P'); }
        vline(b.qrsOn, col.q, false); vline(b.qrsOff, col.q, true);
        if (Number.isFinite(b.tPeak)) dot(b.tPeak, col.t, 'T');
        vline(b.tEnd, col.t, false);
        // R marker
        const vc = b.type === 'V' ? col.v : b.type === 'S' ? col.s : col.q;
        ctx.fillStyle = vc; const yr = L.top + 6; ctx.beginPath(); ctx.moveTo(xr - 5, yr); ctx.lineTo(xr + 5, yr); ctx.lineTo(xr, yr + 8); ctx.fill();
        ctx.beginPath(); ctx.arc(xr, ty(ys[b.r]), 2.6, 0, 7); ctx.fill();
        if (li === 0) { ctx.font = 'bold 11px system-ui,sans-serif'; ctx.fillText(b.type, xr + 7, yr + 9); if (Number.isFinite(b.rr)) { ctx.fillStyle = col.muted; ctx.font = '10px system-ui,sans-serif'; ctx.fillText(Math.round(b.rr * 1000), xr - 40, yr + 9); } }
        if (bi === opt.sel) { ctx.strokeStyle = col.sel; ctx.lineWidth = 2; ctx.strokeRect(tx(Number.isFinite(b.pOn) ? b.pOn : b.r - 0.25 * fs) - 4, L.top + 2, tx(Number.isFinite(b.tEnd) ? b.tEnd : b.r + 0.4 * fs) - tx(Number.isFinite(b.pOn) ? b.pOn : b.r - 0.25 * fs) + 8, L.h - 4); }
      }
    });
  }
  const colors = (print) => print ? { paper: '#fff', gridS: '#f7d4d4', gridL: '#e59a9a', trace: '#111', fg: '#111', muted: '#555', p: '#15803d', q: '#be123c', t: '#0369a1', v: '#b91c1c', s: '#b45309', sel: '#f59e0b' }
    : { paper: css('--paper'), gridS: css('--gridS'), gridL: css('--gridL'), trace: css('--trace'), fg: css('--fg'), muted: css('--muted'), p: '#22c55e', q: '#f43f5e', t: '#38bdf8', v: '#ef4444', s: '#f59e0b', sel: '#f5b301' };
  function stripLeads(names, ppm, gain, useRaw, mmMin) {
    let top = 0; return names.map((nm) => {
      const y = useRaw ? S.rec.leads[nm] : S.res.filtered[nm];
      const [lo, hi] = leadRange(y); const hmm = Math.max(mmMin, (hi - lo) * gain + 8);
      const h = Math.round(hmm * ppm); const base = Math.min(0.85, Math.max(0.2, (hi * gain + 4) / hmm));
      const L = { name: nm, y, top, h, base }; top += h; return L;
    });
  }
  function draw() {
    if (!S.res) { const ctx = cv.getContext('2d'); cv.width = cv.clientWidth; ctx.fillStyle = css('--paper'); ctx.fillRect(0, 0, cv.width, cv.height); return; }
    const v = S.view, dpr = window.devicePixelRatio || 1, W = cv.clientWidth;
    const names = v.lead === '__all' ? S.res.leads : [v.lead];
    const leads = stripLeads(names, v.ppm, v.gain, v.raw, names.length > 1 ? 22 : 34);
    const H = leads.reduce((a, L) => a + L.h, 0) + 14;
    cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    v.t0 = clampT0(v.t0);
    drawStrip(ctx, { W, H, ppm: v.ppm, gain: v.gain, speed: v.speed, t0: v.t0, leads, res: S.res, marks: v.marks, col: colors(false), sel: S.sel });
    const span = viewSpan(), maxT = Math.max(0, S.res.duration - span);
    $('posIn').value = maxT ? Math.round(v.t0 / maxT * 1000) : 0; $('posIn').disabled = !maxT;
    $('scaleTxt').textContent = `${v.speed} mm/s · ${v.gain} mm/mV · small box ${1000 / v.speed} ms / ${(1 / v.gain).toFixed(2)} mV · view ${span.toFixed(1)} s`;
  }
  // toolbar
  $('viewLead').onchange = (e) => { S.view.lead = e.target.value; draw(); };
  const zoom = (f, cx) => { const span0 = viewSpan(), tc = S.view.t0 + (cx == null ? 0.5 : cx) * span0; S.view.ppm = Math.max(0.6, Math.min(16, S.view.ppm * f)); S.view.t0 = clampT0(tc - (cx == null ? 0.5 : cx) * viewSpan()); draw(); };
  $('zIn').onclick = () => zoom(1.4); $('zOut').onclick = () => zoom(1 / 1.4);
  $('zFit').onclick = () => { if (!S.res) return; S.view.ppm = Math.max(0.6, (cv.clientWidth - 2) / (S.view.speed * S.res.duration)); S.view.t0 = 0; draw(); };
  $('pL').onclick = () => { S.view.t0 = clampT0(S.view.t0 - 0.8 * viewSpan()); draw(); };
  $('pR').onclick = () => { S.view.t0 = clampT0(S.view.t0 + 0.8 * viewSpan()); draw(); };
  $('gainSel').onchange = (e) => { S.view.gain = Number(e.target.value); draw(); };
  $('speedSel').onchange = (e) => { S.view.speed = Number(e.target.value); draw(); };
  $('showMarks').onchange = (e) => { S.view.marks = e.target.checked; draw(); };
  $('showRaw').onchange = (e) => { S.view.raw = e.target.checked; draw(); };
  $('posIn').oninput = (e) => { if (!S.res) return; S.view.t0 = Number(e.target.value) / 1000 * Math.max(0, S.res.duration - viewSpan()); draw(); };
  // pointer pan / pinch / tap
  const ptrs = new Map(); let drag = null, pinch = null;
  cv.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, e); if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, t0: S.view.t0, moved: false, horiz: null }; else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.abs(a.clientX - b.clientX) || 1, ppm: S.view.ppm }; drag = null; } });
  cv.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, e);
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.abs(a.clientX - b.clientX) || 1; const r = cv.getBoundingClientRect(); const cx = ((a.clientX + b.clientX) / 2 - r.left) / r.width; zoom((pinch.ppm * d / pinch.d) / S.view.ppm, cx); return; }
    if (!drag || !S.res) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.horiz === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) { drag.horiz = Math.abs(dx) >= Math.abs(dy); if (drag.horiz) cv.setPointerCapture(e.pointerId); }
    if (drag.horiz) { drag.moved = true; S.view.t0 = clampT0(drag.t0 - dx / (S.view.speed * S.view.ppm)); draw(); }
  });
  const up = (e) => {
    if (drag && !drag.moved && drag.horiz === null && S.res && ptrs.size === 1) { // tap → nearest beat
      const r = cv.getBoundingClientRect(); const t = S.view.t0 + (e.clientX - r.left) / (S.view.speed * S.view.ppm);
      let bi = -1, bd = Infinity; S.res.beats.forEach((b, i) => { const d = Math.abs(b.r / S.res.fs - t); if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0 && bd < 0.5) selectBeat(bi, false);
    }
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) drag = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => {
    if (!S.res) return;
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); const r = cv.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width); }
    else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); S.view.t0 = clampT0(S.view.t0 + (e.deltaX || e.deltaY) / (S.view.speed * S.view.ppm)); draw(); }
  }, { passive: false });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { draw(); drawTacho(); }, 80); });

  /* ---------------------------------------------------------------- tachogram */
  function drawTacho() {
    const c = $('tacho'), dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = 80; c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!S.res || S.res.beats.length < 3) return;
    const b = S.res.beats.slice(1), rr = b.map((x) => x.rr * 1000), lo = Math.min(...rr) * 0.9, hi = Math.max(...rr) * 1.1, med = ECG.median(rr);
    const X = (i) => 30 + i / Math.max(1, b.length - 1) * (W - 40), Y = (v) => H - 10 - (v - lo) / (hi - lo || 1) * (H - 20);
    ctx.strokeStyle = css('--border'); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(30, Y(med)); ctx.lineTo(W - 10, Y(med)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = css('--muted'); ctx.font = '10px system-ui'; ctx.fillText(Math.round(hi), 2, 12); ctx.fillText(Math.round(lo), 2, H - 4);
    ctx.strokeStyle = css('--accent'); ctx.lineWidth = 1.5; ctx.beginPath(); rr.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    b.forEach((x, i) => { ctx.fillStyle = x.type === 'V' ? '#ef4444' : x.type === 'S' ? '#f59e0b' : css('--accent'); ctx.beginPath(); ctx.arc(X(i), Y(rr[i]), 3, 0, 7); ctx.fill(); });
  }

  /* ---------------------------------------------------------------- exports */
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  const baseName = () => (S.sampleId || S.name || 'ecg').replace(/[^\w.-]+/g, '_').replace(/\.(csv|txt|json|hea|dat)$/i, '');
  $('csvBtn').onclick = () => S.res && download(baseName() + '_beats.csv', ECG.beatsCSV(S.res));
  $('sigBtn').onclick = () => {
    if (!S.res) return; const names = S.res.leads, n = S.res.filtered[names[0]].length, fs = S.res.fs;
    let out = '# filtered signal (mV), ECG Reader, fs=' + fs + '\ntime_s,' + names.join(',') + '\n';
    for (let i = 0; i < n; i++) out += (i / fs).toFixed(4) + ',' + names.map((k) => S.res.filtered[k][i].toFixed(4)).join(',') + '\n';
    download(baseName() + '_signal.csv', out);
  };
  function stripImage(names, t0, secs) {
    const ppm = 6, W = Math.round(secs * 25 * ppm), c = document.createElement('canvas');
    const leads = stripLeads(names, ppm, 10, false, 20); const H = leads.reduce((a, L) => a + L.h, 0) + 14;
    c.width = W; c.height = H; const ctx = c.getContext('2d');
    drawStrip(ctx, { W, H, ppm, gain: 10, speed: 25, t0, leads, res: S.res, marks: true, col: colors(true), sel: -1, lw: 1.3 });
    return c.toDataURL('image/png');
  }
  function buildReport() {
    const r = S.res, m = r.measures, q = r.quality, now = new Date();
    const secs = Math.min(10, r.duration), t0 = Math.max(0, Math.min(S.view.t0, r.duration - secs));
    const smp = samples.find((s) => s.id === S.sampleId);
    const lim = S.opts.sex === 'm' ? 450 : S.opts.sex === 'f' ? 470 : 460;
    const row = (k, v, ref) => `<tr><td>${k}</td><td>${v}</td><td style="color:#555">${ref || ''}</td></tr>`;
    const leadsForImg = r.leads.length <= 4 ? [r.leads] : [r.leads.slice(0, 6), r.leads.slice(6)];
    $('report').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><h1>ECG automated analysis — DRAFT</h1><div>${now.toLocaleString()}</div></div>
      <div class="rdisc">AUTOMATED DRAFT – NOT A DIAGNOSIS. Generated by rule-based software (ECG Reader ${ECG.VERSION}); must be reviewed and confirmed by a clinician against the original tracing and clinical context. Not a medical device. No STEMI detection.</div>
      <div class="pf"><div>Patient:</div><div>ID / MRN:</div><div>Age / Sex:</div><div>Location:</div></div>
      <h3>Recording</h3>
      <div>${esc(S.name)} · ${r.leads.length} lead(s): ${esc(r.leads.join(', '))} · ${r.duration.toFixed(1)} s @ ${r.fs} Hz · analysis lead <b>${esc(r.lead)}</b><br>
      Filters: baseline ${esc(S.opts.baseline)}, notch ${S.opts.notch ? S.opts.notch + ' Hz' : 'off'}, low-pass ${S.opts.lp} Hz · Signal quality: <b>${q.grade} (${q.score}/100)</b>${q.notes.length ? ' – ' + esc(q.notes.join(', ')) : ''}</div>
      <h3>Rhythm (draft)</h3><div style="font-size:15px;font-weight:700">${esc(r.rhythm ? r.rhythm.label : '–')}</div>
      <h3>Measurements (median of dominant beats)</h3>
      <table><tr><th style="text-align:left">Parameter</th><th style="text-align:left">Value</th><th style="text-align:left">Reference (adult)</th></tr>
      ${row('Heart rate', fmt(m.hr) + ' bpm (mean ' + fmt(m.hrMean) + ')', '60–100')}${row('PR', fmt(m.pr) + ' ms', '120–200')}${row('QRS', fmt(m.qrs) + ' ms', '&lt;120 (≥120 wide)')}
      ${row('QT', fmt(m.qt) + ' ms', '')}${row('QTc Bazett / Fridericia', fmt(m.qtcB) + ' / ' + fmt(m.qtcF) + ' ms', '≤' + lim + ' (≥500 high risk)')}
      ${row('RR mean / SDNN / RMSSD', fmt(m.rrMean) + ' / ' + fmt(m.sdnn) + ' / ' + fmt(m.rmssd) + ' ms', '')}${row('Beats (N / PVC-like / premature narrow)', `${m.nBeats - m.nV - m.nS} / ${m.nV} / ${m.nS}`, '')}
      ${row('P waves detected', Number.isFinite(m.pFrac) ? Math.round(m.pFrac * 100) + '% of beats' : '–', '')}</table>
      <h3>Findings (draft, for clinician confirmation)</h3>
      <ul>${r.findings.map((f) => `<li><b>${{ crit: 'URGENT', warn: 'Abnormal', info: 'Note', ok: 'Normal' }[f.sev]}:</b> ${esc(f.text)}${f.conf && f.conf !== 'n/a' ? ' <i>(confidence: ' + f.conf + ')</i>' : ''}</li>`).join('')}</ul>
      <h3>ST deviation at J+60 ms — SCREENING ONLY (not STEMI detection)</h3>
      <div>${(r.st || []).map((s) => `${esc(s.lead)}: ${fmt(s.st, 2)} mV${s.flag ? ' (' + s.flag + ')' : ''}`).join(' · ')}</div>
      <h3>Tracing ${t0.toFixed(1)}–${(t0 + secs).toFixed(1)} s (25 mm/s, 10 mm/mV, filtered; markers: P green, QRS red, T blue)</h3>
      ${leadsForImg.map((ln) => `<img alt="ECG strip" src="${stripImage(ln, t0, secs)}">`).join('')}
      ${smp && smp.license ? `<div style="font-size:10.5px;color:#444;margin-top:4px">Data: ${esc(smp.source)}</div>` : smp ? '<div style="font-size:10.5px;color:#444">Data: synthetic demo signal (not a patient).</div>' : ''}
      <div class="sig"><div>Reviewed by (clinician)</div><div>Date / time</div><div>Clinician interpretation</div></div>`;
  }
  $('reportBtn').onclick = () => { if (!S.res) return; buildReport(); $('reportOverlay').classList.add('on'); $('reportOverlay').setAttribute('aria-hidden', 'false'); };
  $('closeReport').onclick = () => { $('reportOverlay').classList.remove('on'); $('reportOverlay').setAttribute('aria-hidden', 'true'); };
  $('printBtn').onclick = () => window.print();
  window.addEventListener('beforeprint', () => { if (S.res && !$('reportOverlay').classList.contains('on')) buildReport(); });

  /* ---------------------------------------------------------------- photo digitizer (EXPERIMENTAL) */
  const P = { img: null, data: null, pts: [], scale: 1 };
  const icv = $('imgcv');
  const photoSteps = ['Click the TOP-LEFT corner of a calibration rectangle on the grid (spanning the large boxes set above).', 'Click the BOTTOM-RIGHT corner of the calibration rectangle.', 'Click the TOP-LEFT of the region to trace (one lead only, include peaks).', 'Click the BOTTOM-RIGHT of the region to trace.', 'Ready – press “Digitize & analyze”.'];
  function photoDraw(trace) {
    if (!P.img) return; const ctx = icv.getContext('2d'); ctx.drawImage(P.img, 0, 0, icv.width, icv.height);
    const lw = Math.max(2, icv.width / 500);
    P.pts.forEach((p, i) => { ctx.fillStyle = i < 2 ? '#2563eb' : '#16a34a'; ctx.beginPath(); ctx.arc(p[0], p[1], lw * 3, 0, 7); ctx.fill(); });
    if (P.pts.length >= 2) { ctx.strokeStyle = '#2563eb'; ctx.lineWidth = lw; ctx.strokeRect(P.pts[0][0], P.pts[0][1], P.pts[1][0] - P.pts[0][0], P.pts[1][1] - P.pts[0][1]); }
    if (P.pts.length >= 4) { ctx.strokeStyle = '#16a34a'; ctx.setLineDash([8, 6]); ctx.lineWidth = lw; ctx.strokeRect(P.pts[2][0], P.pts[2][1], P.pts[3][0] - P.pts[2][0], P.pts[3][1] - P.pts[2][1]); ctx.setLineDash([]); }
    if (trace) { ctx.strokeStyle = 'rgba(0,140,255,.85)'; ctx.lineWidth = lw; ctx.beginPath(); trace.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
    $('photoStep').textContent = 'Step ' + Math.min(5, P.pts.length + 1) + '/5: ' + photoSteps[Math.min(4, P.pts.length)];
    $('photoGo').disabled = P.pts.length < 4;
  }
  $('imgIn').onchange = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const img = new Image(); img.onload = () => {
      const maxW = 2000, sc = Math.min(1, maxW / img.naturalWidth); icv.width = Math.round(img.naturalWidth * sc); icv.height = Math.round(img.naturalHeight * sc);
      P.img = img; P.pts = []; $('photoCard').style.display = ''; const ctx = icv.getContext('2d'); ctx.drawImage(img, 0, 0, icv.width, icv.height); P.data = ctx.getImageData(0, 0, icv.width, icv.height); photoDraw();
    };
    img.onerror = () => status('Could not read image.', true);
    img.src = URL.createObjectURL(f);
  };
  icv.addEventListener('click', (e) => { if (!P.img || P.pts.length >= 4) return; const r = icv.getBoundingClientRect(); P.pts.push([(e.clientX - r.left) * icv.width / r.width, (e.clientY - r.top) * icv.height / r.height]); photoDraw(); });
  $('photoReset').onclick = () => { P.pts = []; photoDraw(); };
  $('thrIn').oninput = (e) => { $('thrVal').textContent = Number(e.target.value) ? e.target.value : 'auto'; };
  $('photoGo').onclick = () => {
    try {
      const [a, b, c, d] = P.pts, bw = Number($('boxW').value) || 5, bh = Number($('boxH').value) || 2;
      const pxPerSec = Math.abs(b[0] - a[0]) / (bw * 0.2), pxPerMv = Math.abs(b[1] - a[1]) / (bh * 0.5);
      if (pxPerSec < 5 || pxPerMv < 5) throw new Error('Calibration rectangle too small.');
      const rec = ECG.digitize(P.data, { pxPerSec, pxPerMv, x0: c[0], y0: c[1], x1: d[0], y1: d[1], thr: Number($('thrIn').value) || 0 });
      // overlay the trace for visual QA
      const y = rec.leads.Strip, x0 = rec.info.x0px, tr = [];
      for (let i = 0; i < y.length; i += 2) tr.push([x0 + i / rec.fs * pxPerSec, rec.info.basePx - y[i] * pxPerMv]);
      photoDraw(tr);
      if (rec.info.coverage < 0.6) status('Trace coverage only ' + Math.round(rec.info.coverage * 100) + '% – result unreliable; adjust threshold/crop.', true);
      S.sampleId = null; loadRecord(rec, 'Photo strip (EXPERIMENTAL digitization)', 'Image');
      if (rec.info.coverage >= 0.6) status('Digitized ' + (y.length / rec.fs).toFixed(1) + ' s (coverage ' + Math.round(rec.info.coverage * 100) + '%, threshold ' + Math.round(rec.info.threshold) + '). EXPERIMENTAL – verify against the image.');
    } catch (err) { status('Digitizing failed: ' + err.message, true); }
  };

  /* ---------------------------------------------------------------- init + test hooks */
  window.ECGApp = { state: S, loadSample, loadRecord, getResult: () => S.res, samples, photo: P };
  draw();
  const hashS = location.hash.match(/sample=([\w-]+)/);
  loadSample(hashS ? hashS[1] : 'syn_nsr72');
})();
