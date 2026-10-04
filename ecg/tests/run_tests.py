#!/usr/bin/env python3
"""Headless browser tests for ECG Reader (Playwright + Chromium/Chrome).

Run:  python3 tests/run_tests.py            (uses /usr/bin/google-chrome if present, else Playwright's chromium)
Writes: tests/results.json, tests/results.md, shots/*.png, shots/report_*.pdf
"""
import json, os, sys, shutil, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'shots'); os.makedirs(SHOTS, exist_ok=True)
URL = 'file://' + os.path.join(ROOT, 'index.html')
SD = os.path.join(ROOT, 'samples')

# expected labels per sample: rhythm code, required finding codes, HR tolerance (fraction), interval tolerances (ms)
EXPECT = {
    'syn_nsr72':    dict(rhythm='sinus',       flags=[]),
    'syn_brady45':  dict(rhythm='sinus_brady', flags=[]),
    'syn_tachy120': dict(rhythm='sinus_tachy', flags=[]),
    'syn_af':       dict(rhythm='af',          flags=['af'], hr_tol=0.12),
    'syn_pvc':      dict(rhythm='sinus',       flags=['pvc']),
    'syn_avb1':     dict(rhythm='sinus',       flags=['avb1']),
    'syn_wideqrs':  dict(rhythm='sinus',       flags=['wide_qrs'], qrs_tol=30),
    'syn_longqt':   dict(rhythm='sinus',       flags=['long_qtc']),
    'syn_pause':    dict(rhythm='sinus',       flags=['pause']),
    'syn_shortpr':  dict(rhythm='sinus',       flags=['short_pr']),
    'mitdb100':     dict(rhythm='sinus',       flags=[], optional=['pac']),
    'mitdb208':     dict(rhythm='sinus_tachy', flags=['pvc']),
}
MAJOR = {'af', 'pvc', 'avb1', 'wide_qrs', 'long_qtc', 'pause', 'short_pr', 'pac'}
NAMES = {'sinus': 'NSR', 'sinus_brady': 'Sinus brady', 'sinus_tachy': 'Sinus tachy', 'af': 'Possible AF', 'narrow_noP': 'Narrow, no P', 'wide_noP': 'Wide, no P'}

def rnd(v):
    return None if v is None or v != v else round(v)

def chrome(p):
    exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
    return p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()

def get_res(pg):
    return pg.evaluate("""() => { const r = ECGApp.getResult(); const m = r.measures;
      return { lead: r.lead, rhythm: r.rhythm.code, label: r.rhythm.label, codes: r.findings.map(f => f.code), m,
               q: r.quality, nleads: r.leads.length, beats: r.beats.map(b => ({ r: b.r / r.fs, type: b.type })), fs: r.fs, dur: r.duration }; }""")

def wait_analysis(pg, prev):
    pg.wait_for_function('n => Number(document.body.dataset.analyzed || 0) > n', arg=prev, timeout=15000)

def analyzed(pg):
    return pg.evaluate('Number(document.body.dataset.analyzed || 0)')

def check_layout(pg, width):
    o = pg.evaluate("""() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
        canvas: document.getElementById('ecg').getBoundingClientRect().width,
        offenders: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.tblwrap,.tabs,#reportOverlay'); }).slice(0, 5).map(e => e.tagName + '#' + e.id + '.' + e.className) })""")
    ok = o['sw'] <= width + 1 and o['canvas'] <= width and not o['offenders']
    return ok, o

