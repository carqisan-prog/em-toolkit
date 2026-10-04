// ======================= S15 TOXICOLOGY (sample section) =======================
// Sources: AACT/EAPCCT decontamination papers; ANZ 2019 & US 2023 paracetamol consensus; EXTRIP; AHA 2023 toxicology
// focused update; WHO/Eddleston OP guidance; Hunter serotonin criteria; NCPC button-battery guideline; UP-PGH NPMCC.
Object.assign(REVIEW, {
  'tx-asa-hd': {t:'Salicylate hemodialysis (EXTRIP 2015): level > 100 mg/dL (7.2 mmol/L), > 90 mg/dL with impaired kidney function, altered mental status, new hypoxemia, or pH ≤ 7.20 despite treatment', r:'EXTRIP thresholds as recalled; confirm units (mg/dL vs mmol/L) with the lab.', tab:'Tox'},
  'tx-iron':   {t:'Iron toxicity by elemental iron: < 20 mg/kg usually benign, 20–60 mg/kg GI toxicity, > 60 mg/kg potentially lethal; serum iron > 500 mcg/dL at 4–6 h = severe', r:'Traditional thresholds; poor correlation with outcome – clinical status and anion gap acidosis matter more.', tab:'Tox'},
  'tx-pc':       {t:'UP-PGH NPMCC hotline (02) 8524-1078 / Globe 0966-718-9904 (24 h)', r:'Numbers taken from NPMCC public pages (2025–26); confirm and add your regional poison center / toxicology referral number.', tab:'Tox'},
  'tx-decon':    {t:'Decontamination thresholds (charcoal 1 g/kg max 50 g within ~1 h; WBI with PEG 1.5–2 L/hr adult, 25 mL/kg/hr child, for iron, lithium, sustained-release drugs, body packers)', r:'AACT/EAPCCT position papers – evidence weak; airway must be protected; owner to confirm local practice.', tab:'Tox'},
  'tx-apap-line':{t:'Paracetamol nomogram: treatment line 150 mg/L (≈ 1,000 µmol/L) at 4 h halving every 4 h; UK uses 100 mg/L line; staggered/unknown-time ingestion → treat', r:'US/ANZ use the 150 line; UK treats on the 100 line. Choose the institutional standard.', tab:'Tox'},
  'tx-nac2':     {t:'NAC two-bag regimen (200 mg/kg over 4 h then 100 mg/kg over 16 h), weight cap 100 kg here (ANZ uses 110 kg); massive ingestion may need higher-dose NAC', r:'ANZ 2019 consensus; US 2023 consensus allows either regimen. Weight cap and high-dose rules vary.', tab:'Tox'},
  'tx-asa-bicarb':{t:'Salicylate alkalinization: NaHCO₃ 1–2 mEq/kg bolus then 150 mEq/L in D5W at 1.5–2× maintenance; urine pH 7.5–8.0; blood pH ≤ 7.55; keep K ≥ 4', r:'Common toxicology regimen (ACMT/EXTRIP context) – infusion recipes differ; hypokalemia blocks urinary alkalinization.', tab:'Tox'},
  'tx-asa-vent': {t:'Salicylate: avoid intubation if possible; if intubated, bicarbonate bolus first and match the pre-intubation minute ventilation (often RR 30+); dextrose for neuroglycopenia despite normal glucose', r:'Expert practice, low-quality evidence.', tab:'Tox'},
  'tx-tca':      {t:'Na-channel blocker toxicity thresholds (QRS > 100 ms, R in aVR > 3 mm) and bicarbonate 1–2 mEq/kg boluses to QRS narrowing, target pH 7.45–7.55; hypertonic saline / lipid if refractory', r:'AHA 2023 toxicology update and tox-center practice; maximum cumulative bicarbonate is clinical.', tab:'Tox'},
  'tx-dig-ind':  {t:'Digoxin Fab indications (life-threatening dysrhythmia, K > 5–5.5 mmol/L in acute toxicity, end-organ hypoperfusion, level > 10–15 ng/mL acute) and empiric vial numbers', r:'Thresholds differ between references; Fab availability in the Philippines is limited.', tab:'Tox'},
  'tx-osm':      {t:'Osmolar gap = measured − (2Na + glucose/18 + BUN/2.8 + ethanol/3.7) with mg/dL units; gap > 10 suspicious', r:'Ethanol divisor 3.7 vs 4.6 and the normal range (−14 to +10) vary; a normal gap does not exclude late toxic alcohol poisoning.', tab:'Tox'},
  'tx-etoh':     {t:'Ethanol as alcohol dehydrogenase blocker (10% IV: 8 mL/kg load, 0.8 mL/kg/hr non-drinker / 1.6–2 mL/kg/hr chronic drinker, doubled on HD; oral 40% spirits ≈ 2 mL/kg load); target serum ethanol 100–150 mg/dL', r:'Only if fomepizole unavailable (usual in PH); regimens vary – levels hourly; hypoglycemia in children.', tab:'Tox'},
  'tx-alc-adj':  {t:'Toxic alcohol adjuncts (methanol: folinic/folic acid 50 mg IV q6h; ethylene glycol: thiamine 100 mg + pyridoxine 50 mg IV q6h)', r:'Low-quality evidence; dosing intervals vary.', tab:'Tox'},
  'tx-paraquat': {t:'Paraquat: avoid supplemental O₂ unless SpO₂ < 88–90%; early charcoal or Fuller’s earth 1 g/kg; immunosuppression (cyclophosphamide + methylprednisolone) not routinely recommended', r:'Evidence conflicting; discuss every case with NPMCC.', tab:'Tox'},
  'tx-bzd':      {t:'Benzodiazepine for toxic agitation/seizures (diazepam 5–10 mg IV q5–10 min; midazolam 2.5–5 mg IV / 5–10 mg IM; peds diazepam 0.1–0.2 mg/kg max 10 mg, midazolam IM 0.1–0.2 mg/kg max 10 mg)', r:'Titration to effect; large cumulative doses may be needed in sympathomimetic toxicity – airway readiness.', tab:'Tox'},
  'tx-cypro':    {t:'Cyproheptadine for serotonin syndrome (12 mg PO/NG, then 2 mg q2h while symptomatic; maintenance 8 mg q6h)', r:'Oral only; evidence limited; pediatric dosing not established here.', tab:'Tox'},
  'tx-nms':      {t:'NMS / severe hyperthermia adjuncts (dantrolene 1–2.5 mg/kg IV, max 10 mg/kg/day; bromocriptine 2.5 mg PO q8h)', r:'Weak evidence; cooling and benzodiazepines are first line.', tab:'Tox'},
  'tx-battery':  {t:'Button battery: honey 10 mL q10 min up to 6 doses (age ≥ 1 y, ≤ 12 h, swallowing OK) pre-endoscopy; sucralfate 1 g (10 mL) q10 min × 3 in hospital; esophageal battery → endoscopic removal within 2 h', r:'NCPC 2018 guideline based on animal data; must not delay removal.', tab:'Tox'},
  'tx-li':       {t:'Lithium: no charcoal; WBI for sustained-release; isotonic fluids to normal urine output; EXTRIP dialysis criteria (see Renal: AEIOU)', r:'Fluid volume/rate depends on cardiac and renal function.', tab:'Tox'}
});
Object.assign(D, {
  nac2: {n:'NAC – two-bag IV regimen (alternative)', flag:'tx-nac2', b:[C('200 mg/kg over 4 h → 100 mg/kg over 16 h', w=>{
      if(!ok(w)) return {main:'Enter weight', lines:['Bag 1: 200 mg/kg over 4 h · Bag 2: 100 mg/kg over 16 h (dosing weight capped at 100 kg)']};
      const dw=Math.min(w,100);
      return {main:`${fmt(200*dw)} mg over 4 h`, lines:[`= ${fmt(dw)} mL of 200 mg/mL (bag 1)`, `Bag 2: ${fmt(100*dw)} mg (= ${fmt(dw/2)} mL) over 16 h`, `Total ${fmt(300*dw)} mg (300 mg/kg)${w>100?' – dosing weight capped at 100 kg':''}. Fewer anaphylactoid reactions than the 3-bag regimen.`]}; })]},
  asaBic: {n:'Sodium bicarbonate – salicylate alkalinization', flag:'tx-asa-bicarb', b:[
      B('Bolus (8.4%)',1,2,'mEq/kg',{conc:1,amax:100,note:'Then infusion; repeat bolus if serum pH falls.'}),
      C('Infusion: 150 mEq NaHCO₃ in 1 L D5W',w=>{ if(!ok(w)) return {main:'Enter weight',lines:['1.5–2 × maintenance rate (4-2-1)','Target urine pH 7.5–8.0, serum pH ≤ 7.55']};
        const m=maint(w); return {main:`${fmt(1.5*m)} – ${fmt(2*m)} mL/hr`, lines:['= 1.5–2 × maintenance (4-2-1)','Add KCl 20–40 mEq/L if K < 4 (alkaline urine needs normal K)','Check urine pH hourly, VBG/K/salicylate level q2h']}; })]},
  etohA: {n:'Ethanol (if no fomepizole)', flag:'tx-etoh', b:[
      B('10% ethanol IV load (over 30–60 min)',8,8,'mL/kg',{amax:800,note:'= 0.8 g/kg. Central line preferred (hyperosmolar).'}),
      C('10% IV maintenance',w=>ok(w)?{main:`${fmt(0.8*w)} – ${fmt(2*w)} mL/hr`,lines:['0.8 mL/kg/hr (non-drinker) → 1.6–2 mL/kg/hr (chronic drinker); double during hemodialysis','Target serum ethanol 100–150 mg/dL; glucose hourly (children)']}:{main:'Enter weight',lines:['0.8–2 mL/kg/hr; double during HD']}),
      B('Oral 40% spirits (e.g. 80-proof) load',2,2,'mL/kg',{amax:200,note:'Then ≈ 0.2–0.4 mL/kg/hr; lambanog strength varies – check label.'})]},
  bzdAg: {n:'Benzodiazepine – toxic agitation / seizures', flag:'tx-bzd',
    a:[F('Diazepam IV','5 – 10 mg q5–10 min, titrate to calm'), F('Midazolam','2.5 – 5 mg IV, or 5 – 10 mg IM; repeat PRN')],
    p:[B('Diazepam IV',0.1,0.2,'mg/kg',{max:10,conc:5}), B('Midazolam IM',0.1,0.2,'mg/kg',{max:10,conc:5})]},
  cypro: {n:'Cyproheptadine – serotonin syndrome', flag:'tx-cypro',
    a:[F('PO / crushed via NG','12 mg, then 2 mg q2h while symptomatic',{note:'Maintenance 8 mg q6h. No IV form.'})],
    p:[F('Pediatric','Dose with toxicology / poison center')]},
  dantro: {n:'NMS / malignant hyperthermia-like states', flag:'tx-nms', b:[
      B('Dantrolene IV',1,2.5,'mg/kg',{amax:250,note:'Repeat to max 10 mg/kg/day. Adjunct only – cool and sedate first.'}),
      F('Bromocriptine (NMS, adult)','2.5 mg PO/NG q8h')]},
  battery: {n:'Button battery – mucosal protection while arranging removal', flag:'tx-battery', b:[
      F('Honey (age ≥ 1 y, ≤ 12 h since ingestion)','10 mL PO q10 min, up to 6 doses'),
      F('Sucralfate (in hospital)','1 g = 10 mL PO q10 min × 3')]}
});
const TOXIDROMES = [
 ['Sympathomimetic','↑ HR, ↑ BP, ↑ T','Agitated, paranoid','Dilated','Sweaty','Tremor, seizures, rhabdo','Methamphetamine (shabu), cocaine, caffeine excess'],
 ['Anticholinergic','↑ HR, ↑ T','Delirium, picking, mumbling','Dilated, sluggish','Dry, flushed','Urinary retention, ↓ bowel sounds','Antihistamines, TCAs, Datura (talampunay)'],
 ['Cholinergic','↓ or ↑ HR','Confused → coma','Pinpoint','Wet (sweat, saliva)','Bronchorrhea, bronchospasm, vomiting, diarrhea, fasciculations → weakness','Organophosphate / carbamate pesticides'],
 ['Opioid','↓ RR, ↓ HR','Depressed','Pinpoint','Normal / cool','Hypoventilation; tramadol → seizures','Morphine, tramadol, fentanyl, nalbuphine'],
 ['Sedative–hypnotic','Near-normal; mild ↓ RR','Depressed','Normal','Normal','Ataxia, slurred speech','Benzodiazepines, alcohol, Z-drugs'],
 ['Serotonin syndrome','↑ HR, ↑ T, labile BP','Agitated','Dilated','Sweaty','Clonus (ocular/inducible), hyperreflexia legs > arms; onset hours','SSRI/SNRI + tramadol, linezolid, MAOI, dextromethorphan'],
 ['NMS','↑ T, labile BP','Altered, mute','Normal','Sweaty','Lead-pipe rigidity, ↓ reflexes; onset days','Antipsychotics, metoclopramide, abrupt levodopa stop']];
