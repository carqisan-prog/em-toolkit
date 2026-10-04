import json, re, sys
from playwright.sync_api import sync_playwright
URL="file:///workspace/em-tintinalli/index.html"
SEARCH=json.load(open('/workspace/em-tintinalli/search_terms.json'))
DOSE=r'\d\s*(mg|mcg|g|units?|U|mL|mEq|mmol|IU|J|ampoules?|drops|tablets?)(?!\s*/\s*d?L)(/kg)?\b'
VCHK="""(sel)=>{ const re=new RegExp(%r,'i'); const miss=[];
  document.querySelectorAll(sel).forEach(sec=>{ sec.querySelectorAll('li,.cline,.drug,tr').forEach(e=>{
    if(e.closest('.printrev')||e.closest('[data-card$=src]')||e.closest('.topics')) return;
    if(e.matches('.drug') && e.querySelector('.cline')) { if(!e.querySelector('.vtag')) miss.push(sec.id+': '+e.innerText.slice(0,90)); return; }
    if(e.closest('.drug') && !e.matches('.drug')) return;
    if(re.test(e.innerText) && !e.querySelector('.vtag') && !(e.closest('li,tr')!==e && e.closest('li,tr') && e.closest('li,tr').querySelector('.vtag'))) miss.push(sec.id+': '+e.innerText.replace(/\\s+/g,' ').slice(0,110)); }); });
  return miss; }"""%DOSE
R={}; ERR=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for W,H in [(390,844),(1280,900)]:
        c=b.new_context(viewport={"width":W,"height":H}); pg=c.new_page()
        pg.on("console",lambda m,W=W: ERR.append(f"[{W}] {m.type}: {m.text}") if m.type in("error","warning") else None)
        pg.on("pageerror",lambda e,W=W: ERR.append(f"[{W}] pageerror: {e}"))
        pg.on("dialog",lambda d: d.accept())
        pg.goto(URL); pg.wait_for_timeout(700)
        tabs=pg.evaluate("TABS")
        ov={}
        for mode,wt,age in [('adult','70','45'),('peds','18','5')]:
            pg.click(f"#modeSeg button[data-m={mode}]"); pg.fill("#wt",wt); pg.fill("#age",age); pg.wait_for_timeout(150)
            for t in tabs:
                if t=='stub': continue
                pg.evaluate(f"setTab('{t}')"); pg.wait_for_timeout(60)
                sw=pg.evaluate("document.documentElement.scrollWidth")
                if sw>W: ov[f"{mode}:{t}"]=sw
            if W==1280:
                R[f'verify_missing_{mode}']=pg.evaluate(VCHK, ','.join('#tab-'+t for t in tabs if t!='stub'))
        R[f'overflow_{W}']=ov
        if W==390:
            pg.click("#navBtn"); pg.wait_for_timeout(200); R['drawer_sections']=pg.eval_on_selector_all("#dlist [data-nsec]","e=>e.length"); pg.keyboard.press("Escape")
            res={}
            for q,cid in SEARCH.items():
                pg.fill("#search",""); pg.type("#search",q,delay=5); pg.wait_for_timeout(120)
                n=pg.eval_on_selector_all("#sres [role=option]","e=>e.length")
                pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
                okk=any(pg.evaluate(f"(()=>{{const c=document.querySelector('[data-card=\"{x}\"]'); return !!c && !c.closest('section').hidden;}})()") for x in (cid if isinstance(cid,list) else [cid]))
                if not (n and okk): res[q]=f"results={n} navigated={okk}"
            R['search_fail']=res; R['search_tested']=len(SEARCH)
            pg.evaluate("setTab('peds')")
            pg.click("#newPt"); pg.wait_for_timeout(200)
            R['newpatient_fields_left']=pg.evaluate("FIELDS.filter(id=>{const e=document.getElementById(id); return e && e.tagName!=='SELECT' && e.value!==''})")
        else:
            R['peds_bolus_without_cap']=pg.evaluate("Object.entries(D).flatMap(([k,x])=>(x.p||x.b||[]).map((d,i)=>[k,i,d]).filter(([k,i,d])=>d.type==='bolus'&&d.max==null&&d.amax==null).map(([k,i,d])=>k+'['+i+'] '+d.label))")
            R['drugs_without_flag']=pg.evaluate("Object.entries(D).filter(([k,x])=>!x.flag && !(x.a||x.p||x.b||[]).every(d=>d.flag)).map(([k])=>k)")
            R['missing_review_keys']=pg.evaluate("[...new Set([...document.querySelectorAll('.vtag[data-vk]')].map(e=>e.dataset.vk).filter(k=>!REVIEW[k]))]")
            R['broken_goto']=pg.evaluate("[...new Set([...document.querySelectorAll('[data-goto]')].map(e=>e.dataset.goto).filter(k=>!CARDS[k]))]")
            R['review_count']=pg.evaluate("Object.keys(REVIEW).length"); R['cards']=pg.evaluate("Object.keys(CARDS).length"); R['tabs']=len(tabs)
            R['stub_sections']=pg.evaluate("SECTIONS.filter(s=>s.status==='soon').map(s=>s.id)")
        c.close()
    R['console_errors']=ERR
s=json.dumps(R,indent=1,ensure_ascii=False); open('/workspace/em-tintinalli/test_all_out.json','w').write(s)
for k,v in R.items():
    print(k,'=>',(json.dumps(v,ensure_ascii=False) if not isinstance(v,list) or len(v)<12 else f'{len(v)} items: '+json.dumps(v[:40],ensure_ascii=False))[:6000])