def main():
    rows, problems, console_errors = [], [], []
    samples_truth = {}
    with sync_playwright() as p:
        br = chrome(p)
        ctx = br.new_context(viewport={'width': 1280, 'height': 900}, accept_downloads=True, color_scheme='dark')
        pg = ctx.new_page()
        pg.on('console', lambda m: console_errors.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)
        pg.on('pageerror', lambda e: console_errors.append('[pageerror] ' + str(e)))
        pg.goto(URL); pg.wait_for_function('window.ECGApp && ECGApp.getResult()')
        samples_truth = pg.evaluate('ECGApp.samples.map(s => ({id: s.id, name: s.name, truth: s.truth}))')
        ok, lay = check_layout(pg, 1280)
        rows_layout = [('1280 px', ok, lay)]
        # ---------------- every sample
        for s in samples_truth:
            sid, t, e = s['id'], s['truth'], EXPECT[s['id']]
            n0 = analyzed(pg); pg.select_option('#sampleSel', sid); wait_analysis(pg, n0)
            r = get_res(pg); m = r['m']; checks = []
            hr_tol = e.get('hr_tol', 0.06)
            checks.append(('HR', abs(m['hr'] - t['hr']) <= max(3, hr_tol * t['hr']), f"{m['hr']:.0f} vs {t['hr']}"))
            checks.append(('rhythm', r['rhythm'] == e['rhythm'], r['rhythm']))
            got = set(r['codes']) & MAJOR
            missing = [f for f in e['flags'] if f not in got]
            extra = [f for f in got if f not in e['flags'] and f not in e.get('optional', [])]
            checks.append(('flags', not missing and not extra, f"missing={missing} extra={extra}"))
            if t.get('pr') and 'pr' in m:
                checks.append(('PR', rnd(m['pr']) is not None and abs(m['pr'] - t['pr']) <= 25, f"{rnd(m['pr'])}"))
            if t.get('qrs') and sid.startswith('syn'):
                checks.append(('QRS', abs(m['qrs'] - t['qrs']) <= e.get('qrs_tol', 25), f"{m['qrs']:.0f}"))
            if t.get('qtc'):
                checks.append(('QTcB', abs(m['qtcB'] - t['qtc']) <= 30, f"{m['qtcB']:.0f}"))
            # plausibility of all measured values
            for k, lo, hi in [('qrs', 50, 200), ('qt', 250, 650), ('qtcB', 320, 600)]:
                v = m.get(k)
                checks.append((f'{k} plausible', rnd(v) is not None and lo <= v <= hi, f'{rnd(v)}'))
            if t.get('n_pvc') is not None:
                checks.append(('n PVC', m['nV'] == t['n_pvc'], f"{m['nV']} vs {t['n_pvc']}"))
            if t.get('ref_beats'):
                ref = t['ref_beats']; fs = 360.0; det = r['beats']
                tp = sum(1 for (s_, sym) in ref if any(abs(b['r'] - s_ / fs) < 0.1 for b in det))
                se = tp / len(ref); ppv = tp / max(1, len(det))
                checks.append(('beat Se/PPV', se >= 0.95 and ppv >= 0.95, f"Se {se:.2f} PPV {ppv:.2f}"))
                refV = [s_ / fs for s_, sym in ref if sym == 'V']
                hitV = sum(1 for v in refV if any(abs(b['r'] - v) < 0.1 and b['type'] == 'V' for b in det))
                falseV = sum(1 for b in det if b['type'] == 'V' and not any(abs(b['r'] - v) < 0.1 for v in refV))
                checks.append(('PVC match', hitV == len(refV) and falseV == 0, f"{hitV}/{len(refV)} ref V found, {falseV} false V"))
            passed = all(c[1] for c in checks)
            rows.append(dict(id=sid, name=s['name'], expected=dict(rhythm=e['rhythm'], hr=t['hr'], pr=t.get('pr'), qrs=t.get('qrs'), qtc=t.get('qtc'), flags=e['flags']),
                             detected=dict(rhythm=r['rhythm'], label=r['label'], hr=rnd(m['hr']), pr=rnd(m['pr']), qrs=rnd(m['qrs']), qtcB=rnd(m['qtcB']), qtcF=rnd(m['qtcF']),
                                           flags=sorted(got), nV=m['nV'], nS=m['nS'], quality=f"{r['q']['grade']} {r['q']['score']}"),
                             checks=[dict(name=c[0], ok=c[1], detail=c[2]) for c in checks], passed=passed))
            if sid in ('syn_nsr72', 'syn_af', 'syn_pvc', 'mitdb208', 'syn_wideqrs'):
                pg.screenshot(path=os.path.join(SHOTS, f'desktop_{sid}.png'), full_page=False)
        # zoomed view with markers + all leads
        n0 = analyzed(pg); pg.select_option('#sampleSel', 'syn_avb1'); wait_analysis(pg, n0)
        pg.click('#zIn'); pg.click('#zIn'); pg.select_option('#viewLead', '__all')
        pg.locator('#ecg').scroll_into_view_if_needed(); pg.wait_for_timeout(200)
        pg.locator('#traceCard').screenshot(path=os.path.join(SHOTS, 'desktop_zoom_all_leads_avb1.png'))
        # drag pan
        box = pg.locator('#ecg').bounding_box(); t0a = pg.evaluate('ECGApp.state.view.t0')
        pg.mouse.move(box['x'] + 500, box['y'] + 60); pg.mouse.down(); pg.mouse.move(box['x'] + 200, box['y'] + 62, steps=8); pg.mouse.up()
        t0b = pg.evaluate('ECGApp.state.view.t0')
        extra_checks = [('drag-to-pan moves view', t0b > t0a, f't0 {t0a:.2f} → {t0b:.2f}')]
        # ---------------- upload / paste formats
        def upload(files, fs=None, label=''):
            pg.click('#loadTabs button[data-p=pFile]')
            if fs: pg.evaluate("v => { document.querySelector('details').open = true; document.getElementById('fsIn').value = v; }", str(fs))
            n0 = analyzed(pg); pg.set_input_files('#fileIn', files); wait_analysis(pg, n0)
            pg.evaluate("() => document.getElementById('fsIn').value = ''")
            return get_res(pg)
        fmt_rows = []
        def fmt_check(name, r, hr, rhythm, fs=None):
            ok = abs(r['m']['hr'] - hr) <= 4 and r['rhythm'] == rhythm and (fs is None or abs(r['fs'] - fs) < 0.5)
            fmt_rows.append(dict(input=name, expected=f'HR {hr}, {rhythm}' + (f', fs {fs}' if fs else ''), detected=f"HR {r['m']['hr']:.0f}, {r['rhythm']}, fs {r['fs']}, leads {r['nleads']}", ok=ok))
        r = upload([os.path.join(SD, 'syn_nsr72_with_time.csv')]); fmt_check('CSV 3-lead + time column (fs auto)', r, 72, 'sinus', 500)
        r = upload([os.path.join(SD, 'syn_avb1_lead2_uV.txt')], fs=500); fmt_check('TXT single column µV (fs set 500)', r, 70, 'sinus', 500)
        r = upload([os.path.join(SD, 'syn_af.json')]); fmt_check('JSON {fs, units, leads}', r, 77, 'af', 500)
        r = upload([os.path.join(SD, 'mitdb100_10s.hea'), os.path.join(SD, 'mitdb100_10s.dat')]); fmt_check('WFDB format 212 (MIT-BIH 100 excerpt)', r, 75, 'sinus', 360)
        r = upload([os.path.join(SD, 'syn_nsr72.hea'), os.path.join(SD, 'syn_nsr72.dat')]); fmt_check('WFDB format 16 (synthetic NSR)', r, 72, 'sinus', 500)
        # paste
        txt = open(os.path.join(SD, 'syn_avb1_lead2_uV.txt')).read()
        pg.click('#loadTabs button[data-p=pPaste]')
        vis = pg.evaluate("getComputedStyle(document.getElementById('pPaste')).display")
        pg.evaluate("t => { const e = document.getElementById('pasteTa'); e.value = t; e.dispatchEvent(new Event('input')); }", txt)
        pg.evaluate("() => { document.querySelector('details').open = true; document.getElementById('fsIn').value = '500'; }")
        n0 = analyzed(pg); pg.click('#pasteBtn'); wait_analysis(pg, n0); r = get_res(pg)
        fmt_check('Paste raw samples (fs 500)', r, 70, 'sinus', 500)
        pg.evaluate("() => document.getElementById('fsIn').value = ''")
        # notch 50 vs 60 toggle still works
        n0 = analyzed(pg); pg.click('#notchSeg button[data-v="50"]'); wait_analysis(pg, n0)
        n0 = analyzed(pg); pg.click('#notchSeg button[data-v="60"]'); wait_analysis(pg, n0)
        n0 = analyzed(pg); pg.select_option('#baseSel', 'median'); wait_analysis(pg, n0); r = get_res(pg)
        extra_checks.append(('median baseline filter variant', r['rhythm'] == 'sinus' and abs(r['m']['hr'] - 70) < 4, f"{r['rhythm']} HR {r['m']['hr']:.0f}"))
        n0 = analyzed(pg); pg.select_option('#baseSel', 'hp'); wait_analysis(pg, n0)
        # ---------------- photo digitizer (EXPERIMENTAL)
        pg.click('#loadTabs button[data-p=pPhoto]')
        pg.set_input_files('#imgIn', os.path.join(SD, 'strip_photo.jpg'))
        pg.wait_for_function("document.getElementById('imgcv').width > 100")
        meta = json.load(open(os.path.join(SD, 'strip_photo.meta.json')))
        pg.locator('#imgcv').scroll_into_view_if_needed(); pg.wait_for_timeout(100)
        cvb = pg.locator('#imgcv').bounding_box(); iw = pg.evaluate("document.getElementById('imgcv').width")
        sc = cvb['width'] / iw; ox, oy = meta['origin']; pm = meta['px_per_mm']
        def click_img(x, y): pg.mouse.click(cvb['x'] + x * sc, cvb['y'] + y * sc)
        click_img(ox + 5 * pm * 5, oy + 5 * pm * 1); click_img(ox + 5 * pm * 10, oy + 5 * pm * 3)   # 5 x 2 large boxes
        click_img(ox + 4, oy + 4); click_img(ox + 125 * pm - 6, oy + 40 * pm - 4)                     # trace region
        n0 = analyzed(pg); pg.click('#photoGo'); wait_analysis(pg, n0); r = get_res(pg)
        photo_ok = abs(r['m']['hr'] - 72) <= 5 and r['rhythm'] == 'sinus' and r['m']['nBeats'] >= 5
        photo = dict(expected='HR 72, sinus (syn_nsr72 lead II printed at 25 mm/s, 10 mm/mV, rotated 0.6°, blurred JPEG)',
                     detected=f"HR {r['m']['hr']:.0f}, {r['rhythm']}, beats {r['m']['nBeats']}, PR {r['m']['pr']}, QRS {r['m']['qrs']:.0f}, QTcB {r['m']['qtcB']:.0f}", ok=photo_ok)
        pg.evaluate("window.scrollTo(0, 0)"); pg.wait_for_timeout(100)
        pg.screenshot(path=os.path.join(SHOTS, 'desktop_photo_digitizer.png'), full_page=True)
        # ---------------- exports
        pg.click('#loadTabs button[data-p=pSample]')
        n0 = analyzed(pg); pg.select_option('#sampleSel', 'syn_pvc'); wait_analysis(pg, n0)
        with pg.expect_download() as dl: pg.click('#csvBtn')
        path = dl.value.path(); csv = open(path).read().strip().splitlines()
        dest = os.path.join(SHOTS, 'beats_syn_pvc.csv'); shutil.copy(path, dest)
        nb = pg.evaluate('ECGApp.getResult().beats.length')
        extra_checks.append(('beats CSV export', csv[1].startswith('beat,type,r_time_s') and len(csv) - 2 == nb, f'{len(csv) - 2} rows, {nb} beats'))
        pg.click('#reportBtn'); pg.wait_for_selector('#report img')
        pg.screenshot(path=os.path.join(SHOTS, 'desktop_report_preview.png'))
        pg.emulate_media(media='print')
        pdf = os.path.join(SHOTS, 'report_syn_pvc.pdf'); pg.pdf(path=pdf, format='A4', print_background=True)
        pg.emulate_media(media='screen')
        extra_checks.append(('printable report → PDF', os.path.getsize(pdf) > 20000, f'{os.path.getsize(pdf)//1024} KB'))
        pg.click('#closeReport')
        ctx.close()
        # ---------------- mobile 390 px
        mctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark')
        mp = mctx.new_page()
        mp.on('console', lambda m: console_errors.append(f'[mobile {m.type}] {m.text}') if m.type == 'error' else None)
        mp.on('pageerror', lambda e: console_errors.append('[mobile pageerror] ' + str(e)))
        mp.goto(URL); mp.wait_for_function('window.ECGApp && ECGApp.getResult()')
        ok, lay = check_layout(mp, 390); rows_layout.append(('390 px (NSR)', ok, lay))
        mp.screenshot(path=os.path.join(SHOTS, 'mobile390_nsr72_top.png'))
        mp.screenshot(path=os.path.join(SHOTS, 'mobile390_nsr72_full.png'), full_page=True)
        n0 = analyzed(mp); mp.select_option('#sampleSel', 'syn_af'); wait_analysis(mp, n0)
        ok, lay = check_layout(mp, 390); rows_layout.append(('390 px (AF)', ok, lay))
        mp.locator('#interpCard').scroll_into_view_if_needed(); mp.screenshot(path=os.path.join(SHOTS, 'mobile390_af_interp.png'))
        mp.locator('#ecg').scroll_into_view_if_needed(); mp.screenshot(path=os.path.join(SHOTS, 'mobile390_af_tracing.png'))
        # light theme at 390
        mp.click('#themeBtn'); mp.locator('#interpCard').scroll_into_view_if_needed(); mp.screenshot(path=os.path.join(SHOTS, 'mobile390_af_light.png'))
        mctx.close()
        # light desktop full page
        lctx = br.new_context(viewport={'width': 1280, 'height': 900}, color_scheme='light'); lp = lctx.new_page()
        lp.on('pageerror', lambda e: console_errors.append('[light pageerror] ' + str(e)))
        lp.goto(URL + '#sample=mitdb208'); lp.wait_for_function('window.ECGApp && ECGApp.getResult()'); lp.wait_for_timeout(200)
        lp.screenshot(path=os.path.join(SHOTS, 'desktop_light_mitdb208_full.png'), full_page=True)
        lctx.close()
        # standalone single-file build (if built)
        sa = os.path.join(ROOT, 'ecg-reader-standalone.html')
        if os.path.exists(sa):
            sctx = br.new_context(viewport={'width': 1280, 'height': 900}); sp = sctx.new_page()
            sp.on('pageerror', lambda e: console_errors.append('[standalone pageerror] ' + str(e)))
            sp.on('console', lambda m: console_errors.append(f'[standalone {m.type}] {m.text}') if m.type == 'error' else None)
            sp.goto('file://' + sa + '#sample=syn_brady45'); sp.wait_for_function('window.ECGApp && ECGApp.getResult()')
            rr = get_res(sp); extra_checks.append(('standalone single-file build loads offline', rr['rhythm'] == 'sinus_brady', f"{rr['rhythm']} HR {rr['m']['hr']:.0f}"))
            sctx.close()
        br.close()

    allpass = all(r['passed'] for r in rows) and all(f['ok'] for f in fmt_rows) and all(c[1] for c in extra_checks) and all(l[1] for l in rows_layout) and not console_errors
    out = dict(when=time.strftime('%Y-%m-%d %H:%M:%S'), samples=rows, formats=fmt_rows, photo=photo, extra=[dict(name=a, ok=b, detail=c) for a, b, c in extra_checks],
               layout=[dict(viewport=a, ok=b, info=c) for a, b, c in rows_layout], console_errors=console_errors, all_passed=allpass)
    json.dump(out, open(os.path.join(ROOT, 'tests', 'results.json'), 'w'), indent=1)
    md = ['# ECG Reader – headless test results', f"Run {out['when']} · overall: **{'PASS' if allpass else 'FAIL'}**", '',
          '| Sample | Expected | Detected | Result |', '|---|---|---|---|']
    for r in rows:
        e, d = r['expected'], r['detected']
        exp = f"{NAMES.get(e['rhythm'], e['rhythm'])}, HR {e['hr']}" + (f", PR {e['pr']}" if e['pr'] else '') + (f", QRS {e['qrs']}" if e['qrs'] else '') + (f", QTc {e['qtc']}" if e['qtc'] else '') + (f"; flags {','.join(e['flags'])}" if e['flags'] else '')
        det = f"{NAMES.get(d['rhythm'], d['rhythm'])}, HR {d['hr']}, PR {d['pr'] if d['pr'] is not None else '–'}, QRS {d['qrs']}, QTcB {d['qtcB']}" + (f"; flags {','.join(d['flags'])}" if d['flags'] else '') + f" (V {d['nV']}, S {d['nS']}; quality {d['quality']})"
        fails = [c['name'] + ': ' + c['detail'] for c in r['checks'] if not c['ok']]
        md.append(f"| {r['name']} | {exp} | {det} | {'✅' if r['passed'] else '❌ ' + '; '.join(fails)} |")
    md += ['', '| Input format | Expected | Detected | Result |', '|---|---|---|---|']
    md += [f"| {f['input']} | {f['expected']} | {f['detected']} | {'✅' if f['ok'] else '❌'} |" for f in fmt_rows]
    md += ['', f"**Photo digitizer (EXPERIMENTAL):** expected {photo['expected']} → detected {photo['detected']} → {'✅' if photo['ok'] else '❌'}", '']
    md += [f"- {'✅' if c['ok'] else '❌'} {c['name']}: {c['detail']}" for c in out['extra']]
    md += [f"- {'✅' if l['ok'] else '❌'} layout {l['viewport']}: scrollWidth {l['info']['sw']}, canvas {l['info']['canvas']:.0f}px {l['info']['offenders'] or ''}" for l in out['layout']]
    md += [f"- {'✅' if not console_errors else '❌'} console errors: {len(console_errors)} {console_errors[:5] if console_errors else ''}"]
    open(os.path.join(ROOT, 'tests', 'results.md'), 'w').write('\n'.join(md) + '\n')
    print('\n'.join(md))
    sys.exit(0 if allpass else 1)

if __name__ == '__main__':
    main()
