#!/usr/bin/env python3
"""Build /workspace/em-tintinalli/index.html from src/base.html (read-only copy of the
emt-renal add-renal-section index.html: v1 + merged Renal & Pulmonary) plus new/ pieces."""
import json, re, os, collections
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE); N=os.path.join(HERE,'new')
rd=lambda p: open(p,encoding='utf-8').read()
s=rd(os.path.join(HERE,'base.html'))
exec(rd(os.path.join(HERE,'outline.py')))   # defines S

def rep(old,new,count=1):
    global s
    n=s.count(old)
    assert n==count, f'expected {count} match(es), found {n}: {old[:90]!r}'
    s=s.replace(old,new)
def cut(start,end,keep_end=False):
    """remove s[start:end) and return it"""
    global s
    i=s.index(start); j=s.index(end,i)
    if not keep_end: pass
    chunk=s[i:j]; s=s[:i]+s[j:]; return chunk
def between(a,b):
    i=s.index(a); j=s.index(b,i)+len(b); return s[i:j]

# ---------- CSS: replace renal print block with new layout + print ----------
i=s.index('  /* ---- print: current tab only, B/W friendly ---- */'); j=s.index('</style>')
old_print=s[i:j]
s=s[:i]+rd(os.path.join(N,'app.css'))+'\n'+rd(os.path.join(N,'print.css'))+'\n'+s[j:]

# ---------- title/meta ----------
rep('<title>Emergency Medicine Toolkit</title>','<title>EM Toolkit – Tintinalli-mapped clinician reference</title>\n<meta name="description" content="Weight-based emergency medicine reference organised by the 26 major sections of Tintinalli 9e (topic map only). Original summaries of public guidelines. Not a medical device.">')

# ---------- header ----------
rep('<body class="dark">\n<div class="top"><div><h1>Emergency Medicine Toolkit <span id="pedsBadge" class="badge" hidden>PEDIATRIC</span></h1><p class="sub" id="sub">Weight-based adult emergency reference</p></div><button id="theme" title="Toggle dark mode">☀️ Light</button></div>',
 '<body class="dark">\n<div id="app"><nav id="side" aria-label="Sections"></nav><main id="main"><div id="printhead" class="printhead"></div>\n'
 '<div class="top"><div><h1>EM Toolkit <span id="pedsBadge" class="badge" hidden>PEDIATRIC</span></h1><p class="sub" id="sub">Weight-based adult emergency reference</p></div>'
 '<div class="hbtns"><button id="newPt" title="Clear all patient data">🆕 New patient</button><button id="theme" title="Toggle dark mode">☀️ Light</button></div></div>')
rep('<div class="sticky"><button id="emBtn" class="em">🚨 EMERGENCY – Crash card</button><div id="stat" class="stat"></div></div>',
 '<div class="sticky"><button id="emBtn" class="em">🚨 EMERGENCY – Crash card</button><div id="stat" class="stat"></div>'
 '<div id="plaus" class="plaus" role="alert"></div>'
 '<div class="navbar"><button id="navBtn" type="button" aria-controls="drawer" aria-expanded="false" aria-label="Open section menu">☰ <span id="curSec" class="cur">Sections</span></button>'
 '<div class="sbox"><input id="search" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="sres" placeholder="Search: STEMI, naloxone, box jelly…" autocomplete="off" aria-label="Search cards and topics">'
 '<div id="sres" role="listbox" hidden></div></div></div><div id="subnav" class="subnav" aria-label="Panels in this section"></div></div>')
rep('<label for="search">Quick find</label>\n<input id="search" type="search" list="cardList" placeholder="e.g. GCS, naloxone, Parkland…" autocomplete="off">\n<datalist id="cardList"></datalist>\n','')
i=s.index('<div class="tabs" id="tabs">'); j=s.index('</div>',i)+len('</div>'); s=s[:i]+s[j:]

# ---------- extract cards from old tox + more ----------
def card(cid):
    m=re.search(r'  <div class="card" data-card="%s".*?\n  </div>\n'%cid, s, re.S); assert m, cid; return m.group(0)
C={k:card(k) for k in ['anaph','naloxone','antidotes','hyperk','dka','apls','vitals','maint']}
for sid in ['tox','more']:
    i=s.index(f'<section id="tab-{sid}" hidden>'); j=s.index('</section>',i)+len('</section>'); s=s[:i]+s[j:]
