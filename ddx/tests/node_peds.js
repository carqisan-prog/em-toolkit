// Pediatric mode checks: hand-calculated doses and adult caps, Holliday–Segar, APLS weight, age-specific vitals,
// pediatric scores, adult-only suppression, KB integrity (sources, ⚠ VERIFY, doses).  Run: node tests/node_peds.js
const fs=require('fs'), path=require('path'); const R=f=>fs.readFileSync(path.join(__dirname,'..','js',f),'utf8');
eval(R('findings.js')+R('kb.js')+R('engine.js')+R('cases.js')+';global.X={extract,CASES,KB,FLABEL,derive,scoreAll,computeScores,alerts,chartNote,pedRanges,aplsWeight,holliday,pedDose,condDoses};');
const P=1, N=-1; let fail=0, n=0; const out=[];
const eq=(name, got, exp)=>{ n++; const ok = typeof exp==='function' ? exp(got) : JSON.stringify(got)===JSON.stringify(exp); if(!ok) fail++; out.push((ok?'PASS ':'FAIL ')+name+'  expected '+(typeof exp==='function'?'(predicate)':JSON.stringify(exp))+' got '+JSON.stringify(got)); };
const K = id => X.KB.find(c=>c.id===id); const spec = (id, nm) => K(id).dz.find(s=>s.n.startsWith(nm));
const dose = (id, nm, wt, age) => { const r=X.pedDose(spec(id,nm), wt, age); return {v:r.v, v2:r.v2, capped:r.capped, txt:r.txt}; };
const run = I => { const D=X.derive(I); const Rr=X.scoreAll(D); return {D, R:Rr, S:X.computeScores(D,Rr), A:X.alerts(D)}; };
const sc = (r,id) => (r.S.find(s=>s.id===id)||{}).v;

