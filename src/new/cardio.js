// ======================= S7 CARDIOVASCULAR (sample section) =======================
// Sources: 2025 ACC/AHA ACS; 2023 ESC ACS; 4th UDMI; STREAM-2; HEART; 2017 ACC/AHA HTN; AAP 2017; 2021/2023 ESC HF; SCAI;
// AHA 2020/2025 ACLS; 2023 ACC/AHA AF; 2022 ACC/AHA aortic; ADD-RS/ADvISED; ESC pericardial 2015 / myocarditis-pericarditis 2025.
Object.assign(REVIEW, {
  'cv-energy':      {t:'Adult defibrillation energy: biphasic 120–200 J per manufacturer (maximum if unknown), monophasic 360 J', r:'AHA 2020/2025; device-specific.', tab:'Cardiovascular / Resus'},
  'cv-energy-peds': {t:'Pediatric energies: defibrillation 2 J/kg → 4 J/kg → ≥ 4 J/kg (max 10 J/kg or adult dose); synchronized cardioversion 0.5–1 J/kg then 2 J/kg', r:'PALS 2020/2025; v1 values reused, now flagged.', tab:'Cardiovascular / Resus'},
  'cv-times':   {t:'STEMI time targets: ECG ≤ 10 min of arrival; FMC-to-device ≤ 90 min (≤ 120 min including transfer, else lyse); door-to-needle ≤ 30 min; lysis → transfer, angiography 2–24 h, rescue PCI if < 50% ST resolution at 60–90 min; primary PCI still reasonable 12–48 h with ongoing symptoms/instability', r:'2025 ACC/AHA ACS and 2023 ESC (ESC uses ≤ 10 min diagnosis-to-lysis bolus). Local STEMI network protocol governs.', tab:'Cardiovascular'},
  'cv-stemi-crit': {t:'STEMI ECG criteria (4th UDMI): new ST elevation at J point in ≥ 2 contiguous leads – ≥ 1 mm all leads except V2–V3: ≥ 2 mm men ≥ 40 y, ≥ 2.5 mm men < 40 y, ≥ 1.5 mm women; posterior V7–V9 ≥ 0.5 mm', r:'Thresholds from the 4th Universal Definition (2018); OMI/STEMI-equivalent patterns are guideline-endorsed to varying degrees.', tab:'Cardiovascular'},
  'cv-asa':     {t:'Aspirin 162–325 mg chewed (non-enteric) loading, then 75–100 mg daily', r:'AHA 162–325 mg; ESC 150–300 mg PO (75–250 mg IV).', tab:'Cardiovascular'},
  'cv-p2y12':   {t:'P2Y12 loading: ticagrelor 180 mg; prasugrel 60 mg (PCI only; avoid prior stroke/TIA; ≥ 75 y or < 60 kg 5 mg maintenance); clopidogrel 600 mg for PCI, 300 mg with fibrinolysis (75 mg, no load, if > 75 y)', r:'Timing of pre-treatment differs (ESC: not routine in NSTE-ACS when early angiography planned).', tab:'Cardiovascular'},
  'cv-acoag':   {t:'Anticoagulation: primary PCI UFH 70–100 U/kg IV; with fibrinolysis UFH 60 U/kg (max 4,000 U) then 12 U/kg/hr (max 1,000 U/hr, aPTT 1.5–2×) or enoxaparin < 75 y 30 mg IV + 1 mg/kg SC q12h (max 100 mg first 2 doses), ≥ 75 y no IV bolus, 0.75 mg/kg SC q12h (max 75 mg first 2 doses), CrCl < 30: 1 mg/kg q24h; NSTE-ACS enoxaparin 1 mg/kg SC q12h', r:'2013/2025 ACC/AHA; ESC 2023 similar. Renal dosing and bleeding risk decide.', tab:'Cardiovascular'},
  'cv-ntg':     {t:'Nitroglycerin 0.4 mg SL q5 min × 3 for ischemic pain (avoid SBP < 90, RV infarct, PDE-5 inhibitor within 24–48 h); IV 5–10 mcg/min titrated', r:'ACC/AHA. Not shown to reduce mortality; do not use to mask pain before ECG.', tab:'Cardiovascular'},
  'cv-tnk':     {t:'Tenecteplase single bolus by weight: < 60 kg 30 mg · 60–69 35 mg · 70–79 40 mg · 80–89 45 mg · ≥ 90 kg 50 mg; half dose if ≥ 75 y', r:'Half dose ≥ 75 y comes from STREAM/STREAM-2 and ESC 2023; not in all labels. TNK may not be stocked in PH hospitals.', tab:'Cardiovascular'},
  'cv-tpa':     {t:'Alteplase accelerated STEMI regimen: 15 mg IV bolus, 0.75 mg/kg over 30 min (max 50 mg), 0.5 mg/kg over 60 min (max 35 mg); total ≤ 100 mg', r:'GUSTO accelerated regimen.', tab:'Cardiovascular'},
  'cv-sk':      {t:'Streptokinase 1.5 million units IV over 30–60 min; do not repeat (antibodies) – use a fibrin-specific agent if previously exposed', r:'Still used where fibrin-specific agents are unavailable (relevant to PH public hospitals). Hypotension common – slow infusion.', tab:'Cardiovascular'},
  'cv-heart':   {t:'HEART score bands: 0–3 low (MACE ≈ 1–2%), 4–6 moderate, 7–10 high', r:'Use with serial or high-sensitivity troponin pathway; HEART alone is not a 0/1-h hs-troponin algorithm.', tab:'Cardiovascular'},
  'cv-htn-tgt': {t:'BP targets: general hypertensive emergency – lower MAP ≤ 25% in 1st hour, then to 160/100–110 over 2–6 h, then normal over 24–48 h; aortic dissection SBP ≤ 120 (100–120) and HR ≤ 60 within 20 min; preeclampsia/eclampsia, pheochromocytoma SBP < 140 in 1st hour; ischemic stroke: < 185/110 before and < 180/105 for 24 h after lysis (no lysis: treat only > 220/120); ICH: target SBP 140 (avoid < 130); ACS/AHF: vasodilator to symptom relief', r:'2017 ACC/AHA HTN, 2019 AIS, 2022 ICH. Do not treat asymptomatic severe hypertension with rapid IV drops.', tab:'Cardiovascular'},
  'cv-htn-drugs':{t:'IV antihypertensives: labetalol 20 mg IV then 20–80 mg q10 min (max 300 mg) or 0.5–2 mg/min; nicardipine 5 mg/hr, + 2.5 mg/hr q5–15 min (max 15); esmolol 500 mcg/kg load then 50–300 mcg/kg/min; NTG 5–200 mcg/min; nitroprusside 0.3–10 mcg/kg/min (max 10 for ≤ 10 min); hydralazine 10–20 mg IV; phentolamine 1–5 mg IV (repeat; for catecholamine excess)', r:'2017 ACC/AHA HTN table; nicardipine/clevidipine availability varies in PH.', tab:'Cardiovascular'},
  'cv-htn-peds':{t:'Pediatric hypertensive emergency: lower BP ≤ 25% of planned reduction in first 8 h, rest over 24–48 h; labetalol 0.2–1 mg/kg (max 40 mg) or 0.25–3 mg/kg/hr; nicardipine 0.5–3 mcg/kg/min; esmolol 100–500 mcg/kg/min; hydralazine 0.1–0.2 mg/kg (max 20 mg); nitroprusside 0.3–8 mcg/kg/min', r:'AAP 2017 Flynn guideline table (recalled) – pediatric nephrology/PICU input recommended. Nitroprusside peds max uncertain.', tab:'Cardiovascular'},
  'cv-ahf':     {t:'Acute HF: furosemide IV – diuretic-naïve 20–40 mg; on oral loop diuretic 1–2.5× the daily oral dose IV; reassess natriuresis (spot urine Na > 50–70 mmol/L at 2 h) / urine output > 100–150 mL/hr at 6 h; double dose if inadequate', r:'ESC 2021 HF / 2019 HFA diuretic position paper.', tab:'Cardiovascular'},
  'cv-scape':   {t:'SCAPE (sympathetic crashing acute pulmonary edema): high-dose nitroglycerin – SL 0.4–0.8 mg repeated, or IV bolus 400–1,000 mcg over 2 min and/or infusion starting 100–200 mcg/min titrated rapidly (up to ~400 mcg/min) + immediate NIV', r:'Based on observational ED data (e.g. Mathew 2021, Wilson 2017); not in ESC/AHA guidelines in this form. Owner review essential.', tab:'Cardiovascular'},
  'cv-dobut':   {t:'Dobutamine 2–20 mcg/kg/min (start 2–5) – pump concentration 250 mg in 250 mL = 1,000 mcg/mL (premix 250 mg/250 mL or 500 mg/250 mL = 2,000 mcg/mL)', r:'Concentration assumption must match local premix.', tab:'Cardiovascular'},
  'cv-rate':    {t:'Rate control: diltiazem 0.25 mg/kg IV over 2 min (then 0.35 mg/kg after 15 min), infusion 5–15 mg/hr; metoprolol 2.5–5 mg IV over 2 min q5 min to 15 mg; avoid both in decompensated HFrEF, WPW, hypotension – use amiodarone/digoxin', r:'2023 ACC/AHA AF guideline.', tab:'Cardiovascular'},
  'cv-aorta':   {t:'Aortic dissection: IV β-blocker first (esmolol 500 mcg/kg then 50–300 mcg/kg/min, or labetalol) to HR ≤ 60, then vasodilator (nicardipine/nitroprusside) for SBP 100–120; opioid analgesia', r:'2022 ACC/AHA aortic guideline. If AR severe/shock, avoid β-blocker – surgery.', tab:'Cardiovascular'},
  'cv-addrs':   {t:'ADD-RS + D-dimer (ADvISED): ADD-RS 0–1 with D-dimer < 500 ng/mL FEU → dissection very unlikely; ADD-RS ≥ 2 → direct CT angiography', r:'ADvISED (2018) failure rate ≈ 0.3% in ADD-RS ≤ 1 + D-dimer negative; not validated in all populations.', tab:'Cardiovascular'},
  'cv-peri':    {t:'Acute pericarditis: ibuprofen 600 mg q8h (or aspirin 750–1,000 mg q8h) for 1–2 weeks then taper + colchicine 0.5 mg BID (0.5 mg daily if < 70 kg) for 3 months; avoid routine steroids; pediatric ibuprofen 30–50 mg/kg/day ÷ q8h, colchicine < 5 y 0.5 mg/day, > 5 y 1–1.5 mg/day ÷ 2–3', r:'ESC 2015 doses; the 2025 ESC myocarditis–pericarditis guideline may refine – check current version. Diagnosis needs ≥ 2 of 4 criteria.', tab:'Cardiovascular'}
});
Object.assign(D, {
  cvAsa: {n:'Aspirin', flag:'cv-asa', a:[F('Chewed (non-enteric) loading','162 – 325 mg',{note:'Then 75–100 mg daily. Rectal 300–600 mg if unable to swallow.'})]},
  cvP2y12: {n:'P2Y12 inhibitor (load)', flag:'cv-p2y12', a:[F('Ticagrelor','180 mg PO'),F('or Prasugrel (PCI)','60 mg PO – avoid prior stroke/TIA'),F('or Clopidogrel','600 mg (PCI) · 300 mg with fibrinolysis (75 mg, no load, if > 75 y)')]},
  cvUfh: {n:'Unfractionated heparin', flag:'cv-acoag',
    a:[B('Primary PCI bolus',70,100,'units/kg',{note:'Cath-lab ACT-guided.'}),
       C('With fibrinolysis',w=>ok(w)?{main:`${fmt(Math.min(60*w,4000))} units IV bolus`,lines:[`Then ${fmt(Math.min(12*w,1000))} units/hr (12 U/kg/hr, max 1,000)`,'60 U/kg (max 4,000 U); aPTT 1.5–2× control; 48 h or until revascularisation']}:{main:'Enter weight',lines:['60 U/kg (max 4,000 U) then 12 U/kg/hr (max 1,000 U/hr)']})]},
  cvEnox: {n:'Enoxaparin', flag:'cv-acoag',
    a:[C('With fibrinolysis (age-adjusted)',w=>{ const y=ageYears(); if(!ok(w)) return {main:'Enter weight (and age)',lines:['< 75 y: 30 mg IV + 1 mg/kg SC q12h','≥ 75 y: no IV bolus, 0.75 mg/kg SC q12h','CrCl < 30: 1 mg/kg SC q24h']};
        if(y!=null && y>=75) return {main:`${fmt(Math.min(0.75*w,75))} mg SC q12h – no IV bolus`,lines:['Age ≥ 75: 0.75 mg/kg (max 75 mg for first 2 doses)','CrCl < 30: 1 mg/kg SC q24h']};
        return {main:`30 mg IV, then ${fmt(Math.min(w,100))} mg SC q12h`,lines:[`1 mg/kg SC (max 100 mg first 2 doses)${y==null?' – enter age: ≥ 75 y changes the regimen':''}`,'CrCl < 30: 1 mg/kg SC q24h']}; }),
       C('NSTE-ACS',w=>ok(w)?{main:`${fmt(w)} mg SC q12h`,lines:['1 mg/kg q12h; CrCl < 30 → q24h']}:{main:'Enter weight',lines:['1 mg/kg SC q12h']})]},
  cvNtg: {n:'Nitroglycerin (ischemic pain)', flag:'cv-ntg', a:[F('SL','0.4 mg q5 min × 3'),F('IV infusion','5 – 10 mcg/min, titrate by 10 mcg/min q3–5 min',{note:'Avoid: SBP < 90, RV infarct (inferior STEMI – check V4R), PDE-5 inhibitor (sildenafil 24 h, tadalafil 48 h).'})]},
  cvTnk: {n:'Tenecteplase (single IV bolus over 5–10 s)', flag:'cv-tnk',
    a:[C('Weight band',w=>{ const y=ageYears(), old=y!=null&&y>=75; if(!ok(w)) return {main:'Enter weight',lines:['< 60 kg 30 mg · 60–69 35 · 70–79 40 · 80–89 45 · ≥ 90 kg 50 mg','Age ≥ 75 y: half dose']};
        const d = w<60?30:w<70?35:w<80?40:w<90?45:50; return {main: old?`${fmt(d/2)} mg (half dose, age ≥ 75)`:`${d} mg`, lines:[`Band dose ${d} mg = ${fmt(d/5)} mL of 5 mg/mL`, old?'STREAM-2 / ESC 2023 half-dose for ≥ 75 y':(y==null?'Enter age – half dose if ≥ 75 y':'')].filter(Boolean)}; })]},
  cvTpa: {n:'Alteplase – accelerated (90 min)', flag:'cv-tpa',
    a:[C('Regimen',w=>ok(w)?{main:`15 mg bolus → ${fmt(Math.min(0.75*w,50))} mg over 30 min → ${fmt(Math.min(0.5*w,35))} mg over 60 min`,lines:[`Total ${fmt(15+Math.min(0.75*w,50)+Math.min(0.5*w,35))} mg (max 100 mg)`]}:{main:'Enter weight',lines:['15 mg bolus; 0.75 mg/kg over 30 min (max 50); 0.5 mg/kg over 60 min (max 35)']})]},
  cvSk: {n:'Streptokinase', flag:'cv-sk', a:[F('IV infusion','1.5 million units over 30–60 min',{note:'Hypotension → slow/pause infusion, fluids. Never re-use (antibodies) – prior exposure → fibrin-specific agent.'})]},
  cvLab: {n:'Labetalol', flag:'cv-htn-drugs',
    a:[F('IV bolus','20 mg over 2 min, then 20 – 80 mg q10 min (max 300 mg)'),F('or infusion','0.5 – 2 mg/min')],
    p:[B('IV bolus',0.2,1,'mg/kg',{max:40,conc:5,flag:'cv-htn-peds',note:'Infusion 0.25–3 mg/kg/hr. Avoid in asthma, HF.'})]},
  cvNicar: {n:'Nicardipine', flag:'cv-htn-drugs',
    a:[F('Infusion','5 mg/hr, increase 2.5 mg/hr q5–15 min (max 15 mg/hr)',{note:'25 mg in 250 mL = 0.1 mg/mL. Reflex tachycardia; avoid in severe aortic stenosis.'})],
    p:[I('Infusion',0.5,3,'mcg/kg/min',100,{flag:'cv-htn-peds',note:'100 mcg/mL (0.1 mg/mL).'})]},
  cvEsmo: {n:'Esmolol', flag:'cv-htn-drugs',
    a:[B('Load (over 1 min)',500,500,'mcg/kg',{conc:10000}),I('Infusion',50,300,'mcg/kg/min',10000,{note:'10 mg/mL. Titrate q4 min to HR/BP.'})],
    p:[I('Infusion',100,500,'mcg/kg/min',10000,{flag:'cv-htn-peds',note:'Load 100–500 mcg/kg optional.'})]},
  cvNtgInf: {n:'Nitroglycerin infusion', flag:'cv-htn-drugs', a:[F('IV','5 – 200 mcg/min (titrate q3–5 min)',{note:'50 mg in 250 mL = 200 mcg/mL. Preferred for ACS and pulmonary edema.'})]},
  cvSnp: {n:'Sodium nitroprusside', flag:'cv-htn-drugs',
    a:[I('Infusion',0.3,10,'mcg/kg/min',200,{note:'50 mg in 250 mL D5W = 200 mcg/mL, light-protected. Arterial line. > 2 mcg/kg/min or > 72 h: cyanide/thiocyanate risk; max rate ≤ 10 min.'})],
    p:[I('Infusion',0.3,8,'mcg/kg/min',200,{flag:'cv-htn-peds',note:'PICU only; cyanide toxicity monitoring.'})]},
  cvHydral: {n:'Hydralazine', flag:'cv-htn-drugs',
    a:[F('IV','10 – 20 mg q4–6h',{note:'Unpredictable, prolonged effect – not first-line except pregnancy.'})],
    p:[B('IV',0.1,0.2,'mg/kg',{max:20,flag:'cv-htn-peds'})]},
  cvPhent: {n:'Phentolamine (catecholamine excess: pheochromocytoma, cocaine/MAOI crisis)', flag:'cv-htn-drugs',
    a:[F('IV','1 – 5 mg, repeat q5–15 min'),F('Pediatric','0.05 – 0.1 mg/kg (max 5 mg)')]},
  cvFuro: {n:'Furosemide – acute HF', flag:'cv-ahf',
    a:[F('Diuretic-naïve','20 – 40 mg IV'),F('On oral loop diuretic','1 – 2.5 × total daily oral dose, given IV',{note:'Check spot urine Na at 2 h (> 50–70 mmol/L) / urine output at 6 h (> 100–150 mL/hr); else double the dose.'})],
    p:[B('IV',1,1,'mg/kg',{max:40,flag:'cv-ahf'})]},
  cvNtgHi: {n:'High-dose nitroglycerin – SCAPE', flag:'cv-scape',
    a:[F('SL (while setting up)','0.4 – 0.8 mg, repeat q3–5 min'),F('IV bolus','400 – 1,000 mcg over 2 min (may repeat)'),F('IV infusion','Start 100 – 200 mcg/min, titrate rapidly (up to ~400 mcg/min) then wean as BP falls',{note:'Hold if SBP < 100–110 or MAP drop > 30%. Avoid in severe AS/RV infarct/PDE-5.'})]},
  cvDobut: {n:'Dobutamine (low output)', flag:'cv-dobut',
    a:[I('Infusion',2,20,'mcg/kg/min',1000,{note:'250 mg in 250 mL = 1,000 mcg/mL. Start 2–5; arrhythmias, hypotension.'})],
    p:[I('Infusion',2,20,'mcg/kg/min',1000,{flag:'peds-pressor'})]},
  cvDilt: {n:'Diltiazem – AF/flutter rate control', flag:'cv-rate',
    a:[B('IV over 2 min',0.25,0.25,'mg/kg',{max:25,conc:5,note:'Repeat 0.35 mg/kg after 15 min if needed; infusion 5–15 mg/hr. Not in HFrEF, WPW, hypotension.'})]},
  cvMetop: {n:'Metoprolol – rate control', flag:'cv-rate', a:[F('IV over 2 min','2.5 – 5 mg, repeat q5 min to 15 mg',{note:'Avoid in decompensated HF, bronchospasm, WPW.'})]},
  cvIbu: {n:'Acute pericarditis – anti-inflammatory', flag:'cv-peri',
    a:[F('Ibuprofen','600 mg PO q8h × 1–2 wk, then taper (+ PPI)'),F('or Aspirin','750 – 1,000 mg PO q8h × 1–2 wk, then taper (preferred post-MI)'),
       C('+ Colchicine (3 months)',w=>({main: ok(w)?(w<70?'0.5 mg once daily':'0.5 mg twice daily'):'0.5 mg BID (once daily if < 70 kg)', lines:['Reduce in CKD; interactions (clarithromycin, azoles, statins)']}))],
    p:[B('Ibuprofen (per dose, q8h)',10,15,'mg/kg',{max:600,note:'= 30–50 mg/kg/day.'}),F('Colchicine','< 5 y: 0.5 mg/day · > 5 y: 1 – 1.5 mg/day in 2–3 doses')]}
});
function dtVal(id){ const v=$(id).value; if(!v) return null; const t=new Date(v).getTime(); return isNaN(t)?null:t; }
function hhmm(t){ const d=new Date(t); return d.toTimeString().slice(0,5); }
function renderCardio(w){
  const P=peds(), now=Date.now();
  // ---- ACS ----
  const on=dtVal('stOnset'), fmc=dtVal('stFmc'), pci=$('stPci').value;
  let tl='';
  if(fmc){
    const el=(now-fmc)/60000, sx= on ? (now-on)/3600000 : null;
    const row=(lbl,mins)=>{ const due=fmc+mins*60000, left=(due-now)/60000; return `<div class="dl">${lbl}</div><div><b>${hhmm(due)}</b> ${left>=0?`<span class="soon">(${Math.round(left)} min left)</span>`:`<span class="due">(${Math.round(-left)} min overdue)</span>`}</div>`; };
    const r=[row('12-lead ECG read',10)];
    if(pci==='onsite') r.push(row('Device (wire crossing)',90));
    else if(pci==='transfer') r.push(row('Device if transferred (else lyse)',120), row('Decide: transfer vs lysis',30));
    else r.push(row('Needle (fibrinolysis)',30));
    tl=`<div class="kv">${r.join('')}<div class="dl">Since FMC</div><div>${Math.round(el)} min</div>${sx!=null?`<div class="dl">Since onset</div><div><b>${fmt(sx,1)} h</b> ${sx>12?'<span class="due">> 12 h: primary PCI if ongoing ischemia/instability/HF (reasonable to 48 h); lysis not indicated</span>':sx>3&&pci!=='onsite'?'<span class="soon">later presentation favours PCI if achievable ≤ 120 min</span>':''}</div>`:''}</div>${vtag('cv-times')}`;
  } else tl='<div class="note">Enter first medical contact (and onset) to get live deadlines.</div>';
  $('o-acs').innerHTML = (P?'<div class="vwarn">Adult ACS pathway – pediatric chest pain: consider myocarditis, Kawasaki, anomalous coronary, cocaine.</div>':'') + tl +
   `<ol class="steps"><li><b>ECG within 10 min</b>; repeat q15–30 min if non-diagnostic and still in pain. STEMI: new ST elevation at J point in ≥ 2 contiguous leads – ≥ 1 mm (V2–V3: ≥ 2 mm men ≥ 40 y, ≥ 2.5 mm men &lt; 40 y, ≥ 1.5 mm women)${vtag('cv-stemi-crit')}</li>
     <li><b>STEMI equivalents / occlusion MI:</b> posterior MI (ST depression V1–V3 → record V7–V9, ≥ 0.5 mm), new LBBB or paced rhythm with modified Sgarbossa (concordant STE ≥ 1 mm, concordant STD V1–V3, or discordant STE/S ≥ 25%), de Winter T waves, STE aVR + diffuse STD with ongoing ischemia (left main/multivessel), hyperacute T waves – discuss with the cath lab</li>
     <li><b>Reperfusion:</b> primary PCI if FMC-to-device ≤ 120 min achievable; otherwise <b>fibrinolysis within 30 min</b> (onset &lt; 12 h, no contraindication) then transfer – angiography 2–24 h (pharmaco-invasive) or <b>rescue PCI</b> if ST resolution &lt; 50% at 60–90 min, ongoing pain, or instability${vtag('cv-times')}</li>
     <li>Cardiogenic shock or arrest with ROSC + STEMI → immediate angiography regardless of delay; culprit-only PCI in shock</li>
     <li>NSTE-ACS: high-sensitivity troponin 0/1-h or 0/2-h algorithm; immediate invasive (&lt; 2 h) if unstable, refractory pain, arrhythmia, mechanical complication, acute HF; early (&lt; 24 h) if NSTEMI confirmed or GRACE &gt; 140</li></ol>
   <h3>Antithrombotics &amp; anti-ischemic</h3>${P?'<div class="note">Adult doses only.</div>':drugs(['cvAsa','cvP2y12','cvUfh','cvEnox','cvNtg'],w)}
   <ul class="tight"><li>O₂ only if SpO₂ &lt; 90% · morphine may delay oral P2Y12 absorption – use sparingly · no NSAIDs · β-blocker orally in first 24 h only if no HF/shock signs</li>
     <li>Inferior STEMI: right-sided leads (V4R); RV infarct → avoid nitrates, fluids for preload</li></ul>`;
  // ---- lysis ----
  $('o-lysis').innerHTML = P?'<div class="note">Adult STEMI fibrinolysis only.</div>':`${drugs(['cvTnk','cvTpa','cvSk'],w)}
   <div class="note"><b>Adjuncts:</b> aspirin + clopidogrel (300 mg; 75 mg if &gt; 75 y) + UFH or enoxaparin (Antithrombotics above). Transfer to a PCI centre for all lysed patients.</div>
   <div class="twocol"><div><h3>Absolute contraindications</h3><ul class="tight"><li>Any prior intracranial hemorrhage</li><li>Ischemic stroke &lt; 3 months (except within 4.5 h)</li><li>Known intracranial neoplasm / AVM</li><li>Suspected aortic dissection</li><li>Active bleeding (excl. menses) or bleeding diathesis</li><li>Significant head/facial trauma or intracranial/spinal surgery &lt; 2–3 months</li><li>Severe uncontrolled HTN unresponsive to treatment (streptokinase: prior use &lt; 6 months)</li></ul></div>
   <div><h3>Relative</h3><ul class="tight"><li>SBP &gt; 180 or DBP &gt; 110</li><li>Ischemic stroke &gt; 3 months, dementia</li><li>Traumatic/prolonged CPR (&gt; 10 min), major surgery &lt; 3 weeks</li><li>Internal bleeding 2–4 weeks; non-compressible punctures</li><li>Pregnancy; active peptic ulcer; oral anticoagulant</li></ul></div></div>${vtag('cv-times')}`;
  // ---- HEART ----
  const y=ageYears(); const ageP = y==null?null: y<45?0:y<65?1:2;
  const hs=['heartH','heartE','heartR','heartT'].reduce((s,id)=>s+(parseInt($(id).value,10)||0),0) + (ageP||0);
  $('o-heart').innerHTML = `<div><span class="total">${ageP==null?'–':hs}</span> <span class="note">${ageP==null?'Enter age in the patient bar (age points: &lt; 45 = 0, 45–64 = 1, ≥ 65 = 2)':`incl. age ${fmt(y,0)} y = ${ageP} point${ageP===1?'':'s'}`}</span></div>
   ${ageP==null?'':`<div class="big">${hs<=3?'<span class="okc">Low (0–3)</span> – MACE ≈ 1–2% at 6 wk: early discharge if serial troponin negative':hs<=6?'<span class="soon">Moderate (4–6)</span> – observe, serial troponins, further testing':'<span class="due">High (7–10)</span> – early invasive strategy / cardiology'}${vtag('cv-heart')}</div>`}
   ${P?'<div class="vwarn">Not validated in children.</div>':''}`;
  // ---- hypertensive emergencies ----
  $('o-cvhtn').innerHTML = `<div class="note"><b>Emergency</b> = severe BP (often &gt; 180/120) <b>with</b> acute target-organ damage (encephalopathy, stroke/ICH, ACS, pulmonary edema, dissection, AKI/TMA, eclampsia, retinal hemorrhage/papilledema). Without damage = severe hypertension/urgency: oral agents, recheck, outpatient follow-up – no IV boluses.</div>
   <table class="wide"><thead><tr><th>Condition</th><th>Target${vtag('cv-htn-tgt')}</th><th>Preferred</th></tr></thead><tbody>
   <tr><td>Most emergencies</td><td>MAP ↓ ≤ 25% in 1st h → 160/100–110 over 2–6 h → normal over 24–48 h</td><td>Labetalol, nicardipine</td></tr>
   <tr><td>Aortic dissection</td><td><b>SBP ≤ 120, HR ≤ 60 within 20 min</b></td><td>Esmolol/labetalol first, then nicardipine/nitroprusside</td></tr>
   <tr><td>Pulmonary edema / ACS</td><td>Symptom relief; ~25% ↓</td><td>Nitroglycerin (+ NIV); avoid hydralazine</td></tr>
   <tr><td>Ischemic stroke</td><td>Lysis/thrombectomy: &lt; 185/110 before, &lt; 180/105 × 24 h · no reperfusion: treat if &gt; 220/120 (↓ 15%)</td><td>Labetalol, nicardipine</td></tr>
   <tr><td>Intracerebral hemorrhage</td><td>SBP 140 (avoid &lt; 130, avoid big swings)</td><td>Nicardipine, labetalol</td></tr>
   <tr><td>Preeclampsia / eclampsia</td><td>≥ 160/110 treated within 30–60 min; &lt; 140/90 (see OB)</td><td><a href="#" data-goto="obhtn">OB: labetalol, hydralazine, nifedipine + Mg</a></td></tr>
   <tr><td>Sympathomimetic (cocaine, amphetamine) / pheochromocytoma</td><td>SBP &lt; 140 (pheo)</td><td>Benzodiazepines first; phentolamine; α before β (no unopposed β-blocker)</td></tr>
   </tbody></table>
   ${P?`<div class="vwarn">Pediatric: lower BP by ≤ 25% of the planned reduction over the first 8 h${vtag('cv-htn-peds')}; look for renal causes, coarctation; PICU.</div>${drugs(['cvLab','cvNicar','cvEsmo','cvHydral','cvSnp'],w)}`:drugs(['cvLab','cvNicar','cvEsmo','cvNtgInf','cvSnp','cvHydral','cvPhent'],w)}`;
  // ---- AHF ----
  $('o-ahf').innerHTML = `<div class="note">Profile at the bedside: <b>warm/wet</b> (most) → vasodilator + diuretic · <b>cold/wet</b> → inotrope ± pressor, cath lab if ACS · <b>cold/dry</b> → cautious fluid. Find the trigger (CHAMPIT: ACS, Hypertensive emergency, Arrhythmia, Mechanical cause, Pulmonary embolism, Infection, Tamponade).</div>
   <h3>SCAPE – hypertensive flash pulmonary edema</h3>
   <ol class="steps"><li class="shock">Sit upright; <b>NIV immediately</b> (CPAP 5–10 cmH₂O or BiPAP) – reduces intubation</li>
     <li class="drugstep"><b>High-dose nitroglycerin</b> is the main treatment; diuretic is secondary (patients are often euvolemic, fluid redistributed)${vtag('cv-scape')}</li></ol>
   ${P?'':drugs(['cvNtgHi'],w)}
   <h3>Congestion (warm/wet)</h3>${drugs(['cvFuro'],w)}
   <ul class="tight"><li>Add a thiazide (metolazone/HCTZ) or acetazolamide for diuretic resistance; daily weight, K, Mg, creatinine</li><li>Avoid NSAIDs, non-DHP calcium blockers; continue GDMT unless shock or bradycardia</li></ul>
   <h3>Cardiogenic shock (SCAI stages)</h3>
   <table class="wide"><tbody><tr><td><b>A</b> At risk</td><td>Large MI, HF – normal perfusion</td></tr><tr><td><b>B</b> Beginning</td><td>Hypotension/tachycardia, perfusion preserved (lactate &lt; 2)</td></tr><tr><td><b>C</b> Classic</td><td>Hypoperfusion requiring intervention (inotrope/pressor/MCS); lactate ≥ 2</td></tr><tr><td><b>D</b> Deteriorating</td><td>Failing initial therapy</td></tr><tr><td><b>E</b> Extremis</td><td>Arrest/CPR, ECMO, refractory collapse</td></tr></tbody></table>
   <ol class="steps"><li>Treat the cause: <b>STEMI → emergent PCI</b>; mechanical complications (VSR, papillary rupture – echo) → surgery; tamponade → drain; arrhythmia → cardiovert</li>
     <li class="drugstep">MAP ≥ 65: <b>norepinephrine</b> first-line; add <b>dobutamine</b> for low output once MAP adequate${vtag('cv-dobut')}</li>
     <li>Arterial line, lactate, urine output, echo; early shock team / mechanical support referral (IABP, Impella, VA-ECMO where available)</li></ol>
   ${drugs(['nor','cvDobut'],w)}`;
  // ---- arrhythmias ----
  const d=defibInfo(w), c=cvInfo(w);
  $('o-arrhy').innerHTML = `<div class="row" style="flex-wrap:wrap;gap:.4rem"><button class="linkbtn" data-algo="brady" type="button">▶ ${P?'PALS':'ACLS'} bradycardia</button><button class="linkbtn" data-algo="tachy" type="button">▶ ${P?'PALS':'ACLS'} tachycardia</button><button class="linkbtn" data-algo="vf" type="button">▶ Arrest algorithm</button><button class="linkbtn" data-startcode="1" type="button">⏱ Start code timer</button></div>
   <div class="note">Buttons open the shared algorithm and code timer in Resuscitation – same doses, one source.</div>
   <h3>Unstable? (hypotension, altered mentation, shock, ischemic pain, acute HF)</h3>
   <div class="cline"><div class="dl">Synchronized cardioversion${P?vtag('cv-energy-peds'):vtag('cv-adult')}</div><b>${c.main}</b>${c.lines.map(l=>`<div class="note">${l}</div>`).join('')}</div>
   <div class="cline"><div class="dl">Pulseless VT/VF – defibrillation${vtag(P?'cv-energy-peds':'cv-energy')}</div><b>${d.main}</b></div>
   <div class="cline"><div class="dl">Bradycardia – pacing</div><b>Transcutaneous pacing if atropine fails</b><div class="note">Rate 60–80/min; raise mA until capture, confirm mechanical pulse (femoral); analgesia/sedation. Transvenous via cardiology.</div></div>
   <h3>Stable tachycardia – by QRS and regularity</h3>
   <table class="wide"><tbody>
   <tr><td><b>Narrow, regular</b> (SVT, flutter)</td><td>Modified Valsalva (strain 15 s, then supine + legs raised) → adenosine 6 → 12 (→ 12) mg rapid push with flush → diltiazem/β-blocker; flutter waves revealed → rate control</td></tr>
   <tr><td><b>Narrow, irregular</b> (AF, MAT)</td><td>Rate control (diltiazem or metoprolol; amiodarone/digoxin if HFrEF/hypotension); onset &lt; 24–48 h or anticoagulated → rhythm control option; CHA₂DS₂-VA for anticoagulation</td></tr>
   <tr><td><b>Wide, regular</b></td><td>Assume VT. Procainamide or amiodarone; adenosine only if regular + monomorphic and SVT with aberrancy likely; expert consult; cardioversion if any doubt</td></tr>
   <tr><td><b>Wide, irregular</b></td><td>Pre-excited AF (WPW): <b>no AV-nodal blockers</b> (adenosine, diltiazem, verapamil, β-blocker, digoxin, amiodarone) → procainamide (or ibutilide) or cardioversion. Polymorphic VT/torsades: Mg, defibrillate if unstable</td></tr></tbody></table>
   ${drugs(['adeno','cvDilt','cvMetop','amio','proc','lido','mag'],w)}
   <h3>Bradycardia</h3>${drugs(['atro','bradyInf'],w)}
   <ul class="tight"><li>High-grade AV block (Mobitz II, 3rd degree) → pacing pads on; atropine often ineffective (infranodal)</li>
     <li>Look for causes: <a href="#" data-goto="rnhyperk">hyperkalemia</a>, <a href="#" data-goto="cardiotox">β-blocker / CCB / digoxin toxicity</a>, inferior MI, hypothermia, hypothyroidism, raised ICP, Lyme/Chagas</li>
     <li>QT prolongation → stop QT drugs, correct K &gt; 4 and Mg &gt; 2; torsades → magnesium, overdrive pacing/isoproterenol</li></ul>`;
  // ---- aortic dissection ----
  const add=['ad_cond','ad_pain','ad_exam'].filter(k=>nc(k)).length, dd=$('adDd').value;
  let adv;
  if(add>=2) adv='<span class="due">ADD-RS ≥ 2: high risk → CT angiography (or bedside TTE/TEE if unstable); do not rely on D-dimer</span>';
  else if(dd==='neg') adv='<span class="okc">ADD-RS ≤ 1 + D-dimer &lt; 500: dissection very unlikely (ADvISED)</span> – consider other diagnoses';
  else if(dd==='pos') adv='<span class="soon">ADD-RS ≤ 1 + D-dimer positive → CT angiography</span>';
  else adv=`ADD-RS ${add}: ${add===1?'intermediate':'low'} risk – D-dimer can help rule out (ADD-RS 0–1)`;
  $('o-aorta').innerHTML = `<div><span class="total">${add}</span> <span class="note">ADD-RS (0–3)</span></div><div class="big">${adv}${vtag('cv-addrs')}</div>
   <ol class="steps"><li>Analgesia (IV opioid) – pain drives catecholamines</li>
     <li class="drugstep"><b>Impulse control first:</b> IV β-blocker to <b>HR ≤ 60</b>, then vasodilator for <b>SBP 100–120</b> within ~20 min (never vasodilator first – reflex tachycardia)${vtag('cv-aorta')}</li>
     <li><b>Type A</b> (ascending) → emergency cardiothoracic surgery; <b>Type B</b> → medical therapy ± endovascular if complicated (malperfusion, rupture, refractory pain/HTN)</li>
     <li>Hypotension = tamponade, rupture, severe AR, or coronary involvement → surgery, not β-blockers; no fibrinolysis/anticoagulation (STEMI with dissection: inferior STEMI is the classic trap)</li></ol>
   ${P?'':drugs(['cvEsmo','cvLab','cvNicar'],w)}
   <h3>Abdominal aortic aneurysm – suspected rupture</h3>
   <ul class="tight"><li>Pain (abdomen/back/flank) + hypotension or syncope in &gt; 50–60 y, smoker: bedside POCUS (aorta &gt; 3 cm), vascular surgery immediately – CT only if stable</li>
     <li>Permissive hypotension (target SBP ~70–90 / conscious and mentating) until control; activate massive transfusion (<a href="#" data-goto="mtp">MTP</a>)</li>
     <li>Mimics renal colic – image the aorta in older first-time "colic"</li></ul>`;
  // ---- pericarditis / myocarditis / tamponade ----
  $('o-peri').innerHTML = `<h3>Acute pericarditis – ≥ 2 of 4 (ESC)</h3>
   <ul class="tight"><li>Pleuritic chest pain, better sitting forward</li><li>Pericardial friction rub</li><li>New widespread ST elevation / PR depression (PR elevation in aVR)</li><li>New or worsening pericardial effusion</li></ul>
   <div class="note"><b>High-risk features → admit:</b> fever &gt; 38 °C, subacute onset, large effusion (&gt; 20 mm) or tamponade, no response to NSAID after 7 days, myopericarditis (troponin ↑), immunosuppression, trauma, oral anticoagulant. Look for TB (common in PH: large effusion, constitutional symptoms), uremia, malignancy, autoimmune.</div>
   ${drugs(['cvIbu'],w)}
   <h3>Myocarditis red flags</h3>
   <ul class="tight"><li>Chest pain + troponin rise with non-obstructed coronaries / viral prodrome; new HF, syncope, ventricular arrhythmia, AV block</li>
     <li><b>Fulminant</b>: cardiogenic shock within days → ICU, echo, early mechanical support referral; avoid NSAIDs in myocarditis-predominant disease; dengue and COVID/vaccine-related cases reported locally</li>
     <li>Exercise restriction ≥ 3–6 months; cardiac MRI</li></ul>
   <h3>Tamponade – recognise early</h3>
   <ul class="tight"><li>Hypotension, tachycardia, JVD (absent if hypovolemic), muffled sounds, pulsus paradoxus &gt; 10 mmHg, electrical alternans/low voltage</li>
     <li>POCUS: effusion + RA systolic collapse / RV diastolic collapse + plethoric IVC</li>
     <li>Fluid bolus only as a bridge; avoid positive-pressure ventilation and diuretics/vasodilators; intubation can precipitate arrest</li>
     <li><b>Pericardiocentesis</b> (ultrasound-guided, subxiphoid or parasternal) for tamponade; traumatic or dissection-related → surgery (needle only as a bridge in arrest)</li></ul>`;
}
function initCardio(){
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-now]'); if(!b) return; e.preventDefault();
    const d=new Date(), off=d.getTimezoneOffset(); const s=new Date(d.getTime()-off*60000).toISOString().slice(0,16);
    const el=$(b.dataset.now); el.value=s; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); });
  setInterval(()=>{ if(tab==='cardio' && $('stFmc').value) renderCardio(W()); }, 30000);
}
