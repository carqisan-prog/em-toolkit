// =====================================================================
// DDx Assist – engine: derive findings → score conditions → clinical scores → note.
// Pure functions (no DOM) so the same code runs in the browser and in node tests.
// =====================================================================
'use strict';
const CC_MAP = {
  'Chest pain':['chest_pain'], 'Shortness of breath':['dyspnea'], 'Fever':['fever'], 'Abdominal pain':['abd_pain'], 'Headache':['headache'],
  'Altered sensorium':['confusion'], 'One-sided weakness / stroke symptoms':['focal_weak'], 'Seizure':['seizure'], 'Syncope / collapse':['syncope'],
  'Diarrhea / vomiting':['diarrhea','vomiting'], 'Cough':['cough'], 'Palpitations':['palpitations'], 'Vaginal bleeding':['vag_bleed'], 'Flank pain':['flank_pain'],
  'Dysuria / urinary symptoms':['dysuria'], 'Vomiting blood / melena':['hematemesis'], 'Rectal bleeding':['hematochezia'], 'Allergic reaction':['urticaria'],
  'Poisoning / overdose':['overdose'], 'Snakebite':['snake_bite'], 'Animal bite':['animal_bite'], 'Sore throat':['sore_throat'], 'Jaundice':['jaundice'],
  'Leg swelling':['dvt_signs'], 'Dizziness / vertigo':['dizziness'], 'High blood sugar':['polyuria'], 'Rash':['rash'], 'Scrotal pain':['testis_pain'], 'Joint pain / swelling':['hot_joint']
};
const num = v => (v===''||v==null||isNaN(+v)) ? null : +v;

// ---------- free-text extraction ----------
const LEXRE = LEX.map(([src,ids]) => [new RegExp('(?:^|[^a-z\\u00f1])('+src+')(?=$|[^a-z\\u00f1])','gi'), ids, src]);
const TL_NUM = {isang:1,isa:1,dalawang:2,dalawa:2,tatlong:3,tatlo:3,'apat na':4,apat:4,limang:5,lima:5,'anim na':6,anim:6,pitong:7,pito:7,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,ten:10};
function extract(text){
  const t = (text||'').toLowerCase().replace(/\s+/g,' ');
  const hits = []; const byId = {};
  if(!t.trim()) return {hits, f:byId, duration:null};
  for(const [re, ids] of LEXRE){
    re.lastIndex = 0; let m;
    while((m = re.exec(t))){
      const term = m[1]; const start = m.index + m[0].indexOf(term);
      const pre = t.slice(Math.max(0,start-40), start);
      const clause = pre.split(/[.;,!?]| pero | but | kaya /).pop();
      const neg = NEG_CUES.test(clause);
      hits.push({term, ids, neg});
      ids.forEach(id => { if(neg){ if(byId[id]!==1) byId[id]=-1; } else byId[id]=1; });
      if(re.lastIndex===m.index) re.lastIndex++;
    }
  }
  // duration (first match)
  let duration=null;
  const dm = t.match(/(\d+(?:\.\d+)?|isang|isa|dalawang|dalawa|tatlong|tatlo|apat na|apat|limang|lima|anim na|anim|pitong|pito|one|two|three|four|five|six|seven|ten)\s*(?:na\s*)?(araw|days?|d|hrs?|hours?|oras|linggo|weeks?|wks?)\b/);
  if(dm){ const n = isNaN(+dm[1]) ? TL_NUM[dm[1]] : +dm[1]; const u = /^(araw|day|days|d)$/.test(dm[2])?'d':/^(linggo|week|weeks|wk|wks)$/.test(dm[2])?'wk':'h'; duration={n,u,term:dm[0]}; }
  else { const rm = t.match(/\b(kahapon|kagabi|yesterday|last night|kaninang umaga|kanina|this morning|earlier today|noong isang linggo|last week)\b/);
    if(rm){ const k=rm[1]; duration = /kahapon|kagabi|yesterday|last night/.test(k)?{n:1,u:'d',term:k}:/linggo|week/.test(k)?{n:1,u:'wk',term:k}:{n:6,u:'h',term:k}; } }
  // de-duplicate hits by term
  const seen=new Set(); const uh=[]; hits.forEach(h=>{const k=h.term+'|'+h.neg; if(!seen.has(k)){seen.add(k); uh.push(h);} });
  return {hits:uh, f:byId, duration};
}