// ---- 1. doses: weight × mg/kg, capped at the adult maximum (values worked by hand) ----
eq('Paracetamol 14 kg: 10–15 mg/kg = 140–210 mg, 5.8–8.8 mL of 120 mg/5 mL', dose('pd_febsz','Paracetamol',14), {v:140, v2:210, capped:false, txt:'140–210 mg = 5.8–8.8 mL of syrup 120 mg/5 mL'});
eq('Paracetamol 80 kg: 800–1200 → cap 1000 mg', dose('pd_febsz','Paracetamol',80), d=>d.v===800 && d.v2===1000 && d.capped);
eq('Ibuprofen 10 mg/kg 12 kg = 120 mg = 6 mL of 100 mg/5 mL', dose('pd_febsz','Ibuprofen',12).txt, '120 mg = 6 mL of syrup 100 mg/5 mL');
eq('Ibuprofen 50 kg: 500 → cap 400 mg', dose('pd_febsz','Ibuprofen',50), d=>d.v===400 && d.capped);
eq('Ceftriaxone 50 mg/kg 18 kg = 900 mg', dose('pd_mening','Ceftriaxone',18).v, 900);
eq('Ceftriaxone 50 mg/kg 45 kg: 2250 → cap 2000 mg', dose('pd_mening','Ceftriaxone',45), d=>d.v===2000 && d.capped);
eq('Epinephrine IM 0.01 mg/kg 20 kg = 0.2 mg = 0.2 mL of 1 mg/mL', dose('pd_anaph','Epinephrine 1 mg/mL',20).txt, '0.2 mg = 0.2 mL of 1 mg/mL (1:1000)');
eq('Epinephrine IM 60 kg: 0.6 → cap 0.5 mg', dose('pd_anaph','Epinephrine 1 mg/mL',60), d=>d.v===0.5 && d.capped);
eq('Adenosine 0.1 mg/kg 5 kg = 0.5 mg', dose('pd_svt','Adenosine 1st',5).v, 0.5);
eq('Adenosine 1st 70 kg: 7 → cap 6 mg', dose('pd_svt','Adenosine 1st',70), d=>d.v===6 && d.capped);
eq('Adenosine 2nd 70 kg: 14 → cap 12 mg', dose('pd_svt','Adenosine 2nd',70), d=>d.v===12 && d.capped);
eq('Cardioversion 0.5–1 J/kg 8 kg = 4–8 J', dose('pd_svt','Synchronised',8), d=>d.v===4 && d.v2===8);
eq('Amoxicillin AOM 45 mg/kg q12h 12 kg = 540 mg = 10.8 mL of 250 mg/5 mL', dose('pd_aom','Amoxicillin',12).txt, '540 mg = 10.8 mL of suspension 250 mg/5 mL');
eq('Amoxicillin AOM 50 kg: 2250 → cap 2000 mg', dose('pd_aom','Amoxicillin',50), d=>d.v===2000 && d.capped);
eq('Leptospirosis amoxicillin 50 mg/kg/day ÷ 3, 12 kg = 200 mg per dose', dose('pd_lepto','Amoxicillin',12).txt, '200 mg per dose');
eq('Leptospirosis amoxicillin 40 kg: 667 → cap 500 mg per dose', dose('pd_lepto','Amoxicillin',40), d=>d.v===500 && d.capped);
eq('NAC bag 1 150 mg/kg 20 kg = 3000 mg', dose('pd_apap','NAC bag 1',20).v, 3000);
eq('NAC bag 1 120 kg: 18 000 → cap 15 000 mg (100-kg cap)', dose('pd_apap','NAC bag 1',120), d=>d.v===15000 && d.capped);
eq('Activated charcoal 1 g/kg 60 kg → cap 50 g', dose('pd_apap','Activated charcoal',60), d=>d.v===50 && d.capped);
eq('Salbutamol 0.15 mg/kg 10 kg = 1.5 → minimum 2.5 mg', X.pedDose(spec('pd_hydrocarbon','Salbutamol'),10,2), d=>d.v===2.5 && d.floored);
eq('Midazolam buccal 0.3 mg/kg 10.5 kg = 3.15 → 3.2 mg', dose('pd_febsz','Midazolam buccal',10.5).txt, '3.2 mg');
eq('Midazolam buccal 40 kg: 12 → cap 10 mg', dose('pd_febsz','Midazolam buccal',40), d=>d.v===10 && d.capped);
eq('Levetiracetam 60 mg/kg 80 kg: 4800 → cap 4500 mg', dose('pd_se','Levetiracetam',80), d=>d.v===4500 && d.capped);
eq('D10W 2–5 mL/kg 4 kg = 8–20 mL', dose('pd_hypogly','Dextrose 10',4), d=>d.v===8 && d.v2===20);
eq('Dexamethasone croup 0.6 mg/kg 12 kg = 7.2 mg = 1.8 mL of 4 mg/mL', dose('pd_croup','Dexamethasone (moderate',12).txt, '7.2 mg = 1.8 mL of injection 4 mg/mL (can be given orally)');
eq('Dexamethasone croup 0.6 mg/kg 30 kg: 18 → cap 16 mg', dose('pd_croup','Dexamethasone (moderate',30), d=>d.v===16 && d.capped);
eq('IVIG Kawasaki 2 g/kg 14 kg = 28 g', dose('pd_kawasaki','IVIG',14).v, 28);
eq('IVIG MIS-C 2 g/kg 60 kg: 120 → cap 100 g', dose('pd_misc','IVIG',60), d=>d.v===100 && d.capped);
eq('Isoniazid 10 mg/kg 35 kg: 350 → cap 300 mg', dose('pd_tb','Isoniazid',35), d=>d.v===300 && d.capped);
eq('Rifampicin 15 mg/kg 20 kg = 300 mg', dose('pd_tb','Rifampicin',20).v, 300);
eq('Glucagon weight band 20 kg → 0.5 mg', X.pedDose(spec('pd_hypogly','Glucagon'),20).txt, '0.5 mg');
eq('Glucagon weight band 25 kg → 1 mg', X.pedDose(spec('pd_hypogly','Glucagon'),25).txt, '1 mg');
eq('Benzathine penicillin 26 kg → 600,000 units', X.pedDose(spec('pd_strep','Benzathine'),26).txt, '600,000 units');
eq('Benzathine penicillin 27 kg → 1,200,000 units', X.pedDose(spec('pd_strep','Benzathine'),27).txt, '1,200,000 units');
eq('Vitamin A by age 4 mo → 50,000 IU', X.pedDose(spec('pd_measles','Vitamin A'),6,0.33).txt, '50,000 IU');
eq('Vitamin A by age 8 mo → 100,000 IU', X.pedDose(spec('pd_measles','Vitamin A'),8,0.67).txt, '100,000 IU');
eq('Vitamin A by age 3 y → 200,000 IU', X.pedDose(spec('pd_measles','Vitamin A'),14,3).txt, '200,000 IU');
eq('No weight → per-kg text only, no number', X.pedDose(spec('pd_mening','Ceftriaxone'),null), d=>d.txt===null && d.perKg==='50 mg/kg');
// every dz spec: capped value never exceeds max; no NaN at 3 kg or 150 kg
const bad=[]; X.KB.forEach(c=>(c.dz||[]).forEach(s=>[3,12,150].forEach(w=>{ const r=X.pedDose(s,w,5); if(r.v!=null&&(isNaN(r.v)||(s.max!=null&&r.v>s.max+1e-9)||(r.v2!=null&&s.max!=null&&r.v2>s.max+1e-9))) bad.push(c.id+':'+s.n+'@'+w); if(!r.txt) bad.push(c.id+':'+s.n+' no text @'+w); })));
eq('All dose specs compute (3/12/150 kg) and respect the adult cap', bad, []);
const nocap = []; X.KB.filter(c=>c.pd).forEach(c=>(c.dz||[]).forEach(s=>{ if(!s.wb && !s.age && s.max==null && !s.x) nocap.push(c.id+':'+s.n); }));
eq('Every pediatric dose has an adult cap or an explicit “no fixed cap” note', nocap, []);

