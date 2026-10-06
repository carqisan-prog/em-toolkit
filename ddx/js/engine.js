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
  'Trauma / injury':['trauma'],
  // pediatric chief complaints
  'Fever (infant / child)':['fever'], 'Difficulty breathing / noisy breathing (child)':['dyspnea'], 'Poor feeding / not feeding (infant)':['poor_feed'],
  'Vomiting / diarrhea (child)':['vomiting','diarrhea'], 'Seizure / kumbulsyon (child)':['seizure'], 'Limp / refuses to walk':['limp'], 'Ingestion (child)':['ingestion'],
  'Ear pain':['ear_pain'], 'Crying / irritable infant':['irritable'], 'Rash with fever (child)':['rash','fever']
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
  const ageRaw = num(I.age), ageU = I.ageU||'y';
  const age = ageRaw==null ? null : ageU==='d' ? ageRaw/365.25 : ageU==='wk' ? ageRaw*7/365.25 : ageU==='mo' ? ageRaw/12 : ageRaw;
  const sex = I.sex||'', v = I.v||{}, L = I.lab||{}, PD = I.pd||{};
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
  const pgE=num(PD.pgE), pgV=num(PD.pgV), pgM=num(PD.pgM);
  if(gcs==null && pgE!=null && pgV!=null && pgM!=null) gcs = pgE+pgV+pgM;
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
  // ---------- pediatric mode ----------
  // On when the UI says so (I.pd.on), or automatically for age < 18 when no explicit state is passed (node tests / cases).
  const peds = (I.pd && I.pd.on!=null) ? !!I.pd.on : (age!=null && age<18);
  const lbl = {}; let rng=null, wtEst=null, anc=null, crp=null, pct=null, esr=null, ph=null, hco3=null, feverD=null;
  if(wt==null) wt = num(PD.wt);
  if(peds){
    const yes=id=>F[id]===1, pos=(id,src)=>{ if(F[id]==null) set(id,1,src||'derived'); }, neg=(id,src)=>{ if(F[id]==null) set(id,-1,src||'derived'); };
    set('peds',1,'mode',true);
    if(age!=null){
      const dd = age*365.25;
      dv('age_le21d',dd<=21,1); dv('age_le28d',dd<=28,1); dv('age_le60d',dd<=60,1); dv('age_lt3mo',dd<90,1); dv('age_lt6mo',age<0.5,1); dv('age_lt1y',age<1,1);
      dv('age_lt2y',age<2,1); dv('age_lt5y',age<5,1); dv('age_6mo_5y',age>=0.5&&age<6,1); dv('age_3mo_3y',dd>=90&&age<3,1); dv('age_2_12wk',dd>=14&&dd<=84,1);
      dv('age_ge5',age>=5,1); dv('age_ge10',age>=10,1);
      rng = pedRanges(age); wtEst = aplsWeight(age);
      // age-specific vital signs; the adult cut-off findings are re-defined for age so shared conditions keep working
      if(hr!=null){ dv('hr_hi_age',hr>rng.hr[1],1); dv('hr_vhi_age',hr>=(age<1?220:180),1); dv('hr_lo_age',hr<rng.brady,1);
        dv('hr_gt100',hr>rng.hr[1],1); dv('hr_ge125',hr>rng.hr[1]*1.2,1); dv('hr_ge120',hr>rng.hr[1]*1.2,1); dv('hr_lt60',hr<rng.brady,1);
        lbl.hr_gt100='Tachycardia for age (HR > '+rng.hr[1]+')'; lbl.hr_ge125='Marked tachycardia for age (HR > '+Math.round(rng.hr[1]*1.2)+')'; lbl.hr_lt60='Bradycardia for age (HR < '+rng.brady+')'; lbl.hr_ge120=lbl.hr_ge125; }
      if(rr!=null){ dv('rr_hi_age',rr>rng.rr[1],1); dv('fast_breath',rr>=rng.fast,1);
        dv('rr_ge22',rr>rng.rr[1],1); dv('rr_ge30',rr>=rng.fast,1); dv('rr_lt12',rr<rng.slow,1);
        lbl.rr_ge22='Tachypnea for age (RR > '+rng.rr[1]+')'; lbl.rr_ge30='Fast breathing for age (RR ≥ '+rng.fast+')'; lbl.rr_lt12='Slow breathing for age (RR < '+rng.slow+')'; lbl.fast_breath='Fast breathing (RR ≥ '+rng.fast+' for age)'; }
      if(sbp!=null){ dv('sbp_lo_age',sbp<rng.hypo,1); dv('sbp_lt90',sbp<rng.hypo,1); dv('sbp_le100',sbp<rng.sbp[0],1); dv('sbp_lt110',sbp<rng.sbp[0],1);
        lbl.sbp_lt90='Hypotension for age (SBP < '+rng.hypo+')'; lbl.sbp_le100='SBP below normal for age (< '+rng.sbp[0]+')'; lbl.sbp_lt110=lbl.sbp_le100; }
      if(hr!=null&&sbp){ const sipa = age>=4&&age<7?1.22:age>=7&&age<13?1.0:age>=13?0.9:null;
        if(sipa){ dv('si_ge1',hr/sbp>sipa,1); lbl.si_ge1='Shock index above age-adjusted cut-off (SIPA > '+sipa+')'; } else { delete F.si_ge1; delete SRC.si_ge1; } }
      if(age<12){ ['htn_sev','bp_ge140','dbp_le60'].forEach(k=>{ if(SRC[k]==='derived'){ delete F[k]; delete SRC[k]; } }); }
    }
    // Pediatric Assessment Triangle
    if(PD.patA) set('pat_appear', PD.patA==='a'?1:-1, 'form', true);
    if(PD.patB) set('pat_wob', PD.patB==='a'?1:-1, 'form', true);
    if(PD.patC) set('pat_circ', PD.patC==='a'?1:-1, 'form', true);
    if(yes('pat_appear')) pos('toxic');
    // immunization · intake · urine output · activity
    if(PD.imm==='complete') set('unimmunized',-1,'form',true); else if(PD.imm==='incomplete'||PD.imm==='none') set('unimmunized',1,'form',true);
    if(yes('imm_complete') && F.unimmunized==null) set('unimmunized',-1,'text');
    if(PD.feed==='normal') set('poor_feed',-1,'form',true); else if(PD.feed==='reduced'||PD.feed==='poor') set('poor_feed',1,'form',true); else if(PD.feed==='unable'){ set('poor_feed',1,'form',true); set('ds_drink',1,'form',true); set('drinks_poor',1,'form'); }
    if(PD.uo==='normal') set('oliguria',-1,'form',true); else if(PD.uo==='reduced'||PD.uo==='none') set('oliguria',1,'form',true);
    if(PD.act==='normal'){ set('lethargy',-1,'form',true); neg('irritable','form'); neg('ds_leth','form'); }
    else if(PD.act==='irritable') set('irritable',1,'form',true);
    else if(PD.act==='inconsolable'){ set('irritable',1,'form',true); set('inconsolable',1,'form',true); }
    else if(PD.act==='lethargic'){ set('lethargy',1,'form',true); set('ds_leth',1,'form',true); }
    else if(PD.act==='unresponsive'){ set('lethargy',1,'form',true); set('ds_leth',1,'form',true); pos('confusion','form'); }
    // IMCI general danger signs
    if(yes('seizure')) pos('ds_conv'); if(yes('ds_convnow')){ pos('seizure'); pos('ds_conv'); pos('sz_long'); }
    if(yes('ds_vomit')) pos('vomiting'); if(yes('ds_drink')) pos('poor_feed'); if(yes('ds_conv')) pos('seizure');
    if(yes('sz_long')||yes('sz_complex')||yes('sz_brief')) pos('seizure');
    const DS=['ds_drink','ds_vomit','ds_conv','ds_leth','ds_convnow'];
    if(DS.some(yes)) set('danger_sign',1,'derived',true); else if(['ds_drink','ds_vomit','ds_conv','ds_leth'].every(id=>F[id]===-1)) set('danger_sign',-1,'derived',true);
    if(yes('pinch_vslow')) pos('dehydration'); if(yes('pinch_slow')||yes('sunken_eyes')) pos('dehydration');
    if(yes('stridor_rest')) pos('stridor'); if(yes('kd_conj')) pos('conj_red'); if(yes('kd_rash')) pos('rash'); if(yes('kd_node')) pos('cerv_nodes');
    if(yes('crt_prolonged')||yes('mottled')) pos('cool_periph'); if(yes('unilat_wheeze')) pos('wheeze_pe'); if(yes('ingest_iron')||yes('ingest_kero')) pos('ingestion');
    if(yes('currant')) pos('hematochezia'); if(yes('scrotal_swell')) pos('testis_pain'); if(yes('nwb')) pos('limp');
    // explicit 'no fever' (chip marked absent, no measured fever) → fever_any absent so pediatric 'a' weights apply
    if(F.fever_any!==1 && F.fever===-1 && (T==null||T<38)) set('fever_any',-1,'derived');
    // fever duration (days of fever: fever day field, else illness duration when febrile)
    feverD = fd!=null ? fd : (F.fever_any===1 && durH!=null ? durH/24 : null);
    if(feverD!=null && F.fever_any===1){ dv('fever_ge5d',feverD>=5,1); dv('fever_ge7d',feverD>=7,1); dv('fever_lt24h',feverD<1,1); }
    if(T!=null) dv('t_ge385',T>=38.5,1);
    // pediatric labs
    anc = num(PD.anc); if(anc==null && wbc!=null && neut!=null) anc = Math.round(wbc*neut)/100;
    crp=num(PD.crp); pct=num(PD.pct); esr=num(PD.esr); ph=num(PD.ph); hco3=num(PD.hco3);
    if(anc!=null){ dv('anc_high',anc>4.09,1); dv('anc_10',anc>10,1); }
    if(pct!=null) dv('pct_high',pct>0.5,1);
    if(crp!=null){ dv('crp_high',crp>20,1); dv('crp_30',crp>=30,1); }
    if(esr!=null) dv('esr_40',esr>40,1);
    if(wbc!=null) dv('wbc_12',wbc>12,1);
    if(ph!=null||hco3!=null){ dv('ph_lt73',(ph!=null&&ph<7.3)||(hco3!=null&&hco3<18),1); if(F.ph_lt73===1) pos('acidosis'); }
  }
  const wtUse = wt!=null ? wt : (peds ? wtEst : null);
  return {F, SRC, ex, lbl, ctx:{age, sex, pregnant, ga, trauma, peds, f:F}, n:{age,ageRaw,ageU,hr,sbp,dbp,rr,T,sp,gcs,glu,wbc,neut,plt,lac,ureaMmol,o2:!!v.o2,durH,fd, injH, fallM, tbsa, wt, bd, gE, gV, gM, trOn:!!tr.on,
    peds, rng, wtEst, wtUse, wtIsEst: wt==null && wtUse!=null, anc, crp, pct, esr, ph, hco3, feverD, pgE, pgV, pgM, pd:PD}};
}
// ---------- pediatric helpers (pure) ----------
// Normal ranges: APLS (HR, RR, SBP by age band). Hypotension: PALS 2020 (< 60 term neonate, < 70 infant, < 70 + 2×age 1–10 y, < 90 ≥ 10 y).
// Fast breathing: WHO IMCI / PAPP-PIDSP cut-offs (≥ 60 < 2 mo, ≥ 50 2–12 mo, ≥ 40 1–5 y, ≥ 30 ≥ 5 y).
function pedRanges(a){
  const b = a<1?{band:'< 1 y',hr:[110,160],rr:[30,40],sbp:[70,90],brady:100}: a<2?{band:'1–2 y',hr:[100,150],rr:[25,35],sbp:[80,95],brady:90}:
            a<5?{band:'2–5 y',hr:[95,140],rr:[25,30],sbp:[80,100],brady:80}: a<12?{band:'5–12 y',hr:[80,120],rr:[20,25],sbp:[90,110],brady:70}:{band:'≥ 12 y',hr:[60,100],rr:[15,20],sbp:[100,120],brady:60};
  b.hypo = a*365.25<=28 ? 60 : a<1 ? 70 : a<10 ? Math.round(70+2*a) : 90;
  b.fast = a*365.25<60 ? 60 : a<1 ? 50 : a<5 ? 40 : 30;
  b.slow = a<1?20:a<5?15:a<12?12:10;
  return b;
}
// APLS weight estimate (kg): 0–12 mo (0.5 × months) + 4 · 1–5 y (2 × y) + 8 · 6–12 y (3 × y) + 7. Not for > 12 y.
function aplsWeight(a){ if(a==null||a>12) return null; const m=a*12; const w = a<1 ? 0.5*m+4 : a<6 ? 2*a+8 : 3*a+7; return Math.round(w*10)/10; }
// Holliday–Segar maintenance (4-2-1 rule), capped at the usual adult maximum of 100 mL/h (2400 mL/day)
function holliday(wt){ if(!wt||wt<=0) return null;
  const h = wt<=10 ? 4*wt : wt<=20 ? 40+2*(wt-10) : 60+(wt-20); const d = wt<=10 ? 100*wt : wt<=20 ? 1000+50*(wt-10) : 1500+20*(wt-20);
  return {h:Math.min(h,100), d:Math.min(d,2400), hRaw:h, dRaw:d, capped:h>100}; }