// ---------- derive the finding map from raw input ----------
function derive(I){
  const F = {}, SRC = {};
  const set = (id,v,src,force) => { if(force || F[id]==null){ F[id]=v; SRC[id]=src; } };
  const ex = extract(I.text);
  Object.entries(ex.f).forEach(([id,v]) => set(id,v,'text',true));
  (CC_MAP[I.cc]||[]).forEach(id => set(id,1,'cc',true));
  Object.entries(I.chips||{}).forEach(([id,v]) => { if(v===1||v===-1) set(id,v,'form',true); });
  const age = num(I.age), sex = I.sex||'', v = I.v||{}, L = I.lab||{};
  const dv = (id, cond, known) => { if(known) set(id, cond?1:-1, 'derived', !(I.chips||{})[id]); };
  // demographics
  if(age!=null){ dv('age_ge50',age>=50,1); dv('age_ge65',age>=65,1); dv('age_lt40',age<40,1); dv('age_lt16',age<16,1); }
  if(sex){ dv('male',sex==='M',1); dv('female',sex==='F',1); if(age!=null) dv('repro_f', sex==='F'&&age>=12&&age<=50, 1); }
  if(sex==='F' && I.preg==='possible' && F.amenorrhea==null) set('amenorrhea',1,'form');
  if(sex==='F' && I.preg==='no' && F.hcg_neg==null && F.hcg_pos!==1) set('hcg_neg',1,'form');
  if(sex==='F' && I.preg==='yes' && F.hcg_pos==null) set('hcg_pos',1,'form');
  const pregnant = sex==='F' && (I.preg==='yes' || F.hcg_pos===1);
  if(sex) dv('pregnant', pregnant, 1);
  const ga = num(I.ga); if(pregnant && ga!=null) dv('ga_ge20', ga>=20, 1);
  // onset / duration
  if(I.onset) dv('onset_sudden', I.onset==='sudden', 1);
  let durH = null; const d = num(I.dur);
  if(d!=null){ durH = d * ({h:1,d:24,wk:168}[I.durU||'d']); }
  else if(ex.duration && ex.duration.n){ durH = ex.duration.n * ({h:1,d:24,wk:168}[ex.duration.u]); }
  if(durH!=null){ dv('dur_lt24h',durH<24,1); dv('dur_le7d',durH<=168,1); dv('dur_gt7d',durH>168,1); dv('dur_ge14d',durH>=336,1); }
  const fd = num(I.feverDay); if(fd!=null) dv('fever_d3_7', fd>=3&&fd<=7, 1);
  // vitals
  const hr=num(v.hr), sbp=num(v.sbp), dbp=num(v.dbp), rr=num(v.rr), T=num(v.t), sp=num(v.spo2), gcs=num(v.gcs);
  let glu=num(v.glu); if(glu!=null && v.gluU==='mmol') glu = glu*18;
  if(hr!=null){ dv('hr_gt100',hr>100,1); dv('hr_ge125',hr>=125,1); dv('hr_lt60',hr<60,1); }
  if(sbp!=null){ dv('sbp_lt90',sbp<90,1); dv('sbp_le100',sbp<=100,1); }
  if(dbp!=null) dv('dbp_le60',dbp<=60,1);
  if(sbp!=null||dbp!=null){ dv('htn_sev',(sbp||0)>=180||(dbp||0)>=120,1); dv('bp_ge140',(sbp||0)>=140||(dbp||0)>=90,1); }
  if(sbp!=null&&dbp!=null) dv('narrow_pp', sbp-dbp<=20, 1);
  if(hr!=null&&sbp!=null&&sbp>0) dv('si_ge1', hr/sbp>=1, 1);
  if(rr!=null){ dv('rr_ge22',rr>=22,1); dv('rr_ge30',rr>=30,1); dv('rr_lt12',rr<12,1); }
  if(T!=null){ dv('t_ge38',T>=38,1); dv('t_ge39',T>=39,1); dv('t_ge40',T>=40,1); dv('t_lt36',T<36,1); }
  if(T!=null&&hr!=null) dv('rel_brady', T>=38.5&&hr<100, 1);
  if(sp!=null){ dv('spo2_lt94',sp<94,1); dv('spo2_lt90',sp<90,1); }
  if(gcs!=null){ dv('gcs_lt15',gcs<15,1); dv('gcs_le8',gcs<=8,1); }
  if(glu!=null){ dv('glu_high',glu>250,1); dv('glu_vhigh',glu>600,1); dv('glu_low',glu<70,1); }
  // labs
  const wbc=num(L.wbc), neut=num(L.neut), plt=num(L.plt), lac=num(L.lactate); let urea=num(L.urea);
  if(wbc!=null){ dv('wbc_high',wbc>10,1); dv('wbc_vhigh',wbc>15,1); dv('wbc_low',wbc<5,1); }
  if(neut!=null) dv('neut_high',neut>75,1);
  if(plt!=null) dv('plt_low',plt<=100,1);
  let ureaMmol = urea==null?null:(L.ureaU==='bun' ? urea/2.8 : urea);
  if(ureaMmol!=null) dv('urea_high', ureaMmol>7, 1);
  if(lac!=null){ dv('lactate_high',lac>=2,1); dv('lactate_4',lac>=4,1); }
  if(F.fever===1||F.t_ge38===1) F.fever_any=1;
  return {F, SRC, ex, ctx:{age, sex, pregnant, ga, f:F}, n:{age,hr,sbp,dbp,rr,T,sp,gcs,glu,wbc,neut,plt,lac,ureaMmol,o2:!!v.o2,durH,fd}};
}