// ---- 2. Holliday–Segar, APLS weight, vital-sign ranges ----
eq('Holliday 8 kg = 32 mL/h, 800 mL/day', (h=>[h.h,h.d])(X.holliday(8)), [32,800]);
eq('Holliday 15 kg = 50 mL/h, 1250 mL/day', (h=>[h.h,h.d])(X.holliday(15)), [50,1250]);
eq('Holliday 25 kg = 65 mL/h, 1600 mL/day', (h=>[h.h,h.d])(X.holliday(25)), [65,1600]);
eq('Holliday 70 kg = 110 → cap 100 mL/h, 2500 → cap 2400 mL/day', (h=>[h.h,h.d,h.capped])(X.holliday(70)), [100,2400,true]);
eq('APLS weight 6 mo = 0.5×6+4 = 7 kg', X.aplsWeight(0.5), 7);
eq('APLS weight 3 y = 2×3+8 = 14 kg', X.aplsWeight(3), 14);
eq('APLS weight 8 y = 3×8+7 = 31 kg', X.aplsWeight(8), 31);
eq('APLS weight 15 y → not valid (null)', X.aplsWeight(15), null);
eq('Ranges 6 mo: HR 110–160, fast breathing ≥ 50, hypotension < 70', (r=>[r.hr,r.fast,r.hypo])(X.pedRanges(0.5)), [[110,160],50,70]);
eq('Ranges 3 y: HR 95–140, fast ≥ 40, hypotension < 76', (r=>[r.hr,r.fast,r.hypo])(X.pedRanges(3)), [[95,140],40,76]);
eq('Ranges 1 mo: fast breathing ≥ 60', X.pedRanges(1/12).fast, 60);
{ const r=run({age:6, ageU:'mo', v:{hr:150, rr:45}}); eq('6 mo HR 150 → NOT tachycardic for age (adult flag remapped)', [r.D.F.hr_gt100, r.D.F.hr_hi_age], [-1,-1]); eq('6 mo RR 45 → tachypnea for age but not fast breathing (< 50)', [r.D.F.rr_hi_age, r.D.F.fast_breath], [1,-1]); }
{ const r=run({age:4, v:{hr:150, rr:42}}); eq('4 y HR 150, RR 42 → tachycardia + fast breathing', [r.D.F.hr_hi_age, r.D.F.fast_breath], [1,1]); }
{ const r=run({age:2, v:{sbp:70}}); eq('2 y SBP 70 → hypotension for age (< 74)', r.D.F.sbp_lo_age, 1); }
{ const r=run({age:10, ageU:'mo', chips:{fever:-1}}); eq('Fever chip absent → fever_any absent (pediatric “a” weights apply)', r.D.F.fever_any, -1); }
eq('Age units: 21 d / 5 wk / 14 mo → years', [X.derive({age:21,ageU:'d'}).n.age, X.derive({age:5,ageU:'wk'}).n.age, X.derive({age:14,ageU:'mo'}).n.age].map(v=>Math.round(v*1000)/1000), [0.057,0.096,1.167]);
{ const r=run({age:3}); eq('APLS estimate used when no weight (3 y → 14 kg, flagged estimate)', [r.D.n.wtUse, r.D.n.wtIsEst], [14,true]); }

