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
  'Leg swelling':['dvt_signs'], 'Dizziness / vertigo':['dizziness'], 'High blood sugar':['polyuria'], 'Rash':['rash'], 'Scrotal pain':['testis_pain'], 'Joint pain / swelling':['hot_joint'],
  'Trauma / injury':['trauma']
};
const num = v => (v===''||v==null||isNaN(+v)) ? null : +v;

const TR_MECH = ['mech_mvc','mech_moto','mech_ped','mech_hienergy','mech_fall','mech_fall_low','mech_axial','mech_assault','mech_stab','mech_gsw','mech_burn','burn_elec','mech_crush','mech_drown','head_inj','no_helmet'];
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
  // trauma: fall height (m) and time since injury in minutes
  let fallM=null, injH=null;
  if(/nahulog|nalaglag|bumagsak|fell|fall|fallen/.test(t)){
    const fm = t.match(/(\d+(?:\.\d+)?)\s*(m|meters?|metres?|metro|ft|feet|foot|talampakan)\b/);
    if(fm) fallM = /^(ft|feet|foot|talampakan)$/.test(fm[2]) ? +fm[1]*0.3048 : +fm[1];
    else { const fs = t.match(/\b(2nd|second|ikalawang|3rd|third|ikatlong|4th|fourth|ikaapat na)\s*(floor|storey|story|palapag)/); if(fs) fallM = (/2nd|second|ikalawang/.test(fs[1])?1:/3rd|third|ikatlong/.test(fs[1])?2:3)*3; }
  }
  const im = t.match(/(\d+)\s*(min|mins|minutes?|minuto)\b/); if(im) injH = +im[1]/60;
  // de-duplicate hits by term
  const seen=new Set(); const uh=[]; hits.forEach(h=>{const k=h.term+'|'+h.neg; if(!seen.has(k)){seen.add(k); uh.push(h);} });
  return {hits:uh, f:byId, duration, fallM, injH};
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
  const tr = I.tr||{};
  let gcs=num(v.gcs); const gE=num(tr.gcsE), gV=num(tr.gcsV), gM=num(tr.gcsM);
  if(gcs==null && gE!=null && gV!=null && gM!=null) gcs = gE+gV+gM;
  const hr=num(v.hr), sbp=num(v.sbp), dbp=num(v.dbp), rr=num(v.rr), T=num(v.t), sp=num(v.spo2);
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
  // ---------- trauma ----------
  if(T!=null) dv('t_lt35',T<35,1);
  if(sbp!=null) dv('sbp_lt110',sbp<110,1);
  if(hr!=null) dv('hr_ge120',hr>=120,1);
  if(tr.on) set('trauma',1,'mode',F.trauma!==1);
  if(TR_MECH.some(id=>F[id]===1) && F.trauma!==1) set('trauma',1,'derived',true);
  const trauma = F.trauma===1;
  let injH=null, fallM=null, tbsa=null, wt=num(tr.wt), bd=num(tr.bd);
  if(trauma){
    const yes=id=>F[id]===1, pos=(id,src)=>{ if(F[id]==null) set(id,1,src||'derived'); };
    if(['mech_stab','mech_gsw','chest_pen','abd_pen','neck_pen'].some(yes)) pos('penetrating');
    if(['mech_mvc','mech_moto','mech_ped','mech_fall','mech_fall_low','mech_assault','mech_crush','mech_hienergy','mech_axial'].some(yes)) pos('blunt');
    fallM = num(tr.fallM); if(fallM==null) fallM = ex.fallM;
    if(fallM!=null){ dv('fall_ge1m',fallM>=0.9,1); dv('fall_ge3m',fallM>=3,1); if(fallM>0) pos('mech_fall'); }
    if(yes('fall_ge3m')) pos('fall_ge1m');
    if(tr.air==='patent'){ dv('air_threat',false,1); dv('air_obst',false,1); } else if(tr.air==='threat') dv('air_threat',true,1); else if(tr.air==='obst'){ dv('air_obst',true,1); dv('air_threat',true,1); }
    if(tr.bs==='equal') dv('dec_bs_uni',false,1); else if(tr.bs==='L'||tr.bs==='R') dv('dec_bs_uni',true,1); else if(tr.bs==='both') dv('dec_bs_bil',true,1);
    if(tr.pup==='equal'){ dv('pupil_uni',false,1); dv('pupil_bil',false,1); } else if(tr.pup==='uni') dv('pupil_uni',true,1); else if(tr.pup==='bil') dv('pupil_bil',true,1); else if(tr.pup==='pin') dv('miosis',true,1);
    if(gcs!=null){ dv('gcs_9_12',gcs>=9&&gcs<=12,1); dv('gcs_13_15',gcs>=13,1); dv('gcs_lt13',gcs<13,1); }
    const iT=num(tr.injT); if(iT!=null) injH = iT/(tr.injU==='min'?60:1); else if(ex.injH!=null) injH=ex.injH; else if(durH!=null && durH<=72) injH=durH;
    if(injH!=null){ dv('inj_le3h',injH<=3,1); dv('inj_gt3h',injH>3,1); }
    tbsa=num(tr.tbsa); if(tbsa!=null){ dv('tbsa_ge10',tbsa>=10,1); dv('tbsa_ge20',tbsa>=20,1); if(tbsa>0) pos('mech_burn'); }
    if(bd!=null){ bd=Math.abs(bd); dv('bd_ge6',bd>=6,1); }
    if(yes('fast_abd')) pos('us_fluid'); if(yes('fast_peri')) pos('us_effusion'); if(yes('fast_ptx')) pos('cxr_ptx'); if(yes('fast_htx')) pos('cxr_htx');
    if(yes('fast_neg')){ if(F.us_fluid==null) set('us_fluid',-1,'derived'); if(F.us_effusion==null) set('us_effusion',-1,'derived'); }
    if(yes('helmet') && F.no_helmet==null) set('no_helmet',-1,'derived');
    if(yes('syncope')) pos('loc'); if(yes('hemiparesis')) pos('lateralizing'); if(yes('chest_pen')||yes('box_wound')) pos('penetrating');
    if(yes('box_wound')) pos('chest_pen'); if(yes('femur_fx')||yes('open_fx')) pos('long_bone');
    if(['long_bone','open_fx','femur_fx','burn_full','tbsa_ge10'].some(yes)) pos('distract');
    if(yes('vomit2')) pos('vomiting'); if(yes('mech_burn')&&yes('burn_enclosed')) pos('trauma');
  }
  return {F, SRC, ex, ctx:{age, sex, pregnant, ga, trauma, f:F}, n:{age,hr,sbp,dbp,rr,T,sp,gcs,glu,wbc,neut,plt,lac,ureaMmol,o2:!!v.o2,durH,fd, injH, fallM, tbsa, wt, bd, gE, gV, gM, trOn:!!tr.on}};
}