// ---------- score every condition ----------
function scoreAll(D){
  const F = D.F, out = [], excluded = [];
  for(const c of KB){
    const considered = c.g.some(id => F[id]===1);
    if(!considered) continue;
    const exr = c.ex ? c.ex(D.ctx) : null;
    if(exr){ excluded.push({id:c.id, n:c.n, why:exr}); continue; }
    let s = c.p||0; const pro=[], con=[];
    for(const [id,w] of Object.entries(c.w)){ if(F[id]===1){ s+=w; (w>=0?pro:con).push({id,w,l:FLABEL[id]}); } }
    for(const [id,w] of Object.entries(c.a||{})){ if(F[id]===-1){ s+=w; con.push({id,w,l:'no '+FLABEL[id]}); } }
    const notes=[];
    if(c.id==='hypogly' && D.n.glu==null && (F.confusion===1||F.seizure===1||F.gcs_lt15===1)){ s+=1.5; pro.push({id:'glu_unk',w:1.5,l:'Glucose not entered with altered mentation'}); notes.push('Check capillary glucose now.'); }
    if(c.id==='sepsis'){ const q=qsofa(D); if(q.v>=2){ s+=1; pro.push({id:'qsofa',w:1,l:'qSOFA ≥ 2'}); } }
    pro.sort((a,b)=>b.w-a.w); con.sort((a,b)=>a.w-b.w);
    const red = (c.rf||[]).filter(id=>F[id]===1).map(id=>FLABEL[id]);
    const ask = Object.entries(c.w).filter(([id,w])=>w>=2 && F[id]==null && FGROUP_OF[id]).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([id])=>FLABEL[id]);
    out.push({c, id:c.id, s:Math.round(s*10)/10, pro, con, red, ask, notes});
  }
  out.sort((a,b)=>b.s-a.s || (b.c.mnm-a.c.mnm));
  const ddx = out.filter(r=>r.s>=2).slice(0,10);
  ddx.forEach((r,i)=>r.rank=i+1);
  const mnm = out.filter(r=>r.c.mnm && r.s>=2).slice(0,6);
  return {all:out, ddx, mnm, excluded};
}
const tier = s => s>=8?'High':s>=5?'Moderate':'Low';

// ---------- clinical scores ----------
function qsofa(D){ const n=D.n,F=D.F, miss=[]; let v=0;
  if(n.rr==null) miss.push('RR'); else if(n.rr>=22) v++;
  if(n.sbp==null) miss.push('SBP'); else if(n.sbp<=100) v++;
  if(n.gcs==null && F.confusion==null) miss.push('mentation'); else if((n.gcs!=null&&n.gcs<15)||F.confusion===1) v++;
  return {v, miss}; }