// ---- 3. scores ----
{ const c=X.CASES.find(k=>k.id==='pd_age_severe'); const r=run(Object.assign({},c.I)); const w=r.S.find(s=>s.id==='whodehyd');
  eq('WHO dehydration (AGE case 9 kg, 14 mo) → Plan C', w.v, 'Severe – Plan C');
  eq('Plan C volumes 9 kg ≥ 12 mo: 900 mL total = 270 mL / 30 min + 630 mL / 2½ h', /900 mL: 270 mL over 30 min, then 630 mL over 2½ h/.test(w.interp), true); }
{ const r=run({age:2, chips:{diarrhea:P, irritable:P, sunken_eyes:P}, pd:{wt:12}}); const w=r.S.find(s=>s.id==='whodehyd');
  eq('Some dehydration 12 kg → Plan B ORS 75 mL/kg = 900 mL over 4 h', [w.v, /900 mL over 4 h/.test(w.interp)], ['Some – Plan B', true]); }
eq('Westley (croup case: stridor with agitation 1 + mild retractions 1) = 2', sc(run(Object.assign({},X.CASES.find(k=>k.id==='pd_croup_2y').I)),'westley'), 2);
{ const base={age:45, ageU:'d', chips:{fever:P, ua_pos:N}, v:{t:38.3}, pd:{anc:3, pct:0.3, crp:5, patA:'n'}};
  eq('PECARN 45 d: UA neg, ANC 3.0, PCT 0.3 → Low risk', sc(run(base),'pecarnfi'), 'Low risk');
  eq('PECARN 45 d: PCT 2.0 (> 1.71) → Not low risk', sc(run(Object.assign({},base,{pd:{anc:3,pct:2,crp:5,patA:'n'}})),'pecarnfi'), 'Not low risk');
  eq('PECARN 45 d: ANC 5.0 (> 4.09) → Not low risk', sc(run(Object.assign({},base,{pd:{anc:5,pct:0.3,crp:5,patA:'n'}})),'pecarnfi'), 'Not low risk'); }
