// ======================= S16 ENVIRONMENTAL INJURIES (sample section) =======================
// Sources: ERC 2021/2025 special circumstances; WMS hypothermia 2019, heat 2019/2024, altitude 2019/2024, frostbite 2019/2024;
// ACSM 2023 EHS; ILCOR drowning; WHO SEARO snakebite 2016; DOH/RITM PCAV; UP-PGH NPMCC; ARC 9.4.5; UHMS/ACEP CO 2017.
Object.assign(REVIEW, {
  'ev-hypo-stage': {t:'Hypothermia staging: mild 35–32 °C (conscious, shivering), moderate < 32–28 °C (impaired consciousness, shivering stops), severe < 28 °C (unconscious, arrest risk; high risk < 24 °C)', r:'Swiss/WMS staging relies on clinical signs; temperature bands are approximate (2022 update moved to risk-of-arrest wording).', tab:'Environmental'},
  'ev-hypo-arrest':{t:'Hypothermic arrest (ERC): < 30 °C withhold adrenaline and limit to 3 shocks until > 30 °C; 30–35 °C double adrenaline interval (6–10 min); ECLS rewarming; K⁺ > 12 mmol/L (HOPE score preferred) suggests futility', r:'ERC 2021 (confirm 2025 update); AHA has a less restrictive stance on epinephrine.', tab:'Environmental'},
  'ev-heat':       {t:'Exertional heat stroke: cold/ice-water immersion (1–15 °C) to a cooling rate ≥ 0.15 °C/min; stop at ~38.6–39 °C core (rectal); "cool first, transport second"', r:'ACSM 2023 / WMS 2019 differ slightly on the endpoint (38.6 vs 39 °C).', tab:'Environmental'},
  'ev-eah':        {t:'Exercise-associated hyponatremia with neuro symptoms: 3% NaCl 100 mL IV bolus, repeat up to × 2 at 10-min intervals (pediatric 2 mL/kg, max 100 mL)', r:'WMS EAH 2019; pediatric extrapolation is not guideline-derived.', tab:'Environmental'},
  'ev-drown':      {t:'Drowning: 5 initial rescue breaths before compressions; asymptomatic patients observe ≥ 4–6 h (pulse oximetry, auscultation) before discharge', r:'ERC/ILCOR; observation duration varies 4–8 h in sources.', tab:'Environmental'},
  'ev-elec':       {t:'Electrical injury: urine output target 1–1.5 mL/kg/hr if myoglobinuria (else 0.5–1); asymptomatic low-voltage (≤ 220–240 V household) exposure with normal ECG may be discharged; monitor 24 h if LOC, abnormal ECG, high voltage, chest pain', r:'Expert consensus/observational data; Parkland underestimates deep tissue injury.', tab:'Environmental'},
  'ev-alt':        {t:'Altitude: acetazolamide prevention 125 mg BID (peds 1.25 mg/kg BID, max 125), treatment 250 mg BID (peds 2.5 mg/kg BID, max 250); dexamethasone AMS 4 mg q6h, HACE 8 mg then 4 mg q6h (peds 0.15 mg/kg q6h, max 4 mg); HAPE nifedipine ER 30 mg q12h', r:'WMS 2019/2024. Descent and O₂ are definitive.', tab:'Environmental'},
  'ev-pcav':       {t:'Philippine cobra antivenom (PCAV, RITM): start 5 ampoules IV for severe neurotoxic envenoming, reassess at 1–2 h and repeat per protocol; same dose for children; no routine skin test', r:'Starting dose per RITM/DOH guidance (Eastern Visayas data: 1–4 vials often sufficed); confirm current product insert and NPMCC advice.', tab:'Environmental'},
  'ev-neo':        {t:'Neostigmine trial (WHO SEARO 2016): atropine 0.6 mg IV (peds 50 mcg/kg) then neostigmine 1.5–2.0 mg IM (peds 50–100 mcg/kg); positive = clear improvement in ptosis/strength in 10–20 min → continue 0.5 mg q30 min with atropine', r:'Pediatric neostigmine dose recalled from WHO SEARO – check (some sources give 0.04 mg/kg). Mainly helps post-synaptic (cobra) neurotoxicity, not kraits.', tab:'Environmental'},
  'ev-20wbct':     {t:'20-minute whole blood clotting test: 1–2 mL venous blood in a new, clean, dry GLASS tube, leave undisturbed 20 min, tip once – unclotted = coagulopathy (antivenom indication, repeat 6 h after antivenom)', r:'WHO SEARO 2016; plastic tubes or washed glass give false positives.', tab:'Environmental'},
  'ev-npmcc':      {t:'UP-PGH National Poison Management and Control Center: (02) 8524-1078 · Globe 0966-718-9904', r:'Numbers from public NPMCC listings – confirm before printing for use.', tab:'Environmental / Tox'},
  'ev-marine':     {t:'Box jellyfish: vinegar (4–6% acetic acid) ≥ 30 s on the sting, then remove tentacles, then hot water immersion (~45 °C, 20 min) or ice for pain; stingray/stonefish/catfish/urchin: hot water 40–45 °C for 30–90 min', r:'ARC 2021 and Isbister/Australian toxinology sources; vinegar NOT advised for bluebottle (Physalia) in ARC – hot water instead.', tab:'Environmental'},
  'ev-vibrio':     {t:'Marine wound infection (Vibrio): doxycycline 100 mg BID + ceftazidime 2 g q8h (or ciprofloxacin); peds: avoid doxycycline < 8 y for long courses – TMP-SMX + aminoglycoside', r:'CDC/IDSA SSTI 2014. Local susceptibility unknown.', tab:'Environmental'},
  'ev-co':         {t:'CO: 100% O₂ via non-rebreather (COHb half-life ~300 min air → ~75 min O₂ → ~20–30 min HBOT); HBOT referral if LOC/syncope, neuro deficit, altered mental status, COHb > 25% (> 15% pregnancy), myocardial ischemia, severe acidosis', r:'UHMS criteria; ACEP 2017 Level B (HBOT or high-flow normobaric for moderate-severe). Very few HBOT chambers in PH.', tab:'Environmental'},
  'ev-frost':      {t:'Frostbite: rapid rewarming in 37–39 °C water for 15–30 min (only if refreezing will not occur); ibuprofen 12 mg/kg/day in 2 doses (max 2,400 mg/day); tPA within 24 h for severe injury with no contraindication (e.g. alteplase 0.15 mg/kg bolus then 0.15 mg/kg/hr × 6 h, max 100 mg – protocols vary); iloprost 0.5–2 ng/kg/min IV × 6 h daily for 5–8 days (within 48–72 h)', r:'WMS 2019/2024; thrombolysis and iloprost only in experienced centres with imaging.', tab:'Environmental'},
  'ev-hymen':      {t:'Mass Hymenoptera envenomation: > 50 stings (adult; fewer in children) → admit for rhabdomyolysis, hemolysis, AKI monitoring', r:'Threshold is approximate; hornet (Vespa) stings are more toxic per sting.', tab:'Environmental'}
});
if(D.epiIM && !D.epiIM.flag) D.epiIM.flag='ev-epi';
Object.assign(REVIEW, {'ev-epi': {t:'IM epinephrine 0.01 mg/kg (1 mg/mL) – max 0.5 mg adult, 0.3 mg child; repeat q5–15 min', r:'v1 values (WAO/EAACI/ASCIA); reused here for sting anaphylaxis and now flagged everywhere it appears.', tab:'Environmental / Anaphylaxis'}});
Object.assign(D, {
  evAcetaz: {n:'Acetazolamide', flag:'ev-alt',
    a:[F('Prevention','125 mg PO BID (start day before ascent)'),F('AMS treatment','250 mg PO BID')],
    p:[B('Prevention (BID)',1.25,1.25,'mg/kg',{max:125}),B('Treatment (BID)',2.5,2.5,'mg/kg',{max:250})]},
  evDexa: {n:'Dexamethasone – AMS / HACE', flag:'ev-alt',
    a:[F('Moderate–severe AMS','4 mg PO/IM/IV q6h'),F('HACE','8 mg IV/IM/PO once, then 4 mg q6h')],
    p:[B('AMS / HACE (q6h)',0.15,0.15,'mg/kg',{max:4})]},
  evNifed: {n:'Nifedipine ER – HAPE (if descent/O₂ unavailable)', flag:'ev-alt', a:[F('PO','30 mg ER q12h (or 20 mg ER q8h)')]},
  evEah: {n:'3% NaCl – symptomatic exercise-associated hyponatremia', flag:'ev-eah',
    a:[F('IV bolus','100 mL over ~1 min; repeat up to 2 more times at 10-min intervals')],
    p:[B('IV bolus',2,2,'mL/kg',{max:100})]},
  evAtrTest: {n:'Neostigmine trial – step 1: atropine', flag:'ev-neo',
    a:[F('IV','0.6 mg')], p:[B('IV',0.05,0.05,'mg/kg',{max:0.6})]},
  evNeoTest: {n:'Neostigmine trial – step 2: neostigmine', flag:'ev-neo',
    a:[F('IM','1.5 – 2.0 mg',{note:'Reassess ptosis, single-breath count, neck flexion at 10–20 min. Positive → 0.5 mg IV/SC q30 min + atropine 0.6 mg q8h.'})],
    p:[B('IM',0.05,0.1,'mg/kg',{max:2})]},
  evPcav: {n:'Purified Cobra Antivenom (PCAV, RITM) – Naja philippinensis', flag:'ev-pcav',
    b:[F('IV infusion (same dose adults & children)','5 ampoules (severe neurotoxicity) in 0.9% NaCl over ~30–60 min',{note:'Reconstitute per insert. Epinephrine IM ready for reactions (stop infusion, treat, then restart slowly). Reassess at 1–2 h; repeat per protocol/NPMCC.'})]},
  evIbuFrost: {n:'Ibuprofen – frostbite', flag:'ev-frost',
    a:[F('PO','400 – 600 mg q12h (12 mg/kg/day, max 2,400 mg/day)')],
    p:[B('PO q12h',6,6,'mg/kg',{max:600,note:'= 12 mg/kg/day.'})]}
});
let WBCT = store.get(K('wbct'), null);   // {start, result}
function wbctHTML(){
  if(!WBCT||!WBCT.start) return `<button class="linkbtn" data-wbct="start" type="button">⏱ Start 20WBCT (20 min)</button>`;
  const left = WBCT.start + 20*60000 - Date.now();
  const res = WBCT.result ? `<b class="${WBCT.result==='noclot'?'due':'okc'}">${WBCT.result==='noclot'?'NOT clotted → venom-induced coagulopathy: give antivenom, repeat 6 h after':'Clotted → no coagulopathy now; repeat at 6 h (and if new bleeding)'}</b>` : '';
  return `<div class="big">${left>0?`⏱ ${mmss(left+999)} left – do not touch the tube`:'<span class="due">20 min up – tip the tube once</span>'}</div>
   <div class="note">Started ${new Date(WBCT.start).toTimeString().slice(0,5)}</div>
   ${left<=0&&!WBCT.result?`<div class="row" style="flex-wrap:wrap;gap:.4rem"><button class="linkbtn" data-wbct="clot" type="button">Clotted</button><button class="linkbtn" data-wbct="noclot" type="button">Not clotted</button></div>`:''}${res}
   <div><button class="linkbtn" data-wbct="reset" type="button">Reset 20WBCT</button></div>`;
}
function renderEnv(w){
  const P=peds();
  // ---- hypothermia ----
  const t=parseFloat($('ccTemp').value), tv = t>10&&t<45 ? t : null;
  let st='<div class="note">Enter core temperature (low-reading thermometer; esophageal if intubated).</div>';
  if(tv!=null){ st = tv>=35 ? '<span class="okc">≥ 35 °C – not hypothermic</span>' : tv>=32 ? '<span class="soon">Mild (35–32 °C)</span> – conscious, shivering: passive + active external rewarming, warm sweet drinks if alert' : tv>=28 ? '<span class="due">Moderate (&lt; 32–28 °C)</span> – drowsy, shivering stops: horizontal, gentle handling (VF risk), active external + warm IV fluids (38–42 °C), monitor' : `<span class="due">Severe (&lt; 28 °C)</span> – unconscious, arrest risk${tv<24?' high (&lt; 24 °C)':''}: transfer to an ECLS-capable centre if unstable`;
    st=`<div class="big">${st}${vtag('ev-hypo-stage')}</div>`; }
  $('o-hypotherm').innerHTML = st + `<ol class="steps"><li>Handle gently and keep horizontal; remove wet clothes, insulate (vapour barrier); warm humidified O₂; check glucose</li>
    <li>Check for a pulse for up to <b>1 minute</b> (bradycardia, vasoconstriction); POCUS/capnography help. Low BP + organised rhythm = do not start CPR if any signs of life</li>
    <li class="shock"><b>Arrest:</b> standard CPR rate; ${tv!=null&&tv<30?'<b>T &lt; 30 °C: withhold adrenaline; max 3 shocks until &gt; 30 °C</b>':tv!=null&&tv<35?'<b>30–35 °C: double adrenaline interval (6–10 min)</b>':'&lt; 30 °C: no adrenaline, max 3 shocks; 30–35 °C: double the interval'}; mechanical CPR for transport; <b>ECLS (VA-ECMO)</b> rewarming ${vtag('ev-hypo-arrest')}</li>
    <li>Prognosis: "not dead until warm and dead" – but stop if obvious lethal injury, body frozen solid, airway packed with snow/ice and asystole, or K⁺ &gt; 12 mmol/L (HOPE score better)${vtag('ev-hypo-arrest')}</li>
    <li>Rewarming afterdrop/collapse: watch for hypovolemia, arrhythmia; consider sepsis, hypoglycemia, hypothyroidism, adrenal insufficiency, drugs/alcohol in "urban" hypothermia (PH: elderly, near-drowning, flood victims)</li></ol>`;
  // ---- heat ----
  $('o-heat').innerHTML = `<div class="note"><b>Heat stroke</b> = core &gt; 40 °C + CNS dysfunction (confusion, seizure, coma). <b>Heat exhaustion</b> = no significant CNS dysfunction, core usually &lt; 40 °C. Classic (elderly, chronic illness, hot humid PH summer) vs exertional (athletes, soldiers, workers).</div>
   <ol class="steps"><li class="shock"><b>Cool first, transport second.</b> Measure rectal temperature. <b>Cold/ice-water immersion</b> up to the neck (1–15 °C), stir water, keep airway above water – target ≥ 0.15 °C/min${vtag('ev-heat')}</li>
     <li>No tub: tarp-assisted cooling, rotating ice-water-soaked towels, ice packs + evaporative (mist + fan) – slower</li>
     <li><b>Stop at ~38.6–39 °C</b> to avoid overshoot hypothermia${vtag('ev-heat')}; continue to monitor</li>
     <li>No antipyretics (acetaminophen/NSAIDs ineffective, harmful to liver/kidney); dantrolene not recommended; benzodiazepine for shivering/seizures</li>
     <li>Check glucose, Na, K, CK, creatinine, LFTs, coagulation (DIC) – rhabdomyolysis, AKI, liver failure often peak at 24–72 h</li></ol>
   <h3>Exercise-associated hyponatremia (mimic)</h3>
   <div class="note">Endurance event + excess water, confusion/seizure with normal-ish temperature: check Na before giving fluids. Do not give hypotonic fluids.</div>
   ${drugs(['evEah'],w)}
   <ul class="tight"><li>Heat cramps/syncope/edema: rest, shade, oral electrolyte solution; return to activity gradually</li><li>Drug contributors: anticholinergics, sympathomimetics, antipsychotics (NMS), serotonergic (see <a href="#" data-goto="symp">Tox: hyperthermic syndromes</a>)</li></ul>`;
  // ---- drowning ----
  $('o-drown').innerHTML = `<ol class="steps"><li class="shock">Hypoxia is the cause of arrest: <b>5 initial rescue breaths</b>, then CPR (30:2${P?'; 15:2 with 2 rescuers':''}); early airway and O₂${vtag('ev-drown')}</li>
    <li>Do not attempt to drain water (no abdominal thrusts); vomiting is common – suction, lateral position</li>
    <li>Spinal precautions only if injury mechanism (diving, surf, waterslide) or signs</li>
    <li>Hypoxemia: O₂, early CPAP/NIV; intubate if failing – lung-protective ventilation with PEEP; bronchospasm → salbutamol</li>
    <li>Assess for hypothermia (see above), trauma, intoxication, seizure or arrhythmia (long QT) as the cause</li>
    <li><b>Asymptomatic</b> (normal SpO₂, no cough, normal chest exam) → observe ≥ 4–6 h then discharge; any symptom → admit; prophylactic antibiotics/steroids not indicated (consider in grossly contaminated/flood water)${vtag('ev-drown')}</li></ol>`;
  // ---- electrical / lightning ----
  $('o-elec').innerHTML = `<div class="note">PH household supply is <b>220 V, 60 Hz</b> (AC: tetanic "can't let go"). High voltage ≥ 1,000 V (power lines). Skin burns underestimate deep muscle injury.</div>
   <ol class="steps"><li><b>Scene safety</b> – isolate power first. <b>Lightning mass casualty: reverse triage</b> – resuscitate those apparently dead first (respiratory arrest; survivors breathing usually do well); prolonged ventilation may be needed</li>
     <li>ECG for all; cardiac monitoring 24 h if loss of consciousness, abnormal ECG/arrhythmia, chest pain, high voltage, known heart disease${vtag('ev-elec')}. Asymptomatic household-voltage injury with normal ECG → discharge</li>
     <li>Look for: compartment syndrome, fractures/dislocations (posterior shoulder), spinal injury from fall, cataracts, TM rupture (lightning), keraunoparalysis (transient limb paralysis), fern-pattern skin (Lichtenberg figures)</li>
     <li>CK, myoglobinuria, creatinine, K: <b>urine output 1–1.5 mL/kg/hr</b>${ok(w)?` (= ${fmt(w)} – ${fmt(1.5*w)} mL/hr)`:''} if myoglobinuria${vtag('ev-elec')}; Parkland (<a href="#" data-goto="burns">burns card</a>) underestimates fluid needs</li>
     <li>Pregnancy: fetal monitoring – fetal injury possible even with minor maternal injury. Oral commissure burns in children (biting cords): delayed labial artery bleeding at 5–14 days</li></ol>`;
  // ---- altitude ----
  $('o-altitude').innerHTML = `<div class="note">Rare in PH ED practice but relevant for climbers (Mt Apo 2,954 m, Pulag 2,926 m) and travellers abroad. Typically &gt; 2,500 m; onset 6–12 h (AMS), 2–5 days (HAPE).</div>
   <ul class="tight"><li><b>AMS</b>: headache + GI upset, fatigue, dizziness → stop ascent, analgesia, antiemetic; acetazolamide; descend if worsening</li>
     <li><b>HACE</b>: ataxia, altered mental status in AMS → <b>descend</b> (≥ 300–1,000 m), O₂, dexamethasone, portable hyperbaric bag</li>
     <li><b>HAPE</b>: dyspnea at rest, cough, ↓ exercise tolerance, crackles, SpO₂ low for altitude → <b>descend + O₂</b> (SpO₂ &gt; 90%); nifedipine if descent/O₂ unavailable; no diuretics</li></ul>
   ${drugs(['evAcetaz','evDexa','evNifed'],w)}
   <h3>Diving (brief)</h3><ul class="tight"><li>Symptoms within 24 h of diving (joint pain, neuro deficit, rash, dyspnea, confusion): <b>100% O₂</b>, supine, fluids, no flying – contact a hyperbaric facility / DAN; arterial gas embolism = sudden neuro deficit within 10 min of surfacing</li></ul>${vtag('ev-alt')}`;
  // ---- snakebite ----
  $('o-snake').innerHTML = `<div class="note"><b>Medically important PH snakes:</b> Philippine cobra (<i>Naja philippinensis</i>, Luzon/Mindoro – neurotoxic, spits), Samar cobra (<i>N. samarensis</i>, Visayas/Mindanao), king cobra (<i>Ophiophagus hannah</i>), kraits (rare), pit vipers (<i>Trimeresurus/Parias flavomaculatus</i>, Wagler's <i>Tropidolaemus</i> – mostly local swelling/pain, occasionally coagulopathy), sea snakes (<i>Hydrophis, Laticauda</i> – myotoxic/neurotoxic).</div>
   <h3>First aid</h3>
   <ul class="tight"><li>Reassure, immobilise the whole limb (splint), keep still, remove rings/watches, transport now</li>
     <li><b>No tourniquet</b>, cutting, suction, ice, electric shock or herbal "tandok"; pressure-pad/bandage for suspected elapid (cobra) bite only if trained and it doesn't delay transport${vtag('ev-pcav')}</li>
     <li>Spitting cobra eye exposure: irrigate copiously with water/saline, fluorescein, topical antibiotic; no antivenom drops</li></ul>
   <h3>Assess (repeat hourly for 24 h – asymptomatic ≥ 24 h before discharge)</h3>
   <ul class="tight"><li><b>Neurotoxic</b>: ptosis (earliest), diplopia, dysphagia, drooling, dysarthria, neck flexor weakness, single-breath count, paradoxical breathing → prepare to intubate</li>
     <li><b>Hemotoxic</b>: 20WBCT, bleeding gums/sites, hematuria · <b>Myotoxic</b> (sea snake): myalgia, dark urine, ↑ CK, ↑ K · Local: swelling progression (mark edge hourly), blistering, necrosis; true compartment syndrome is rare – measure pressure before fasciotomy</li></ul>
   <div class="cline" id="wbctBox"><div class="dl">20-minute whole blood clotting test${vtag('ev-20wbct')}</div><div class="note">1–2 mL venous blood → new, clean, dry <b>glass</b> tube → leave 20 min → tip once.</div><div id="wbctT">${wbctHTML()}</div></div>
   <h3>Antivenom</h3>
   <ul class="tight"><li><b>Indications:</b> any neurotoxic sign, shock, spontaneous systemic bleeding or unclotted 20WBCT, rapidly progressive swelling (&gt; half the limb in 48 h / bite on digit), myoglobinuria/hyperkalemia (sea snake)</li>
     <li><b>PCAV</b> (RITM, monovalent <i>N. philippinensis</i>) – antivenom for pit vipers and sea snakes is generally <b>not</b> locally produced; ask NPMCC for availability${vtag('ev-pcav')}</li>
     <li>Same dose for children (venom dose, not weight); give in an area with epinephrine ready – see <a href="#" data-goto="anaph">anaphylaxis</a></li></ul>
   ${drugs(['evPcav'],w)}
   <h3>Neostigmine trial (cobra neurotoxicity)</h3>${drugs(['evAtrTest','evNeoTest'],w)}
   <ul class="tight"><li>Tetanus prophylaxis; antibiotics only for infected wounds/necrosis; analgesia (avoid NSAIDs if coagulopathic)</li>
     <li><b>UP-PGH NPMCC (24 h):</b> (02) 8524-1078 · Globe 0966-718-9904${vtag('ev-npmcc')}</li></ul>`;
  // ---- spiders / stings ----
  $('o-spider').innerHTML = `<ul class="tight"><li><b>Spiders</b>: most PH spider bites cause only local pain/redness. Widow-type (<i>Latrodectus</i>) envenoming → regional pain, sweating, muscle cramps, hypertension: analgesia (opioids), benzodiazepines; widow antivenom generally unavailable locally. "Necrotic spider bite" is usually infection (MRSA) – treat as cellulitis/abscess${vtag('ev-hymen')}</li>
     <li><b>Scorpions</b> (PH species): local pain, paresthesia – ice, analgesia, local anesthetic infiltration/digital block; systemic toxicity rare (watch children: hypertension, agitation, hypersalivation)</li>
     <li><b>Centipedes</b> (<i>Scolopendra</i>): intense local pain, swelling – hot water immersion (40–45 °C), analgesia, tetanus; rare rhabdomyolysis/AKI</li>
     <li><b>Bees, wasps, hornets</b>: remove stings quickly by any method (speed matters more than scraping); local reaction → cold compress, antihistamine; any systemic features → <a href="#" data-goto="anaph">IM epinephrine</a>; <b>mass envenomation</b> (&gt; 50 stings adult, fewer in children; hornets) → admit for rhabdomyolysis, hemolysis, AKI${vtag('ev-hymen')}</li>
     <li>Fire ants, caterpillars (lepidopterism): local care, antihistamine, remove hairs with tape</li></ul>
   ${drugs(['epiIM'],w)}`;
  // ---- marine ----
  $('o-marine').innerHTML = `<ol class="steps"><li class="shock"><b>Box jellyfish</b> (<i>Chironex</i>/<i>Chiropsalmus</i>; fatalities in PH waters): get out of water, call for help, <b>CPR if needed</b>. Flood the sting with <b>vinegar for ≥ 30 s</b> (stops undischarged nematocysts), then pick off tentacles; then hot water (~45 °C, 20 min) or ice for pain${vtag('ev-marine')}</li>
     <li><b>Never</b> rub, apply fresh water, urine, alcohol or sand (triggers discharge). <b>Bluebottle/Portuguese man-o'-war</b> (<i>Physalia</i>): no vinegar – rinse with seawater, remove tentacles, hot water</li>
     <li>Irukandji-like syndrome (delayed severe back/abdominal pain, sweating, hypertension, pulmonary edema): opioids, antihypertensive (phentolamine/GTN), ICU. CSL box jellyfish antivenom is not routinely available in PH</li></ol>
   <h3>Venomous spines (stingray, stonefish, scorpionfish, catfish, sea urchin)</h3>
   <ul class="tight"><li><b>Hot water immersion 40–45 °C for 30–90 min</b> (test with the rescuer's hand – avoid scalds), analgesia/regional block${vtag('ev-marine')}</li>
     <li>X-ray/ultrasound for retained spines; explore and irrigate; stingray wounds to chest/abdomen → treat as penetrating trauma</li>
     <li>Tetanus; antibiotics for deep wounds/high-risk hosts with <b>Vibrio cover</b> (doxycycline + ceftazidime or ciprofloxacin)${vtag('ev-vibrio')}; <i>V. vulnificus</i> (liver disease, seafood/sea-water wound) → necrotising infection, sepsis</li></ul>
   <h3>Seafood poisoning</h3>
   <ul class="tight"><li><b>Scombroid</b> (tuna, mackerel, "galunggong"): flushing, headache, urticaria within 1 h → H1 + H2 antihistamines; not an allergy</li>
     <li><b>Tetrodotoxin</b> (pufferfish – <i>butete</i>; some crabs): perioral numbness → ascending paralysis, respiratory failure within hours → airway and ventilation support; no antidote; good recovery if ventilated</li>
     <li><b>Paralytic shellfish poisoning</b> (red tide – check BFAR shellfish bulletin): similar to tetrodotoxin → supportive ventilation; cooking does not destroy the toxin</li>
     <li>Ciguatera (reef fish): GI then neuro symptoms, temperature reversal – supportive</li></ul>`;
  // ---- CO ----
  $('o-co').innerHTML = `<div class="note">PH context: generators and charcoal grills indoors during typhoon power outages, vehicles in closed garages, fires (with <b>cyanide</b>). Symptoms are non-specific (headache, nausea, dizziness – "flu" in a household); SpO₂ is falsely normal – measure COHb (co-oximetry, venous OK). COHb correlates poorly with severity.</div>
   <ol class="steps"><li class="shock"><b>100% O₂</b> via non-rebreather at 15 L/min (or intubate) until symptom-free and COHb &lt; 3–5% (≥ 6 h typical)${vtag('ev-co')}</li>
     <li><b>Hyperbaric O₂ referral criteria</b>: loss of consciousness/syncope, neurological deficit or altered mental status, COHb &gt; 25% (&gt; 15% in pregnancy), myocardial ischemia, severe metabolic acidosis${vtag('ev-co')}</li>
     <li>ECG + troponin (myocardial injury predicts mortality); pregnancy: fetal Hb binds CO more – treat longer, low HBOT threshold</li>
     <li>Smoke inhalation with lactate &gt; 8–10 mmol/L, shock or arrest → empiric <b>hydroxocobalamin</b> (<a href="#" data-goto="antidotes">Tox antidotes</a>)</li>
     <li>Delayed neurological sequelae (2–40 days): counsel and arrange follow-up; check other household members and pets; report the source</li></ol>`;
  // ---- frostbite ----
  $('o-frost').innerHTML = `<div class="note">Rare in PH except returning travellers/climbers and industrial cold (freezers, liquid nitrogen, LPG/refrigerant burns – treat refrigerant as frostbite).</div>
   <ol class="steps"><li>Treat hypothermia first; avoid thaw–refreeze (keep frozen until definitive rewarming is guaranteed)</li>
     <li class="drugstep"><b>Rapid rewarming</b> in circulating water <b>37–39 °C</b> for 15–30 min until tissue is soft and red/purple; opioid analgesia (painful)${vtag('ev-frost')}</li>
     <li>Do not rub; drain clear blisters (or aspirate), leave hemorrhagic blisters intact; aloe vera, elevate, splint; tetanus</li>
     <li class="drugstep"><b>Ibuprofen</b> 12 mg/kg/day in 2 doses${vtag('ev-frost')}</li>
     <li>Severe (proximal phalanges or more) within 24 h: imaging (bone scan/angiography) and <b>thrombolysis</b> (tPA) or <b>iloprost</b> (within 48–72 h) at an experienced centre; amputation decisions delayed weeks${vtag('ev-frost')}</li></ol>
   ${drugs(['evIbuFrost'],w)}`;
}
function initEnv(){
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-wbct]'); if(!b) return; e.preventDefault();
    const a=b.dataset.wbct;
    if(a==='start') WBCT={start:Date.now(),result:null};
    else if(a==='reset') WBCT=null;
    else if(WBCT) WBCT.result=a;
    store.set(K('wbct'),WBCT); const el=$('wbctT'); if(el) el.innerHTML=wbctHTML(); });
  setInterval(()=>{ const el=$('wbctT'); if(el && WBCT && WBCT.start && !WBCT.result) el.innerHTML=wbctHTML(); },1000);
}