const rnd = v => v==null?null: v<1 ? Math.round(v*100)/100 : v<10 ? Math.round(v*10)/10 : Math.round(v);
const fmtN = v => { const r=rnd(v); return r>=10000 ? r.toLocaleString('en-US') : String(r); };
// Weight-based dose. spec: {n, d:number|[lo,hi], u, per:'dose'|'day', div, max (per dose, same unit), min, r (route/frequency), c:[conc per mL, label], rate (per-kg/min infusion), wb:[[maxKg, text]], age:[[maxAgeY, text]], x (note)}
function pedDose(sp, wt, ageY){
  const head = sp.n;
  if(sp.age){ if(ageY==null) return {n:head, txt:'dose by age – enter age', r:sp.r, x:sp.x}; const a=sp.age.find(([mx])=>ageY<mx)||sp.age[sp.age.length-1]; return {n:head, txt:a[1], r:sp.r, x:sp.x, basis:'by age'}; }
  if(sp.wb){ if(!wt) return {n:head, txt:'dose by weight band – enter weight', r:sp.r, x:sp.x}; const b=sp.wb.find(([mx])=>wt<mx)||sp.wb[sp.wb.length-1]; return {n:head, txt:b[1], r:sp.r, x:sp.x, basis:'weight band'}; }
  const lo = Array.isArray(sp.d)?sp.d[0]:sp.d, hi = Array.isArray(sp.d)?sp.d[1]:null, u=sp.u||'mg';
  const perKg = (hi!=null?lo+'–'+hi:lo)+' '+u+'/kg'+(sp.rate?'/min':sp.per==='day'?'/day'+(sp.div?' ÷ '+sp.div:''):'');
  if(!wt) return {n:head, perKg, txt:null, r:sp.r, x:sp.x};
  const one = k => { let v = k*wt; if(sp.per==='day'&&sp.div) v = v/sp.div; let capped=false, floored=false;
    if(sp.max!=null && v>sp.max){ v=sp.max; capped=true; } if(sp.min!=null && v<sp.min){ v=sp.min; floored=true; } return {v, capped, floored}; };
  const a = one(lo), b = hi!=null ? one(hi) : null;
  const unitOut = sp.rate ? u+'/min' : u;
  let txt = fmtN(a.v)+(b?'–'+fmtN(b.v):'')+' '+unitOut+(sp.rate?'':sp.per==='day'&&sp.div?' per dose':sp.per==='day'?' per day':'');
  const cap = (a.capped||(b&&b.capped));
  if(sp.c){ const vol = x => { const m=x/sp.c[0]; return String(m<100 ? Math.round(m*10)/10 : Math.round(m)); }; txt += ' = '+vol(a.v)+(b?'–'+vol(b.v):'')+' mL of '+sp.c[1]; }
  return {n:head, perKg, txt, r:sp.r, x:sp.x, v:a.v, v2:b?b.v:null, capped:!!cap, floored:a.floored||(b&&b.floored), max:sp.max, u:unitOut};
}
function condDoses(c, D){ if(!c.dz || !c.dz.length) return null; const n=D.n; return {wt:n.wtUse, est:n.wtIsEst, rows:c.dz.map(sp=>pedDose(sp, n.wtUse, n.age))}; }