s=s.replace('<!-- ============ TOX ============ -->\n','').replace('<!-- ============ MORE ============ -->\n','')
# hyperk quick card → Renal (before sources)
HK=C['hyperk'].replace('<a href="#" data-goto="rnhyperk">🫘 Renal tab →</a>','<a href="#" data-goto="rnhyperk">stepwise card ↑</a>')
rep('  <div class="card rn-src"', HK+'  <div class="card rn-src"')

tox=rd(os.path.join(N,'tox.html')).replace('@@NALOXONE@@',C['naloxone'].strip()).replace('@@ANTIDOTES@@',C['antidotes'].strip())
endo=rd(os.path.join(N,'endo.html')).replace('@@DKA@@',C['dka'].replace('DKA quick card</h2>','DKA quick card</h2><div class="note">Calculator: <a href="#" data-goto="hgcalc">anion gap, osmolality, DKA vs HHS ↑</a></div>',1).strip())
assert '@@' not in tox+endo
anaph='<!-- ============ S3 RESUSCITATION: ANAPHYLAXIS ============ -->\n<section id="tab-anaph" hidden>\n'+C['anaph']+'</section>\n'
pedsec='<!-- ============ S12 PEDIATRICS (v1 cards) ============ -->\n<section id="tab-peds" hidden>\n'+C['apls']+C['vitals']+C['maint']+'  <div class="note" style="margin:.5rem 0">Pediatric doses appear throughout the app in Pediatric mode (capped at the adult dose). Full Pediatrics section coming soon.</div>\n</section>\n'
stub='<section id="tab-stub" hidden><div id="o-stub"></div></section>\n'
newsecs='\n'.join([anaph, rd(os.path.join(N,'cardio.html')), rd(os.path.join(N,'ob.html')), pedsec, tox, rd(os.path.join(N,'env.html')), endo, rd(os.path.join(N,'ddx.html')), stub])
rep('<details class="card" id="review">', newsecs+'\n<details class="card" id="review">')

# ---------- footer ----------
rep('<p><b>Reference aid only – verify clinically.</b> Doses follow common guideline values (',
    '<p><b>Reference aid only – verify clinically.</b> Organised by the 26 major sections of <i>Tintinalli’s Emergency Medicine</i> 9e as a <b>topic map only</b>; all text is original and summarises public guidelines (AHA/ACC 2025 ACS, ESC 2023 ACS / 2021 HF, ACC/AHA 2017 HTN &amp; 2022 aortic, ERC 2021, WMS, WHO SEARO 2016 snakebite, DOH/RITM, UP-PGH NPMCC, UHMS/ACEP CO, ACOG, WHO PPH 2023, FIGO, ADA/EASD/JBDS 2024, ATA 2014/2016, Endocrine Society, AACT/EAPCCT, EXTRIP). Doses follow common guideline values (')
rep('<p>Works offline once loaded · data stays on this device (localStorage).</p>\n</footer>',
    '<p>Works offline once loaded · data stays on this device (localStorage).</p>\n<p><button id="printSample" type="button">🖨 Print sample sections (Cardio · OB · Tox · Environmental · Endocrine)</button> <button id="printAll" type="button">🖨 Print full toolkit</button></p>\n</footer>\n</main></div>\n'
    '<div id="drawer" class="drawer" hidden><div class="dpanel" role="dialog" aria-modal="true" aria-label="Sections"><div class="dhead"><b>Sections (Tintinalli 9e map)</b><button id="drawerX" type="button" aria-label="Close menu">✕</button></div>'
    '<input class="dfilter" id="dfilter" type="search" placeholder="Filter sections…" aria-label="Filter sections"><div id="dlist" class="slist"></div><div id="dlegend"></div></div></div>')

# ---------- engine patches ----------
rep("    const mt = typeof d.max==='function' ? d.maxText : (d.max!=null?`${fmt(d.max)} ${base}`:null);",
    "    const mt = (typeof d.max==='function' ? d.maxText : (d.max!=null?`${fmt(d.max)} ${base}`:null)) || (peds()&&d.amax!=null?`${fmt(d.amax)} ${base} (adult cap)`:null);")
rep("""    const mx = V(d.max,w);
    let lo=d.lo*w, hi=d.hi*w, capped=false;""","""    const mx0 = V(d.max,w), am = peds()&&d.amax!=null ? d.amax : null;
    const mx = mx0!=null&&am!=null ? Math.min(mx0,am) : (mx0!=null ? mx0 : am);
    let lo=d.lo*w, hi=d.hi*w, capped=false;""")