function renderTox(w){
  const P=peds();
  $('o-txapproach').innerHTML = `<ol class="steps">
    <li class="shock"><b>ABCs first</b> – airway, breathing, circulation; glucose (point-of-care) in every altered patient; 12-lead ECG (QRS, QTc, R in aVR); temperature.</li>
    <li><b>History:</b> what, how much (mg/kg), when, why (intentional?), co-ingestants, pill bottles/photos; staggered or sustained-release?</li>
    <li><b>Look for a toxidrome</b> (next card) and an antidote; check paracetamol and salicylate levels in every intentional overdose.</li>
    <li><b>Decontaminate selectively${vtag('tx-decon')}:</b> activated charcoal ${P?(ok(w)?`<b>${fmt(Math.min(w,50))} g</b> (1 g/kg, max 50 g)`:'1 g/kg (max 50 g)'):'<b>50 g</b>'} only if within ~1 h of a dangerous, charcoal-adsorbable ingestion and the airway is protected. Not for alcohols, iron, lithium, metals, caustics, hydrocarbons. Whole-bowel irrigation (PEG ${P?'25 mL/kg/hr':'1.5–2 L/hr'}) for iron, lithium, sustained-release drugs, body packers. <b>No induced emesis.</b></li>
    <li><b>Enhanced elimination:</b> urinary alkalinization (salicylate); hemodialysis for salicylate, lithium, toxic alcohols, metformin, valproate (EXTRIP – see <a href="#" data-goto="dialysis">Renal: AEIOU</a>).</li>
    <li><b>Call the poison center early${vtag('tx-pc')}:</b> UP-PGH National Poison Management &amp; Control Center (NPMCC) <b>(02) 8524-1078</b> · Globe <b>0966-718-9904</b>. Suicide risk assessment before disposition.</li></ol>
   <div class="note">Observe asymptomatic ingestions 4–6 h (≥ 12–24 h for sustained-release, sulfonylureas, methadone, button batteries, paraquat). Hypoglycemia, hyperthermia and seizures kill early – treat them before chasing levels.</div>`;
  $('o-toxidromes').innerHTML = `<div style="overflow-x:auto"><table class="wide"><thead><tr><th>Toxidrome</th><th>Vitals</th><th>Mental status</th><th>Pupils</th><th>Skin</th><th>Clues</th><th>Typical agents</th></tr></thead><tbody>${TOXIDROMES.map(r=>`<tr>${r.map((c,i)=>i?`<td>${c}</td>`:`<td><b>${c}</b></td>`).join('')}</tr>`).join('')}</tbody></table></div>
   <div class="note">Sweaty vs dry skin separates sympathomimetic from anticholinergic. Clonus = serotonin; rigidity with slow onset = NMS. Mixed ingestions blur the picture.</div>`;
  // --- acetaminophen ---
  const u=$('apapU').value, lv=parseFloat($('apapLvl').value), t=parseFloat($('apapHrs').value);
  const mgL = lv>0 ? (u==='umol' ? lv/6.62 : lv) : null;
  let a='';
  if(mgL!=null && t>=0){
    if(t<4) a=`<div class="soon">Level taken &lt; 4 h after ingestion is not interpretable – repeat at 4 h (start NAC now if &gt; 8 h will pass before the result, or large ingestion).</div>`;
    else if(t>24) a=`<div class="soon">Nomogram not valid &gt; 24 h: treat if paracetamol is detectable or ALT is raised.</div>`;
    else { const L150=150*Math.pow(2,-(t-4)/4), L100=100*Math.pow(2,-(t-4)/4);
      a=`<div class="big ${mgL>=L150?'due':mgL>=L100?'soon':'okc'}">${mgL>=L150?'ABOVE 150-line → start NAC':mgL>=L100?'Above the UK 100-line only':'Below treatment lines'}</div>
       <div class="note">Level ${fmt(mgL,0)} mg/L (${fmt(mgL*6.62,0)} µmol/L) at ${fmt(t,1)} h · 150-line ${fmt(L150,0)} mg/L · 100-line ${fmt(L100,0)} mg/L${vtag('tx-apap-line')}</div>`; }
  } else a=`<div class="note">Enter level and time for a single acute ingestion with a known time${vtag('tx-apap-line')}.</div>`;
  $('o-apap').innerHTML = a + `<ul class="tight">
    <li><b>Start NAC without waiting for a level</b>${vtag('tx-apap-line')} if: &gt; 8 h since ingestion with a potentially toxic dose (≥ 150 mg/kg or ≥ 10 g), unknown time, staggered ingestion, or any liver injury (raised ALT)</li>
    <li>Toxic dose${vtag('tx-apap-line')} ≈ ≥ 150 mg/kg (≥ 200 mg/kg or 10 g in 24 h for repeated supratherapeutic use)${ok(w)?` = <b>${fmt(150*w/1000,1)} g</b> for ${fmt(w)} kg`:''}</li>
    <li>Stop NAC when paracetamol undetectable and ALT normal/falling with INR &lt; 2 (per local protocol). Liver unit referral: INR rising, pH &lt; 7.3, creatinine rising, encephalopathy</li></ul>` + drugs(['nacA','nac2'],w);
  // --- salicylate ---
  $('o-asa').innerHTML = `<div class="note">Early: tinnitus, vomiting, <b>tachypnea</b> (respiratory alkalosis) → mixed respiratory alkalosis + high anion gap metabolic acidosis → confusion, hyperthermia, pulmonary/cerebral edema. Repeat levels q2h until clearly falling (enteric-coated / bezoars absorb late).</div>
   <ol class="steps"><li>Activated charcoal if alert and early; fluids for volume depletion (avoid overload)</li>
    <li class="drugstep"><b>Urinary alkalinization</b> for symptomatic patients or rising levels:</li></ol>${drugs(['asaBic'],w)}
   <ul class="tight"><li><b>Altered mental status = neuroglycopenia:</b> give dextrose even if serum glucose normal${vtag('tx-asa-vent')}</li>
    <li class="due"><b>Avoid intubation</b> if possible; if unavoidable: bicarbonate bolus first, then match pre-intubation minute ventilation (high RR)${vtag('tx-asa-vent')}</li>
    <li><b>Hemodialysis</b> (EXTRIP)${vtag('tx-asa-hd')}: level &gt; 100 mg/dL (7.2 mmol/L), &gt; 90 mg/dL with impaired kidneys, altered mental status, new hypoxemia, pH ≤ 7.20, or failure of standard therapy – call nephrology early (see <a href="#" data-goto="dialysis">AEIOU</a>)</li></ul>`;
  // --- Na channel ---
  $('o-nachan').innerHTML = `<div class="note">TCAs, diphenhydramine (large), cocaine, propranolol, flecainide, carbamazepine. Danger signs: <b>QRS &gt; 100 ms</b>, terminal R in aVR &gt; 3 mm, right-axis deviation of terminal QRS, hypotension, seizures${vtag('tx-tca')}.</div>
   ${drugs(['tcaA'],w)}
   <ul class="tight"><li>Repeat boluses until QRS narrows / BP improves; target arterial pH 7.45–7.55; watch K and Na${vtag('tx-tca')}</li>
    <li>Seizures: benzodiazepines (avoid phenytoin). Hypotension: fluids then norepinephrine. Refractory: hypertonic saline, lipid emulsion (see antidotes), ECMO</li>
    <li>Avoid physostigmine, class IA/IC antiarrhythmics; amiodarone only with expert advice. Lidocaine for refractory VT (expert)</li>
    <li>Asymptomatic with normal ECG at 6 h → medically clear (psychiatric assessment)</li></ul>`;
  // --- cardiotox ---
  $('o-cardiotox').innerHTML = `<div class="gl">β-blocker / calcium-channel blocker</div><div class="note">Bradycardia + hypotension ± hyperglycemia (CCB) or hypoglycemia (β-blocker, children). Atropine often fails. Early high-dose insulin is the key therapy; add vasopressors (norepinephrine/epinephrine), pacing, lipid or ECMO for refractory shock (AHA 2023).</div>
   ${drugs(['bbA'],w)}
   <div class="gl" style="margin-top:.8rem">Digoxin</div><div class="note">Vomiting, visual change, confusion; any dysrhythmia (classic: atrial tachycardia with block, bidirectional VT, regularized AF). Acute toxicity → hyperkalemia; chronic → often hypokalemia/renal impairment. Treat hypokalemia and hypomagnesemia; avoid calcium only if Fab is immediately available (old “stone heart” concern is largely refuted).</div>
   <div class="note"><b>Fab indications${vtag('tx-dig-ind')}:</b> life-threatening dysrhythmia, K &gt; 5–5.5 mmol/L in acute poisoning, end-organ hypoperfusion, or very high level. Without Fab: atropine/pacing for bradycardia, lidocaine for ventricular dysrhythmias, avoid cardioversion unless pulseless.</div>
   ${drugs(['digA'],w)}`;
  // --- toxic alcohols ---
  const om=parseFloat($('alcOsm').value), na=parseFloat($('alcNa').value), gl=parseFloat($('alcGlu').value), bun=parseFloat($('alcBun').value), et=parseFloat($('alcEtoh').value)||0;
  let og='';
  if(om>0 && na>0 && gl>0 && bun>=0 && $('alcBun').value!==''){ const calc=2*na+gl/18+bun/2.8+et/3.7, gap=om-calc;
    og=`<div class="big ${gap>10?'due':'okc'}">Osmolar gap ${fmt(gap,0)} mOsm/kg</div><div class="note">Calculated ${fmt(calc,0)} = 2×${fmt(na)} + ${fmt(gl)}/18 + ${fmt(bun)}/2.8${et?` + ${fmt(et)}/3.7`:''}${vtag('tx-osm')}. ${gap>10?'Raised gap – consider toxic alcohol (or ethanol, mannitol, ketoacidosis, lactic acidosis)':'Normal gap does not exclude late presentation (alcohol already metabolised → high anion gap)'}.</div>`; }
  else og=`<div class="note">Enter measured osmolality, Na, glucose and BUN (mg/dL; urea mmol/L × 2.8 = BUN mg/dL)${vtag('tx-osm')}.</div>`;
  $('o-toxalc').innerHTML = og + `<ul class="tight">
    <li><b>Methanol</b> (adulterated lambanog / bootleg spirits, outbreaks): delayed 12–24 h, blurred/“snowfield” vision, high anion gap acidosis. <b>Ethylene glycol</b> (antifreeze, brake fluid): intoxication → acidosis, AKI, oxalate crystals, hypocalcemia. <b>Isopropanol:</b> ketosis without acidosis – supportive</li>
    <li>Treat on suspicion (history + acidosis or osmolar gap) – do not wait for levels (rarely available)</li></ul>
   ${drugs(['alcA','etohA'],w)}
   <ul class="tight"><li>Correct acidosis with bicarbonate (pH &lt; 7.3) – less formic acid enters the brain/eye</li>
    <li>Adjuncts${vtag('tx-alc-adj')}: methanol → folinic/folic acid 50 mg IV q6h; ethylene glycol → thiamine 100 mg + pyridoxine 50 mg IV q6h</li>
    <li><b>Hemodialysis</b>: severe acidosis, visual signs, coma/seizures, AKI, or high level – removes both alcohol and toxic acids (EXTRIP)</li></ul>`;
  // --- pesticides ---
  $('o-pest').innerHTML = `<div class="gl">Organophosphate / carbamate (cholinergic crisis)</div>
   <div class="note">Decontaminate (remove clothes, wash skin; staff PPE). Killers: bronchorrhea, bronchospasm, respiratory muscle weakness. Atropinize fast, by doubling, to a dry chest – not to pupil size. Avoid succinylcholine (prolonged paralysis) – use rocuronium. Watch for intermediate syndrome (proximal/neck/respiratory weakness) at 24–96 h.</div>
   ${drugs(['opA'],w)}
   <div class="gl" style="margin-top:.8rem">Paraquat (e.g. gramoxone) – very high lethality</div>
   <ul class="tight"><li>Burning mouth/throat ulcers, vomiting → AKI, liver injury, progressive lung fibrosis</li>
    <li>Decontaminate early: activated charcoal or Fuller’s earth 1 g/kg${ok(w)?` (${fmt(Math.min(w,50))} g max 50 g charcoal)`:''}${vtag('tx-paraquat')}; <b>avoid supplemental O₂ unless SpO₂ &lt; 88–90%</b> (oxygen worsens lung injury)</li>
    <li>Urine dithionite test (blue = positive) supports exposure; early hemoperfusion/immunosuppression are unproven – NPMCC + palliative discussion</li></ul>
   <div class="gl">Glyphosate-surfactant · rodenticides</div>
   <ul class="tight"><li>Glyphosate: GI corrosion, hypotension, acidosis, hyperkalemia, AKI – supportive; dialysis for refractory acidosis/hyperkalemia</li>
    <li>Superwarfarin rat poison (brodifacoum): INR at 24–48 h; bleeding → vitamin K (high doses, weeks–months) + PCC/FFP. Zinc/aluminium phosphide fumigants: refractory shock, phosphine gas risk – supportive, protect staff</li></ul>`;
  // --- agitated / hyperthermic ---
  $('o-symp').innerHTML = `<ol class="steps">
    <li class="shock"><b>Temperature &gt; 40 °C = emergency:</b> rapid external cooling (ice-water immersion / ice packs + evaporative); paralysis + intubation if rigid/agitated hyperthermia persists (antipyretics do not work)</li>
    <li class="drugstep"><b>Benzodiazepines first</b> for agitation, tachycardia, hypertension and seizures; minimise physical restraint (rhabdo, sudden death)</li></ol>${drugs(['bzdAg'],w)}
   <ul class="tight"><li><b>Sympathomimetic</b> (shabu, cocaine): treat chest pain as ACS (aspirin, nitrates, benzodiazepines); hypertension → benzodiazepine, then phentolamine or nitroglycerin; cocaine wide-QRS → bicarbonate (TCA card). Avoid pure β-blockade early (unopposed α concern – evidence mixed)</li>
    <li><b>Serotonin syndrome</b> (Hunter): stop serotonergic drugs, benzodiazepines, cool; cyproheptadine for moderate cases; severe (T &gt; 41 °C, rigidity) → paralyse and ventilate</li>
    <li><b>NMS:</b> stop the antipsychotic, cool, fluids, benzodiazepines; ICU for rigidity/hyperthermia; check CK</li>
    <li><b>Anticholinergic delirium:</b> benzodiazepines; physostigmine only with toxicology advice and a narrow QRS (see antidotes)</li></ul>
   ${drugs(['cypro','dantro'],w)}`;
  // --- misc ---
  $('o-toxmisc').innerHTML = `<div class="gl">Iron</div><ul class="tight"><li>Toxicity by${vtag('tx-iron')} <b>elemental iron</b>: &lt; 20 mg/kg usually benign; 20–60 mg/kg GI toxicity; &gt; 60 mg/kg potentially lethal${ok(w)?` (= ${fmt(20*w)} / ${fmt(60*w)} mg elemental for ${fmt(w)} kg)`:''}. Vomiting/diarrhea → latent phase → shock, acidosis, liver failure</li>
    <li>Abdominal X-ray (tablets radio-opaque); WBI if tablets beyond pylorus; charcoal ineffective; serum iron at 4–6 h; deferoxamine for shock, acidosis, altered status, or high levels</li></ul>${drugs(['feA'],w)}
   <div class="gl" style="margin-top:.8rem">Lithium${vtag('tx-li')}</div><ul class="tight"><li>Acute: GI symptoms first, neurotoxicity later; chronic (often AKI/dehydration, new ACEi/thiazide/NSAID): tremor, ataxia, confusion, seizures at lower levels</li>
    <li>No charcoal; WBI for sustained-release; isotonic fluids to restore urine output; avoid nephrotoxins; dialysis per EXTRIP (<a href="#" data-goto="dialysis">AEIOU</a>)</li></ul>
   <div class="gl">Methemoglobinemia</div><ul class="tight"><li>Cyanosis/“chocolate” blood with SpO₂ stuck ~85% not responding to O₂; dapsone, topical benzocaine/prilocaine, nitrites, aniline dyes, some herbal remedies. Co-oximetry MetHb; treat if symptomatic or &gt; 20–30%</li></ul>${drugs(['metA'],w)}
   <div class="gl" style="margin-top:.8rem">Caustics &amp; button batteries</div><ul class="tight"><li>Caustics (lye, toilet/drain cleaners, sosa): no emesis, no neutralisation, no charcoal; airway assessment (stridor, drooling → early intubation by expert); endoscopy within 12–24 h if symptomatic or intentional</li>
    <li><b>Button battery:</b> X-ray neck–abdomen immediately; <b>esophageal battery = endoscopic removal within 2 h</b>; meanwhile, for age ≥ 1 y and ≤ 12 h:</li></ul>${drugs(['battery'],w)}
   <div class="gl" style="margin-top:.8rem">Hydrocarbons (kerosene, gasoline, lamp oil)</div><ul class="tight"><li>Main danger is <b>aspiration pneumonitis</b> (cough, choking, tachypnea) – no emesis, no charcoal, no lavage</li>
    <li>Asymptomatic: observe 6 h + CXR; symptomatic: O₂, admit; antibiotics/steroids not routine. Huffing: sudden sniffing death (catecholamine-triggered VF) – avoid adrenergic stimulation</li></ul>`;
}
function initTox(){}
