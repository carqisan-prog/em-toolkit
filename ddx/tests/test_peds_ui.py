#!/usr/bin/env python3
"""Headless Chromium tests for DDx Assist pediatric mode (file://, index.html and ddx-standalone.html) at 390 and 1280 px."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT/'shots'; SHOTS.mkdir(exist_ok=True)
R = {'cases': [], 'ui': {}, 'layout': [], 'console': {}}; fails = []
def launch(p):
    try: return p.chromium.launch()
    except Exception: return p.chromium.launch(executable_path='/usr/bin/google-chrome')
def page(b, url, w, h, errs, dark=True):
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if w < 600 else 1); pg = ctx.new_page()
    pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    pg.goto(url); pg.wait_for_function('window.DDX')
    if not dark: pg.click('#theme')
    pg.add_style_tag(content='.toast{display:none!important}')
    return ctx, pg
ov = lambda pg: pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
with sync_playwright() as p:
    b = launch(p)
    for label, url in [('index', (ROOT/'index.html').as_uri()), ('standalone', (ROOT/'ddx-standalone.html').as_uri())]:
        for W, H in [(390, 844), (1280, 900)]:
            errs = []; ctx, pg = page(b, url, W, H, errs)
            cases = pg.evaluate("DDX.cases.filter(c=>c.id.startsWith('pd_')).map(c=>({id:c.id,expect:c.expect,mnm:c.mnm,name:c.name}))")
            for c in cases:
                pg.select_option('#example', c['id']); pg.wait_for_timeout(80)
                top = pg.eval_on_selector_all('#ddx .dx', 'e=>e.slice(0,3).map(x=>x.dataset.id)')
                mn = pg.eval_on_selector_all('#mnm .dx', 'e=>e.map(x=>x.dataset.id)')
                st = pg.evaluate('DDX_PEDS()'); sec = pg.is_visible('#sec-pd')
                dz = pg.eval_on_selector_all('#ddx .dx:first-child .pdz tr', 'e=>e.length'); home = pg.eval_on_selector_all('#ddx .dx:first-child .pdh li', 'e=>e.length')
                ok = c['expect'] in top and all(m in mn for m in c['mnm']) and st['on'] and sec and ov(pg) <= 0
                if label == 'index' and W == 390:
                    names = pg.eval_on_selector_all('#ddx .dx', 'e=>e.slice(0,3).map(x=>x.dataset.id+" ("+x.querySelector(".sc").textContent.split(" ·")[0]+")")')
                    scores = pg.eval_on_selector_all('#scores .scb', 'e=>e.map(x=>x.dataset.score+"="+x.querySelector(".v").textContent)')
                    R['cases'].append(dict(case=c['id'], name=c['name'], expect=c['expect'], rank=top.index(c['expect'])+1 if c['expect'] in top else None, top3=names, dose_rows=dz, home_items=home, scores=scores, ok=ok))
                if not ok: fails.append(f'{label} {W} {c["id"]}: top={top} mnm={mn} peds={st} sec={sec} ov={ov(pg)}')
            # adult case after peds case → peds mode switches off automatically
            pg.select_option('#example', 'stemi'); pg.wait_for_timeout(120)
            adult_off = not pg.evaluate('DDX_PEDS().on') and not pg.is_visible('#sec-pd') and pg.eval_on_selector_all('#ddx .dx .pdz', 'e=>e.length') == 0
            if not adult_off: fails.append(f'{label} {W}: peds mode not off for adult case')
            R['layout'].append(dict(page=label, w=W, overflow_after_cases=ov(pg)))
            if label == 'index' and W == 390:
                ui = R['ui']
                # auto-on from age; months unit; APLS placeholder; range note
                pg.click('#clear'); pg.fill('#age', '8'); pg.select_option('#ageU', 'mo'); pg.wait_for_timeout(350)
                ui['auto_on_8mo'] = dict(on=pg.evaluate('DDX_PEDS().on'), visible=pg.is_visible('#sec-pd'), placeholder=pg.get_attribute('#pdWt', 'placeholder'), range=pg.inner_text('#pdRange'), wt_note=pg.inner_text('#pdWtNote'))
                if not (ui['auto_on_8mo']['on'] and ui['auto_on_8mo']['visible'] and '8' in ui['auto_on_8mo']['placeholder'] and 'HR 110–160' in ui['auto_on_8mo']['range'] and 'overestimate' in ui['auto_on_8mo']['wt_note']): fails.append(f"auto on {ui['auto_on_8mo']}")
                # manual off sticks; adult conditions come back
                pg.click('#pdMode'); pg.wait_for_timeout(300); off = pg.evaluate('DDX_PEDS()'); pg.fill('#age', '9'); pg.wait_for_timeout(300)
                ui['manual_off'] = dict(off=not off['on'], stays_off=not pg.evaluate('DDX_PEDS().on'), hidden=not pg.is_visible('#sec-pd'))
                if not all(ui['manual_off'].values()): fails.append(f"manual off {ui['manual_off']}")
                # 25-y-old toggled on manually
                pg.click('#clear'); pg.fill('#age', '25'); pg.wait_for_timeout(250); a_off = not pg.evaluate('DDX_PEDS().on'); pg.click('#pdMode'); pg.wait_for_timeout(250)
                ui['manual_on_adult_age'] = dict(auto_off_25y=a_off, on_after_toggle=pg.evaluate('DDX_PEDS().on'))
                if not all(ui['manual_on_adult_age'].values()): fails.append(f"manual on {ui['manual_on_adult_age']}")
                # weight mirrored between pediatric and trauma fields; dose recomputes with weight
                pg.click('#clear'); pg.fill('#age', '3'); pg.fill('#text', '2 araw nang may lagnat, nangisay ng 2 minuto, ngayon gising na'); pg.wait_for_timeout(400)
                est = pg.inner_text('#ddx .dx:first-child .pdz h4'); pg.fill('#pdWt', '12'); pg.wait_for_timeout(400)
                ui['weight'] = dict(top=pg.eval_on_selector('#ddx .dx', 'e=>e.dataset.id'), est_header=est, measured_header=pg.inner_text('#ddx .dx:first-child .pdz h4'), trauma_wt=pg.input_value('#wt'),
                                    first_dose=pg.inner_text('#ddx .dx:first-child .pdz tr:first-child'))
                if not (ui['weight']['trauma_wt'] == '12' and 'APLS' in est and '12 kg' in ui['weight']['measured_header']): fails.append(f"weight {ui['weight']}")
                # Taglish keywords through the free-text box
                pg.click('#clear'); pg.fill('#text', 'Lagnat 3 araw, may ubo at sipon, kinukumbulsyon kanina, ayaw dumede, matamlay, nagsusuka, may pagtatae, hirap huminga, may rashes, namamaga ang paa'); pg.wait_for_timeout(400)
                x = pg.evaluate("Object.keys(DDX.last().D.ex.f)")
                need = ['fever', 'cough', 'coryza', 'seizure', 'poor_feed', 'lethargy', 'vomiting', 'diarrhea', 'dyspnea', 'rash', 'swelling']
                ui['taglish_missing'] = [k for k in need if k not in x]
                if ui['taglish_missing']: fails.append(f"taglish {ui['taglish_missing']}")
                # capped dose shown for a heavy adolescent
                pg.click('#clear'); pg.fill('#age', '15'); pg.fill('#pdWt', '70'); pg.fill('#text', 'nangingisay pa rin ng 10 minuto, tuloy-tuloy'); pg.wait_for_timeout(450)
                ui['cap_shown'] = pg.eval_on_selector_all('.pdz .cap', 'e=>e.map(x=>x.textContent)')[:4]
                if not ui['cap_shown']: fails.append('no capped dose badge for 70 kg')
                # screenshots: pediatric case on phone
                pg.select_option('#example', 'pd_dengue_8y'); pg.wait_for_timeout(200); pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(150)
                pg.screenshot(path=str(SHOTS/'phone_peds_form.png'))
                pg.evaluate("document.querySelector('#ddx .dx .pdz').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=str(SHOTS/'phone_peds_dengue_doses.png'))
            if label == 'index' and W == 1280:
                pg.select_option('#example', 'pd_kawasaki_3y'); pg.wait_for_timeout(250); pg.screenshot(path=str(SHOTS/'desktop_peds_kawasaki.png'))
                pg.select_option('#example', 'pd_age_severe'); pg.wait_for_timeout(250); pg.evaluate("document.querySelector('#scores').scrollIntoView()"); pg.wait_for_timeout(200); pg.screenshot(path=str(SHOTS/'desktop_peds_age_scores.png'))
            R['console'][f'{label}_{W}'] = errs; ctx.close()
    e = []; ctx, pg = page(b, (ROOT/'index.html').as_uri(), 390, 844, e, dark=False)
    pg.select_option('#example', 'pd_croup_2y'); pg.wait_for_timeout(200); pg.locator('#results').screenshot(path=str(SHOTS/'phone_light_peds_croup_results.png'))
    R['layout'].append(dict(page='index-light', w=390, overflow=ov(pg))); R['console']['index_390_light'] = e; ctx.close()
    b.close()
for k, v in R['console'].items():
    if v: fails.append(f'console {k}: {v}')
for l in R['layout']:
    if l.get('overflow_after_cases', l.get('overflow', 0)) > 0: fails.append(f'overflow {l}')
R['fails'] = fails
(ROOT/'tests/peds_results.json').write_text(json.dumps(R, indent=1, ensure_ascii=False))
print('| case | expected | rank | top 3 | dose rows | ok |')
for r in R['cases']: print(f"| {r['case']} | {r['expect']} | {r['rank']} | {'; '.join(r['top3'])} | {r['dose_rows']} | {'PASS' if r['ok'] else 'FAIL'} |")
print(json.dumps(R['ui'], ensure_ascii=False)); print('layout', R['layout']); print('console', R['console'])
print('FAILS:', len(fails)); [print(' -', f[:300]) for f in fails]
sys.exit(1 if fails else 0)
