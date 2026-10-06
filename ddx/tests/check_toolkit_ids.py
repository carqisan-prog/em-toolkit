#!/usr/bin/env python3
"""Checks that every toolkit card id DDx Assist links to (tk, tkx, primary-survey banner) resolves in the EM Toolkit
and that the claimed section matches the card's tab.  Usage: python3 tests/check_toolkit_ids.py [TOOLKIT_URL]
(default: the published toolkit; when ddx/ is inside the toolkit repo, serve the repo root and pass http://127.0.0.1:PORT/index.html)."""
import json, pathlib, subprocess, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://carqisan-prog.github.io/em-toolkit/index.html'
JS = r"""const fs=require('fs'),path=require('path');const R=f=>fs.readFileSync(path.join(process.argv[1],'js',f),'utf8');
eval(R('findings.js')+R('kb.js')+R('engine.js')+R('cases.js')+';global.X={CASES,KB,derive,primarySurvey};');
const ids={};const add=(id,w,s)=>{ if(!id) return; (ids[id]=ids[id]||[]).push([w,s==null?null:+s]); };
X.KB.forEach(c=>{ if(c.tk) add(c.tk[0],c.id,c.tk[3]!=null?c.tk[3]:c.sec); (c.tkx||[]).forEach(t=>add(t[0],c.id+'.tkx',t[2])); });
X.CASES.map(k=>X.derive(Object.assign({},k.I))).concat([X.derive({tr:{on:true}})]).forEach(D=>{ if(D.F.trauma===1) X.primarySurvey(D).forEach(r=>add(r.tk,'ps.'+r.k)); });
console.log(JSON.stringify(ids));"""
ids = json.loads(subprocess.run(['node', '-e', JS, str(ROOT)], capture_output=True, text=True, check=True).stdout)
with sync_playwright() as p:
    try: b = p.chromium.launch()
    except Exception: b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(); pg.goto(URL); pg.wait_for_function('typeof cardFor==="function" && typeof SECTIONS!=="undefined"')
    res = pg.evaluate("""ids=>Object.keys(ids).map(id=>{ const c=cardFor(id); if(!c) return [id,null,null];
      const s=SECTIONS.find(x=>(x.panels||[]).some(p=>p[0]===CARDS[c].tab)); return [id,c,s?s.n:null]; })""", ids)
    b.close()
bad = [r[0] for r in res if not r[1]]
# section mismatches only reported for trauma-mode links (sources tr_*/ps.*); legacy mismatches are informational
mism = [(r[0], r[2], w) for r in res if r[1] for (w, s) in ids[r[0]] if s is not None and s != r[2] and (w.startswith('tr_') or w.startswith('ps.'))]
legacy = sorted({(r[0], r[2]) for r in res if r[1] for (w, s) in ids[r[0]] if s is not None and s != r[2] and not w.startswith('tr_')})
print(f'{len(res)} card ids checked against {URL}; unresolved: {bad}; trauma section mismatches: {mism}')
if legacy: print('info – legacy (pre-trauma) section labels differing from the card tab:', legacy)
sys.exit(1 if bad or mism else 0)
