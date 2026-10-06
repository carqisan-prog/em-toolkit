#!/usr/bin/env python3
"""Headless Chromium UI tests for DDx Assist (file://, both index.html and ddx-standalone.html)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT/'shots'; SHOTS.mkdir(exist_ok=True)
results = {'cases': [], 'tagalog': [], 'layout': [], 'console': {}, 'standalone': {}}
fails = []

def launch(p):
    try: return p.chromium.launch()
    except Exception: return p.chromium.launch(executable_path='/usr/bin/google-chrome')

def open_page(browser, url, w, h, errs, dark=True):
    ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if w < 600 else 1)
    pg = ctx.new_page()
    pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    pg.goto(url); pg.wait_for_function('window.DDX')
    if not dark: pg.click('#theme')
    pg.add_style_tag(content='.toast{display:none!important}')
    return ctx, pg

def overflow(pg):
    return pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')

with sync_playwright() as p:
    b = launch(p)
    url = (ROOT/'index.html').as_uri()
    errs = []
    ctx, pg = open_page(b, url, 390, 844, errs)
    cases = pg.evaluate('DDX.cases.map(c=>({id:c.id,name:c.name,expect:c.expect,mnm:c.mnm}))')
    for c in cases:
        pg.select_option('#example', c['id']); pg.wait_for_timeout(80)
        top = pg.eval_on_selector_all('#ddx .dx', 'els=>els.slice(0,3).map(e=>e.dataset.id)')
        names = pg.eval_on_selector_all('#ddx .dx', 'els=>els.slice(0,3).map(e=>e.querySelector(".nm").textContent+" ("+e.querySelector(".sc").textContent.split(" ·")[0]+")")')
        mnm = pg.eval_on_selector_all('#mnm .dx', 'els=>els.map(e=>e.dataset.id)')
        ok_top = c['expect'] in top; miss = [m for m in c['mnm'] if m not in mnm]
        ov = overflow(pg)
        r = dict(case=c['id'], expect=c['expect'], top3=names, top3_ids=top, mnm_shown=mnm, mnm_missing=miss, overflow390=ov, ok=ok_top and not miss and ov <= 0)
        results['cases'].append(r)
        if not r['ok']: fails.append(f"case {c['id']}: {r}")
    # Tagalog / Taglish extraction
    T = [
      ('Tatlong araw nang nilalagnat, may ubo at hirap huminga.', {'fever': 1, 'cough': 1, 'dyspnea': 1}, 'duration'),
      ('Pananakit ng dibdib, pinagpapawisan. Walang ubo.', {'chest_pain': 1, 'cough': -1}, None),
      ('Nagtatae at nagsusuka simula kahapon, masakit ang tiyan', {'diarrhea': 1, 'vomiting': 1, 'abd_pain': 1}, 'duration'),
      ('Matinding sakit ng ulo, hindi nilalagnat', {'headache': 1, 'fever': -1}, None),
      ('Masakit ang likod ng mata, may pantal at dumudugo ang gilagid', {'retro_orb': 1, 'bleeding': 1}, None),
      ('Lumusong sa baha 1 linggo na, masakit ang binti (calf)', {'flood': 1}, None),
    ]
    pg.click('#clear')
    for txt, exp, extra in T:
        pg.fill('#text', txt); pg.wait_for_timeout(250)
        got = pg.evaluate('t=>DDX.extract(t)', txt)
        f = got['f']; bad = {k: v for k, v in exp.items() if f.get(k) != v}
        chips = pg.eval_on_selector_all('#xout .xc', 'els=>els.map(e=>e.textContent)')
        dur_ok = (extra is None) or bool(got.get('duration'))
        r = dict(text=txt, expected=exp, extracted=f, chips=chips, mismatches=bad, duration=got.get('duration'), ok=not bad and dur_ok and len(chips) > 0)
        results['tagalog'].append(r)
        if not r['ok']: fails.append(f'tagalog: {r}')
    # Apply-to-form
    pg.fill('#text', 'nilalagnat, walang ubo'); pg.wait_for_timeout(250); pg.click('#apply'); pg.wait_for_timeout(100)
    st = pg.evaluate('[document.querySelector(\'.chip[data-f="fever"]\').className, document.querySelector(\'.chip[data-f="cough"]\').className]')
    results['tagalog'].append(dict(text='apply-to-form', chips=st, ok=('p' in st[0].split() and 'n' in st[1].split())))
    if not results['tagalog'][-1]['ok']: fails.append(f'apply: {st}')
    # chart note + screenshots (phone)
    pg.click('#clear'); pg.select_option('#example', 'dengue'); pg.wait_for_timeout(100); pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(100)
    pg.screenshot(path=str(SHOTS/'phone_dark_form_dengue.png'))
    pg.click('#jump'); pg.wait_for_timeout(500)
    pg.locator('#results').screenshot(path=str(SHOTS/'phone_dark_results_dengue.png'))
    pg.click('#shownote'); pg.wait_for_timeout(100)
    note = pg.input_value('#notebox')
    results['note_excerpt'] = note[:1500]
    for must in ['ASSESSMENT', 'PLAN', 'VERIFY', 'Source:']:
        if must not in note.upper() and must not in note: fails.append(f'note missing {must}')
    pg.locator('#notebox').screenshot(path=str(SHOTS/'phone_chartnote.png'))
    pg.emulate_media(media='print'); pg.evaluate("document.getElementById('printnote').textContent=DDX.note(); window.scrollTo(0,0)")
    pg.screenshot(path=str(SHOTS/'print_preview.png'), full_page=False); pg.emulate_media(media='screen')
    ctx.close()
    results['console']['index_390'] = errs[:]
    # phone light
    errs2 = []
    ctx, pg = open_page(b, url, 390, 844, errs2, dark=False)
    pg.select_option('#example', 'stemi'); pg.wait_for_timeout(100)
    pg.locator('#results').screenshot(path=str(SHOTS/'phone_light_results_stemi.png'))
    results['layout'].append(dict(w=390, theme='light', overflow=overflow(pg)))
    ctx.close(); results['console']['index_390_light'] = errs2[:]
    # desktop
    for dark, case, name in [(True, 'lepto', 'desktop_dark_lepto.png'), (False, 'ectopic', 'desktop_light_ectopic.png'), (True, 'pe', 'desktop_dark_pe.png')]:
        e3 = []
        ctx, pg = open_page(b, url, 1280, 900, e3, dark=dark)
        pg.select_option('#example', case); pg.wait_for_timeout(100)
        pg.screenshot(path=str(SHOTS/name))
        ov = overflow(pg); cols = pg.evaluate("getComputedStyle(document.querySelector('.cols')).gridTemplateColumns")
        results['layout'].append(dict(w=1280, case=case, dark=dark, overflow=ov, grid=cols))
        if ov > 0: fails.append(f'overflow 1280 {case}')
        results['console'][f'index_1280_{case}'] = e3
        ctx.close()
    # empty-state phone overflow
    e4 = []; ctx, pg = open_page(b, url, 390, 844, e4)
    results['layout'].append(dict(w=390, state='empty', overflow=overflow(pg)))
    pg.screenshot(path=str(SHOTS/'phone_dark_empty.png')); ctx.close()
    # standalone
    e5 = []; ctx, pg = open_page(b, (ROOT/'ddx-standalone.html').as_uri(), 390, 844, e5)
    okc = 0
    for c in cases:
        pg.select_option('#example', c['id']); pg.wait_for_timeout(60)
        top = pg.eval_on_selector_all('#ddx .dx', 'els=>els.slice(0,3).map(e=>e.dataset.id)')
        okc += c['expect'] in top
    results['standalone'] = dict(cases_ok=okc, total=len(cases), kb=pg.inner_text('#kbcount'), console=e5)
    if okc != len(cases): fails.append('standalone cases')
    ctx.close()
    for k, v in results['console'].items():
        if v: fails.append(f'console {k}: {v}')
    if e5: fails.append(f'console standalone: {e5}')
    for l in results['layout']:
        if l['overflow'] > 0: fails.append(f'overflow {l}')
    b.close()

results['fails'] = fails
(ROOT/'tests/results.json').write_text(json.dumps(results, indent=1, ensure_ascii=False))
print('| case | expected | top 3 | mnm missing | ok |')
for r in results['cases']: print(f"| {r['case']} | {r['expect']} | {'; '.join(r['top3'])} | {r['mnm_missing'] or '-'} | {'PASS' if r['ok'] else 'FAIL'} |")
for r in results['tagalog']: print('TAGALOG', 'PASS' if r['ok'] else 'FAIL', r['text'][:50], r.get('mismatches', ''))
print('layout', results['layout']); print('standalone', results['standalone']); print('console', results['console'])
print('FAILS:', len(fails)); [print(' -', f[:400]) for f in fails]
sys.exit(1 if fails else 0)
