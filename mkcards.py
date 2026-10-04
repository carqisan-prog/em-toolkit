import json
from playwright.sync_api import sync_playwright
# section id -> (panel, mode, wt, age)
S=[('prehosp','prehosp'),('disaster','disaster'),('analgesia','analg'),('wound','wound'),('gi','gi'),('heme','heme'),('eent','eent'),('derm','derm'),('ortho','ortho'),('msk','msk'),('psych','psych'),('abuse','abuse'),('special','special'),
   ('peds','pedsem'),('id','infect'),('resus','shock'),('resusproc','proc'),('neuro','neuro'),('trauma','trauma')]
res={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    c=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2); pg=c.new_page()
    pg.goto("file:///workspace/em-tintinalli/index.html"); pg.wait_for_timeout(700)
    for sid,panel in S:
        pd = sid=='peds'
        pg.click(f"#modeSeg button[data-m={'peds' if pd else 'adult'}]"); pg.fill("#wt","15" if pd else "70"); pg.fill("#age","3" if pd else "45")
        if not pd: pg.select_option("#sex","m"); pg.fill("#ht","170")
        pg.evaluate(f"setTab('{panel}')"); pg.wait_for_timeout(200)
        pg.evaluate('''([panel,sid])=>{ document.querySelectorAll('body *').forEach(e=>{ const p=getComputedStyle(e).position; if(p==='sticky'||p==='fixed'){ e.dataset.qrPos=p; e.style.setProperty('position','static','important'); } });
          document.querySelectorAll('.qrhead').forEach(e=>e.remove());
          const s=SEC(PANEL_SEC[panel]); const sec=document.getElementById('tab-'+panel); const d=document.createElement('div'); d.className='qrhead';
          d.style.cssText='padding:10px 12px;margin:0 0 8px;border-radius:10px;background:#7f1d1d;color:#fff;font:600 15px system-ui';
          d.innerHTML=`EM Toolkit · S${s.n} ${s.title}<div style="font:400 11px system-ui;opacity:.9">Phone quick reference · ${peds()?'PEDIATRIC':'ADULT'} ${W()} kg example · ⚠ VERIFY = pending owner review · reference aid only · built ${new Date().toISOString().slice(0,10)}</div>`;
          sec.prepend(d); }''',[panel,sid]); pg.wait_for_timeout(100)
        el=pg.query_selector(f"#tab-{panel}"); h=el.bounding_box()['height']
        el.screenshot(path=f"cards/{sid}.png"); res[sid]=int(h)
        pg.evaluate("document.querySelectorAll('.qrhead').forEach(e=>e.remove())")
    c.close()
print(json.dumps(res))
