import json,re
from playwright.sync_api import sync_playwright
exec(open('test_all.py').read().split('R={}')[0].split('SEARCH=')[0])  # imports
DOSE=r'\d\s*(mg|mcg|g|units?|U|mL|mEq|mmol|IU|J|ampoules?|drops|tablets?)(?!\s*/\s*d?L)(/kg)?\b'
src=open('test_all.py').read(); VCHK=src[src.index('VCHK="""')+8:src.index('"""%DOSE')]%DOSE
out={}; ERR=[]
def txt(pg,cid): return pg.inner_text(f'[data-card="{cid}"]').replace('\n',' ')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport={'width':1280,'height':900})
    pg.on("pageerror",lambda e: ERR.append(str(e))); pg.on("console",lambda m: ERR.append(m.text) if m.type=="error" else None)
    pg.goto("file:///workspace/em-tintinalli/index.html"); pg.wait_for_timeout(600)
    pg.click("#modeSeg button[data-m=adult]"); pg.fill("#wt","120"); pg.fill("#age","40"); pg.select_option("#sex","m"); pg.fill("#ht","175"); pg.wait_for_timeout(200)
    pg.evaluate("setTab('special')"); t=txt(pg,'obesity'); out['obesity']=re.search(r'Total.*?BMI\D*[\d.]+',t).group(0)
    pg.evaluate("setTab('infect')")
    miss=[]
    for g in ['a','b','c1','c2']:
        pg.select_option('#dgGrp',g); pg.wait_for_timeout(100)
        miss+=pg.evaluate(VCHK,'[data-card=dengue]'.replace('[data-card=dengue]','#tab-infect'))
        out['dengue_'+g]=re.findall(r'\d+–\d+ mL/h|\d+ mL over',txt(pg,'dengue'))[:3]
    out['dengue_obese_note']='IBW' in txt(pg,'dengue')
    pg.evaluate("setTab('shock')")
    for k,v in {'abPH':'7.20','abCO2':'25','abHCO3':'10','abNa':'140','abCl':'100','abAlb':'2.0'}.items(): pg.fill('#'+k,v)
    pg.wait_for_timeout(150); out['abg']=re.search(r'Metabolic.*?Delta ratio [\d.]+ → [^C]+',txt(pg,'abg')).group(0)[:300]
    pg.click("#modeSeg button[data-m=peds]"); pg.fill("#wt","5"); pg.fill("#age","1"); pg.select_option("#ageUnit","mo"); pg.wait_for_timeout(150)
    pg.evaluate("setTab('pedsem')"); pg.fill('#fiDays','40'); pg.select_option('#fiUA','n'); pg.fill('#fiAnc','3000'); pg.fill('#fiPct','0.2'); pg.wait_for_timeout(150)
    out['febinf_low']=re.search(r'Low risk[^.]*|Not low risk[^:]*',txt(pg,'febinf')).group(0)
    pg.fill('#fiPct','1.2'); pg.wait_for_timeout(150); out['febinf_hi']=re.search(r'Not low risk[^:]*|Low risk[^.]*',txt(pg,'febinf')).group(0)
    out['amp_5kg']=re.search(r'Ampicillin.*?mg',txt(pg,'febinf')).group(0)[-40:]
    pg.fill("#wt","15"); pg.fill("#age","3"); pg.select_option("#ageUnit","y"); pg.wait_for_timeout(100)
    for k,v in {'wsStr':'2','wsRet':'2','wsAir':'1','wsCy':'0','wsLoc':'0'}.items(): pg.select_option('#'+k,v)
    pg.wait_for_timeout(100); t=txt(pg,'pedresp'); out['westley']=re.search(r'\d+ Westley.*?(Mild|Moderate|Severe)[^:]*',t).group(0)[:80]; out['dex15']=re.search(r'Dexamethasone – croup.*?mg',t).group(0)[-30:]; out['epi15']=re.search(r'Nebulized \d[\d.–]* mL',t).group(0) if re.search(r'Nebulized \d[\d.–]* mL',t) else re.search(r'epinephrine 1:1000.*?mL',t).group(0)[-40:]
    for c in ['kdConj','kdLips','kdRash','kdExt','kdFev']: pg.check(f'[data-nc={c}]')
    pg.wait_for_timeout(100); out['kawasaki']=re.search(r'Meets criteria[^→]*|Possible[^→]*|Criteria not met',txt(pg,'kawasaki')).group(0); t=txt(pg,'kawasaki'); i=t.find('IVIG –'); out['ivig15']=t[i:i+90]
    pg.check('[data-nc=ph_ams]') if False else None
    pg.select_option('#phAge','ge2'); pg.check('[data-nc=po_vom]'); pg.wait_for_timeout(100); out['pecarn_int']=re.search(r'(High|Intermediate|Very low) risk',txt(pg,'pecarnhead')).group(0)
    miss+=pg.evaluate(VCHK,'#tab-pedsem,#tab-infect,#tab-neuro,#tab-trauma,#tab-shock,#tab-proc,#tab-psych,#tab-abuse,#tab-special')
    pg.click("#modeSeg button[data-m=adult]"); pg.fill("#wt","70"); pg.wait_for_timeout(100)
    pg.evaluate("setTab('psych')")
    for i,(id_) in enumerate(['cwN','cwT','cwS','cwA','cwG']): pg.select_option('#'+id_,'4')
    pg.wait_for_timeout(100); t=txt(pg,'awd'); i=t.find('CIWA-Ar ('); out['ciwa']=t[max(0,i-6):i+120]
    pg.evaluate("setTab('trauma')"); pg.check('[data-nc=cl_sit]'); pg.check('[data-nc=cc_rot]'); pg.wait_for_timeout(100); out['ccs_low']=re.search(r'No imaging needed by rule|→ CT c-spine',txt(pg,'cspine')).group(0)
    pg.check('[data-nc=cc_age]'); pg.wait_for_timeout(100); out['ccs_hi']=re.search(r'High risk → CT c-spine|No imaging needed by rule',txt(pg,'cspine')).group(0)
    miss+=pg.evaluate(VCHK,'#tab-pedsem,#tab-infect,#tab-neuro,#tab-trauma,#tab-shock,#tab-proc,#tab-psych,#tab-abuse,#tab-special')
    out['verify_miss_with_inputs']=sorted(set(miss)); out['errors']=ERR
print(json.dumps(out,indent=1,ensure_ascii=False)); json.dump(out,open('test_calc_out.json','w'),indent=1,ensure_ascii=False)
