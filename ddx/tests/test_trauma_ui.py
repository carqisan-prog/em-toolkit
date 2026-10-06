#!/usr/bin/env python3
"""Headless Chromium tests for DDx Assist trauma mode (file://, index.html and ddx-standalone.html)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT/'shots'; SHOTS.mkdir(exist_ok=True)
R = {'cases': [], 'taglish': [], 'ui': {}, 'layout': [], 'console': {}}; fails = []

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
ORDER = """()=>{ const r=document.getElementById('results'), p=document.getElementById('psf'), d=document.getElementById('ddx'), m=document.getElementById('mnm');
  if(!p) return 'no banner'; const before = el => !!(p.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING); return before(d)&&before(m) ? 'banner first' : 'banner after list'; }"""

with sync_playwright() as p:
    b = launch(p)
    for label, url in [('index', (ROOT/'index.html').as_uri()), ('standalone', (ROOT/'ddx-standalone.html').as_uri())]:
        for W, H in [(390, 844), (1280, 900)]:
            errs = []; ctx, pg = page(b, url, W, H, errs)
            cases = pg.evaluate('DDX.cases.map(c=>({id:c.id,expect:c.expect,mnm:c.mnm}))')
            for c in cases:
                pg.select_option('#example', c['id']); pg.wait_for_timeout(60)
                top = pg.eval_on_selector_all('#ddx .dx', 'e=>e.slice(0,3).map(x=>x.dataset.id)')
                mn = pg.eval_on_selector_all('#mnm .dx', 'e=>e.map(x=>x.dataset.id)')
                trauma = c['id'].startswith('tr_'); order = pg.evaluate(ORDER)
                ok = c['expect'] in top and all(m in mn for m in c['mnm']) and (order == 'banner first' if trauma else order == 'no banner') and ov(pg) <= 0
                if trauma and label == 'index' and W == 390:
                    names = pg.eval_on_selector_all('#ddx .dx', 'e=>e.slice(0,3).map(x=>x.querySelector(".nm").textContent+" ("+x.querySelector(".sc").textContent.split(" ·")[0]+")")')
                    threats = pg.eval_on_selector_all('#psf .psr.threat[data-ps]', 'e=>e.map(x=>x.dataset.ps)')
                    scores = pg.eval_on_selector_all('#scores .scb', 'e=>e.map(x=>x.dataset.score+"="+x.querySelector(".v").textContent)')
                    sec_visible = pg.is_visible('#sec-tr')
                    R['cases'].append(dict(case=c['id'], expect=c['expect'], top3=names, rank=top.index(c['expect'])+1 if c['expect'] in top else None, mnm_missing=[m for m in c['mnm'] if m not in mn], banner=order, threats=threats, scores=scores, trauma_section_visible=sec_visible, ok=ok and sec_visible))
                if not ok: fails.append(f'{label} {W} case {c["id"]}: top={top} mnm={mn} order={order} ov={ov(pg)}')
            R['layout'].append(dict(page=label, w=W, overflow_after_cases=ov(pg)))
            R['console'][f'{label}_{W}'] = errs
            if label == 'index' and W == 390:
                # Taglish trauma keywords
                T = [('Naaksidente sa motor, walang helmet', {'trauma': 1, 'mech_moto': 1, 'no_helmet': 1}),
                     ('Nabangga ang jeep na sinasakyan', {'mech_mvc': 1, 'trauma': 1}),
                     ('Nahulog sa puno ng niyog, mga 5 metro', {'mech_fall': 1, 'fall_ge3m': 1}),
                     ('Sinaksak sa tiyan kagabi', {'mech_stab': 1, 'penetrating': 1}),
                     ('Binaril sa hita', {'mech_gsw': 1, 'penetrating': 1}),
                     ('Nasagasaan ng tricycle ang bata', {'mech_ped': 1, 'trauma': 1}),
                     ('Naka-helmet naman, nadulas lang ang motor', {'helmet': 1, 'mech_fall_low': 1, 'mech_moto': 1}),
                     ('Nagkaroon ng acute kidney injury, walang trauma', {'trauma': -1})]
                pg.click('#clear')
                for txt, exp in T:
                    got = pg.evaluate('t=>DDX.extract(t).f', txt); bad = {k: v for k, v in exp.items() if got.get(k) != v}
                    R['taglish'].append(dict(text=txt, expected=exp, mismatches=bad, ok=not bad))
                    if bad: fails.append(f'taglish {txt}: {bad} got {got}')
                fm = pg.evaluate("DDX.extract('Nahulog mula sa 2nd floor').fallM"); R['taglish'].append(dict(text='fall from 2nd floor → m', got=fm, ok=fm == 3))
                if fm != 3: fails.append(f'fallM {fm}')
                # auto trauma mode from text; manual off stays off
                pg.click('#clear'); pg.fill('#text', 'Naaksidente sa motor, walang helmet, nawalan ng malay'); pg.wait_for_timeout(400)
                auto = pg.evaluate('DDX.trauma()'); vis = pg.is_visible('#sec-tr'); banner = pg.evaluate(ORDER)
                pg.click('#trMode'); pg.wait_for_timeout(300); off = pg.evaluate('DDX.trauma()'); pg.fill('#text', 'Naaksidente sa motor, walang helmet, nawalan ng malay at nagsuka'); pg.wait_for_timeout(400)
                stays_off = not pg.evaluate('DDX.trauma()')
                R['ui']['auto_on_from_text'] = dict(auto=auto, section_visible=vis, banner=banner, manual_off=not off, stays_off_after_typing=stays_off)
                if not (auto and vis and banner == 'banner first' and not off and stays_off): fails.append(f"auto trauma {R['ui']['auto_on_from_text']}")
                # toggle with empty form shows banner with unknown rows; GCS E/V/M → vitals GCS; mirrors
                pg.click('#clear'); pg.click('#trMode'); pg.wait_for_timeout(300)
                rows = pg.eval_on_selector_all('#psf .psr[data-ps]', 'e=>e.map(x=>x.dataset.ps+":"+x.className.split(" ")[1])')
                pg.select_option('#gcsE', '3'); pg.select_option('#gcsV', '4'); pg.select_option('#gcsM', '5'); pg.wait_for_timeout(300)
                gcs = pg.input_value('#gcs'); pg.fill('#trSbp', '84'); pg.fill('#trHr', '128'); pg.wait_for_timeout(400)
                sbp = pg.input_value('#sbp'); cthreat = pg.get_attribute('#psf .psr[data-ps=C]', 'class')
                R['ui']['toggle_empty'] = dict(rows=rows, gcs_from_evm=gcs, sbp_mirrored=sbp, C_row=cthreat)
                if not (len(rows) == 6 and gcs == '12' and sbp == '84' and 'threat' in cthreat): fails.append(f"toggle {R['ui']['toggle_empty']}")
                # chart note for a trauma case
                pg.select_option('#example', 'tr_burn30'); pg.wait_for_timeout(150); pg.click('#shownote'); pg.wait_for_timeout(150)
                note = pg.input_value('#notebox'); R['ui']['note_has'] = {k: (k in note) for k in ['TRAUMA:', 'PRIMARY SURVEY:', 'Burn fluid', '⚠VERIFY', 'Source:']}
                if not all(R['ui']['note_has'].values()): fails.append(f"note {R['ui']['note_has']}")
                # toolkit links rendered for trauma plans
                pg.select_option('#example', 'tr_stab_tamp'); pg.wait_for_timeout(150)
                R['ui']['tk_links_tamponade'] = pg.eval_on_selector_all('#ddx .dx[data-id=tr_tamponade] .tk a', 'e=>e.map(a=>a.getAttribute("href"))')
                # every dose in trauma plans carries ⚠ VERIFY? (count vtags vs. "mg|mL/kg|IU" mentions in treatment items)
                R['ui']['doses_without_verify'] = pg.evaluate("""DDX.kb.filter(c=>c.tr).flatMap(c=>c.tx.map(t=>[c.id,t])).filter(([id,t])=>/\\d\\s?(mg|g|mcg|mL|IU|U)\\b/.test(t) && !/\\[V\\]/.test(t)).map(([id,t])=>id+': '+t.slice(0,80))""")
                if R['ui']['doses_without_verify']: fails.append(f"doses without VERIFY: {R['ui']['doses_without_verify']}")
                R['ui']['blocks_without_source'] = pg.evaluate("DDX.kb.filter(c=>c.tr && !(c.dxs && c.txs && c.dps)).map(c=>c.id)")
                if R['ui']['blocks_without_source']: fails.append('blocks without source')
                # screenshots (phone)
                pg.select_option('#example', 'tr_moto_edh'); pg.wait_for_timeout(150); pg.evaluate("document.getElementById('psf').scrollIntoView()"); pg.wait_for_timeout(400)
                pg.screenshot(path=str(SHOTS/'phone_trauma_edh_banner.png'))
                pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(200); pg.screenshot(path=str(SHOTS/'phone_trauma_form.png'))
            if label == 'index' and W == 1280:
                pg.select_option('#example', 'tr_tension'); pg.wait_for_timeout(200); pg.screenshot(path=str(SHOTS/'desktop_trauma_tension.png'))
                pg.select_option('#example', 'tr_burn30'); pg.wait_for_timeout(200); pg.evaluate("document.querySelector('#scores').scrollIntoView()"); pg.wait_for_timeout(200)
                pg.screenshot(path=str(SHOTS/'desktop_trauma_burn_scores.png'))
            ctx.close()
    # light theme phone, trauma
    e = []; ctx, pg = page(b, (ROOT/'index.html').as_uri(), 390, 844, e, dark=False)
    pg.select_option('#example', 'tr_fall_pelvis'); pg.wait_for_timeout(150); pg.locator('#results').screenshot(path=str(SHOTS/'phone_light_trauma_pelvis_results.png'))
    R['layout'].append(dict(page='index-light', w=390, overflow=ov(pg))); R['console']['index_390_light'] = e; ctx.close()
    b.close()
for k, v in R['console'].items():
    if v: fails.append(f'console {k}: {v}')
for l in R['layout']:
    if l.get('overflow_after_cases', l.get('overflow', 0)) > 0: fails.append(f'overflow {l}')
R['fails'] = fails
(ROOT/'tests/trauma_results.json').write_text(json.dumps(R, indent=1, ensure_ascii=False))
print('| case | expected | rank | top 3 | life threats (banner) | ok |')
for r in R['cases']: print(f"| {r['case']} | {r['expect']} | {r['rank']} | {'; '.join(r['top3'])} | {','.join(r['threats'])} | {'PASS' if r['ok'] else 'FAIL'} |")
for r in R['taglish']: print('TAGLISH', 'PASS' if r['ok'] else 'FAIL', r['text'])
print(json.dumps(R['ui'], ensure_ascii=False)); print('layout', R['layout']); print('console', R['console'])
print('FAILS:', len(fails)); [print(' -', f[:300]) for f in fails]
sys.exit(1 if fails else 0)