eq('AAP 2021: 21-day febrile infant case → Step-by-Step High risk', sc(run(Object.assign({},X.CASES.find(k=>k.id==='pd_febinf_21d').I)),'sbs'), 'High risk');
eq('Kawasaki case → Complete KD (fever ≥ 5 d + 5/5)', sc(run(Object.assign({},X.CASES.find(k=>k.id==='pd_kawasaki_3y').I)),'kawasaki'), 'Complete KD');
eq('Kawasaki fever 6 d + 2 criteria → Possible incomplete KD', sc(run({age:2, feverDay:6, chips:{fever:P,kd_conj:P,kd_oral:P}, pd:{crp:50}}),'kawasaki'), 'Possible incomplete KD');
eq('Kocher 4/4 (NWB, T 39, ESR 60, WBC 15)', sc(run({age:5, chips:{limp:P,nwb:P}, v:{t:39}, lab:{wbc:15}, pd:{esr:60}}),'kocher'), 4);
eq('Kocher 0/4 (walking, afebrile, ESR 10, WBC 8)', sc(run({age:5, chips:{limp:P,nwb:N}, v:{t:37}, lab:{wbc:8}, pd:{esr:10}}),'kocher'), 0);
eq('PAS 10 (hop 2, anorexia, T 38.5, vomiting, RLQ 2, WBC 14, ANC 11, migration)', sc(run({age:9, chips:{abd_pain:P,hop_pain:P,anorexia:P,vomiting:P,rlq_tender:P,migration:P}, v:{t:38.5}, lab:{wbc:14}, pd:{anc:11}}),'pas'), 10);
eq('ISPAD DKA case (pH 7.12, HCO₃ 8) → Moderate', sc(run(Object.assign({},X.CASES.find(k=>k.id==='pd_dka_12y').I)),'ispad'), 'Moderate');
eq('ISPAD pH 7.05 → Severe', sc(run({age:12, chips:{ketones:P}, v:{glu:500}, pd:{ph:7.05, hco3:6, wt:35}}),'ispad'), 'Severe');
eq('Pediatric GCS E3 V4 M5 = 12', sc(run({age:1, pd:{pgE:3,pgV:4,pgM:5}}),'pgcs'), 12);
eq('PAT appearance + circulation abnormal → 2/3', sc(run({age:1, pd:{patA:'a',patB:'n',patC:'a'}}),'pat'), '2/3 abnormal');
eq('PEWS (AGE severe case) ≥ 5', sc(run(Object.assign({},X.CASES.find(k=>k.id==='pd_age_severe').I)),'pews'), v=>v>=5);
eq('Maintenance card 25 kg = 65 mL/h', sc(run({age:7, pd:{wt:25}}),'maint'), '65 mL/h');
eq('TWIST torsion case = 5 (high risk)', sc(run(Object.assign({},X.CASES.find(k=>k.id==='pd_torsion_13y').I)),'twist'), 5);
{ const r=run(Object.assign({},X.CASES.find(k=>k.id==='pd_dengue_8y').I)); const f=r.S.find(s=>s.id==='denguefluid');
  eq('Dengue fluids card present for the 8-y dengue case (24 kg)', !!f && /24 kg|mL\/h/.test(JSON.stringify(f)), true); }
{ const r=run({age:14, chips:{fever:P,cough:P}, v:{hr:120,rr:28,sbp:110,t:38.5,spo2:96}}); eq('Adult scores hidden in pediatric mode (NEWS2, qSOFA, CURB-65)', r.S.filter(s=>['news2','qsofa','curb'].includes(s.id)).length, 0); }

// ---- 4. adult-only suppression and pediatric replacements ----
{ const r=run({age:8, chips:{chest_pain:P, dyspnea:P}}); const ex=r.R.excluded.map(e=>e.id);
  eq('8 y chest pain: STEMI / NSTEMI / aortic dissection suppressed (listed as excluded)', ['stemi','nstemi','dissection'].every(id=>ex.includes(id)) && !r.R.all.some(x=>['stemi','nstemi','dissection'].includes(x.id)), true); }
{ const r=run({age:9, chips:{abd_pain:P, rlq_tender:P}}); eq('9 y RLQ pain: adult “appy” replaced by pd_appy', [r.R.all.some(x=>x.id==='appy'), r.R.all.some(x=>x.id==='pd_appy'), (r.R.excluded.find(e=>e.id==='appy')||{}).why], [false,true,'pediatric mode – see Appendicitis (pediatric – PAS)']); }
{ const r=run({age:30, chips:{fever:P, cough:P}}); eq('Adult (30 y): no pediatric-only conditions', r.R.all.filter(x=>x.c.pd).length, 0); }
{ const r=run({age:10, pd:{on:false}, chips:{chest_pain:P}}); eq('Pediatric mode switched off for a 10-y-old → adult rules (STEMI considered, no pd_)', [r.D.ctx.peds, r.R.all.some(x=>x.id==='stemi'), r.R.all.some(x=>x.c.pd)], [false,true,false]); }
{ const r=run({age:25, pd:{on:true}, chips:{fever:P, cough:P}}); eq('Pediatric mode forced on (age 25) → peds rules', r.D.ctx.peds, true); }
{ const r=run({age:16, chips:{abd_pain:P, vag_bleed:P}, sex:'F', preg:'possible'}); eq('16-y-old: ectopic pregnancy still considered (amin 10)', r.R.all.some(x=>x.id==='ectopic'), true); }
{ const r=run({age:2, chips:{fever:P, vomiting:P, diarrhea:P}}); eq('2 y: adult gastroenteritis/dengue/sepsis replaced by pediatric versions', ['age','dengue','sepsis'].some(id=>r.R.all.some(x=>x.id===id)), false); }
{ const r=run({age:12, sex:'F', chips:{testis_pain:P}}); eq('Torsion excluded for female', r.R.all.some(x=>x.id==='pd_torsion'), false); }