function computeScores(D, R){
  const F=D.F, n=D.n, S=[]; const yes=id=>F[id]===1; const top = new Set(R.all.slice(0,8).map(r=>r.id));
  const add = o => S.push(o);
  // NEWS2
  { const miss=[]; let v=0, red3=false; const p=(x,pts)=>{ v+=pts; if(pts===3) red3=true; };
    if(n.rr==null) miss.push('RR'); else p('rr', n.rr<=8?3:n.rr<=11?1:n.rr<=20?0:n.rr<=24?2:3);
    if(n.sp==null) miss.push('SpO₂'); else p('sp', n.sp<=91?3:n.sp<=93?2:n.sp<=95?1:0);
    if(n.o2) v+=2;
    if(n.sbp==null) miss.push('SBP'); else p('sbp', n.sbp<=90?3:n.sbp<=100?2:n.sbp<=110?1:n.sbp<=219?0:3);
    if(n.hr==null) miss.push('HR'); else p('hr', n.hr<=40?3:n.hr<=50?1:n.hr<=90?0:n.hr<=110?1:n.hr<=130?2:3);
    if(n.gcs==null && F.confusion==null) miss.push('consciousness'); else if((n.gcs!=null&&n.gcs<15)||F.confusion===1) p('c',3);
    if(n.T==null) miss.push('Temp'); else p('t', n.T<=35?3:n.T<=36?1:n.T<=38?0:n.T<=39?1:2);
    if(miss.length<6) add({id:'news2', name:'NEWS2', v, max:20, miss, interp: v>=7?'High clinical risk – emergency assessment':v>=5?'Medium risk – urgent review':red3?'Low–medium (single parameter = 3)':'Low risk', lvl:v>=7?3:v>=5?2:red3?1:0, src:'RCP 2017 (intl)'}); }
  // shock index
  if(n.hr!=null&&n.sbp) { const si=Math.round(n.hr/n.sbp*100)/100; add({id:'si', name:'Shock index', v:si, interp: si>=1?'≥ 1.0 – occult shock / high risk':si>=0.7?'0.7–0.99 – borderline':'< 0.7 normal', lvl:si>=1?3:si>=0.7?1:0, src:'HR/SBP'}); }
  // qSOFA
  if(yes('fever_any')||yes('t_lt36')||top.has('sepsis')){ const q=qsofa(D); add({id:'qsofa', name:'qSOFA', v:q.v, max:3, miss:q.miss, interp:q.v>=2?'≥ 2 – high risk of poor outcome; screen for sepsis/organ dysfunction':'< 2 (does not exclude sepsis)', lvl:q.v>=2?3:0, src:'Sepsis-3 2016 (intl)'}); }
  // CURB-65 + PCAP
  if(top.has('cap')||yes('cxr_consol')||yes('crackles_focal')){
    const miss=[]; let v=0;
    if(n.gcs==null&&F.confusion==null) miss.push('confusion'); else if(yes('confusion')||(n.gcs!=null&&n.gcs<15)) v++;
    if(n.ureaMmol==null) miss.push('urea'); else if(n.ureaMmol>7) v++;
    if(n.rr==null) miss.push('RR'); else if(n.rr>=30) v++;
    if(n.sbp==null&&n.dbp==null) miss.push('BP'); else if((n.sbp!=null&&n.sbp<90)||(n.dbp!=null&&n.dbp<=60)) v++;
    if(n.age==null) miss.push('age'); else if(n.age>=65) v++;
    add({id:'curb65', name:'CURB-65', v, max:5, miss, interp: v>=3?'3–5: severe – consider ICU':v===2?'2: moderate – admit':'0–1: low', lvl:v>=3?3:v===2?2:0, src:'BTS (intl) – PH uses PCAP risk below'});
    const mod=[]; if(n.rr!=null&&n.rr>=30) mod.push('RR ≥ 30'); if(n.hr!=null&&n.hr>=125) mod.push('HR ≥ 125'); if(n.T!=null&&(n.T>=40||n.T<=36)) mod.push('T ≥ 40 or ≤ 36');
    if((n.sbp!=null&&n.sbp<90)||(n.dbp!=null&&n.dbp<60)) mod.push('SBP < 90 or DBP < 60'); if(yes('confusion')||(n.gcs!=null&&n.gcs<15)) mod.push('altered mental state');
    const high=[]; if(n.sbp!=null&&n.sbp<90&&(n.lac==null||n.lac>=2)) high.push('hypotension (possible septic shock)'); if(n.lac!=null&&n.lac>=4) high.push('lactate ≥ 4'); if(n.gcs!=null&&n.gcs<=8) high.push('GCS ≤ 8 (airway / ventilation)'); if(n.o2&&n.sp!=null&&n.sp<90) high.push('SpO₂ < 90 % on O₂');
    const cls = high.length? 'HIGH risk (ICU)' : mod.length? 'MODERATE risk (admit ward)' : 'LOW risk (outpatient) – if no decompensated comorbidity / aspiration / multilobar or effusion on CXR';
    add({id:'pcap', name:'PCAP 2016 risk class', v:high.length?'High':mod.length?'Moderate':'Low', interp:cls, details:[...mod,...high].join(' · ')||'no moderate-risk criteria entered', miss:['suspected aspiration','decompensated comorbidity','CXR extent (multilobar / effusion / abscess)'].map(x=>x+' – judge clinically'), lvl:high.length?3:mod.length?2:0, src:'PCAP 2016 (PH CPG)'});
  }
  // Wells PE + PERC
  if(top.has('pe')||yes('cp_pleuritic')||(yes('dyspnea')&&yes('hr_gt100'))){
    let v=0; const it=[]; const w=(c,p,l)=>{ if(c){ v+=p; it.push(l+' +'+p);} };
    w(yes('dvt_signs'),3,'DVT signs'); w(yes('hr_gt100'),1.5,'HR > 100'); w(yes('immobil'),1.5,'immobilization/surgery'); w(yes('dvt_hx'),1.5,'prior DVT/PE'); w(yes('hemoptysis'),1,'hemoptysis'); w(yes('malignancy'),1,'cancer');
    const judged = D.peLikely; if(judged){ v+=3; it.push('PE most likely +3'); }
    add({id:'wells', name:'Wells (PE)', v, max:12.5, interp:(v>4?'> 4: PE likely → CTPA':'≤ 4: PE unlikely → D-dimer (PERC if gestalt low)')+(judged?'':' · add +3 if PE is the most likely diagnosis (tick in Bedside results)'), details:it.join(', ')||'no Wells items', lvl:v>4?3:v>=2?1:0, src:'ESC 2019 (intl)'});
    const perc=[]; const pm=[]; if(n.age==null) pm.push('age'); else if(n.age>=50) perc.push('age ≥ 50'); if(n.hr==null) pm.push('HR'); else if(n.hr>=100) perc.push('HR ≥ 100'); if(n.sp==null) pm.push('SpO₂'); else if(n.sp<95) perc.push('SpO₂ < 95');
    ['hemoptysis','m_estrogen','dvt_hx','dvt_signs','immobil'].forEach(id=>{ if(yes(id)) perc.push(FLABEL[id]); });
    add({id:'perc', name:'PERC', v:perc.length?'Positive':'Negative', interp: perc.length? 'PERC positive ('+perc.join(', ')+') – cannot rule out without testing' : (pm.length?'Incomplete':'All 8 negative – if gestalt < 15 %, PE ruled out without D-dimer'), miss:pm, lvl:perc.length?1:0, src:'Kline 2004 (intl)'});
  }
  // HEART
  if(yes('chest_pain')||yes('cp_pressure')){
    const sus=['cp_pressure','cp_radiate','diaphoresis','cp_exertional','nausea'].filter(yes).length - ['cp_pleuritic','cp_positional'].filter(yes).length;
    const H = sus>=3?2:sus>=1?1:0;
    let E=null; if(yes('ecg_ste')||yes('ecg_std')) E=2; else if(yes('ecg_af')||yes('ecg_diffuse')||yes('ecg_rv')) E=1; else if(F.ecg_ste===-1||F.ecg_std===-1) E=0;
    const A = n.age==null?null: n.age>=65?2:n.age>=45?1:0;
    const rfN=['htn','dm','smoker','dyslipid','obesity','fam_cad'].filter(yes).length; const Rk = (yes('cad')||yes('stroke_hx')||rfN>=3)?2:rfN>=1?1:0;
    let T=null; if(yes('trop_pos')) T=2; else if(F.trop_pos===-1) T=0;
    const v=H+(E||0)+(A||0)+Rk+(T||0); const miss=[]; if(E==null) miss.push('ECG (assumed 0)'); if(A==null) miss.push('age'); if(T==null) miss.push('troponin (assumed 0)');
    add({id:'heart', name:'HEART', v, max:10, miss, details:`H${H} E${E??'?'} A${A??'?'} R${Rk} T${T??'?'} (history auto-estimated from features)`, interp: v>=7?'7–10: high risk – early invasive':v>=4?'4–6: moderate – admit/observe, serial troponin':'0–3: low risk (if serial troponin negative)', lvl:v>=7?3:v>=4?2:0, src:'Six 2008 · PHA 2014 (PH CPG)'});
    // ADD-RS
    const c1 = yes('ctd')?1:0, c2 = (yes('cp_back')||(yes('onset_sudden')&&(yes('chest_pain')||yes('abd_back'))))?1:0, c3=(yes('pulse_deficit')||yes('murmur')||yes('sbp_lt90')||(yes('focal_weak')&&yes('chest_pain')))?1:0;
    const ad=c1+c2+c3; add({id:'addrs', name:'ADD-RS (aortic dissection)', v:ad, max:3, interp: ad>=2?'≥ 2: high risk – CT aortography':ad===1?'1: intermediate – D-dimer / imaging per gestalt':'0: low risk', lvl:ad>=2?3:ad===1?1:0, src:'ESC 2024 / ADvISED (intl)'});
  }
  // Centor / McIsaac
  if(yes('sore_throat')){ let v=0; const it=[]; const c=(x,l,p=1)=>{ if(x){ v+=p; it.push(l);} };
    c(n.T!=null?n.T>38:yes('fever'),'fever > 38'); c(F.cough===-1||(F.cough==null&&false),'no cough'); c(yes('cerv_nodes'),'tender nodes'); c(yes('exudate'),'exudate/swelling');
    if(n.age!=null){ if(n.age>=3&&n.age<=14){v++;it.push('age 3–14');} else if(n.age>=45){v--;it.push('age ≥ 45 −1');} }
    add({id:'centor', name:'Centor / McIsaac', v, max:5, details:it.join(', ')+(F.cough==null?' (cough not marked absent → 0)':''), interp: v>=4?'≥ 4: test (RADT) / treat if positive':v>=2?'2–3: RADT/culture':'0–1: no test, no antibiotic', lvl:v>=4?2:v>=2?1:0, src:'IDSA 2012 (intl)'}); }
  // Alvarado
  if(yes('abd_pain')||yes('rlq_pain')||yes('rlq_tender')){ let v=0; const it=[], miss=[]; const c=(x,l,p=1)=>{ if(x){v+=p; it.push(l+(p>1?' +'+p:''));} };
    c(yes('migration'),'migration'); c(yes('anorexia'),'anorexia'); c(yes('nausea')||yes('vomiting'),'N/V'); c(yes('rlq_tender'),'RLQ tenderness',2); c(yes('rebound'),'rebound');
    if(n.T==null) miss.push('temp'); else c(n.T>=37.3,'T ≥ 37.3');
    if(n.wbc==null) miss.push('WBC'); else c(n.wbc>10,'WBC > 10k',2); if(n.neut==null) miss.push('neutrophil %'); else c(n.neut>75,'left shift');
    add({id:'alvarado', name:'Alvarado', v, max:10, miss, details:it.join(', '), interp: v>=7?'7–10: appendicitis probable – surgical consult':v>=5?'5–6: possible – imaging (US/CT)':'≤ 4: unlikely (does not exclude)', lvl:v>=7?3:v>=5?2:0, src:'Alvarado 1986 · WSES 2020 (intl)'}); }
  // Dengue classification
  const den = R.all.find(r=>r.id==='dengue');
  if(den && den.s>=3) add(dengueClass(D));
  return S;
}
function dengueClass(D){
  const F=D.F, n=D.n, y=id=>F[id]===1;
  const ws=[]; if(y('abd_pain')||y('epi_tender')||y('murphy')||y('hepatomegaly')&&false) ws.push('abdominal pain / tenderness'); if(y('persist_vomit')) ws.push('persistent vomiting');
  if(y('ascites')) ws.push('clinical fluid accumulation'); if(y('bleeding')||y('bleed_site')) ws.push('mucosal bleeding'); if(y('lethargy')||y('confusion')) ws.push('lethargy / restlessness');
  if(y('hepatomegaly')) ws.push('liver enlargement > 2 cm'); if(y('hct_rise')&&y('plt_low')) ws.push('rising Hct with rapid platelet fall'); else if(y('hct_rise')) ws.push('rising Hct');
  const sev=[]; if(y('sbp_lt90')||y('narrow_pp')||y('cool_periph')||y('si_ge1')) sev.push('shock / severe plasma leakage'); if(y('spo2_lt90')&&y('dyspnea')) sev.push('respiratory distress from fluid accumulation');
  if(y('hematemesis')||y('melena')||y('hematochezia')) sev.push('severe bleeding'); if(y('gcs_lt15')) sev.push('impaired consciousness'); if(y('jaundice')||y('bili_high')) sev.push('liver involvement'); if(y('cr_high')||y('oliguria')) sev.push('renal impairment');
  const co=[]; if(D.ctx.pregnant) co.push('pregnancy'); if(n.age!=null&&(n.age<1||n.age>=60)) co.push('infancy / older age'); ['dm','ckd','hf','obesity','cirrhosis','immuno','htn'].forEach(id=>{ if(y(id)) co.push(FLABEL[id].toLowerCase()); });
  const g = sev.length?'C':(ws.length||co.length)?'B':'A';
  const lab = {A:'Group A – may be sent home (if tolerating oral fluids, voiding, no warning signs)', B:'Group B – refer for in-hospital care', C:'Group C – severe dengue: emergency treatment'}[g];
  return {id:'dengueclass', name:'Dengue classification (WHO 2009 / DOH)', v:'Group '+g, interp:lab, details:[sev.length?'Severe: '+sev.join(', '):'', ws.length?'Warning signs: '+ws.join(', '):'No warning signs entered', co.length?'Coexisting: '+co.join(', '):''].filter(Boolean).join(' · '), lvl:g==='C'?3:g==='B'?2:0, src:'DOH 2011 / WHO 2009 (PH CPG)'};
}
function alerts(D){
  const n=D.n, a=[];
  if(n.sbp!=null&&n.sbp<90) a.push('SBP < 90 – shock: resuscitate now');
  if(n.sp!=null&&n.sp<90) a.push('SpO₂ < 90 % – oxygen / airway');
  if(n.gcs!=null&&n.gcs<=8) a.push('GCS ≤ 8 – protect airway');
  if(n.glu!=null&&n.glu<70) a.push('Glucose < 70 mg/dL – give dextrose now');
  if(n.rr!=null&&(n.rr>=30||n.rr<8)) a.push('RR '+n.rr+' – respiratory failure risk');
  if(n.hr!=null&&(n.hr>=140||n.hr<40)) a.push('HR '+n.hr+' – unstable rhythm? ECG now');
  if(n.T!=null&&n.T>=40) a.push('T ≥ 40 °C – hyperthermia: cool, consider heat stroke / sepsis / storm');
  if(n.sbp!=null&&n.sbp>=220) a.push('SBP ≥ 220 – check for hypertensive emergency');
  return a;
}
// ---------- chart note ----------
const V2T = s => s.replace(/\[V\]/g,'⚠VERIFY');
function chartNote(I, D, R, scores, planIds){
  const F=D.F, n=D.n, L=[]; const now=new Date();
  const lbl = id => FLABEL[id]||id;
  const pos = g => FGROUPS[g].f.filter(([id])=>F[id]===1).map(([id,l])=>l);
  const negs = g => FGROUPS[g].f.filter(([id])=>F[id]===-1).map(([id,l])=>l);
  L.push('ED NOTE – DRAFT generated by DDx Assist (rule-based decision support; verify everything) – '+now.toLocaleString());
  const pt = [n.age!=null?n.age+' y':'age ?', I.sex==='M'?'M':I.sex==='F'?'F':'sex ?']; if(I.sex==='F'&&I.preg&&I.preg!=='unk') pt.push({yes:'pregnant'+(I.ga?' '+I.ga+' wk':''),no:'not pregnant (test neg)',possible:'possible pregnancy (late period)',na:''}[I.preg]||'');
  L.push('PATIENT: '+pt.filter(Boolean).join(', '));
  L.push('CC: '+(I.cc||'—')+(n.durH!=null?' × '+(I.dur?I.dur+' '+({h:'h',d:'d',wk:'wk'}[I.durU||'d']):Math.round(n.durH/24)+' d'):'')+(I.onset?' · onset '+I.onset:'')+(n.fd!=null?' · fever day '+n.fd:''));
  const hp=[], hn=[]; ['hx_gen','hx_cr','hx_gi','hx_gu','hx_neuro','hx_exp'].forEach(g=>{ hp.push(...pos(g)); hn.push(...negs(g)); });
  L.push('HPI: (+) '+(hp.join(', ')||'—')+(hn.length?' | (−) '+hn.join(', '):''));
  if((I.text||'').trim()) L.push('Narrative: '+I.text.trim().replace(/\s+/g,' '));
  const pm=pos('pmh'), pmn=negs('pmh'); L.push('PMH / RF: '+(pm.join(', ')||'none entered')+(pmn.length?' | (−) '+pmn.join(', '):''));
  const md=pos('meds'); L.push('Meds: '+([...md, (I.meds||'').trim()].filter(Boolean).join(', ')||'none entered'));
  const v=I.v||{}; const vs=[]; if(v.hr) vs.push('HR '+v.hr); if(v.sbp||v.dbp) vs.push('BP '+(v.sbp||'?')+'/'+(v.dbp||'?')); if(v.rr) vs.push('RR '+v.rr); if(v.t) vs.push('T '+v.t+' °C'); if(v.spo2) vs.push('SpO₂ '+v.spo2+' %'+(v.o2?' on O₂':' RA')); if(v.gcs) vs.push('GCS '+v.gcs); if(v.glu) vs.push('CBG '+v.glu+' '+(v.gluU==='mmol'?'mmol/L':'mg/dL'));
  L.push('VITALS: '+(vs.join(', ')||'not entered'));
  const pe=[]; ['pe_gen','pe_heent','pe_resp','pe_cvs','pe_abd','pe_neuro','pe_skin'].forEach(g=>{ const p=pos(g), ng=negs(g); if(p.length||ng.length) pe.push(FGROUPS[g].t+': '+[p.join(', '), ng.length?'no '+ng.join(', no '):''].filter(Boolean).join('; ')); });
  L.push('PE: '+(pe.join(' | ')||'not entered'));
  const lab=I.lab||{}; const lb=[]; if(lab.wbc) lb.push('WBC '+lab.wbc); if(lab.neut) lb.push('Neut '+lab.neut+'%'); if(lab.plt) lb.push('Plt '+lab.plt); if(lab.hct) lb.push('Hct '+lab.hct+'%'); if(lab.urea) lb.push((lab.ureaU==='bun'?'BUN ':'Urea ')+lab.urea); if(lab.lactate) lb.push('Lactate '+lab.lactate);
  const bp=pos('bed'), bn=negs('bed'); if(lb.length||bp.length||bn.length) L.push('RESULTS: '+[...lb,...bp].join(', ')+(bn.length?' | (−) '+bn.join(', '):''));
  if(scores.length) L.push('SCORES: '+scores.map(s=>s.name+' '+s.v+(s.max?'/'+s.max:'')+(s.miss&&s.miss.length&&s.id!=='pcap'?' (incomplete)':'')+' – '+s.interp).join(' | '));
  L.push(''); L.push('ASSESSMENT – differential (ranked by rule-based score, not probability):');
  R.ddx.forEach(r=>L.push(`${r.rank}. ${r.c.n} [score ${r.s}, ${tier(r.s)}] – for: ${r.pro.slice(0,5).map(p=>p.l).join(', ')||'—'}${r.con.length?'; against: '+r.con.slice(0,3).map(p=>p.l).join(', '):''}`));
  if(!R.ddx.length) L.push('(insufficient data for a ranked differential)');
  const mn = R.mnm.filter(r=>!R.ddx.slice(0,3).includes(r));
  if(R.mnm.length) L.push('Must-not-miss considered: '+R.mnm.map(r=>r.c.n+(r.red.length?' (red flags: '+r.red.join(', ')+')':'')).join('; '));
  L.push(''); L.push('PLAN (draft – all doses ⚠VERIFY against current references / local protocol):');
  planIds.forEach(id=>{ const r=R.all.find(x=>x.id===id); if(!r) return; const c=r.c;
    L.push('» '+c.n);
    L.push('  Diagnostics: '+c.dx.join('; ')+'  [Source: '+c.dxs+']');
    L.push('  Treatment: '+V2T(c.tx.join('; '))+'  [Source: '+c.txs+']');
    L.push('  Disposition: '+c.dispo); });
  if(mn.length) L.push('» To exclude (must-not-miss): '+mn.map(r=>r.c.n+' – '+r.c.dx[0]).join(' | '));
  L.push(''); L.push('Decision support only – not a diagnosis. Clinical judgment overrides. Generated offline; no data left the device.');
  return L.join('\n');
}
if(typeof module!=='undefined') module.exports={extract,derive,scoreAll,computeScores,alerts,chartNote,tier,CC_MAP};
