// ======================= S17 ENDOCRINE EMERGENCIES (sample section) =======================
// Sources: ADA/EASD/JBDS 2024 hyperglycemic crises consensus; JBDS DKA 2023 / HHS 2022; ISPAD 2022; ADA SoC 2025;
// ATA 2016 thyrotoxicosis; ATA 2014 hypothyroidism; Endocrine Society 2016 PAI & 2024 GI-AI; SfE adrenal crisis 2020.
Object.assign(REVIEW, {
  'en-dka-adult':{t:'Adult DKA: fluids 15–20 mL/kg (≈ 1–1.5 L) hour 1; fixed-rate IV insulin 0.1 U/kg/hr without bolus; add dextrose and halve insulin when glucose < 250 mg/dL', r:'2024 consensus allows 0.1 U/kg/hr (or 0.05–0.1 with bolus variants); JBDS keeps 0.1 U/kg/hr and adds glucose at < 14 mmol/L. Local protocol governs.', tab:'Endocrine'},
  'en-dka-crit': {t:'Hyperglycemic crisis criteria (2024 consensus): DKA = glucose ≥ 200 mg/dL or known diabetes + β-OHB ≥ 3.0 mmol/L + pH < 7.3 and/or HCO₃ < 18; HHS = glucose ≥ 600 mg/dL + effective osmolality > 300 (or total > 320) + β-OHB < 3.0, pH ≥ 7.3, HCO₃ ≥ 15', r:'Thresholds recalled from the 2024 consensus; confirm against the published table. Severity bins use the older ADA 2009 cut-offs.', tab:'Endocrine'},
  'en-hhs':      {t:'HHS: 0.9% NaCl 1–1.5 L hour 1; aim osmolality fall 3–8 mOsm/kg/hr, glucose fall ≤ 90–120 mg/dL/hr (5 mmol/L/hr), Na fall ≤ 10 mmol/L/24 h; insulin 0.05 U/kg/hr only once glucose stops falling with fluids (start early if β-OHB > 1.0–3.0)', r:'JBDS-IP HHS 2022 numbers; 2024 consensus is less prescriptive. VTE prophylaxis per local policy.', tab:'Endocrine'},
  'en-hypo':     {t:'Hypoglycemia: oral 15–20 g glucose if alert; IV dextrose adult 25 g (D50 50 mL, or D10 100–250 mL), peds 0.2–0.5 g/kg as D10 2–5 mL/kg; glucagon 1 mg IM/SC (0.5 mg if < 25 kg), nasal 3 mg (≥ 4 y)', r:'ADA 2025 / ISPAD 2022; v1 peds dextrose card uses 0.5–1 g/kg – owner to harmonise. Glucagon less effective in alcohol use, starvation, sulfonylurea toxicity.', tab:'Endocrine'},
  'en-storm':    {t:'Thyroid storm: propranolol 60–80 mg PO q4h (or esmolol 250–500 mcg/kg load + 50–100 mcg/kg/min); PTU 500–1,000 mg load then 250 mg q4h, or methimazole 60–80 mg/day; iodine (SSKI 5 drops / 250 mg q6h or Lugol 8–10 drops q6–8h) ≥ 1 h after thionamide; hydrocortisone 300 mg IV load then 100 mg q8h; cholestyramine 4 g q6h', r:'ATA 2016; pediatric dosing not included (pediatric endocrinology). PTU preferred in first trimester and in storm; hepatotoxicity.', tab:'Endocrine'},
  'en-myx':      {t:'Myxedema coma: levothyroxine 200–400 mcg IV load, then 1.6 mcg/kg/day × 0.75 IV daily (lower in elderly/cardiac disease); ± liothyronine 5–20 mcg IV then 2.5–10 mcg q8h; hydrocortisone 100 mg IV q8h before thyroid hormone', r:'ATA 2014; IV levothyroxine/liothyronine availability in PH limited – NG levothyroxine used in practice.', tab:'Endocrine'},
  'en-adrenal':  {t:'Adrenal crisis: hydrocortisone 100 mg IV/IM then 200 mg/24 h (50 mg q6h or infusion); peds 50–100 mg/m² (≈ 25 mg < 3 y, 50 mg 3–12 y, 100 mg ≥ 12 y); fluids 1 L 0.9% NaCl in hour 1 (peds 20 mL/kg)', r:'Endocrine Society 2016 PAI / 2024 GI-AI; age bands are an approximation of 50–100 mg/m².', tab:'Endocrine'},
  'en-dex-flag': {t:'Dextrose doses reused from v1 in the Hypoglycemia card (adult 25 g D50; peds 0.5–1 g/kg D10/D25; neonate 0.2 g/kg)', r:'Unflagged in v1; peds range differs from ISPAD (0.2–0.5 g/kg) – see en-hypo.', tab:'Endocrine / Resus / Crash'}
});
if(D.dex && !D.dex.flag) D.dex.flag='en-dex-flag';
const bsaM = () => { const w=W(), h=HT(); return ok(w)&&h ? Math.sqrt(w*h/3600) : null; };   // Mosteller
Object.assign(D, {
  enGlucagon: {n:'Glucagon – hypoglycemia (no IV access)', flag:'en-hypo',
    a:[F('IM / SC','1 mg',{note:'Recovery in 10–15 min; vomiting common. Nasal glucagon 3 mg if available.'})],
    p:[C('IM / SC',w=>({main: ok(w)?(w<25?'0.5 mg':'1 mg'):'0.5 mg (< 25 kg) / 1 mg (≥ 25 kg)', lines:['Nasal 3 mg if ≥ 4 y']}))]},
  enHypoDex: {n:'IV dextrose – ISPAD-style pediatric dosing', flag:'en-hypo',
    a:[F('Adult','25 g IV = 50 mL D50, or 100–250 mL D10 (less phlebitis)',{note:'Then oral carbohydrate or D10 infusion; recheck in 15 min.'})],
    p:[B('D10 bolus',0.2,0.5,'g/kg',{max:25,conc:0.1,note:'= 2–5 mL/kg D10. Then D10 infusion if recurrent.'})]},
  enProp: {n:'β-blockade', flag:'en-storm',
    a:[F('Propranolol PO/NG','60 – 80 mg q4h',{note:'Also blocks T4→T3 conversion at high dose. Avoid/caution in decompensated HF – use esmolol.'}),
       B('Esmolol IV load (over 1 min)',250,500,'mcg/kg',{conc:10000,note:'Then 50–100 mcg/kg/min infusion; titrate HR.'})],
    p:[F('Pediatric','Dose with pediatric endocrinology / PICU')]},
  enThion: {n:'Thionamide (block synthesis)', flag:'en-storm',
    a:[F('Propylthiouracil (preferred in storm, 1st trimester)','500 – 1,000 mg PO/NG load, then 250 mg q4h'),F('or Methimazole','60 – 80 mg/day PO/NG (e.g. 20 mg q4–6h)')],
    p:[F('Pediatric','Dose with pediatric endocrinology')]},
  enIod: {n:'Iodine (block release) – ≥ 1 h AFTER thionamide', flag:'en-storm',
    a:[F('SSKI','5 drops (0.25 mL ≈ 250 mg) PO q6h'),F('or Lugol solution','8 – 10 drops PO q6–8h')]},
  enHcStorm: {n:'Hydrocortisone (storm / relative adrenal insufficiency)', flag:'en-storm',
    a:[F('IV','300 mg load, then 100 mg q8h')]},
  enLT4: {n:'Thyroid hormone – myxedema coma', flag:'en-myx',
    a:[F('Levothyroxine IV load','200 – 400 mcg (lower end if small, elderly, cardiac disease)'),
       C('Levothyroxine IV daily',w=>ok(w)?{main:`${fmt(1.6*w*0.75,0)} mcg IV daily`,lines:['1.6 mcg/kg/day × 0.75 (IV); switch to oral when able']}:{main:'Enter weight',lines:['1.6 mcg/kg/day × 0.75 IV']}),
       F('± Liothyronine (T3) IV','5 – 20 mcg load, then 2.5 – 10 mcg q8h',{note:'Avoid high doses in elderly/cardiac patients.'})]},
  enHcMyx: {n:'Hydrocortisone – give BEFORE thyroid hormone', flag:'en-myx', a:[F('IV','100 mg q8h until adrenal insufficiency excluded')]},
  enHcAdr: {n:'Hydrocortisone – adrenal crisis', flag:'en-adrenal',
    a:[F('Immediate','100 mg IV (or IM if no access)',{note:'Do not wait for cortisol – draw a sample first only if it causes no delay.'}),F('Then','200 mg / 24 h: 50 mg IV/IM q6h or continuous infusion',{note:'Taper to oral double-dose once stable and eating.'})],
    p:[C('Immediate IV/IM',w=>{ const b=bsaM(), y=ageYears();
        if(b) { const mg=Math.min(100, Math.round(50*b/5)*5 || 25); return {main:`${fmt(mg)} mg (50 mg/m², BSA ${fmt(b,2)} m²)`, lines:['Then 50–100 mg/m²/day divided q6h (or infusion)', `= ${fmt(Math.min(200,50*b))} – ${fmt(Math.min(200,100*b))} mg/day (adult max 200 mg/day)`]}; }
        if(y!=null) { const mg = y<3?25:y<12?50:100; return {main:`${mg} mg`, lines:[`Age band: ${y<3?'< 3 y':y<12?'3–12 y':'≥ 12 y'} (≈ 50–100 mg/m²; enter height for BSA)`, 'Then 50–100 mg/m²/day divided q6h']}; }
        return {main:'Enter age (or weight + height)', lines:['≈ 25 mg (< 3 y) · 50 mg (3–12 y) · 100 mg (≥ 12 y)']}; })]}
});
function hgCalc(){
  const u=$('hgGluU').value, gv=parseFloat($('hgGlu').value), g = gv>0 ? (u==='mmol'? gv*18 : gv) : null;
  const na=parseFloat($('hgNa').value), cl=parseFloat($('hgCl').value), hc=parseFloat($('hgHco3').value), ph=parseFloat($('hgPh').value), bhb=parseFloat($('hgBhb').value), k=parseFloat($('hgK').value), bun=parseFloat($('hgBun').value);
  return {g, na:na>0?na:null, cl:cl>0?cl:null, hc:hc>=0&&$('hgHco3').value!==''?hc:null, ph:ph>6&&ph<8?ph:null, bhb:bhb>=0&&$('hgBhb').value!==''?bhb:null, k:k>0?k:null, bun:bun>=0&&$('hgBun').value!==''?bun:null};
}
function renderEndo(w){
  const P=peds(), x=hgCalc();
  let h='';
  if(x.g||x.na){
    const rows=[];
    if(x.na&&x.cl&&x.hc!=null) rows.push(['Anion gap', `<b>${fmt(x.na-x.cl-x.hc,0)}</b> mmol/L (Na − Cl − HCO₃; normal ≈ 8–12, lab-specific)`]);
    if(x.na&&x.g){ const c16=x.na+1.6*(x.g-100)/100, c24=x.na+2.4*(x.g-100)/100; rows.push(['Corrected Na', `<b>${fmt(c16,0)}</b> (Katz 1.6) · ${fmt(c24,0)} (Hillier 2.4) mmol/L – rising corrected Na during treatment is expected; falling fast = cerebral edema risk`]);
      const eo=2*x.na+x.g/18; rows.push(['Effective osmolality', `<b>${fmt(eo,0)}</b> mOsm/kg (2Na + glucose/18)${x.bun!=null?` · total ${fmt(eo+x.bun/2.8,0)} (+ BUN/2.8)`:''}${eo>=320?' – <span class="due">≥ 320: expect obtundation</span>':''}`]); }
    if(x.g) rows.push(['Glucose', `${fmt(x.g,0)} mg/dL = ${fmt(x.g/18,1)} mmol/L`]);
    if(x.k!=null) rows.push(['Potassium', x.k<3.5?'<span class="due">&lt; 3.5 – replace K BEFORE insulin</span>':x.k>5?'&gt; 5.0 – no K in fluids yet; recheck in 2 h':'3.5–5.0 – add 20–40 mmol K per litre']);
    // classification
    const dm = nc('hg_dm'), eo = x.na&&x.g ? 2*x.na+x.g/18 : null;
    const acid = (x.ph!=null && x.ph<7.3) || (x.hc!=null && x.hc<18);
    const dka = (dm || (x.g!=null && x.g>=200)) && x.bhb!=null && x.bhb>=3 && acid;
    const hhs = x.g!=null && x.g>=600 && eo!=null && eo>300 && (x.bhb==null || x.bhb<3) && (x.ph==null || x.ph>=7.3) && (x.hc==null || x.hc>=15);
    let cls='';
    if(dka && x.g>=600 && eo>300) cls='<span class="due">Mixed DKA + HHS</span>';
    else if(dka){ const sev = (x.ph!=null&&x.ph<7.0)||(x.hc!=null&&x.hc<10) ? 'severe' : (x.ph!=null&&x.ph<7.25)||(x.hc!=null&&x.hc<15) ? 'moderate' : 'mild';
      cls=`<span class="due">DKA – ${sev}</span>${x.g!=null&&x.g<250?' · <b>euglycemic DKA</b> (SGLT2 inhibitor? pregnancy? starvation?)':''}`; }
    else if(hhs) cls='<span class="due">HHS</span>';
    else if(x.bhb!=null && x.bhb>=3 && acid && (x.g==null || x.g<200) && !dm) cls='<span class="soon">Ketoacidosis without diabetes criteria – alcoholic or starvation ketoacidosis? (or undiagnosed diabetes)</span>';
    else cls='<span class="note">Criteria not met (or incomplete) – enter glucose, β-OHB, pH/HCO₃, Na</span>';
    h=`<div class="big" style="margin-top:.5rem">${cls}</div>${vtag('en-dka-crit')}<div class="kv">${rows.map(([a,b])=>`<div class="dl">${a}</div><div>${b}</div>`).join('')}</div>`;
  } else h='<div class="note">Enter labs to calculate anion gap, corrected Na, effective osmolality and classify DKA vs HHS (2024 consensus criteria).</div>';
  $('o-hgcalc').innerHTML = h + `<div class="note" style="margin-top:.4rem">DKA: glucose ≥ 200 mg/dL (11.1 mmol/L) <i>or</i> known diabetes · β-OHB ≥ 3.0 mmol/L (urine ketones ≥ 2+ if no blood test) · pH &lt; 7.3 and/or HCO₃ &lt; 18. HHS: glucose ≥ 600 mg/dL (33.3 mmol/L) · effective osmolality &gt; 300 mOsm/kg · β-OHB &lt; 3.0 · pH ≥ 7.3 · HCO₃ ≥ 15${vtag('en-dka-crit')}.</div>`;
  // --- HHS ---
  $('o-hhs').innerHTML = `<div class="note">Older adults with type 2 diabetes, days of polyuria/poor intake, infection or stroke as precipitant. Fluid deficit is huge (~100–220 mL/kg); mortality is higher than DKA – from the precipitant, thrombosis and over-rapid osmolar shifts.</div>
   <ol class="steps"><li class="drugstep"><b>Fluids first</b>${vtag('en-hhs')}: 0.9% NaCl (or balanced crystalloid) 1–1.5 L in hour 1${ok(w)&&!P?` (≈ ${fmt(15*w)} – ${fmt(20*w)} mL at 15–20 mL/kg)`:''}, then ~250–500 mL/hr guided by perfusion, urine output and osmolality; replace ~half the deficit in 12 h, the rest over the next 12 h</li>
    <li><b>Monitor hourly</b> glucose; osmolality, Na, K, urea at 0, 1, 2, 4, 6 h. Target falls: osmolality 3–8 mOsm/kg/hr · glucose ≤ 90–120 mg/dL/hr (≤ 5 mmol/L/hr) · Na ≤ 10 mmol/L in 24 h${vtag('en-hhs')}</li>
    <li class="drugstep"><b>Insulin</b> only when glucose stops falling with fluids alone: fixed-rate 0.05 U/kg/hr${ok(w)?` = <b>${fmt(0.05*w,1)} U/hr</b>`:''}; start at once if significant ketonemia (mixed DKA/HHS)${vtag('en-hhs')}</li>
    <li>Add dextrose (D5) when glucose &lt; 300 mg/dL (16.7 mmol/L); keep glucose 200–300 mg/dL in the first 24 h</li>
    <li>Potassium as for DKA (see calculator); <b>VTE prophylaxis</b> (LMWH) unless contraindicated; look for MI, stroke, sepsis, rhabdomyolysis; foot check</li></ol>
   ${P?'<div class="vwarn">Pediatric HHS is rare and needs PICU-led fluid management (ISPAD) – fluid volumes differ from DKA.</div>':''}`;
  // --- hypoglycemia ---
  $('o-hypogly').innerHTML = `<div class="note"><b>Levels (ADA 2025):</b> level 1 &lt; 70 mg/dL (3.9 mmol/L) · level 2 &lt; 54 mg/dL (3.0 mmol/L) · level 3 = altered mental/physical function needing assistance. Neonates/children: see ISPAD/neonatal thresholds.</div>
   <ol class="steps"><li><b>Alert and can swallow:</b> 15–20 g fast glucose (e.g. 4 glucose tablets, ¾ cup juice, 3 tsp sugar in water); recheck in 15 min, repeat until &gt; 70 mg/dL, then a complex-carbohydrate snack/meal${vtag('en-hypo')}</li>
    <li class="drugstep"><b>Altered / unable to swallow:</b> IV dextrose (below); no IV → glucagon IM/SC or nasal. Thiamine 100 mg IV with (not before, if it delays) dextrose in malnutrition/alcohol use${vtag('en-hypo')}</li></ol>
   ${drugs(['enHypoDex','dex','enGlucagon'],w)}
   <ul class="tight"><li><b>Sulfonylurea</b> (gliclazide, glibenclamide) or long-acting insulin: recurrent hypoglycemia – admit, D10 infusion, frequent glucose; octreotide for sulfonylurea-induced recurrence (see <a href="#" data-goto="antidotes">Tox antidotes</a>); observe ≥ 24 h (longer for modified-release)</li>
    <li>Intentional insulin overdose: hypokalemia, prolonged effect – infusion + K monitoring; consider local excision of a large depot only in exceptional cases</li>
    <li>Non-diabetic hypoglycemia: sepsis, liver failure, adrenal insufficiency, alcohol, malaria/quinine, insulinoma – draw a sample (glucose, insulin, C-peptide, β-OHB, cortisol) before treatment if feasible</li>
    <li>Discharge only if cause understood, long-acting agent excluded, eating, responsible adult present, follow-up arranged</li></ul>`;
  // --- thyroid storm ---
  const bw=['bwT','bwC','bwG','bwH','bwF','bwA','bwP'].reduce((s,id)=>s+(parseInt($(id).value,10)||0),0);
  $('o-storm').innerHTML = `<div class="scoreRow"><div><span class="total">${bw}</span> <span class="note">Burch–Wartofsky point scale</span></div></div>
   <div class="note"><b>${bw>=45?'<span class="due">≥ 45: highly suggestive of thyroid storm</span>':bw>=25?'<span class="soon">25–44: impending storm – treat if clinically suspected</span>':'&lt; 25: storm unlikely'}</b>. A clinical diagnosis – do not wait for TSH/FT4 (send them).</div>
   <ol class="steps"><li>Supportive: cooling, acetaminophen (avoid aspirin – displaces T4), fluids, treat precipitant (infection, missed antithyroid drugs, iodine contrast, delivery, trauma), ICU</li>
    <li class="drugstep">Order matters: <b>β-blocker → thionamide → iodine ≥ 1 h later → steroid</b>${vtag('en-storm')}</li></ol>
   ${drugs(['enProp','enThion','enIod','enHcStorm'],w)}
   <ul class="tight"><li>Cholestyramine 4 g PO q6h reduces enterohepatic recycling${vtag('en-storm')}</li>
    <li>AF with storm: rate control as above; anticoagulate per CHA₂DS₂-VA; cardioversion often fails until euthyroid</li>
    <li>Refractory: plasmapheresis, urgent thyroidectomy (specialist centre)</li>
    ${P?'<li class="vwarn">Pediatric storm (rare; neonatal Graves): pediatric endocrinology / PICU dosing</li>':''}</ul>`;
  // --- myxedema ---
  $('o-myx').innerHTML = `<div class="note">Elderly woman, winter or infection, sedatives/amiodarone, stopped levothyroxine: hypothermia, bradycardia, hypoventilation (↑ CO₂), hyponatremia, hypoglycemia, coma, pericardial effusion. High mortality – ICU.</div>
   <ol class="steps"><li>Airway/ventilation (hypercapnic failure – low threshold for intubation); passive rewarming (active rewarming → vasodilation/collapse)</li>
    <li class="drugstep"><b>Hydrocortisone first</b>, then IV thyroid hormone${vtag('en-myx')}</li></ol>
   ${drugs(['enHcMyx','enLT4'],w)}
   <ul class="tight"><li>Avoid hypotonic fluids; treat hyponatremia cautiously (see <a href="#" data-goto="hypona">Renal: hyponatremia</a>); dextrose for hypoglycemia; look for sepsis</li>
    <li>Drug clearance is slow – reduce sedative and opioid doses</li></ul>`;
  // --- adrenal crisis ---
  $('o-adrenal').innerHTML = `<div class="note"><b>Suspect in:</b> known Addison’s / hypopituitarism / congenital adrenal hyperplasia, <b>long-term steroid use</b> (incl. stopping abruptly, or sick-day without dose increase), shock unresponsive to fluids/pressors, hyponatremia + hyperkalemia, hypoglycemia, unexplained vomiting/abdominal pain. Many carry a steroid emergency card.</div>
   <ol class="steps"><li class="shock"><b>Give hydrocortisone immediately</b> – never delay for tests (draw cortisol/ACTH with first bloods if no delay)${vtag('en-adrenal')}</li></ol>
   ${drugs(['enHcAdr'],w)}
   <ol class="steps"><li class="drugstep"><b>Fluids:</b> ${P?`0.9% NaCl 20 mL/kg${ok(w)?` = <b>${fmt(Math.min(20*w,1000))} mL</b>`:''}, repeat to perfusion; dextrose if hypoglycemic`:'1 L 0.9% NaCl (or D5NS if hypoglycemic) in the first hour, then by response (often 3–4 L/24 h)'}${vtag('en-adrenal')}</li>
    <li>Treat precipitant (infection, GI loss, surgery); monitor glucose, Na, K; ICU if shock persists. Fludrocortisone is unnecessary while hydrocortisone ≥ 50 mg/day${vtag('en-adrenal')}</li>
    <li>Dexamethasone does not cover mineralocorticoid needs – use hydrocortisone unless a diagnostic test must be done very soon</li>
    <li>Before discharge: <b>sick-day rules</b> (double oral dose with fever/illness; IM hydrocortisone if vomiting), emergency card, injection kit education</li></ol>`;
}
function initEndo(){}