// ---------- score every condition ----------
function scoreAll(D){
  const F = D.F, out = [], excluded = [];
  const P = !!D.ctx.peds, ageY = D.n.age, L = id => (D.lbl&&D.lbl[id])||FLABEL[id];
  for(const c of KB){
    if(c.tr && F.trauma!==1) continue;            // trauma conditions only in trauma context
    if(c.pd && !P) continue;                      // pediatric conditions only in pediatric mode
    if(c.ag && ageY!=null && (ageY < c.ag[0] || ageY >= c.ag[1])) continue;   // age window (pediatric entries)
    const considered = c.g.some(id => F[id]===1);
    if(!considered) continue;
    if(P && c.pdalt){ const k=KB.find(x=>x.id===c.pdalt); excluded.push({id:c.id, n:c.n, why:'pediatric mode – see '+(k?k.n:c.pdalt)}); continue; }
    if(P && c.amin!=null && (ageY==null ? c.amin>=18 : ageY < c.amin)){ excluded.push({id:c.id, n:c.n, why:'adult condition – not considered in pediatric mode'+(ageY!=null?' below age '+c.amin+' y':'')}); continue; }
    const exr = c.ex ? c.ex(D.ctx) : null;
    if(exr){ excluded.push({id:c.id, n:c.n, why:exr}); continue; }
    let s = c.p||0; const pro=[], con=[];
    for(const [id,w] of Object.entries(c.w)){ if(F[id]===1){ s+=w; (w>=0?pro:con).push({id,w,l:L(id)}); } }
    for(const [id,w] of Object.entries(c.a||{})){ if(F[id]===-1){ s+=w; (w>=0?pro:con).push({id,w,l:'no '+L(id)}); } }
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
    if(c.pd){
      if(c.id==='pd_febinf' && ageY!=null && ageY*365.25<=21 && F.fever_any===1){ s+=1; pro.push({id:'le21',w:1,l:'Febrile at ≤ 21 days (AAP: full work-up, admit)'}); }
      if(c.id==='pd_kawasaki'){ const k=kdCount(F); if(F.fever_ge5d===1 && k>=4){ s+=2; pro.push({id:'kd4',w:2,l:'Fever ≥ 5 d + '+k+'/5 principal criteria (complete KD)'}); } }
      if(c.id==='pd_dka' && D.n.glu!=null && D.n.glu>200 && (F.ketones===1) && (F.acidosis===1||F.ph_lt73===1)){ s+=1.5; pro.push({id:'ispad',w:1.5,l:'ISPAD biochemical criteria met'}); }
    }
    const red = (c.rf||[]).filter(id=>F[id]===1).map(id=>L(id));
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
  const add = o => S.push(o); const P = !!D.ctx.peds, child = P && (n.age==null || n.age<12);
  if(P) pedsScores(D,R).forEach(add);
  // NEWS2 (adults only – children: PEWS)
  if(!P){ const miss=[]; let v=0, red3=false; const p=(x,pts)=>{ v+=pts; if(pts===3) red3=true; };
    if(n.rr==null) miss.push('RR'); else p('rr', n.rr<=8?3:n.rr<=11?1:n.rr<=20?0:n.rr<=24?2:3);
    if(n.sp==null) miss.push('SpO₂'); else p('sp', n.sp<=91?3:n.sp<=93?2:n.sp<=95?1:0);
    if(n.o2) v+=2;
    if(n.sbp==null) miss.push('SBP'); else p('sbp', n.sbp<=90?3:n.sbp<=100?2:n.sbp<=110?1:n.sbp<=219?0:3);
    if(n.hr==null) miss.push('HR'); else p('hr', n.hr<=40?3:n.hr<=50?1:n.hr<=90?0:n.hr<=110?1:n.hr<=130?2:3);
    if(n.gcs==null && F.confusion==null) miss.push('consciousness'); else if((n.gcs!=null&&n.gcs<15)||F.confusion===1) p('c',3);
    if(n.T==null) miss.push('Temp'); else p('t', n.T<=35?3:n.T<=36?1:n.T<=38?0:n.T<=39?1:2);
    if(miss.length<6) add({id:'news2', name:'NEWS2', v, max:20, miss, interp: v>=7?'High clinical risk – emergency assessment':v>=5?'Medium risk – urgent review':red3?'Low–medium (single parameter = 3)':'Low risk', lvl:v>=7?3:v>=5?2:red3?1:0, src:'RCP 2017 (intl)'}); }
  // shock index (children: age-adjusted SIPA, not under 4 y)
  if(n.hr!=null&&n.sbp&&!(P&&(n.age==null||n.age<4))) { const si=Math.round(n.hr/n.sbp*100)/100; add({id:'si', name:'Shock index', v:si, interp: (si>=1?'≥ 1.0 – occult shock / high risk':si>=0.7?'0.7–0.99 – borderline':'< 0.7 normal')+(F.trauma===1&&si>=1&&!(n.age!=null&&n.age<16)?' · trauma: predicts transfusion / MTP need':'')+(n.age!=null&&n.age<16?' · adult cut-off – children have higher normal values (use age-adjusted SI)':''), details:`HR ${n.hr} ÷ SBP ${n.sbp}`, lvl:si>=1?3:si>=0.7?1:0, src:'Allgöwer & Burri 1967 · HR/SBP'}); }
  // qSOFA (adults only)
  if(!P && (yes('fever_any')||yes('t_lt36')||top.has('sepsis'))){ const q=qsofa(D); add({id:'qsofa', name:'qSOFA', v:q.v, max:3, miss:q.miss, interp:q.v>=2?'≥ 2 – high risk of poor outcome; screen for sepsis/organ dysfunction':'< 2 (does not exclude sepsis)', lvl:q.v>=2?3:0, src:'Sepsis-3 2016 (intl)'}); }
  // CURB-65 + PCAP
  if(!P && (top.has('cap')||yes('cxr_consol')||yes('crackles_focal'))){
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
  if(!child && (top.has('pe')||yes('cp_pleuritic')||(yes('dyspnea')&&yes('hr_gt100')))){
    let v=0; const it=[]; const w=(c,p,l)=>{ if(c){ v+=p; it.push(l+' +'+p);} };
    w(yes('dvt_signs'),3,'DVT signs'); w(yes('hr_gt100'),1.5,'HR > 100'); w(yes('immobil'),1.5,'immobilization/surgery'); w(yes('dvt_hx'),1.5,'prior DVT/PE'); w(yes('hemoptysis'),1,'hemoptysis'); w(yes('malignancy'),1,'cancer');
    const judged = D.peLikely; if(judged){ v+=3; it.push('PE most likely +3'); }
    add({id:'wells', name:'Wells (PE)', v, max:12.5, interp:(v>4?'> 4: PE likely → CTPA':'≤ 4: PE unlikely → D-dimer (PERC if gestalt low)')+(judged?'':' · add +3 if PE is the most likely diagnosis (tick in Bedside results)'), details:it.join(', ')||'no Wells items', lvl:v>4?3:v>=2?1:0, src:'ESC 2019 (intl)'});
    const perc=[]; const pm=[]; if(n.age==null) pm.push('age'); else if(n.age>=50) perc.push('age ≥ 50'); if(n.hr==null) pm.push('HR'); else if(n.hr>=100) perc.push('HR ≥ 100'); if(n.sp==null) pm.push('SpO₂'); else if(n.sp<95) perc.push('SpO₂ < 95');
    ['hemoptysis','m_estrogen','dvt_hx','dvt_signs','immobil'].forEach(id=>{ if(yes(id)) perc.push(FLABEL[id]); });
    add({id:'perc', name:'PERC', v:perc.length?'Positive':'Negative', interp: perc.length? 'PERC positive ('+perc.join(', ')+') – cannot rule out without testing' : (pm.length?'Incomplete':'All 8 negative – if gestalt < 15 %, PE ruled out without D-dimer'), miss:pm, lvl:perc.length?1:0, src:'Kline 2004 (intl)'});
  }
  // HEART
  if(!P && (yes('chest_pain')||yes('cp_pressure'))){
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
  if((!P||n.age==null||n.age>=10) && (yes('abd_pain')||yes('rlq_pain')||yes('rlq_tender'))){ let v=0; const it=[], miss=[]; const c=(x,l,p=1)=>{ if(x){v+=p; it.push(l+(p>1?' +'+p:''));} };
    c(yes('migration'),'migration'); c(yes('anorexia'),'anorexia'); c(yes('nausea')||yes('vomiting'),'N/V'); c(yes('rlq_tender'),'RLQ tenderness',2); c(yes('rebound'),'rebound');
    if(n.T==null) miss.push('temp'); else c(n.T>=37.3,'T ≥ 37.3');
    if(n.wbc==null) miss.push('WBC'); else c(n.wbc>10,'WBC > 10k',2); if(n.neut==null) miss.push('neutrophil %'); else c(n.neut>75,'left shift');
    add({id:'alvarado', name:'Alvarado', v, max:10, miss, details:it.join(', '), interp: v>=7?'7–10: appendicitis probable – surgical consult':v>=5?'5–6: possible – imaging (US/CT)':'≤ 4: unlikely (does not exclude)', lvl:v>=7?3:v>=5?2:0, src:'Alvarado 1986 · WSES 2020 (intl)'}); }
  // Dengue classification
  const den = R.all.find(r=>r.id==='dengue'||r.id==='pd_dengue');
  if(den && den.s>=(P?5:3)){ add(dengueClass(D)); if(P) add(dengueFluids(D)); }
  if(F.trauma===1) traumaScores(D).forEach(add);
  return S;
}
// ---------- pediatric scores (pure; each returns a score card) ----------
const kdCount = F => ['kd_conj','kd_oral','kd_rash','kd_extrem','kd_node'].filter(id=>F[id]===1).length;
function pedsScores(D,R){
  const F=D.F, n=D.n, out=[], y=id=>F[id]===1, no=id=>F[id]===-1; const a=n.age, wt=n.wtUse, rg=n.rng;
  const top = new Set(R.all.slice(0,8).map(r=>r.id)), sc = id => (R.all.find(r=>r.id===id)||{}).s||0;
  const wtTxt = wt ? (n.wtIsEst ? `${wt} kg (APLS estimate – weigh the child; APLS tends to overestimate weight in Filipino children)` : `${wt} kg (measured)`) : 'weight not entered';
  // 1. Pediatric Assessment Triangle
  const pa=F.pat_appear, pw=F.pat_wob, pc=F.pat_circ;
  if(pa!=null||pw!=null||pc!=null){ const A=pa===1, W=pw===1, C=pc===1; const k=(A?1:0)+(W?1:0)+(C?1:0);
    const imp = !A&&!W&&!C ? 'Stable (all three normal)' : A&&W&&C ? 'CARDIOPULMONARY FAILURE – resuscitate now' : A&&W ? 'RESPIRATORY FAILURE – airway, O₂, ventilation' : A&&C ? 'DECOMPENSATED SHOCK – IV/IO access, fluids, antibiotics if septic' :
      W ? 'Respiratory distress' : C ? 'Compensated shock' : 'Primary brain dysfunction / systemic problem (CNS, metabolic, toxic, sepsis)';
    out.push({id:'pat', name:'Pediatric Assessment Triangle', v:k+'/3 abnormal', interp:imp, details:`Appearance ${pa===1?'abnormal':pa===-1?'normal':'?'} · Work of breathing ${pw===1?'increased':pw===-1?'normal':'?'} · Circulation to skin ${pc===1?'abnormal':pc===-1?'normal':'?'}`,
      miss:[pa==null?'appearance':null,pw==null?'work of breathing':null,pc==null?'circulation':null].filter(Boolean), lvl:k>=2?3:k===1?2:0, src:'Dieckmann et al. 2010 (AAP PEPP / APLS) (intl)'}); }
  // 2. Vital signs for age
  if(rg){ const it=[], bad=[];
    if(n.hr!=null){ it.push(`HR ${n.hr} (normal ${rg.hr[0]}–${rg.hr[1]})`); if(y('hr_vhi_age')) bad.push('HR in SVT range'); else if(y('hr_hi_age')) bad.push('tachycardia'); if(y('hr_lo_age')) bad.push('bradycardia'); }
    if(n.rr!=null){ it.push(`RR ${n.rr} (normal ${rg.rr[0]}–${rg.rr[1]}; fast ≥ ${rg.fast})`); if(y('fast_breath')) bad.push('fast breathing'); else if(y('rr_hi_age')) bad.push('tachypnea'); }
    if(n.sbp!=null){ it.push(`SBP ${n.sbp} (normal ${rg.sbp[0]}–${rg.sbp[1]}; hypotension < ${rg.hypo})`); if(y('sbp_lo_age')) bad.push('HYPOTENSION (late sign)'); }
    if(n.T!=null && n.T>=38 && y('hr_hi_age')) it.push('fever raises HR ≈ 10/min per °C – recheck when afebrile');
    out.push({id:'pvitals', name:'Vital signs for age ('+rg.band+')', v:bad.length?bad.length+' abnormal':'within range', interp:bad.length?bad.join(', '):'No age-specific vital-sign abnormality entered', details:it.join(' · ')||'Enter HR, RR, SBP', lvl:y('sbp_lo_age')||y('hr_vhi_age')?3:bad.length?2:0, src:'APLS 7th ed ranges · PALS 2020 hypotension · WHO IMCI / PAPP-PIDSP fast breathing (intl/PH)'}); }
  // 3. IMCI general danger signs
  { const L=[['ds_drink','not able to drink / breastfeed'],['ds_vomit','vomits everything'],['ds_conv','convulsions'],['ds_leth','lethargic / unconscious'],['ds_convnow','convulsing now']];
    const p=L.filter(([id])=>y(id)).map(x=>x[1]), u=L.slice(0,4).filter(([id])=>F[id]==null).map(x=>x[1]);
    if(p.length||(u.length<4&&(a==null||a<5))) out.push({id:'imci', name:'IMCI general danger signs', v:p.length?'Present':u.length?'Incomplete':'None', interp:p.length?'Danger sign ('+p.join(', ')+') → urgent pre-referral treatment and admission / referral':'No general danger sign recorded'+(u.length?' – ask about: '+u.join(', '):''), lvl:p.length?3:0, src:'DOH IMCI chart booklet (PH) · WHO IMCI 2014'}); }
  // 4. Brighton PEWS (simplified from entered data)
  if(n.hr!=null||n.rr!=null||F.lethargy!=null||F.irritable!=null){
    let b=0, c=0, r=0; const pd=n.pd||{};
    b = (y('ds_leth')||y('confusion')||(n.gcs!=null&&n.gcs<12)) ? 3 : y('irritable') ? 2 : y('lethargy') ? 2 : 0;
    if(y('mottled')||(n.hr!=null&&rg&&n.hr>=rg.hr[1]+30)||y('hr_lo_age')) c=3; else if(y('crt_prolonged')||(n.hr!=null&&rg&&n.hr>=rg.hr[1]+20)) c=2; else if(y('pallor')||y('cool_periph')) c=1;
    if(n.rr!=null&&rg){ if((n.rr<=rg.rr[0]-5&&(y('chest_indraw')||y('grunting')))||y('grunting')) r=3; else if(n.rr>=rg.rr[1]+20||y('chest_indraw')||y('stridor_rest')) r=2; else if(n.rr>=rg.rr[1]+10||y('accessory')||y('nasal_flare')||n.o2) r=1; }
    else if(y('grunting')) r=3; else if(y('chest_indraw')) r=2;
    const v=b+c+r;
    out.push({id:'pews', name:'PEWS (Brighton, simplified)', v, max:9, interp: v>=5?'≥ 5 (or any 3) – urgent senior review, consider PICU / rapid response':v>=4?'4 – urgent medical review':v===3?'3 – increase observation, inform senior':'0–2 – routine observation',
      details:`behaviour ${b} · cardiovascular ${c} · respiratory ${r} (from activity, CRT/colour, HR & RR vs upper normal, retractions/grunting, O₂); nebulisers q15 min / persistent vomiting add +2 – not captured`, lvl:v>=5||[b,c,r].includes(3)?3:v>=4?2:v===3?1:0, src:'Monaghan 2005 Brighton PEWS (intl)'}); }
  // 5. Pediatric GCS
  if(n.pgE!=null&&n.pgV!=null&&n.pgM!=null){ const g=n.pgE+n.pgV+n.pgM;
    out.push({id:'pgcs', name:'Pediatric GCS', v:g, max:15, interp:g<=8?'≤ 8 – severe: protect the airway':g<=12?'9–12 – moderate':g<15?'13–14 – mild':'15 – normal', details:`E${n.pgE} V${n.pgV} M${n.pgM} (verbal scale modified for pre-verbal children)`, lvl:g<=8?3:g<=12?2:g<15?1:0, src:'Pediatric GCS (James 1986; APLS) (intl)'}); }
  // 6. Maintenance fluids (Holliday–Segar)
  if(wt){ const h=holliday(wt);
    out.push({id:'maint', name:'Maintenance fluids (Holliday–Segar 4-2-1)', v:fmtN(h.h)+' mL/h', interp:`${fmtN(h.d)} mL/day for ${wtTxt}`+(h.capped?` (formula ${fmtN(h.hRaw)} mL/h, capped at adult 100 mL/h)`:''),
      details:'4 mL/kg/h first 10 kg + 2 mL/kg/h next 10 kg + 1 mL/kg/h each kg > 20 · isotonic fluid with dextrose (PNSS/PLR + D5) for most ill children (hyponatremia risk with hypotonic fluids); reduce to ⅔ in bronchiolitis, meningitis, pneumonia (SIADH risk) [⚠ VERIFY]',
      miss:n.wtIsEst?['measured weight']:[], lvl:0, src:'Holliday & Segar 1957 · AAP 2018 maintenance IV fluids · NICE NG29 (intl)'}); }
  else if(a!=null && a>12) out.push({id:'maint', name:'Maintenance fluids (Holliday–Segar 4-2-1)', v:'—', interp:'Enter weight (APLS estimate is not valid > 12 y)', miss:['weight'], lvl:0, src:'Holliday & Segar 1957 (intl)'});
  // 7. WHO dehydration assessment + plan A/B/C
  if(y('diarrhea')||R.ddx.slice(0,3).some(r=>r.id==='pd_age')){
    const sev=[], some=[];
    if(y('ds_leth')||(y('lethargy')&&!y('irritable'))) sev.push('lethargic / unconscious'); else if(y('irritable')) some.push('restless / irritable');
    if(y('sunken_eyes')){ sev.push('sunken eyes'); some.push('sunken eyes'); }
    if(y('ds_drink')||y('drinks_poor')) sev.push('not able to drink / drinks poorly'); else if(y('drinks_eager')) some.push('drinks eagerly, thirsty');
    if(y('pinch_vslow')){ sev.push('skin pinch very slow (≥ 2 s)'); some.push('skin pinch slow'); } else if(y('pinch_slow')) some.push('skin pinch slow');
    const plan = sev.length>=2 ? 'C' : some.length>=2 ? 'B' : 'A';
    let vol=''; if(wt){ if(plan==='C'){ const inf = a!=null && a<1; vol=`IV PLR (or PNSS) 100 mL/kg = ${fmtN(Math.min(100*wt,7000))} mL: ${fmtN(30*wt)} mL over ${inf?'1 h':'30 min'}, then ${fmtN(70*wt)} mL over ${inf?'5 h':'2½ h'}; reassess every 15–30 min, repeat the first portion if radial pulse still weak`; }
      else if(plan==='B') vol=`ORS 75 mL/kg = ${fmtN(75*wt)} mL over 4 h (≈ ${fmtN(75*wt/4)} mL/h), give by spoon / cup / NGT; reassess at 4 h`;
      else vol=`ORS after each loose stool: ${a!=null&&a<2?'50–100':'100–200'} mL; zinc ${a!=null&&a<0.5?'10':'20'} mg daily × 10–14 days; continue feeding`; }
    out.push({id:'whodehyd', name:'WHO dehydration assessment', v:plan==='C'?'Severe – Plan C':plan==='B'?'Some – Plan B':'No dehydration – Plan A', interp:vol||'Enter weight for volumes', details:(sev.length?'Severe signs: '+sev.join(', '):'')+(some.length?(sev.length?' · ':'')+'Some-dehydration signs: '+some.join(', '):'')+(!sev.length&&!some.length?'No dehydration signs entered (check eyes, thirst/drinking, skin pinch, alertness)':'')+' · ≥ 2 signs needed per category; severe acute malnutrition uses a different protocol',
      miss:[F.sunken_eyes==null?'eyes':null, F.pinch_slow==null&&F.pinch_vslow==null?'skin pinch':null, F.drinks_eager==null&&F.drinks_poor==null&&F.ds_drink==null?'drinking':null].filter(Boolean), lvl:plan==='C'?3:plan==='B'?2:0, src:'WHO 2005 Treatment of diarrhoea · DOH IMCI (PH)'}); }
  // 8. Febrile infant ≤ 60 (90) days: AAP 2021 pathway, PECARN rule, Step-by-Step
  if(a!=null && a*365.25<=90 && y('fever_any')){
    const dd=Math.round(a*365.25), ill = y('pat_appear')||y('toxic')||y('lethargy'), ua=F.ua_pos;
    const imAb = (n.pct!=null&&n.pct>0.5)||(n.anc!=null&&n.anc>4)||(n.crp!=null&&n.crp>20)||(n.T!=null&&n.T>38.5);
    const imKnown = n.pct!=null||n.anc!=null||n.crp!=null;
    let aap;
    if(ill) aap='Ill-appearing – full sepsis evaluation (blood, urine, CSF), IV antibiotics, admit (outside AAP well-infant pathway)';
    else if(dd<8) aap='< 8 days – outside the AAP 2021 guideline (neonatal pathway): full evaluation, admit';
    else if(dd<=21) aap='8–21 d: UA, urine & blood culture, CSF; IV antibiotics; admit';
    else if(dd<=28) aap='22–28 d: UA, blood culture, inflammatory markers (IM); LP if any IM abnormal (or consider for all); '+(imKnown?(imAb||ua===1?'IM/UA abnormal → LP, IV antibiotics, admit':'IM normal & UA negative → may observe at home or in hospital without antibiotics (shared decision, follow-up in 24 h)'):'enter PCT / ANC / CRP');
    else if(dd<=60) aap='29–60 d: UA, blood culture, IM; '+(imKnown?(imAb?'IM abnormal → consider LP; antibiotics (ceftriaxone) and admit or close follow-up':ua===1?'UA positive, IM normal → no LP needed; oral/IM antibiotics for UTI, home with follow-up possible':'IM normal & UA negative → home without antibiotics, follow-up in 24–36 h'):'enter PCT / ANC / CRP');
    else aap='61–90 d – outside AAP 2021 (clinical judgment; Step-by-Step applies to ≤ 90 d)';
    out.push({id:'aapfi', name:'Febrile infant – AAP 2021 pathway', v:dd+' days', interp:aap, details:'IM abnormal = PCT > 0.5 ng/mL, ANC > 4,000/µL (some use 5,200), CRP > 20 mg/L, or T > 38.5 °C (38.5 is an IM for 22–28 d)', miss:[n.pct==null?'PCT':null,n.anc==null?'ANC':null,n.crp==null?'CRP':null,ua==null?'UA':null].filter(Boolean), lvl:ill||dd<=21||imAb||ua===1?3:dd<=28?2:1, src:'AAP 2021 febrile infant 8–60 d CPG (Pantell et al.) (intl)'});
    if(dd>=29&&dd<=60){ const mi=[]; if(ua==null) mi.push('UA'); if(n.anc==null) mi.push('ANC'); if(n.pct==null) mi.push('procalcitonin');
      const hi=[]; if(ua===1) hi.push('UA positive'); if(n.anc!=null&&n.anc>4.09) hi.push('ANC > 4,090'); if(n.pct!=null&&n.pct>1.71) hi.push('PCT > 1.71');
      out.push({id:'pecarnfi', name:'PECARN febrile infant rule (29–60 d)', v:hi.length?'Not low risk':mi.length?'Incomplete':'Low risk', interp:hi.length?'Not low risk ('+hi.join(', ')+') → consider LP, antibiotics, admit':mi.length?'Needs UA, ANC and procalcitonin':'Low risk for SBI (UA negative, ANC ≤ 4,090/µL, PCT ≤ 1.71 ng/mL) – sensitivity ≈ 97.7 %, NPV ≈ 99.6 % in the derivation/validation cohorts', miss:mi, lvl:hi.length?3:mi.length?1:0, src:'Kuppermann et al. JAMA Pediatr 2019 (intl)'}); }
    { const mi=[]; let v, why='';
      if(ill){ v='High risk'; why='ill appearance'; } else if(dd<=21){ v='High risk'; why='age ≤ 21 d'; } else if(ua===1){ v='High risk'; why='leukocyturia'; }
      else if(n.pct!=null&&n.pct>=0.5){ v='High risk'; why='PCT ≥ 0.5'; } else if((n.crp!=null&&n.crp>20)||(n.anc!=null&&n.anc>10)){ v='Intermediate'; why=(n.crp>20?'CRP > 20':'ANC > 10,000'); }
      else { if(ua==null) mi.push('UA'); if(n.pct==null) mi.push('PCT'); if(n.crp==null) mi.push('CRP'); if(n.anc==null) mi.push('ANC'); v = mi.length?'Incomplete':'Low risk'; }
      out.push({id:'sbs', name:'Step-by-Step (febrile infant ≤ 90 d)', v, interp:v==='High risk'?'High risk ('+why+') → full work-up incl. LP, antibiotics, admit':v==='Intermediate'?'Intermediate ('+why+') → blood & urine cultures, consider LP, admit / observe':v==='Low risk'?'Low risk → outpatient management possible with follow-up in 24 h':'Sequential: appearance → age ≤ 21 d → UA → PCT → CRP / ANC', miss:mi, lvl:v==='High risk'?3:v==='Intermediate'?2:v==='Low risk'?0:1, src:'Gomez et al. Pediatrics 2016 (intl)'}); }
  }
  // 9. Westley croup score
  if(y('barking')||y('stridor')||top.has('pd_croup')){
    const pd=n.pd||{}; const g=(k,def)=>pd[k]!==''&&pd[k]!=null?+pd[k]:def; const est=[];
    const loc = g('wLoc', (y('confusion')||y('ds_leth'))?5:0), cy = g('wCy', y('cyanosis')?4:0), st = g('wSt', y('stridor_rest')?2:y('stridor')?1:0), ae = g('wAe', y('air_entry_dec')?1:0), re = g('wRe', y('chest_indraw')?1:0);
    ['wLoc','wCy','wSt','wAe','wRe'].forEach(k=>{ if(pd[k]===''||pd[k]==null) est.push({wLoc:'consciousness',wCy:'cyanosis',wSt:'stridor',wAe:'air entry',wRe:'retractions'}[k]); });
    const v=loc+cy+st+ae+re;
    out.push({id:'westley', name:'Westley croup score', v, max:17, interp:v>=12?'≥ 12: impending respiratory failure – airway expert, PICU':v>=6?'6–11: severe – dexamethasone + nebulised epinephrine, admit':v>=3?'3–5: moderate – dexamethasone, observe ≥ 4 h (epinephrine if stridor at rest)':'≤ 2: mild – single-dose dexamethasone, home',
      details:`consciousness ${loc} · cyanosis ${cy} · stridor ${st} · air entry ${ae} · retractions ${re}`+(est.length?' · estimated from chips (set grades in 🧒 Pediatric › Croup): '+est.join(', '):''), lvl:v>=6?3:v>=3?2:0, src:'Westley et al. 1978 · Alberta TOP croup 2021 (intl)'}); }
  // 10. Pediatric Appendicitis Score
  if(a!=null && a>=1 && (y('abd_pain')||y('rlq_pain')||y('rlq_tender')||y('hop_pain'))){ let v=0; const it=[], miss=[]; const c=(x,l,p=1)=>{ if(x){ v+=p; it.push(l+(p>1?' +'+p:'')); } };
    c(y('hop_pain'),'cough/hop/percussion tenderness',2); c(y('anorexia'),'anorexia'); if(n.T==null) miss.push('temp'); else c(n.T>=38,'T ≥ 38'); c(y('nausea')||y('vomiting'),'nausea/vomiting'); c(y('rlq_tender'),'RLQ tenderness',2);
    if(n.wbc==null) miss.push('WBC'); else c(n.wbc>10,'WBC > 10k'); if(n.anc==null) miss.push('ANC'); else c(n.anc>7.5,'ANC > 7,500'); c(y('migration'),'migration to RLQ');
    out.push({id:'pas', name:'Pediatric Appendicitis Score (PAS)', v, max:10, miss, details:it.join(', ')||'no PAS items', interp:v>=7?'≥ 7: high risk – pediatric surgery':v>=4?'4–6: intermediate – ultrasound / serial exams':'≤ 3: low risk – appendicitis unlikely (safety-net advice)', lvl:v>=7?3:v>=4?2:0, src:'Samuel 2002 (intl)'}); }
  // 11. Kawasaki criteria checklist
  if(['kd_conj','kd_oral','kd_rash','kd_extrem','kd_node'].some(y)||y('fever_ge5d')||top.has('pd_kawasaki')){
    const k=kdCount(F), fd=n.feverD, f5 = y('fever_ge5d'), inf = a!=null && a<0.5 && y('fever_ge7d');
    let v, interp, lvl;
    if(f5 && k>=4){ v='Complete KD'; interp='Fever ≥ 5 d + '+k+'/5 criteria → IVIG + aspirin, echocardiogram'; lvl=3; }
    else if((f5 && k>=2) || inf){ const crpOk = (n.crp!=null&&n.crp>=30)||(n.esr!=null&&n.esr>=40);
      v='Possible incomplete KD'; interp=(inf?'Infant < 6 mo with ≥ 7 d unexplained fever':'Fever ≥ 5 d + '+k+' criteria')+' → CRP / ESR: '+((n.crp!=null||n.esr!=null)?(crpOk?'CRP ≥ 3 mg/dL or ESR ≥ 40 → supplementary labs (≥ 3 of: anemia, platelets ≥ 450k after day 7, albumin ≤ 3.0 g/dL, ↑ ALT, WBC ≥ 15k, urine ≥ 10 WBC/hpf) or echo → treat if positive':'below thresholds → serial clinical / lab follow-up; echo if desquamation develops'):'enter CRP / ESR'); lvl=2; }
    else { v=k+'/5 criteria'; interp=f5?'Fever ≥ 5 d but < 2 criteria – KD unlikely (re-examine; criteria can appear sequentially)':'Fever < 5 days or duration unknown – re-assess daily (diagnosis on day 4 is possible with ≥ 4 criteria by experienced clinicians)'; lvl=k>=3?1:0; }
    out.push({id:'kawasaki', name:'Kawasaki criteria (AHA)', v, interp, details:'Fever days: '+(fd!=null?Math.round(fd*10)/10:'?')+' · conjunctival '+(y('kd_conj')?'✓':'–')+' · oral '+(y('kd_oral')?'✓':'–')+' · rash '+(y('kd_rash')?'✓':'–')+' · extremities '+(y('kd_extrem')?'✓':'–')+' · cervical node '+(y('kd_node')?'✓':'–'),
      miss:fd==null?['fever day / duration']:[], lvl, src:'AHA 2017 Kawasaki statement (McCrindle et al.) · AHA 2024 update (recalled – verify) (intl)'}); }
  // 12. Kocher criteria
  if(y('limp')||y('nwb')||y('hip_rom')||(y('hot_joint')&&a!=null&&a<18)){ let v=0; const it=[], miss=[];
    if(F.nwb==null) miss.push('weight-bearing'); else if(y('nwb')){ v++; it.push('non-weight-bearing'); }
    if(n.T==null) miss.push('temp'); else if(n.T>38.5){ v++; it.push('T > 38.5'); }
    if(n.esr==null) miss.push('ESR'); else if(n.esr>40){ v++; it.push('ESR > 40'); }
    if(n.wbc==null) miss.push('WBC'); else if(n.wbc>12){ v++; it.push('WBC > 12k'); }
    const pr=['< 0.2 %','3 %','40 %','93 %','99.6 %'][v];
    out.push({id:'kocher', name:'Kocher criteria (septic hip)', v, max:4, miss, details:(it.join(', ')||'none met')+(n.crp!=null?` · CRP ${n.crp} mg/L ${n.crp>20?'> 20 (Caird: adds risk)':'≤ 20'}`:''), interp:`Predicted probability of septic arthritis ≈ ${pr} (original cohort)`+(v>=2?' → urgent US + aspiration, orthopedics':' → transient synovitis more likely if well; review in 24–48 h'), lvl:v>=3?3:v===2?2:0, src:'Kocher et al. JBJS 1999 · Caird 2006 (intl)'}); }
  // 13. PAPP-PIDSP pediatric CAP risk
  if(top.has('pd_cap') || (y('cough')&&(y('fast_breath')||y('chest_indraw')))){
    const hi=[], mod=[];
    if(y('cyanosis')||(n.sp!=null&&n.sp<90)) hi.push('cyanosis / SpO₂ < 90 %'); if(y('apnea')) hi.push('apnea'); if(y('grunting')) hi.push('grunting');
    if(y('ds_leth')||y('confusion')||(n.gcs!=null&&n.gcs<13)) hi.push('lethargic / stuporous'); if(y('ds_drink')) hi.push('unable to feed'); if(y('sbp_lo_age')||y('mottled')) hi.push('signs of shock'); if(y('pinch_vslow')) hi.push('severe dehydration');
    if(y('chest_indraw')) mod.push('chest indrawing / retractions'); if(n.rr!=null&&a!=null&&n.rr>(a<1?60:a<5?50:35)) mod.push('RR > '+(a<1?60:a<5?50:35)+' (moderate-risk cut-off, recalled)'); if(y('nasal_flare')) mod.push('nasal flaring / head bobbing');
    if(n.sp!=null&&n.sp<95&&n.sp>=90) mod.push('SpO₂ 90–94 %'); if(y('irritable')) mod.push('irritable'); if(y('pinch_slow')||y('sunken_eyes')) mod.push('dehydration'); if(a!=null&&a<0.25) mod.push('age < 3 mo');
    if(y('immuno')||y('hf')||y('malignancy')) mod.push('comorbidity'); if(y('poor_feed')) mod.push('poor feeding');
    const cls = hi.length?'High risk (PCAP D)':mod.length?'Moderate risk (PCAP C)':'Low / minimal risk (PCAP A/B)';
    out.push({id:'pcapped', name:'Pediatric CAP risk (PAPP-PIDSP, approximate)', v:hi.length?'High':mod.length?'Moderate':'Low', interp:cls+' → '+(hi.length?'admit, ICU referral':mod.length?'admit ward, IV antibiotics':'outpatient oral amoxicillin, review 48–72 h'),
      details:[...hi,...mod].join(' · ')||'no moderate / high-risk features entered', miss:['caregiver ability to follow up / compliance','CXR complications (effusion, abscess, pneumothorax)'].map(x=>x+' – judge clinically'), lvl:hi.length?3:mod.length?2:0, src:'PAPP-PIDSP pediatric CAP CPG 2021 / 2016 risk classes (PH CPG – recalled, verify cut-offs)'}); }
  // 14. DKA severity + fluids (ISPAD 2022)
  if(sc('pd_dka')>=6 || (y('ketones')&&n.glu!=null&&n.glu>200)){
    const ph=n.ph, hc=n.hco3; let sev=null;
    if(ph!=null||hc!=null){ sev = (ph!=null&&ph<7.1)||(hc!=null&&hc<5)?'Severe':(ph!=null&&ph<7.2)||(hc!=null&&hc<10)?'Moderate':(ph!=null&&ph<7.3)||(hc!=null&&hc<18)?'Mild':'Not DKA by gas'; }
    const def = sev==='Severe'?10: sev==='Moderate'?7: 5; let v=sev||'pH / HCO₃?', interp='Enter venous pH and HCO₃ for severity';
    let details='Deficit assumed '+def+' % · replace deficit + maintenance evenly over 24–48 h; subtract boluses beyond the first 20 mL/kg only if local protocol says so';
    if(wt && sev && sev!=='Not DKA by gas'){ const h=holliday(wt); const defMl=def*10*wt; const tot48 = defMl + h.d*2; const rate = tot48/48;
      interp=`${sev} DKA → bolus 10–20 mL/kg = ${fmtN(10*wt)}–${fmtN(Math.min(20*wt,1000))} mL 0.9 % saline (20 mL/kg if shocked), then ≈ ${fmtN(rate)} mL/h for 48 h (deficit ${fmtN(defMl)} mL + maintenance ${fmtN(h.d)} mL/day); insulin 0.05–0.1 units/kg/h = ${fmtN(0.05*wt)}–${fmtN(0.1*wt)} units/h starting 1 h after fluids, no bolus [⚠ VERIFY]`; }
    out.push({id:'ispad', name:'DKA severity & fluids (ISPAD 2022)', v, interp, details:details+' · cerebral edema watch: headache, slowing HR, rising BP, ↓ GCS, recurrent vomiting → mannitol 0.5–1 g/kg'+(wt?` (${fmtN(0.5*wt)}–${fmtN(wt)} g)`:'')+' or 3 % saline 2.5–5 mL/kg'+(wt?` (${fmtN(2.5*wt)}–${fmtN(Math.min(5*wt,250))} mL)`:''), miss:[ph==null&&hc==null?'pH / HCO₃':null, wt?null:'weight'].filter(Boolean), lvl:sev==='Severe'||sev==='Moderate'?3:sev==='Mild'?2:1, src:'ISPAD 2022 DKA & HHS guideline (Glaser et al.) (intl)'}); }
  // 15. TWIST (testicular torsion)
  if(y('testis_pain')&&D.ctx.sex!=='F'){ let v=0; const it=[]; const c=(x,l,p=1)=>{ if(x){ v+=p; it.push(l+(p>1?' +'+p:'')); } };
    c(y('scrotal_swell')||y('swelling'),'testicular swelling',2); c(y('hard_testis'),'hard testis'); c(y('high_testis'),'absent cremasteric / high-riding',2); c(y('nausea')||y('vomiting'),'nausea / vomiting');
    out.push({id:'twist', name:'TWIST score (testicular torsion)', v, max:7, details:(it.join(', ')||'no items')+' · high-riding testis and absent cremasteric reflex are scored together here (one chip)', interp:v>=5?'≥ 5: high risk – straight to surgical exploration':v>=3?'3–4: intermediate – urgent Doppler US':'0–2: low risk – US if doubt', lvl:v>=5?3:v>=3?2:0, src:'Barbosa et al. J Urol 2013 (intl)'}); }
  return out;
}
// Dengue fluids by weight (children) – DOH 2011 / WHO 2009 group B (warning signs) and C (shock) regimens
function dengueFluids(D){
  const n=D.n, wt=n.wtUse, g=dengueClass(D).v.slice(-1);
  if(!wt) return {id:'denguefluid', name:'Dengue fluids (child)', v:'—', interp:'Enter weight (use ideal body weight if obese)', miss:['weight'], lvl:0, src:'DOH 2011 / WHO 2009 (PH CPG)'};
  const h=holliday(wt); const r = (lo,hi)=>`${fmtN(lo*wt)}–${fmtN(hi*wt)} mL/h`;
  let interp;
  if(g==='C') interp=`Compensated shock: crystalloid 10–20 mL/kg over 1 h = ${fmtN(10*wt)}–${fmtN(Math.min(20*wt,1000))} mL; if better → 7–10 mL/kg/h × 1–2 h (${r(7,10)}) → 5–7 (${r(5,7)}) → 3–5 (${r(3,5)}) → 2–3 mL/kg/h (${r(2,3)}). Hypotensive shock: 20 mL/kg (${fmtN(Math.min(20*wt,1000))} mL) over 15 min, repeat; check Hct – rising → colloid/crystalloid, falling → blood 10 mL/kg pRBC`;
  else if(g==='B') interp=`Warning signs: crystalloid 5–7 mL/kg/h × 1–2 h (${r(5,7)}) → 3–5 mL/kg/h × 2–4 h (${r(3,5)}) → 2–3 mL/kg/h (${r(2,3)}); titrate to Hct, perfusion and urine output 0.5–1 mL/kg/h (${fmtN(0.5*wt)}–${fmtN(wt)} mL/h)`;
  else interp=`Group A: oral fluids ≈ maintenance ${fmtN(h.d)} mL/day (+ replacement of losses); urine at least every 4–6 h`;
  return {id:'denguefluid', name:'Dengue fluids (child, by weight)', v:'Group '+g, interp:interp+' [⚠ VERIFY]', details:`For ${wt} kg${n.wtIsEst?' (APLS estimate)':''} · maintenance ${fmtN(h.h)} mL/h (${fmtN(h.d)} mL/day) · stop IV fluids 24–48 h after leakage stops (overload risk)`, lvl:g==='C'?3:g==='B'?2:0, src:'DOH 2011 / WHO 2009 dengue (PH CPG) · 2023 DOH-approved dengue CPG (recalled – verify)'};
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
  const sev=[]; if(y('sbp_lt90')||y('narrow_pp')||y('cool_periph')||y('si_ge1')||y('crt_prolonged')||y('mottled')) sev.push('shock / severe plasma leakage'); if(y('spo2_lt90')&&y('dyspnea')) sev.push('respiratory distress from fluid accumulation');
  if(y('hematemesis')||y('melena')||y('hematochezia')) sev.push('severe bleeding'); if(y('gcs_lt15')) sev.push('impaired consciousness'); if(y('jaundice')||y('bili_high')) sev.push('liver involvement'); if(y('cr_high')||y('oliguria')) sev.push('renal impairment');
  const co=[]; if(D.ctx.pregnant) co.push('pregnancy'); if(n.age!=null&&(n.age<1||n.age>=60)) co.push('infancy / older age'); ['dm','ckd','hf','obesity','cirrhosis','immuno','htn'].forEach(id=>{ if(y(id)) co.push(FLABEL[id].toLowerCase()); });
  const g = sev.length?'C':(ws.length||co.length)?'B':'A';
  const lab = {A:'Group A – may be sent home (if tolerating oral fluids, voiding, no warning signs)', B:'Group B – refer for in-hospital care', C:'Group C – severe dengue: emergency treatment'}[g];
  return {id:'dengueclass', name:'Dengue classification (WHO 2009 / DOH)', v:'Group '+g, interp:lab, details:[sev.length?'Severe: '+sev.join(', '):'', ws.length?'Warning signs: '+ws.join(', '):'No warning signs entered', co.length?'Coexisting: '+co.join(', '):''].filter(Boolean).join(' · '), lvl:g==='C'?3:g==='B'?2:0, src:'DOH 2011 / WHO 2009 (PH CPG)'};
}
function alerts(D){
  const n=D.n, a=[];
  if(D.ctx.peds && n.rng){ const rg=n.rng, F=D.F;
    if(n.sbp!=null&&n.sbp<rg.hypo) a.push(`SBP ${n.sbp} < ${rg.hypo} – hypotension for age (late sign of shock): IV/IO, 10–20 mL/kg bolus, reassess`);
    if(n.sp!=null&&n.sp<90) a.push('SpO₂ < 90 % – oxygen / airway');
    if(n.gcs!=null&&n.gcs<=8) a.push('GCS ≤ 8 – protect airway');
    if(n.glu!=null&&n.glu<(n.age*365.25<=2?47:60)) a.push(`Glucose ${Math.round(n.glu)} mg/dL – hypoglycemia: D10W 2–5 mL/kg IV`+(n.wtUse?` (${fmtN(2*n.wtUse)}–${fmtN(Math.min(5*n.wtUse,250))} mL)`:'')+' [⚠ VERIFY]');
    if(n.rr!=null&&(n.rr>=rg.fast+10||n.rr<rg.slow)) a.push('RR '+n.rr+' – severe respiratory distress / failure for age');
    if(n.hr!=null&&(F.hr_vhi_age===1||n.hr<60)) a.push('HR '+n.hr+(n.hr<60?' – bradycardia: if poor perfusion despite oxygenation/ventilation, start CPR':' – SVT range for age? 12-lead ECG'));
    if(n.T!=null&&n.T>=38&&n.age*365.25<90) a.push('Fever in an infant < 3 months – serious bacterial infection work-up (AAP 2021)');
    if(n.T!=null&&n.T<36&&n.age*365.25<=28) a.push('Hypothermia in a neonate – sepsis until proven otherwise; warm (KMC / incubator)');
    if(n.T!=null&&n.T>=40) a.push('T ≥ 40 °C – hyperpyrexia: sepsis / meningitis / heat stroke');
    if(F.danger_sign===1) a.push('IMCI general danger sign – urgent treatment and admission / referral');
    const pk=[F.pat_appear,F.pat_wob,F.pat_circ].filter(v=>v===1).length; if(pk>=2) a.push('PAT: '+pk+' sides abnormal – unstable child, resuscitate');
    return a; }
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
  const pt = [n.ageRaw!=null?(n.ageU==='d'?n.ageRaw+' d':n.ageU==='wk'?n.ageRaw+' wk':n.ageU==='mo'?n.ageRaw+' mo':n.ageRaw+' y'):'age ?', I.sex==='M'?'M':I.sex==='F'?'F':'sex ?']; if(I.sex==='F'&&I.preg&&I.preg!=='unk') pt.push({yes:'pregnant'+(I.ga?' '+I.ga+' wk':''),no:'not pregnant (test neg)',possible:'possible pregnancy (late period)',na:''}[I.preg]||'');
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
  if(n.peds){ const pd=n.pd||{}, ctx=[];
    if(n.wtUse) ctx.push('weight '+n.wtUse+' kg'+(n.wtIsEst?' (APLS estimate)':''));
    const map={imm:{complete:'immunizations complete',incomplete:'immunizations incomplete',none:'no immunizations'},feed:{normal:'feeding normal',reduced:'feeding reduced',poor:'feeding poor (< 50 %)',unable:'unable to drink / breastfeed'},uo:{normal:'urine output normal',reduced:'urine output reduced',none:'no urine ≥ 8 h'},act:{normal:'alert / playful',irritable:'irritable, consolable',inconsolable:'inconsolable',lethargic:'lethargic',unresponsive:'unresponsive'}};
    Object.entries(map).forEach(([k,m])=>{ if(pd[k]&&m[pd[k]]) ctx.push(m[pd[k]]); });
    const pat=[['pat_appear','appearance'],['pat_wob','work of breathing'],['pat_circ','circulation']].filter(([id])=>F[id]!=null).map(([id,l])=>l+' '+(F[id]===1?'ABNORMAL':'normal'));
    if(pat.length) ctx.push('PAT: '+pat.join(', '));
    if(n.rng) ctx.push('normal for age ('+n.rng.band+'): HR '+n.rng.hr.join('–')+', RR '+n.rng.rr.join('–')+', SBP ≥ '+n.rng.hypo);
    const pp=[], pn=[]; ['pd_ds','pd_hx','pd_pe','pd_kd'].forEach(g=>{ pp.push(...pos(g)); pn.push(...negs(g)); });
    L.push('PEDIATRIC: '+[ctx.join(', '), pp.length?'(+) '+pp.join(', '):'', pn.length?'(−) '+pn.join(', '):''].filter(Boolean).join(' | '));
    const lb=[]; if(n.anc!=null) lb.push('ANC '+n.anc); if(n.crp!=null) lb.push('CRP '+n.crp); if(n.pct!=null) lb.push('PCT '+n.pct); if(n.esr!=null) lb.push('ESR '+n.esr); if(n.ph!=null) lb.push('pH '+n.ph); if(n.hco3!=null) lb.push('HCO₃ '+n.hco3);
    if(lb.length) L.push('PEDS LABS: '+lb.join(', ')); }
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
    if(n.peds){ const dz=condDoses(c,D); if(dz) L.push('  Weight-based doses'+(dz.wt?' for '+dz.wt+' kg'+(dz.est?' (APLS estimate)':''):' (enter weight)')+': '+dz.rows.map(d=>d.n+' '+(d.perKg?d.perKg+' ':'')+(d.txt?'→ '+d.txt:'')+(d.capped?' (capped at adult max)':'')+(d.r?' '+d.r:'')).join('; ')+' ⚠VERIFY');
      if(c.home) L.push('  Home care / return advice: '+c.home.join(' · ')); }
    L.push('  Disposition: '+c.dispo+(c.dps?'  [Source: '+c.dps+']':'')); });
  if(mn.length) L.push('» To exclude (must-not-miss): '+mn.map(r=>r.c.n+' – '+r.c.dx[0]).join(' | '));
  L.push(''); L.push('Decision support only – not a diagnosis. Clinical judgment overrides. Generated offline; no data left the device.');
  return L.join('\n');
}
if(typeof module!=='undefined') module.exports={extract,derive,scoreAll,computeScores,alerts,chartNote,tier,CC_MAP,primarySurvey,traumaScores,atlsClass,traumaCentre,isShock,pedRanges,aplsWeight,holliday,pedDose,condDoses,pedsScores};
