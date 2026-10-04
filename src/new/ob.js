// ======================= S11 OBSTETRIC EMERGENCIES (sample section) =======================
// Sources: ACOG CO 767 & PB 222/183/193; WHO pre-eclampsia, PPH 2023 / E-MOTIVE, TXA 2017; AHA 2020 maternal arrest;
// ERC 2021; AHA/AAP 2020 NRP & ILCOR 2023; RCOG GTG 42/50; ACOG 2024 Rh(D) update; DOH/POGS.
Object.assign(REVIEW, {
  'ob-vol': {t:'Volume figures: preeclampsia fluid restriction ~80 mL/hr total; bladder filling 500–750 mL for cord prolapse; hCG discriminatory zone ~1,500–3,500 IU/L', r:'Approximate values from ACOG/RCOG guidance; local practice differs.', tab:'OB'},
  'ob-antiD':   {t:'Rh(D) immune globulin: 300 mcg IM within 72 h for Rh-negative bleeding/trauma ≥ 12 weeks; < 12 weeks may be omitted (ACOG 2024) or 50–120 mcg if given', r:'Product sizes (50/120/300 mcg) and local policy (DOH/POGS) differ; Kleihauer–Betke for large fetomaternal hemorrhage.', tab:'Obstetrics'},
  'ob-mtx':     {t:'Methotrexate for stable ectopic (50 mg/m² IM single-dose protocol) – OB decision only', r:'Eligibility (hCG level, no cardiac activity, mass size) per ACOG PB 193; listed for awareness, not ED initiation.', tab:'Obstetrics'},
  'ob-sevbp':   {t:'Severe-range BP in pregnancy (≥ 160 systolic or ≥ 110 diastolic, persisting ≥ 15 min) → treat within 30–60 min; target ~140–150/90–100', r:'ACOG CO 767; WHO/DOH targets similar; confirm local OB protocol.', tab:'Obstetrics'},
  'ob-labet':   {t:'Labetalol IV for severe pregnancy hypertension: 20 mg → 40 mg → 80 mg at 10-min intervals (max cumulative 300 mg), then switch agent', r:'ACOG CO 767 algorithm; avoid in asthma, heart failure, bradycardia.', tab:'Obstetrics'},
  'ob-hydral':  {t:'Hydralazine IV 5–10 mg over 2 min, repeat 10 mg at 20 min, then switch agent', r:'ACOG CO 767; maternal hypotension → fetal distress; availability varies.', tab:'Obstetrics'},
  'ob-nifed':   {t:'Nifedipine immediate-release 10 mg PO, then 20 mg at 20 min, then 20 mg at 20 min, then switch agent', r:'ACOG CO 767; capsules swallowed, not sublingual.', tab:'Obstetrics'},
  'ob-mgtox':   {t:'Magnesium toxicity: stop infusion; calcium gluconate 10% 10 mL (1 g) IV over 10 min; monitor reflexes, RR ≥ 12, urine ≥ 25–30 mL/hr', r:'Standard practice; reduce maintenance in renal impairment.', tab:'Obstetrics'},
  'ob-pph-def': {t:'PPH definition/triggers: ≥ 500 mL vaginal (WHO) or ≥ 1,000 mL / any loss with instability (ACOG); obstetric shock index ≥ 0.9–1.0 = escalate', r:'Definitions differ; E-MOTIVE uses calibrated drape ≥ 300 mL with abnormal signs or ≥ 500 mL.', tab:'Obstetrics'},
  'ob-oxy':     {t:'Oxytocin 10 IU IM or slow IV, then infusion (e.g. 20–40 IU in 1 L crystalloid titrated to tone)', r:'WHO 2023; infusion concentration and rate are protocol-specific; avoid rapid undiluted IV bolus (hypotension).', tab:'Obstetrics'},
  'ob-txa':     {t:'TXA for PPH: 1 g IV over 10 min within 3 h of birth; second 1 g if bleeding continues after 30 min or restarts within 24 h', r:'WOMAN trial / WHO 2017; no benefit beyond 3 h.', tab:'Obstetrics'},
  'ob-ergo':    {t:'Ergometrine/methylergonovine 0.2 mg IM (or slow IV), may repeat; contraindicated in hypertension/pre-eclampsia, heart disease', r:'Product and repeat interval (q2–4h, max ~1 mg/day) vary.', tab:'Obstetrics'},
  'ob-carbo':   {t:'Carboprost 250 mcg IM q15–90 min, max 8 doses (2 mg); avoid in asthma', r:'Availability in PH limited; storage refrigerated.', tab:'Obstetrics'},
  'ob-miso':    {t:'Misoprostol 800 mcg sublingual for PPH treatment (if oxytocin unavailable/adjunct)', r:'WHO; adjunct value with oxytocin is limited; fever/shivering common.', tab:'Obstetrics'},
  'ob-fib':     {t:'PPH blood products: early fibrinogen (target > 2 g/L), 1:1:1 MTP, calcium', r:'Obstetric MTP packs and fibrinogen sources (cryo vs concentrate) are institution-specific.', tab:'Obstetrics'},
  'ob-arrest':  {t:'Maternal arrest: manual left uterine displacement if fundus at/above umbilicus (~≥ 20 wk); hysterotomy decision at 4 min, delivery by ~5 min; standard ACLS drugs/energies; Mg toxicity → calcium chloride 10% 10 mL / gluconate 10% 30 mL', r:'AHA 2020 / ERC 2021; timing targets are aspirational – start preparing on arrival.', tab:'Obstetrics'},
  'ob-nrp':     {t:'Newborn resuscitation doses: epinephrine IV/IO 0.01–0.03 mg/kg (0.1 mg/mL), ETT 0.05–0.1 mg/kg; volume 10 mL/kg; dextrose 10% 2 mL/kg; PPV 40–60/min; compressions 3:1 if HR < 60 after 30 s effective ventilation', r:'AHA/AAP 2020 NRP & ILCOR 2023; check local neonatal protocol and drug strength.', tab:'Obstetrics / Pediatrics'},
  'ob-afe':     {t:'Amniotic fluid embolism: supportive (A-OK regimen – atropine 1 mg, ondansetron 8 mg, ketorolac 30 mg IV – case-report evidence only)', r:'Not guideline-endorsed; ketorolac contraindicated with bleeding/coagulopathy. Owner to decide whether to keep.', tab:'Obstetrics'},
  'ob-vte':     {t:'VTE in pregnancy: enoxaparin 1 mg/kg SC q12h (early-pregnancy weight); no DOACs/warfarin', r:'RCOG GTG 37b / ASH 2018; anti-Xa monitoring at weight extremes and renal impairment.', tab:'Obstetrics'},
  'ob-hyper':   {t:'Hyperemesis: thiamine 100 mg IV before dextrose; antiemetics (metoclopramide 10 mg, ondansetron 4–8 mg, doxylamine–pyridoxine)', r:'RCOG GTG 69 (2024); first-trimester ondansetron small oral-cleft signal – shared decision.', tab:'Obstetrics'}
});
const nbW = () => { const v=parseFloat($('nbWt').value); return v>=0.3 && v<=6 ? v : null; };
Object.assign(D, {
  obLabet: {n:'Labetalol IV', flag:'ob-labet', a:[F('Severe BP','20 mg IV over 2 min',{note:'Recheck BP in 10 min → 40 mg → (10 min) 80 mg → (10 min) switch to hydralazine. Max cumulative 300 mg. Avoid: asthma, HF, HR < 60.'})]},
  obHydral: {n:'Hydralazine IV', flag:'ob-hydral', a:[F('Severe BP','5 – 10 mg IV over 2 min',{note:'Recheck in 20 min → 10 mg → (20 min) switch to labetalol.'})]},
  obNifed: {n:'Nifedipine immediate-release PO', flag:'ob-nifed', a:[F('Severe BP (no IV access or as first line)','10 mg PO',{note:'Recheck in 20 min → 20 mg → (20 min) 20 mg → switch to labetalol. Swallow whole.'})]},
  obMgTox: {n:'Magnesium toxicity → calcium gluconate', flag:'ob-mgtox', a:[F('IV over 10 min','1 g = 10 mL of 10%',{note:'Stop Mg. Loss of patellar reflexes → RR depression → arrest as levels rise.'})]},
  obOxy: {n:'Oxytocin – first-line uterotonic', flag:'ob-oxy', a:[F('Bolus','10 IU IM, or slow IV over 1–2 min'),F('Infusion','20 – 40 IU in 1,000 mL crystalloid, titrate to uterine tone',{note:'Water intoxication with prolonged high-dose infusion.'})]},
  obTxa: {n:'Tranexamic acid – PPH', flag:'ob-txa', a:[F('Within 3 h of birth','1 g IV over 10 min',{note:'= 10 mL of 100 mg/mL. Second 1 g if bleeding continues after 30 min or restarts within 24 h.'})]},
  obErgo: {n:'Ergometrine / methylergonovine', flag:'ob-ergo', a:[F('IM (or slow IV)','0.2 mg',{note:'Contraindicated: hypertension, pre-eclampsia, cardiac disease.'})]},
  obCarbo: {n:'Carboprost (15-methyl PGF2α)', flag:'ob-carbo', a:[F('Deep IM (or intramyometrial by OB)','250 mcg q15–90 min, max 8 doses (2 mg)',{note:'Avoid in asthma.'})]},
  obMiso: {n:'Misoprostol', flag:'ob-miso', a:[F('Sublingual','800 mcg',{note:'If oxytocin unavailable; shivering/fever common.'})]},
  nbEpi: {n:'Newborn – epinephrine (0.1 mg/mL)', flag:'ob-nrp', b:[C('IV / IO (preferred)',()=>{ const w=nbW(); return w?{main:`${fmt(0.01*w,2)} – ${fmt(0.03*w,2)} mg`,lines:[`= ${fmt(0.1*w,2)} – ${fmt(0.3*w,2)} mL of 0.1 mg/mL, flush 3 mL NS`,'0.01–0.03 mg/kg q3–5 min if HR < 60 despite ventilation + compressions']}:{main:'Enter newborn weight',lines:['0.01–0.03 mg/kg (0.1–0.3 mL/kg of 0.1 mg/mL)']}; }),
      C('Endotracheal (while obtaining access)',()=>{ const w=nbW(); return w?{main:`${fmt(0.05*w,2)} – ${fmt(0.1*w,2)} mg`,lines:[`= ${fmt(0.5*w,1)} – ${fmt(w,1)} mL of 0.1 mg/mL`]}:{main:'Enter newborn weight',lines:['0.05–0.1 mg/kg (0.5–1 mL/kg of 0.1 mg/mL)']}; })]},
  nbVol: {n:'Newborn – volume & glucose', flag:'ob-nrp', b:[C('NS or O-negative blood (suspected blood loss)',()=>{ const w=nbW(); return w?{main:`${fmt(10*w)} mL over 5–10 min`,lines:['10 mL/kg; repeat once if needed']}:{main:'Enter newborn weight',lines:['10 mL/kg over 5–10 min']}; }),
      C('Dextrose 10% (hypoglycemia)',()=>{ const w=nbW(); return w?{main:`${fmt(2*w,1)} mL D10`,lines:['2 mL/kg (0.2 g/kg), then infusion ~ 60–80 mL/kg/day']}:{main:'Enter newborn weight',lines:['2 mL/kg D10']}; })]}
});
function obTimerHTML(){
  if(!(CT.start && !CT.end)) return `<div class="note">Code timer not running. <button class="linkbtn" data-startcode="1">⏱ Start code timer</button> – this card then shows the 4-minute hysterotomy countdown.</div>`;
  const el=Date.now()-CT.start, left=240000-el;
  return `<div class="tbox${left<=0?' flash':''}"><div class="note">Time since code start (from the code timer)</div><div class="cyc">${mmss(el)}</div>
   <div class="${left<=0?'due':left<60000?'soon':'okc'}">${left>0?`Hysterotomy decision in ${mmss(left)} – prepare now (scalpel, team, neonatal resus)`:'≥ 4 min without ROSC → resuscitative hysterotomy now (if uterus ≥ ~20 weeks)'}</div></div>`;
}
function renderObTimer(){ const e=$('obTimer'); if(e) e.innerHTML=obTimerHTML(); }
setInterval(()=>{ if(tab==='ob') renderObTimer(); }, 1000);
function renderOB(w){
  $('obPeds').hidden=!peds();
  $('o-obearly').innerHTML = `<ol class="steps">
    <li><b>Every person of reproductive age with abdominal pain, bleeding, syncope or shock: pregnancy test.</b> Positive test + no intrauterine pregnancy (IUP) on ultrasound = ectopic until proven otherwise.</li>
    <li class="shock"><b>Unstable</b> (hypotension, peritonism, free fluid in Morison’s pouch on FAST): 2 large-bore IVs, crossmatch, activate MTP, <b>emergency OB/surgery</b> – do not wait for formal imaging or hCG.</li>
    <li><b>Stable:</b> transvaginal ultrasound + quantitative β-hCG; no IUP with hCG above the local discriminatory zone (~1,500–3,500 IU/L) is highly suspicious; below it → repeat hCG in 48 h (expected rise ≥ ~35–50%) with clear return precautions.</li>
    <li><b>Rh(D)-negative</b> with bleeding, ectopic, miscarriage or trauma: anti-D immunoglobulin 300 mcg IM within 72 h (≥ 12 weeks; may be omitted &lt; 12 weeks per ACOG 2024)${vtag('ob-antiD')}</li>
    <li>Heterotopic pregnancy is rare but more common with IVF. Methotrexate (50 mg/m² IM single-dose protocol) is an OB decision for stable, selected patients${vtag('ob-mtx')}.</li></ol>
   <div class="note">Threatened/incomplete miscarriage: analgesia, anti-D if indicated, OB follow-up; heavy bleeding with open os → remove products from the os with ring forceps, uterotonic, OB.</div>`;
  // --- hypertension ---
  const s=parseFloat($('obSbp').value), d=parseFloat($('obDbp').value);
  let bp='';
  if(s>0||d>0){ const sev=(s>=160)||(d>=110), h=(s>=140)||(d>=90);
    bp=`<div class="big ${sev?'due':h?'soon':'okc'}">${sev?'SEVERE-range BP':h?'Hypertensive range':'Below hypertensive range'}</div><div class="note">${sev?'If persistent ≥ 15 min (or sooner if symptomatic): antihypertensive within 30–60 min + magnesium + OB':h?'Assess for pre-eclampsia features (proteinuria, labs, symptoms)':''}${vtag('ob-sevbp')}</div>`; }
  $('o-obhtn').innerHTML = bp + `<div class="note"><b>Pre-eclampsia:</b> new BP ≥ 140/90 after 20 weeks (or up to 6 weeks postpartum) + proteinuria or organ involvement (platelets &lt; 100 × 10⁹/L, creatinine &gt; 1.1 mg/dL or doubled, transaminases ≥ 2×, pulmonary edema, new headache or visual symptoms). <b>Severe features:</b> BP ≥ 160/110, organ involvement, persistent headache/visual change, RUQ/epigastric pain. <b>HELLP:</b> hemolysis, elevated liver enzymes, low platelets – BP may be only mildly raised. <b>Eclampsia:</b> seizure with pre-eclampsia (can occur postpartum, without prior hypertension).</div>
   <ol class="steps"><li class="shock"><b>Eclamptic seizure:</b> left lateral, airway, O₂; <b>magnesium sulfate is the anticonvulsant</b> (benzodiazepine only if Mg delayed or seizures persist); then control BP; deliver once stable.</li></ol>
   ${drugs(['mgEcl','obMgTox'],w)}
   <div class="gl" style="margin-top:.8rem">Severe BP – pick ONE first-line agent${vtag('ob-sevbp')}</div>${drugs(['obLabet','obHydral','obNifed'],w)}
   <ul class="tight"><li>Target ~140–150 / 90–100 mmHg – avoid precipitous drops (placental perfusion); fetal monitoring if viable</li>
    <li>Avoid ACE inhibitors, ARBs, nitroprusside (except refractory, briefly); fluid-restrict (~80 mL/hr total) – pulmonary edema risk${vtag('ob-vol')}</li>
    <li>Definitive treatment is delivery – urgent OB; transfer to a facility with OB/neonatal capability once stabilised</li></ul>`;
  // --- PPH ---
  const hr=parseFloat($('pphHr').value), sb=parseFloat($('pphSbp').value);
  let si=''; if(hr>0&&sb>0){ const x=hr/sb; si=`<div class="cline"><div class="dl">Obstetric shock index (HR/SBP)${vtag('ob-pph-def')}</div><b class="${x>=1?'due':x>=0.9?'soon':'okc'}">${fmt(x,2)}</b><div class="note">${x>=1?'≥ 1.0: significant hemorrhage likely – escalate, blood products, consider MTP':x>=0.9?'≥ 0.9: early warning – reassess, prepare blood':'Normal postpartum ≈ 0.7–0.9'}. Young healthy women compensate until late.</div></div>`; }
  $('o-obpph').innerHTML = si + `<div class="note"><b>Definition${vtag('ob-pph-def')}:</b> ≥ 500 mL after vaginal birth (WHO) or ≥ 1,000 mL / any blood loss with signs of hypovolemia (ACOG). Visual estimates underestimate – weigh/measure. Causes: <b>4 Ts</b> – Tone (≈ 70%), Trauma (tears, inversion, rupture), Tissue (retained placenta), Thrombin (coagulopathy, HELLP, AFE).</div>
   <ol class="steps"><li class="shock"><b>Call for help</b>, two large-bore IVs, bloods + crossmatch, warm fluids, O₂, empty bladder (catheter), keep warm. <b>E-MOTIVE</b> bundle together: uterine <b>M</b>assage, <b>O</b>xytocics, <b>T</b>ranexamic acid, <b>IV</b> fluids, <b>E</b>xamination &amp; escalation.</li>
    <li><b>Bimanual uterine compression</b> / aortic compression while drugs act; inspect for tears and retained placenta; check the placenta is complete.</li></ol>
   ${drugs(['obOxy','obTxa','obErgo','obCarbo','obMiso'],w)}
   <ul class="tight"><li>Refractory: intrauterine balloon tamponade, non-pneumatic anti-shock garment (NASG) for transfer, OR (compression sutures, embolisation, hysterectomy)</li>
    <li>Blood: early transfusion, <b>fibrinogen</b> (target &gt; 2 g/L) and 1:1:1 MTP, calcium – see <a href="#" data-goto="mtp">Trauma: MTP</a>${vtag('ob-fib')}</li>
    <li>Uterine inversion: stop oxytocin, immediately attempt manual replacement, then uterotonics; shock may be out of proportion to blood loss</li></ul>`;
  // --- arrest ---
  $('o-obarrest').innerHTML = `<div id="obTimer">${obTimerHTML()}</div>
   <ol class="steps"><li class="shock"><b>High-quality CPR</b> – standard hand position and ACLS drugs/energies (do not withhold defibrillation); call OB + neonatal team at once${vtag('ob-arrest')}</li>
    <li><b>Manual left uterine displacement</b> (push uterus up and left) if fundus at/above umbilicus (~≥ 20 weeks); remove fetal monitors</li>
    <li>Airway early by the most experienced operator (smaller ETT, aspiration risk); O₂ 100%; IV access <b>above the diaphragm</b></li>
    <li><b>Resuscitative hysterotomy</b> (perimortem cesarean) if no ROSC by <b>4 minutes</b> – aim to deliver by ~5 min; do it at the bedside, do not move the patient</li>
    <li>Pregnancy-specific causes – <b>“BEAU-CHOPS”</b>: Bleeding/DIC, Embolism (PE, amniotic fluid, air), Anesthetic complications (high block, LAST), Uterine atony, Cardiac disease (MI, dissection, peripartum cardiomyopathy), Hypertension/eclampsia, Other (Hs &amp; Ts), Placenta abruption/previa, Sepsis</li>
    <li class="drugstep">On magnesium: stop it; calcium chloride 10% 10 mL or calcium gluconate 10% 30 mL IV${vtag('ob-arrest')}. LAST → lipid emulsion (see Tox antidotes).</li></ol>
   <div class="note">Arrest drug doses: <a href="#" data-goto="arrestdrugs">Resus: arrest drugs</a> · ACLS steps: <button class="linkbtn" data-algo="vf">VF/pVT</button><button class="linkbtn" data-algo="pea">PEA/asystole</button></div>`;
  // --- delivery ---
  const nw=nbW();
  $('o-obdeliv').innerHTML = `<div class="gl">Imminent delivery in the ED</div><ul class="tight">
    <li>Call OB + neonatal help; warm room; prepare newborn resuscitation area (warmer, towels, bag-mask with term &amp; preterm masks, suction, cord clamps); oxytocin ready</li>
    <li>Control the head (gentle flexion), check for nuchal cord (slip over or somersault), deliver anterior then posterior shoulder with gentle traction; dry and place skin-to-skin</li>
    <li>Delay cord clamping ≥ 30–60 s if mother and baby are stable; oxytocin 10 IU IM after the baby is delivered (active management of the third stage)${vtag('ob-oxy')}</li></ul>
   <div class="gl">Shoulder dystocia (head delivered, “turtle sign”)</div><ol class="steps">
    <li class="shock">Call for help; note the time; <b>no fundal pressure</b>; stop maternal pushing while repositioning</li>
    <li><b>McRoberts</b> (hyperflex hips to abdomen) + <b>suprapubic pressure</b> (behind anterior shoulder, toward fetal face) – resolves most cases</li>
    <li>Internal maneuvers: <b>deliver the posterior arm</b>, rotational maneuvers (Rubin II / Woods screw); consider episiotomy for access; then <b>all-fours</b> (Gaskin) and repeat</li>
    <li>Head-to-body interval matters – neonatal team ready for resuscitation</li></ol>
   <div class="gl">Cord prolapse</div><ul class="tight"><li class="due">Elevate the presenting part off the cord${vtag('ob-vol')} (gloved hand in vagina or fill the bladder with 500–750 mL via catheter), knee–chest or exaggerated Sims position; minimal cord handling; <b>emergency cesarean</b></li></ul>
   <div class="gl">Breech</div><ul class="tight"><li>“Hands off the breech” until the umbilicus delivers; support the body, keep the back anterior; flex the head (Mauriceau maneuver) – call OB</li></ul>
   <div class="gl">Newborn resuscitation (AHA/AAP 2020 · ILCOR 2023)${vtag('ob-nrp')}</div><ol class="steps">
    <li><b>Term? Tone? Breathing/crying?</b> Yes → skin-to-skin, dry, observe. No → warm, position airway, clear secretions only if obstructing, dry, stimulate (~30 s)</li>
    <li class="shock">Apneic/gasping or HR &lt; 100 → <b>positive-pressure ventilation within 60 s</b> at 40–60 breaths/min, start in air (21%) for ≥ 35 weeks (21–30% if preterm); SpO₂ on right hand; ventilation corrective steps (MR SOPA) if chest not rising</li>
    <li class="shock">HR &lt; 60 after 30 s of <b>effective</b> ventilation → intubate/SGA, <b>chest compressions 3:1</b> (90 compressions + 30 breaths/min), FiO₂ 100%, UVC/IO</li>
    <li class="drugstep">HR still &lt; 60 → epinephrine; suspected blood loss → volume; check glucose</li></ol>
   ${drugs(['nbEpi','nbVol'],w)}
   ${nw?'':'<div class="note vwarn">Enter newborn weight (estimate: term ≈ 3 kg; 32 weeks ≈ 1.7 kg) to compute newborn doses.</div>'}`;
  // --- other ---
  $('o-obother').innerHTML = `<div class="gl">Antepartum hemorrhage (&gt; 20 weeks)</div><ul class="tight">
    <li><b>No digital vaginal examination until placenta previa is excluded</b> by ultrasound. Painless bright bleeding → previa; painful, tense uterus ± concealed bleeding, fetal distress → <b>abruption</b> (coagulopathy, check fibrinogen)</li>
    <li>Left lateral, two IVs, crossmatch, Kleihauer–Betke + anti-D if Rh-negative${vtag('ob-antiD')}, continuous fetal monitoring if viable, urgent OB</li></ul>
   <div class="gl">Trauma in pregnancy</div><ul class="tight">
    <li>Mother first – standard ATLS with <b>left uterine displacement</b> (or 15–30° left tilt on spinal board) after ~20 weeks; O-negative blood if needed; FAST is valid; indicated imaging should not be withheld</li>
    <li>Normal pregnancy vitals: HR +10–20, BP lower in 2nd trimester, mild respiratory alkalosis (PaCO₂ ~30 mmHg – a “normal” 40 is respiratory failure); blood volume ↑ ~45% masks hemorrhage</li>
    <li>≥ 20–24 weeks: cardiotocography for ≥ 4–6 h even after minor trauma (abruption); Rh-negative → anti-D${vtag('ob-antiD')}; consider intimate partner violence</li></ul>
   <div class="gl">Amniotic fluid embolism</div><ul class="tight"><li>Sudden hypoxia + hypotension/arrest + DIC during labour or soon after delivery. Supportive: airway, ventilation, RV support (norepinephrine, inotropes), early massive transfusion with fibrinogen, delivery; hysterotomy if arrest. A-OK regimen (atropine 1 mg, ondansetron 8 mg, ketorolac 30 mg IV) is case-report level only${vtag('ob-afe')}</li></ul>
   <div class="gl">VTE / PE in pregnancy</div><ul class="tight"><li>D-dimer is less useful (pregnancy-adapted YEARS); leg compression ultrasound first if leg symptoms; CTPA or V/Q per local pathway. Treat with LMWH – enoxaparin 1 mg/kg SC q12h${ok(w)&&!peds()?` (= ${fmt(w,0)} mg)`:''}${vtag('ob-vte')}; no DOACs or warfarin. See <a href="#" data-goto="pe">Pulmonary: PE</a></li></ul>
   <div class="gl">Hyperemesis gravidarum</div><ul class="tight"><li>Ketonuria, weight loss, dehydration, hypokalemia; <b>thiamine 100 mg IV before dextrose</b> (Wernicke); IV fluids (NS/Hartmann’s with K), antiemetics (metoclopramide 10 mg, ondansetron 4–8 mg, doxylamine–pyridoxine), VTE prophylaxis if admitted${vtag('ob-hyper')}</li></ul>
   <div class="gl">Peripartum cardiomyopathy &amp; other</div><ul class="tight"><li>New heart failure in the last month of pregnancy up to 5 months postpartum: BNP, echo, treat as acute HF (see <a href="#" data-goto="ahf">Cardiovascular: AHF</a>); avoid ACEi/ARB antepartum</li>
    <li>Postpartum (≤ 6 weeks) headache, seizures or hypertension → think pre-eclampsia, cerebral venous thrombosis, PRES, stroke</li>
    <li>Drugs best avoided in pregnancy: ACE inhibitors/ARBs, warfarin, statins, NSAIDs after ~20 weeks (oligohydramnios/ductus), tetracyclines, valproate; most standard resuscitation drugs are used as normal</li></ul>`;
}
function initOB(){}