// ---- 5. KB integrity for pediatric entries ----
const P_=X.KB.filter(c=>c.pd);
eq('≥ 30 pediatric conditions', P_.length, v=>v>=30);
eq('Every pediatric block cites a source (dx / tx / dispo)', P_.filter(c=>!(c.dxs&&c.txs&&c.dps)).map(c=>c.id), []);
eq('Every pediatric treatment line with a dose carries ⚠ VERIFY', P_.flatMap(c=>c.tx.map(t=>[c.id,t])).filter(([id,t])=>/\d\s?(mg|g|mcg|mL|IU|U|units|J)\b|mg\/kg|mL\/kg/.test(t)&&!/\[V\]/.test(t)).map(([id,t])=>id+': '+t.slice(0,70)), []);
eq('Every pediatric condition has weight-based doses or is dose-free by design', P_.filter(c=>!c.dz&&!['pd_jaundice','pd_fb','pd_epi','pd_pyloric','pd_volvulus','pd_appy','pd_nec','pd_intuss'].includes(c.id)).map(c=>c.id), []);
eq('Every pediatric condition links a toolkit card', P_.filter(c=>!c.tk||!c.tk[0]).map(c=>c.id), []);
eq('All finding ids used by pediatric conditions exist', P_.flatMap(c=>[...c.g,...(c.rf||[]),...Object.keys(c.w),...Object.keys(c.a||{})].filter(id=>!X.FLABEL[id]).map(id=>c.id+':'+id)), []);
eq('Home-care advice present for ≥ 15 pediatric conditions', P_.filter(c=>c.home&&c.home.length).length, v=>v>=15);
{ const c=X.CASES.find(k=>k.id==='pd_dengue_8y'); const I=Object.assign({},c.I); const r=run(I); const note=X.chartNote(I,r.D,r.R,r.S,['pd_dengue']);
  eq('Chart note (peds) has PEDIATRIC line, weight-based doses and home advice', ['PEDIATRIC','Weight-based doses','⚠VERIFY','Home care'].map(k=>note.includes(k)), [true,true,true,true]); }

// ---- 6. Taglish keywords ----
const T=[['lagnat',{fever:1}],['may ubo at sipon',{cough:1,coryza:1}],['kinukumbulsyon',{seizure:1}],['nangingisay',{seizure:1}],['ayaw dumede',{poor_feed:1}],['ayaw kumain',{poor_feed:1}],
  ['matamlay',{lethargy:1}],['nagsusuka',{vomiting:1}],['pagtatae',{diarrhea:1}],['hirap huminga',{dyspnea:1}],['may rashes',{rash:1}],['namamaga',{swelling:1}],['parang tahol ang ubo',{barking:1}],['nakainom ng gaas',{ingest_kero:1}]];
T.forEach(([t,exp])=>{ const f=X.extract(t).f; eq('Taglish “'+t+'”', Object.fromEntries(Object.keys(exp).map(k=>[k,f[k]])), exp); });

out.forEach(l=>console.log(l)); console.log(`\n${n-fail}/${n} passed · fail ${fail}`); process.exit(fail?1:0);