rep("""${d.min!=null?`, min ${fmt(d.min)} ${base}`:''}${capped?' (capped)':''}`);""",
    """${d.min!=null?`, min ${fmt(d.min)} ${base}`:''}${capped?(am!=null&&mx===am?' (capped at adult dose)':' (capped)'):''}`);
    if(am!=null && (mx0==null || am<mx0)) lines.push(`Adult cap ${fmt(am)} ${base}${vtag('peds-amax')}`);
    if(peds() && mx0==null && am==null) lines.push('<span class="vwarn">No adult cap defined – check against the adult dose</span>');""")
rep("function doseLine(d,w){ const r=doseCalc(d,w); ",
    "function doseLine(d,w){ const r=doseCalc(d,w); if(typeof PRINTMODE!=='undefined' && PRINTMODE && /^Enter (weight|age)/.test(r.main) && r.lines.length){ r.main=r.lines[0]; r.lines=r.lines.slice(1); } ")
# DKA adult vtags + notes
rep("""     <li>Resolution: pH ≥ 7.3, HCO₃⁻ ≥ 18 (or ketones &lt; 0.6 mmol/L). Give basal SC insulin 1–2 h before stopping the drip</li></ol>`;""",
    """     <li>Resolution: pH ≥ 7.3, HCO₃⁻ ≥ 18 (or ketones &lt; 0.6 mmol/L). Give basal SC insulin 1–2 h before stopping the drip</li></ol>
     <ul class="tight"><li><b>Euglycemic DKA</b> (glucose &lt; 250 mg/dL): SGLT2 inhibitors, pregnancy, starvation, low-carb diet – start dextrose with insulin from the outset; stop the SGLT2 inhibitor</li>
     <li><b>Mild DKA</b> (pH 7.25–7.30, alert, tolerating fluids): some protocols allow SC rapid-acting insulin in a monitored ward setting</li>
     <li><b>Alcoholic / starvation ketoacidosis</b>: glucose low–normal, high β-OHB, ± lactate – dextrose-containing fluids + thiamine; insulin rarely needed</li></ul>`;""")

# per-line vtags in the moved v1 DKA card
i=s.index('function renderDKA(w){'); j=s.index("  $('o-dka').innerHTML=h;",i)
blk=s[i:j]; a=blk.index('if(!P){'); e=blk.index('} else {')
ad=blk[a:e]; pe=blk[e:]
ad=re.sub(r'(?<!\$\{vtag\(\'en-dka-adult\'\)\})</li>', "${vtag('en-dka-adult')}</li>", ad)
pe=re.sub(r'</li>', "${vtag('dka-peds')}</li>", pe).replace("enter weight${vtag('dka-peds')}</li>'}", "enter weight'+vtag('dka-peds')+'</li>'}")
s=s[:i]+blk[:a]+ad+pe+s[j:]
# TABS / setTab
ALLP=[p for x in S for p,_ in x['panels']]+['ddx','stub']   # 'ddx' = DDx Assist tool panel (not tied to one section)
rep("const TABS=['resus','airway','neuro','sepsis','tox','trauma','renal','pulm','more'];", "const TABS="+json.dumps(ALLP)+";")
i=s.index('function setTab(t){'); j=s.index("document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.t)));\n")
j+=len("document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.t)));\n")
s=s[:i]+'function setTab(t,sid){ return navSetTab(t,sid); }\n'+s[j:]
i=s.index("$('cardList').innerHTML"); j=s.index('// ---------------- REVIEW LIST'); s=s[:i]+s[j:]
# inject JS
outline=[dict(id=x['id'],n=x['n'],title=x['title'],icon=x['icon'],status=x['status'],panels=[list(p) for p in x['panels']],topics=[list(t) for t in x['topics']],note=x['note']) for x in S]
nav=rd(os.path.join(N,'nav.js')); assert '/*@@OUTLINE_JSON@@*/[]' in nav
nav=nav.replace('/*@@OUTLINE_JSON@@*/[]', json.dumps(outline,ensure_ascii=False))
XORDER=['legacy','prehosp','disaster','resus','resusproc','analgesia','wound','gi','peds','id','neuro','heme','eent','derm','trauma','ortho','msk','psych','abuse','special']
XF=[f'x_{k}.js' for k in XORDER if os.path.exists(os.path.join(N,f'x_{k}.js'))]
js='\n'.join([nav,rd(os.path.join(N,'reg.js'))]+[rd(os.path.join(N,f)) for f in ['tox.js','ob.js','endo.js','cardio.js','env.js']+XF]+['orderSections();'])
print('section files:',XF)
rep('// ---------------- CRASH CARD ----------------', js+'\n// ---------------- CRASH CARD ----------------')
rep("  renderRenal(w); renderPulm(w);\n  if(emergency) renderCrash();","  renderRenal(w); renderPulm(w);\n  renderNew(w);\n  if(emergency) renderCrash();")
rep("  'pfPao2','pfFio2','lpP','lsP','lpL','lsL','lUln','roxS','roxF','roxR'];",
    "  'pfPao2','pfFio2','lpP','lsP','lpL','lsL','lUln','roxS','roxF','roxR',\n"
    "  'apapLvl','apapU','apapHrs','alcOsm','alcNa','alcGlu','alcBun','alcEtoh','obSbp','obDbp','pphHr','pphSbp','nbWt',\n"
    "  'hgNa','hgCl','hgHco3','hgGlu','hgGluU','hgBun','hgPh','hgBhb','hgK','bwT','bwC','bwG','bwH','bwF','bwA','bwP',\n"
    "  'stOnset','stFmc','stPci','heartH','heartE','heartR','heartT','adDd','ccTemp'].concat(NEWFIELDS);")