// ---------- score every condition ----------
function scoreAll(D){
  const F = D.F, out = [], excluded = [];
  for(const c of KB){
    if(c.tr && F.trauma!==1) continue;            // trauma conditions only in trauma context
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
    if(c.tr){
      if((c.id==='tr_cspine'||c.id==='tr_tlspine') && F.sbp_lt90===1 && F.hr_lt60===1){ s+=1.5; pro.push({id:'neuroshock',w:1.5,l:'Hypotension with bradycardia (neurogenic shock?)'}); }
      if(c.id==='tr_tension' && F.dec_bs_uni===1 && (F.hyperres===1||F.trach_dev===1) && (F.sbp_lt90===1||F.spo2_lt90===1)){ s+=1.5; pro.push({id:'tension',w:1.5,l:'↓ breath sounds + hyperresonance/deviation + shock/hypoxia'}); }
      if(c.id==='tr_tamponade' && F.muffled===1 && F.jvd===1 && F.sbp_lt90===1){ s+=1; pro.push({id:'beck',w:1,l:'Beck triad'}); }
      if(['tr_edh','tr_sdh','tr_tbi'].includes(c.id) && D.n.gcs!=null) notes.push('TBI severity by GCS '+D.n.gcs+': '+tbiCat(D.n.gcs)+'.');
      if(c.id==='tr_shock'){ const k=atlsClass(D); if(k.cls) notes.push('Estimated ATLS hemorrhage class '+k.cls+' ('+k.loss+' blood volume) – see Scores.'); }
    }
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
  if(n.hr!=null&&n.sbp) { const si=Math.round(n.hr/n.sbp*100)/100; add({id:'si', name:'Shock index', v:si, interp: (si>=1?'≥ 1.0 – occult shock / high risk':si>=0.7?'0.7–0.99 – borderline':'< 0.7 normal')+(F.trauma===1&&si>=1&&!(n.age!=null&&n.age<16)?' · trauma: predicts transfusion / MTP need':'')+(n.age!=null&&n.age<16?' · adult cut-off – children have higher normal values (use age-adjusted SI)':''), details:`HR ${n.hr} ÷ SBP ${n.sbp}`, lvl:si>=1?3:si>=0.7?1:0, src:'Allgöwer & Burri 1967 · HR/SBP'}); }
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
  if(F.trauma===1) traumaScores(D).forEach(add);
  return S;
}
// ---------- trauma rules & scores (pure; each returns a score card) ----------
const tbiCat = g => g<=8?'severe (GCS 3–8)':g<=12?'moderate (GCS 9–12)':'mild (GCS 13–15)';
const isChild = D => D.n.age!=null && D.n.age<16;
// shock signs: adults – SBP < 90, shock index ≥ 1, cold clammy skin (SBP < 110 counts at ≥ 65 y);
// children – hypotension for age (SBP < 70 + 2 × age, < 90 from 10 y) or poor perfusion; adult SI / HR cut-offs not used.
function isShock(D){ const F=D.F, n=D.n; if(F.cool_periph===1) return true;
  if(isChild(D)){ const lim = n.age>=10 ? 90 : 70 + 2*Math.max(1,n.age); return n.sbp!=null && n.sbp<lim; }
  return F.sbp_lt90===1 || F.si_ge1===1 || (n.age!=null&&n.age>=65&&F.sbp_lt110===1); }
function atlsClass(D){
  // ATLS hemorrhage class estimate. Numeric HR / RR bands follow the ATLS 9th-ed table; ATLS 10th adds base deficit
  // (0 to −2 / −2 to −6 / −6 to −10 / < −10) and replaces fixed numbers with trends. Take the worst parameter.
  const n=D.n, F=D.F, why=[]; let k=0;
  const up=(c,l)=>{ if(c>k) k=c; why.push(l+' → '+['','I','II','III','IV'][c]); };
  if(n.hr!=null) up(n.hr>140?4:n.hr>120?3:n.hr>100?2:1, 'HR '+n.hr);
  if(n.sbp!=null) up(n.sbp<70?4:n.sbp<90?3:1, 'SBP '+n.sbp);
  if(n.sbp!=null&&n.dbp!=null&&n.sbp-n.dbp<=25&&n.sbp>=90) up(2,'pulse pressure '+(n.sbp-n.dbp));
  if(n.rr!=null) up(n.rr>35?4:n.rr>30?3:n.rr>20?2:1, 'RR '+n.rr);
  if(n.bd!=null) up(n.bd>10?4:n.bd>6?3:n.bd>2?2:1, 'base deficit '+n.bd);
  if(n.gcs!=null&&n.gcs<15&&n.sbp!=null&&n.sbp<90) up(3,'altered mentation with hypotension');
  if(!k) return {cls:null};
  return {cls:['','I','II','III','IV'][k], k, loss:['','< 15 %','15–30 %','31–40 %','> 40 %'][k], why};
}
function traumaScores(D){
  const F=D.F, n=D.n, out=[]; const y=id=>F[id]===1, no=id=>F[id]===-1, unk=id=>F[id]==null;
  const age=n.age, gcs=n.gcs;
  // 1. GCS / TBI category
  if(gcs!=null) out.push({id:'tbi', name:'GCS – TBI severity', v:gcs, max:15, interp:'TBI category: '+tbiCat(gcs)+(gcs<=8?' → secure airway, neurosurgical centre':gcs<=12?' → CT head, admit / neurosurgery':''),
    details:(n.gE!=null&&n.gV!=null&&n.gM!=null?`E${n.gE} V${n.gV} M${n.gM}`:'total entered')+(y('pupil_uni')?' · unilateral dilated pupil':y('pupil_bil')?' · bilateral fixed pupils':''), lvl:gcs<=8?3:gcs<=12?2:gcs<15?1:0, src:'Teasdale & Jennett 1974 · BTF 2016 (intl)'});
  // 2. ATLS hemorrhage class
  const bleedCtx = isShock(D)||y('ext_hemorrhage')||y('us_fluid')||y('pelvic_unstable')||y('cxr_htx')||y('femur_fx')||y('penetrating')||y('hard_vasc')||(n.bd!=null&&n.bd>2)||(n.hr!=null&&n.hr>100);
  const ac = (!isChild(D) && bleedCtx) ? atlsClass(D) : {cls:null};
  if(isChild(D) && bleedCtx) out.push({id:'atls', name:'ATLS hemorrhage class', v:'Child', interp:'Adult HR / BP bands do not apply – use age-specific vital signs; tachycardia and poor perfusion precede hypotension (late sign: SBP < 70 + 2 × age)', lvl:isShock(D)?3:1, src:'ATLS 10th ed pediatric chapter · APLS (intl)'});
  if(ac.cls) out.push({id:'atls', name:'ATLS hemorrhage class (estimate)', v:'Class '+ac.cls, interp:'Estimated blood loss '+ac.loss+(ac.k>=3?' → blood products / MTP, hemorrhage control':ac.k===2?' → crystalloid bridge, type-specific blood, find source':' → monitor, reassess'),
    details:ac.why.join(' · ')+' · worst parameter wins; β-blockers, age, pregnancy, athletes and pain alter vital signs'+(y('mech_burn')?' · burns: early tachycardia / shock is usually NOT from the burn – look for another injury':''), miss:['HR','SBP','RR'].filter(k=>n[k.toLowerCase()]==null).concat(n.bd==null?['base deficit']:[]), lvl:ac.k>=3?3:ac.k===2?2:0, src:'ATLS 10th ed (2018) table; HR/RR bands from 9th ed (intl)'});
  // 3. ABC score (derived and validated in adults)
  if(!isChild(D)){ const miss=[]; let v=0; const it=[];
    if(y('penetrating')){ v++; it.push('penetrating'); }
    if(n.sbp==null) miss.push('SBP'); else if(n.sbp<=90){ v++; it.push('SBP ≤ 90'); }
    if(n.hr==null) miss.push('HR'); else if(n.hr>=120){ v++; it.push('HR ≥ 120'); }
    if(y('us_fluid')||y('fast_abd')){ v++; it.push('FAST +'); } else if(!y('fast_neg')&&F.us_fluid==null) miss.push('FAST');
    out.push({id:'abc', name:'ABC score (massive transfusion)', v, max:4, interp:v>=2?'≥ 2 → predicts massive transfusion: activate MTP':'< 2 → MTP not predicted (use clinical judgment)', details:it.join(', ')||'no criteria met', miss, lvl:v>=2?3:0, src:'Nunez et al. J Trauma 2009 · ATLS 11th ed (intl)'}); }
  // 4. Revised trauma score
  if(gcs!=null&&n.sbp!=null&&n.rr!=null){
    const cg = gcs>=13?4:gcs>=9?3:gcs>=6?2:gcs>=4?1:0, cs = n.sbp>89?4:n.sbp>=76?3:n.sbp>=50?2:n.sbp>=1?1:0, cr = (n.rr>=10&&n.rr<=29)?4:n.rr>29?3:n.rr>=6?2:n.rr>=1?1:0;
    const rts = Math.round((0.9368*cg+0.7326*cs+0.2908*cr)*1000)/1000, trts=cg+cs+cr;
    out.push({id:'rts', name:'Revised Trauma Score', v:rts, max:7.841, interp:`Triage-RTS ${trts}/12`+(trts<11?' → < 11: triage to a trauma centre':' (≥ 11)')+' · lower RTS = higher mortality', details:`coded GCS ${cg}, SBP ${cs}, RR ${cr} · RTS = 0.9368·GCS + 0.7326·SBP + 0.2908·RR`, lvl:trts<11?3:trts<12?1:0, src:'Champion et al. J Trauma 1989 (intl)'});
  }
  // 5. Canadian C-spine rule (alert, stable adults)
  const neckRelevant = y('neck_pain')||y('neck_midline')||y('blunt')||y('mech_axial');
  if(neckRelevant && !y('penetrating')){
    const na=[]; if(age!=null&&age<16) na.push('age < 16'); if(gcs!=null&&gcs<15) na.push('GCS < 15'); if(n.sbp!=null&&n.sbp<90) na.push('SBP < 90'); if(n.rr!=null&&(n.rr<10||n.rr>24)) na.push('RR outside 10–24'); if(y('cord_deficit')) na.push('acute paralysis');
    if(na.length) out.push({id:'ccr', name:'Canadian C-spine rule', v:'N/A', interp:'Rule not applicable ('+na.join(', ')+') → keep spinal motion restriction; CT C-spine', lvl:2, src:'Stiell et al. JAMA 2001 (intl)'});
    else {
      const hi=[], miss=[]; if(age==null) miss.push('age'); else if(age>=65) hi.push('age ≥ 65');
      if(y('fall_ge1m')) hi.push('fall ≥ 1 m / 5 stairs'); if(y('mech_axial')) hi.push('axial load'); if(y('mech_hienergy')) hi.push('high-speed / rollover / ejection MVC'); if(y('mech_moto')) hi.push('motorcycle crash (treated as dangerous – motorised vehicle)');
      if(y('paresthesia')) hi.push('paresthesias'); else if(unk('paresthesia')) miss.push('paresthesias');
      if(gcs==null) miss.push('GCS 15 (alert)');
      const lo=[]; if(y('cs_simple')) lo.push('simple rear-end MVC'); if(y('cs_amb')) lo.push('ambulatory / sitting'); if(y('cs_delayed')) lo.push('delayed neck pain'); if(no('neck_midline')) lo.push('no midline tenderness');
      let v, interp, lvl;
      if(hi.length){ v='Image'; interp='High-risk factor ('+hi.join(', ')+') → CT C-spine'; lvl=2; }
      else if(!lo.length){ v='Image'; interp='No low-risk factor present → CT C-spine'+(unk('neck_midline')?' (midline tenderness not assessed)':''); lvl=2; }
      else if(y('cs_rotate')){ v='No imaging'; interp='Low-risk factor ('+lo.join(', ')+') and able to rotate 45° L and R → no imaging by rule'; lvl=0; }
      else if(no('cs_rotate')){ v='Image'; interp='Unable to rotate neck 45° → CT C-spine'; lvl=2; }
      else { v='Assess'; interp='Low-risk factor present – now test active rotation 45° left and right'; lvl=1; }
      out.push({id:'ccr', name:'Canadian C-spine rule', v, interp, details:'Alert (GCS 15), stable adults with neck injury; not for penetrating trauma, age < 16, paralysis', miss, lvl, src:'Stiell et al. JAMA 2001 (intl)'});
    }
    // NEXUS
    const crit=[['midline tenderness', F.neck_midline], ['focal neuro deficit', (y('lateralizing')||y('cord_deficit')||y('hemiparesis'))?1:(no('lateralizing')||no('cord_deficit'))?-1:null],
      ['altered alertness', gcs!=null?((gcs<15||y('confusion'))?1:-1):(y('confusion')?1:null)], ['intoxication', F.intox], ['painful distracting injury', F.distract]];
    const posN=crit.filter(c=>c[1]===1).map(c=>c[0]), unkN=crit.filter(c=>c[1]==null).map(c=>c[0]);
    out.push({id:'nexus', name:'NEXUS low-risk criteria', v: posN.length?'Image':unkN.length?'Incomplete':'Low risk', interp: posN.length?'Criterion present ('+posN.join(', ')+') → imaging indicated':unkN.length?'Cannot clear clinically until all 5 are assessed':'All 5 absent → no C-spine imaging needed',
      miss:unkN, lvl:posN.length?2:unkN.length?1:0, src:'Hoffman et al. NEJM 2000 (intl)'});
  }
  // 6. Canadian CT head rule (adults, GCS 13–15) / PECARN (children)
  const headRelevant = y('head_inj')||y('loc')||y('amnesia')||y('scalp_hematoma')||y('skull_fx')||y('basilar')||y('lucid');
  if(headRelevant && (age==null||age>=16)){
    const na=[]; if(gcs!=null&&gcs<13) na.push('GCS < 13 – moderate/severe TBI'); if(y('m_anticoag')) na.push('anticoagulated'); if(y('post_seizure')) na.push('seizure after injury'); if(y('skull_fx')&&false) na.push('');
    if(na.length) out.push({id:'cchr', name:'Canadian CT head rule', v:'CT', interp:'Rule not applicable ('+na.join(', ')+') → CT head indicated', lvl:3, src:'Stiell et al. Lancet 2001 · ACEP 2023 (intl)'});
    else {
      const hi=[], md=[], miss=[];
      if(gcs==null) miss.push('GCS'); else if(gcs<15) hi.push('GCS < 15 (at 2 h)');
      if(y('skull_fx')) hi.push('open / depressed skull fracture'); if(y('basilar')) hi.push('basal skull fracture signs'); if(y('vomit2')) hi.push('vomiting ≥ 2');
      if(age==null) miss.push('age'); else if(age>=65) hi.push('age ≥ 65');
      if(y('amnesia')) md.push('amnesia ≥ 30 min before impact'); if(y('mech_ped')) md.push('pedestrian struck'); if(y('mech_hienergy')) md.push('ejection from vehicle'); if(y('fall_ge1m')) md.push('fall ≥ 1 m / 5 stairs');
      out.push({id:'cchr', name:'Canadian CT head rule', v:hi.length?'CT – high risk':md.length?'CT – medium risk':'No CT by rule', interp:hi.length?'High risk for neurosurgical intervention ('+hi.join(', ')+') → CT head':md.length?'Medium risk for brain injury on CT ('+md.join(', ')+') → CT head':'No high/medium-risk factor → CT not required by rule (if LOC/amnesia/disorientation with GCS 13–15)',
        details:'For GCS 13–15 after witnessed LOC, amnesia or disorientation; motorcycle crash alone is not a listed dangerous mechanism', miss, lvl:hi.length?3:md.length?2:0, src:'Stiell et al. Lancet 2001 (intl)'});
    }
  }
  if(headRelevant && age!=null && age<18){
    const lt2 = age<2, hiF=[], midF=[];
    const fallSev = n.fallM!=null && n.fallM > (lt2?0.9:1.5);
    const sevMech = y('mech_hienergy')||(y('mech_ped'))||(y('mech_moto')&&y('no_helmet'))||fallSev;
    if(gcs!=null&&gcs<15) hiF.push('GCS < 15'); if(y('confusion')) hiF.push('altered mental status');
    if(lt2){ if(y('skull_fx')) hiF.push('palpable skull fracture'); if(y('scalp_hematoma')) midF.push('non-frontal scalp hematoma'); if(y('loc')) midF.push('LOC ≥ 5 s'); if(sevMech) midF.push('severe mechanism'); if(y('not_normal')) midF.push('not acting normally per parent'); }
    else { if(y('basilar')) hiF.push('basal skull fracture signs'); if(y('loc')) midF.push('LOC'); if(y('vomiting')||y('vomit2')) midF.push('vomiting'); if(sevMech) midF.push('severe mechanism'); if(y('sev_headache')) midF.push('severe headache'); }
    out.push({id:'pecarn', name:'PECARN head injury ('+(lt2?'< 2 y':'2–17 y')+')', v:hiF.length?'CT':midF.length?'Observe vs CT':'No CT', interp:hiF.length?'High risk ('+hiF.join(', ')+') → CT recommended (ciTBI ≈ 4.4 %)':midF.length?'Intermediate ('+midF.join(', ')+') → observation vs CT (ciTBI ≈ 0.9 %): CT if several findings, worsening, age < 3 mo or parental preference':'Very low risk (ciTBI < 0.05 %) → CT not recommended',
      details:'Severe mechanism: ejection / rollover / death in vehicle, pedestrian or unhelmeted rider struck, fall > '+(lt2?'0.9 m':'1.5 m')+', high-impact object'+(n.fallM!=null?' · fall entered: '+n.fallM.toFixed(1)+' m':''), lvl:hiF.length?3:midF.length?2:0, src:'Kuppermann et al. Lancet 2009 (intl)'});
  }
  // 7. Burn fluid (ATLS 10th / ABA 2023 starting rate)
  if(n.tbsa!=null && n.tbsa>0){
    const child = age!=null && age<14, f = y('burn_elec')?4:child?3:2;
    let v='—', interp='Enter weight (kg) to calculate', details='';
    if(n.wt){ const tot=f*n.wt*n.tbsa, half=tot/2; const el=n.injH; const rem = el!=null&&el<8 ? 8-el : 8;
      v=Math.round(tot)+' mL / 24 h';
      interp=`First half ${Math.round(half)} mL by hour 8 after the burn → ${Math.round(half/rem)} mL/h${el!=null?` (${el.toFixed(1)} h elapsed, ${rem.toFixed(1)} h left; subtract fluid already given)`:' (time of injury not entered – assumes now)'}; then ${Math.round(half)} mL over the next 16 h (${Math.round(half/16)} mL/h)`;
      details=`${f} mL × ${n.wt} kg × ${n.tbsa} % TBSA, Lactated Ringer's${y('burn_elec')?' (electrical: 4 mL)':child?' (child: 3 mL; add maintenance dextrose fluid)':' (adult: 2 mL)'} · original Parkland = 4 mL/kg/% · titrate to urine output ${child&&n.wt<30?'1 mL/kg/h':'0.5 mL/kg/h'} (${Math.round((child&&n.wt<30?1:0.5)*n.wt)} mL/h) – starting estimate only [⚠ VERIFY]`; }
    const formal = n.tbsa >= (child?10:20);
    out.push({id:'burnfluid', name:'Burn fluid – ATLS / ABA starting rate', v, interp:(formal?'':'< '+(child?10:20)+' % TBSA: formal resuscitation usually not needed (oral / maintenance) · ')+interp, details, miss:n.wt?[]:['weight'], lvl:formal?2:0, src:'ATLS 10th ed (2018) · ABA 2023 burn resuscitation CPG (intl)'});
  }
  // 8. TXA window
  const bleeding = isShock(D)||(!isChild(D)&&n.hr!=null&&n.hr>110)||y('ext_hemorrhage')||y('us_fluid')||y('pelvic_unstable')||y('cxr_htx');
  const tbiTxa = !isChild(D) && (y('head_inj')||y('loc')) && gcs!=null && gcs>=9 && gcs<=15 && !y('pupil_bil');
  if(bleeding || tbiTxa){
    const h=n.injH; let v, interp, lvl;
    if(h==null){ v='Time?'; interp='Enter time since injury – TXA only within 3 h'; lvl=2; }
    else if(h<=3){ v='Give TXA'; interp=`${h.toFixed(1)} h since injury (≤ 3 h): 1 g IV over 10 min, then 1 g over 8 h – earlier is better [⚠ VERIFY]`; lvl=3; }
    else { v='Do not start'; interp=`${h.toFixed(1)} h since injury (> 3 h): CRASH-2 showed no benefit / possible harm when started after 3 h`; lvl=1; }
    if(isChild(D) && h!=null && h<=3) interp=`${h.toFixed(1)} h since injury (≤ 3 h): 15 mg/kg IV (max 1 g) over 10 min, then 2 mg/kg/h × 8 h [⚠ VERIFY]`;
    out.push({id:'txa', name:'TXA window', v, interp, details:(bleeding?(isChild(D)?'Bleeding / shock in a child (pediatric use extrapolated from CRASH-2, PED-TRAX)':'Significant bleeding (SBP < 90, HR > 110, or source identified)'):'TBI, GCS 9–15 (CRASH-3: adults with GCS ≤ 12 or intracranial bleeding on CT; benefit seen in mild–moderate TBI, not with bilateral unreactive pupils)'), lvl, src:'CRASH-2 (Lancet 2010/2011) · CRASH-3 (Lancet 2019) (intl)'});
  }
  // 9. Trauma-centre / transfer criteria
  const tc=traumaCentre(D);
  if(tc.length) out.push({id:'tcentre', name:'Trauma-centre / transfer criteria', v:'Met', interp:'Meets criteria for a trauma centre – arrange transfer after stabilisation if not already at one', details:tc.join(' · '), lvl:3, src:'ACS COT 2021 National Guideline for Field Triage · ATLS transfer chapter (intl) · DOH DO 2021-0001 / RA 10932 (PH)'});
  return out;
}
function traumaCentre(D){
  const F=D.F, n=D.n, y=id=>F[id]===1, c=[];
  if(n.gcs!=null&&n.gcs<=13) c.push('GCS ≤ 13');
  if(isChild(D)){ if(isShock(D)) c.push('hypotension / poor perfusion for age'); }
  else { if(n.sbp!=null&&(n.sbp<90||(n.age!=null&&n.age>=65&&n.sbp<110))) c.push(n.age>=65?'SBP < 110 at age ≥ 65':'SBP < 90');
    if(n.hr!=null&&n.sbp&&n.hr>n.sbp) c.push('HR > SBP'); }
  if(n.rr!=null&&(n.rr<10||(n.rr>29&&!isChild(D)))) c.push('RR < 10 or > 29'); else if(y('spo2_lt90')) c.push('SpO₂ < 90 %');
  if(y('penetrating')) c.push('penetrating injury to head, neck, torso or proximal limb');
  if(y('skull_fx')) c.push('open / depressed skull fracture'); if(y('flail_seg')) c.push('chest wall instability / flail');
  if(y('pelvic_unstable')) c.push('suspected pelvic fracture'); if(y('cord_deficit')) c.push('suspected spinal cord injury');
  if(y('hard_vasc')||y('mech_crush')&&y('crush_long')) c.push('crushed / pulseless extremity'); if(y('femur_fx')) c.push('proximal long-bone fracture');
  if((n.tbsa!=null&&n.tbsa>=(n.age!=null&&n.age<14?10:20))||y('burn_full')||y('face_burn')||y('burn_elec')) c.push('burn meeting burn-centre criteria');
  if(y('pregnant')&&y('ga_ge20')) c.push('pregnancy ≥ 20 wk');
  if((y('m_anticoag')||y('m_antiplt'))&&y('head_inj')) c.push('anticoagulant / antiplatelet with head injury');
  if(y('mech_hienergy')) c.push('high-risk mechanism (ejection, rollover, death in vehicle)');
  if(y('mech_ped')||(y('mech_moto')&&(y('no_helmet')||y('mech_hienergy')))) c.push(y('mech_ped')?'pedestrian struck / run over':'motorcycle crash with significant impact (rider thrown; unhelmeted = local add-on)');
  if(y('fall_ge3m')) c.push('fall ≥ 3 m');
  return c;
}
// ---------- "Primary survey first" banner (xABCDE life threats) ----------
function primarySurvey(D){
  const F=D.F, n=D.n, y=id=>F[id]===1, no=id=>F[id]===-1, rows=[];
  const row=(k,t,st,msg,tk)=>rows.push({k,t,st,msg,tk});
  // x
  if(y('ext_hemorrhage')||y('hard_vasc')) row('x','Exsanguinating hemorrhage','threat','Stop it first: direct pressure → tourniquet high and tight (note time) → wound packing / junctional pressure; then blood','abcde');
  else row('x','Exsanguinating hemorrhage', no('ext_hemorrhage')?'ok':'unk', no('ext_hemorrhage')?'No catastrophic external bleeding recorded':'Look for catastrophic external bleeding','abcde');
  // A
  const aT=[]; if(y('air_obst')) aT.push('airway obstructed'); else if(y('air_threat')) aT.push('airway threatened'); if(y('stridor')) aT.push('stridor'); if(y('face_burn')||y('voice_change')) aT.push('inhalation / airway burn signs'); if(y('airway_blood')) aT.push('blood / debris in airway'); if(y('face_fx')) aT.push('facial fracture'); if(n.gcs!=null&&n.gcs<=8) aT.push('GCS ≤ 8');
  row('A','Airway + C-spine', aT.length?'threat':F.air_threat===-1?'ok':'unk', aT.length? aT.join(', ')+' → suction, jaw thrust, definitive airway (RSI, in-line stabilisation) by the most experienced operator; surgical airway if CICO' : F.air_threat===-1?'Airway patent – keep spinal motion restriction':'Assess airway patency (talking? stridor? blood?)','rsicheck');
  // B
  const bT=[]; const shock = isShock(D);
  if(y('dec_bs_uni')&&(y('hyperres')||y('trach_dev')||y('jvd')||y('cxr_ptx'))&&(shock||y('spo2_lt90'))) bT.push('TENSION PNEUMOTHORAX likely → needle (4th–5th ICS anterior to mid-axillary line) or finger thoracostomy NOW, then chest tube');
  else if(y('cxr_ptx')||(y('dec_bs_uni')&&y('hyperres'))) bT.push('pneumothorax → chest tube; decompress if hemodynamics / SpO₂ worsen');
  if(y('open_chest')) bT.push('open pneumothorax → vented chest seal / 3-sided dressing, chest tube');
  if(y('cxr_htx')||y('tube_1500')||(y('dec_bs_uni')&&shock&&!y('hyperres'))) bT.push('hemothorax → chest tube + blood; ≥ 1500 mL or > 200 mL/h → thoracotomy');
  if(y('flail_seg')) bT.push('flail chest → O₂, analgesia, ventilatory support');
  if(y('spo2_lt90')) bT.push('SpO₂ < 90 %');
  row('B','Breathing', bT.length?'threat':(F.dec_bs_uni===-1&&!y('spo2_lt90'))?'ok':'unk', bT.length?bT.join(' · '):(F.dec_bs_uni===-1?'Equal breath sounds, no chest threat recorded':'Auscultate both sides, check SpO₂ / RR, chest wall, eFAST lung windows'),'ptx');
  // C
  const cT=[]; const tamp = y('us_effusion')||(y('muffled')&&y('jvd')&&y('sbp_lt90'));
  if(tamp) cT.push('CARDIAC TAMPONADE → OR / thoracotomy now (pericardiocentesis only as a bridge)');
  if(shock) cT.push('SHOCK – assume hemorrhage: 2 large-bore IV/IO, MTP 1:1:1 / whole blood, TXA if ≤ 3 h, permissive hypotension SBP 80–90 ('+(y('head_inj')||(n.gcs!=null&&n.gcs<13)||y('cord_deficit')?'NOT here – TBI/cord: keep SBP ≥ 100–110':'not if TBI')+')');
  if(y('pelvic_unstable')) cT.push('pelvic fracture → binder over greater trochanters');
  if(y('us_fluid')&&shock) cT.push('FAST + and unstable → OR / laparotomy');
  else if(y('us_fluid')) cT.push('FAST + abdomen → CT if stable, surgeon now');
  if(y('femur_fx')) cT.push('femur fracture → traction splint');
  row('C','Circulation + hemorrhage control', cT.length?'threat':(n.sbp!=null&&n.hr!=null&&!shock&&(isChild(D)||n.hr<=100))?'ok':'unk', cT.length?cT.join(' · '):(n.sbp!=null?'No shock signs recorded – reassess HR, BP, skin, eFAST':'Enter HR / SBP, check skin perfusion, eFAST, pelvis'),'mtp');
  // D
  const dT=[];
  if(n.gcs!=null&&n.gcs<=8) dT.push('severe TBI (GCS '+n.gcs+') → airway, SpO₂ ≥ 94 %, SBP ≥ 100–110, CT, neurosurgery');
  else if(n.gcs!=null&&n.gcs<=12) dT.push('moderate TBI (GCS '+n.gcs+') → CT head, neurosurgery');
  if(y('pupil_uni')||y('pupil_bil')||(y('lateralizing')&&n.gcs!=null&&n.gcs<15)) dT.push('HERNIATION signs → head up 30°, 3 % saline / mannitol, brief hyperventilation as bridge, emergency neurosurgery / transfer');
  if(y('cord_deficit')) dT.push('cord injury → spinal motion restriction, MAP 85–90');
  if(n.glu!=null&&n.glu<70) dT.push('hypoglycemia → dextrose');
  row('D','Disability', dT.length?'threat':(n.gcs===15&&!y('lateralizing'))?'ok':'unk', dT.length?dT.join(' · '):(n.gcs!=null?'GCS '+n.gcs+', no lateralising signs recorded':'Record GCS (E/V/M), pupils, lateralising signs, glucose'),'icp');
  // E
  const eT=[]; if(y('t_lt35')) eT.push('HYPOTHERMIA (T < 35 °C) → warm fluids, blankets, warm room (lethal triad)');
  if(y('mech_burn')) eT.push('burn → stop burning, remove clothing / jewellery, cool small burns, keep warm, estimate % TBSA');
  row('E','Exposure / environment', eT.length?'threat':'unk', eT.length?eT.join(' · '):'Fully expose, log-roll (back, perineum), then cover – prevent hypothermia','burns');
  return rows;
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
  if(D.F.trauma===1 && n.T!=null && n.T<35) a.push('T < 35 °C in trauma – hypothermia worsens coagulopathy: actively warm');
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
  if(F.trauma===1){
    const tg=['tr_mech','tr_x','tr_a','tr_b','tr_c','tr_fast','tr_d','tr_e','tr_head','tr_neck','tr_chest','tr_abd','tr_spine','tr_ext','tr_preg'];
    const t=I.tr||{}; const ctx=[];
    if(n.injH!=null) ctx.push('time since injury '+(n.injH<1?Math.round(n.injH*60)+' min':n.injH.toFixed(1)+' h')); if(n.fallM!=null) ctx.push('fall '+n.fallM.toFixed(1)+' m');
    if(t.air) ctx.push('airway '+({patent:'patent',threat:'threatened',obst:'obstructed'}[t.air])); if(t.bs) ctx.push('breath sounds '+({equal:'equal',L:'↓ left',R:'↓ right',both:'↓ both'}[t.bs]));
    if(n.gE!=null&&n.gV!=null&&n.gM!=null) ctx.push(`GCS E${n.gE}V${n.gV}M${n.gM}=${n.gE+n.gV+n.gM}`); if(t.pup) ctx.push('pupils '+({equal:'equal & reactive',uni:'unilateral dilated',bil:'bilateral fixed dilated',pin:'pinpoint'}[t.pup]));
    if(n.tbsa!=null) ctx.push('burn '+n.tbsa+' % TBSA'); if(n.wt) ctx.push('weight '+n.wt+' kg'); if(n.bd!=null) ctx.push('base deficit '+n.bd);
    const tp=[], tn=[]; tg.forEach(g=>{ tp.push(...pos(g)); tn.push(...negs(g)); });
    L.push('TRAUMA: '+[ctx.join(', '), tp.length?'(+) '+tp.join(', '):'', tn.length?'(−) '+tn.join(', '):''].filter(Boolean).join(' | '));
    L.push('PRIMARY SURVEY: '+primarySurvey(D).map(r=>r.k+' '+(r.st==='threat'?'⚠ ':r.st==='ok'?'ok ':'? ')+r.msg).join(' | '));
  }
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
    L.push('  Disposition: '+c.dispo+(c.dps?'  [Source: '+c.dps+']':'')); });
  if(mn.length) L.push('» To exclude (must-not-miss): '+mn.map(r=>r.c.n+' – '+r.c.dx[0]).join(' | '));
  L.push(''); L.push('Decision support only – not a diagnosis. Clinical judgment overrides. Generated offline; no data left the device.');
  return L.join('\n');
}
if(typeof module!=='undefined') module.exports={extract,derive,scoreAll,computeScores,alerts,chartNote,tier,CC_MAP,primarySurvey,traumaScores,atlsClass,traumaCentre,isShock};