rep("applyMode(); renderReview();","initNew(); applyMode(); renderReview();")
rep("setTab(tab); renderAll(); renderFavs(); tickCode();","setTab(tab); renderAll(); renderFavs(); tickCode(); startupPrintParam(); startupDeepLink();")
open(os.path.join(ROOT,'index.html'),'w',encoding='utf-8').write(s)

# ---------- outline.md ----------
cnt=collections.Counter(c for x in S for _,c in x['topics']); T=sum(len(x['topics']) for x in S)
mark={'v1':'✅ v1','new':'🆕 new','merged':'🔀 merged','v1+new':'✅🆕 v1+new','v1+merged':'✅🔀 v1+merged','':'⬜'}
st={'built':'🆕 Built','merged':'🔀 Merged (Renal/Pulm worker)','v1':'✅ v1 cards ported','soon':'⬜ Coming soon'}
L=['# EM Toolkit – outline mapped to Tintinalli’s Emergency Medicine, 9th edition','',
 'Topic map only. The 26 section numbers and names were checked against the publisher’s table of contents (McGraw Hill, ISBN 9781260019933). Topic names are short paraphrases at topic-name level; no chapter numbers, chapter text, tables or figures from the book are reproduced. All app content is original and cites public guidelines.','',
 f'**{len(S)} sections · {T} topics** — status: '+', '.join(f"{v} {sum(1 for x in S if x['status']==k)}" for k,v in st.items()),'',
 'Topic coverage: '+' · '.join(f"{mark[k]} {cnt.get(k,0)}" for k in ['v1','new','merged','v1+new','v1+merged',''])+'','',
 '**Embedded tools** (drawer/sidebar › 🛠, searchable): 📈 ECG reader (`ecg/`, also panel `ecg` under S7) · 🩺 DDx Assist (`ddx/`, panel `ddx`; rule-based differential diagnosis support, not tied to one section). Cards can be deep-linked as `index.html#o-<cardId>`.','',
 '**Legend:** ✅ v1 = card already on the existing site, ported · 🆕 new = built in this slice · 🔀 merged = from the Renal/Pulmonary worker (emt-renal, branch add-renal-section, read-only) · ⬜ = not built (stub with planned topics) · (app) = app addition, not a separate 9e chapter.','']
for x in S:
    L.append(f"## S{x['n']} · {x['icon']} {x['title']} — {st[x['status']]}")
    if x['panels']: L.append('App panels: '+', '.join(f"`{p}` ({l})" for p,l in x['panels']))
    if x['note']: L.append(f"_{x['note']}_")
    L.append('')
    for t,c in x['topics']: L.append(f"- {t} — {mark.get(c,c)}")
    L.append('')
open(os.path.join(ROOT,'outline.md'),'w',encoding='utf-8').write('\n'.join(L))
print('built', len(s), 'chars;', len(S), 'sections;', T, 'topics;', dict(cnt))
