// ======================= LEGACY FLAGS (v1 + merged cards) =======================
// Doses carried over from the v1 site / Renal-Pulm worker that had no ⚠ VERIFY tag get an individual
// pending-review entry (per drug, or per card for inline text) – no content changes.
const V1DRUGS = {epi:['Epinephrine – cardiac arrest (1 mg / 0.01 mg/kg q3–5 min)','Resus / Crash'], calcium:['Calcium chloride/gluconate in arrest','Resus / Crash'],
  bicarb:['Sodium bicarbonate 1 mEq/kg in arrest','Resus / Crash'], fluid:['Crystalloid bolus in anaphylaxis (adult 0.5–1 L; peds 10–20 mL/kg)','Anaphylaxis'],
  diphen:['Diphenhydramine adjunct (25–50 mg; peds 1 mg/kg)','Anaphylaxis'], salb:['Salbutamol neb in anaphylaxis bronchospasm','Anaphylaxis'],
  etom:['Etomidate 0.3 mg/kg induction','Airway'], ket:['Ketamine 1–2 mg/kg induction','Airway'], prop:['Propofol 1–2 mg/kg induction','Airway'],
  roc:['Rocuronium 1.2 mg/kg RSI','Airway'], sux:['Succinylcholine 1.5 mg/kg (peds 2 mg/kg) RSI','Airway'], fent:['Fentanyl 1–3 mcg/kg pre-treatment/analgesia','Airway'],
  dzp:['Diazepam rectal/IV for seizures','Neuro'], lev:['Levetiracetam 60 mg/kg (max 4.5 g) – status epilepticus','Neuro'],
  fos:['Fosphenytoin 20 mg PE/kg (max 1.5 g PE)','Neuro'], vpa:['Valproate 40 mg/kg (max 3 g)','Neuro'], vaso:['Vasopressin 0.03 units/min add-on','Sepsis'],
  hc:['Hydrocortisone 200 mg/day in vasopressor-dependent shock','Sepsis'], txa:['Tranexamic acid 1 g + 1 g (peds 15 mg/kg)','Trauma'], hk:['Hyperkalemia quick card doses','Renal']};
Object.entries(V1DRUGS).forEach(([k,[t,tab]])=>{ const key='v1-'+k; REVIEW[key]={t:t+' (v1 dose, previously unflagged)', r:'Carried over unchanged from the v1 site; needs owner sign-off like every other dose.', tab}; if(D[k] && !D[k].flag) D[k].flag=key; });
const LEGACY_CARDS = [ // [card id, key, what, tab]
  ['algo','v1-algo','ACLS/PALS algorithm step doses and shock energies (epinephrine, amiodarone, lidocaine, atropine; 120–200 J / 2→4 J/kg)','Resus / Crash'],
  ['electric','v1-electric','Defibrillation / cardioversion energies (adult and pediatric)','Resus / Crash'],
  ['seizure','v1-seizure','Status epilepticus timeline doses (thiamine, dextrose, benzodiazepines, second-line agents)','Neuro'],
  ['stroke','v1-stroke','Alteplase 0.9 mg/kg (max 90 mg), 10% bolus – stroke card','Neuro'],
  ['abcde','v1-abcde','Primary survey numbers (fluid boluses, transfusion triggers)','Trauma'],
  ['mtp','v1-mtp','Massive transfusion activation criteria and ratios','Trauma'],
  ['asthma','pu-legacy-asthma','Asthma inline doses (adrenaline, aminophylline, ventilator settings)','Pulm'],
  ['cap','pu-cap-abx','',''], ['pe','pu-legacy-pe','PE inline doses (enoxaparin, DOACs, alteplase 100 mg / 0.6 mg/kg / 50 mg arrest, fluid limit)','Pulm'],
  ['ards','pu-ards','',''], ['effusion','pu-tap','',''], ['aki','rn-legacy-kdigo','KDIGO staging thresholds (creatinine, urine output mL/kg/hr)','Renal'],
  ['hypona','rn-legacy-na','Hyponatremia aquaresis threshold (urine output > 100 mL/hr) and related inline numbers','Renal']];
LEGACY_CARDS.forEach(([c,k,t,tab])=>{ if(t && !REVIEW[k]) REVIEW[k]={t, r:'Inline values from v1 / merged card, previously unflagged.', tab}; });
const DOSE_RE = /\d\s*(mg|mcg|g|units?|U|mL|mEq|mmol|IU|J|ampoules?|drops|tablets?)(?!\s*\/\s*d?L)(\/kg)?\b/i;
function autoTag(cardId, key){ const c=document.querySelector(`[data-card="${cardId}"]`); if(!c || !REVIEW[key]) return;
  c.querySelectorAll('li,.cline,tr').forEach(e=>{ if(e.closest('.drug')||e.querySelector('.vtag')) return; const p=e.parentElement&&e.parentElement.closest('li,tr'); if(p&&p.querySelector('.vtag')) return;
    if(DOSE_RE.test(e.innerText||e.textContent)){ const tgt=e.matches('tr')?e.lastElementChild:e; if(tgt) tgt.insertAdjacentHTML('beforeend',vtag(key)); } }); }
POSTRENDER.push(()=>LEGACY_CARDS.forEach(([c,k])=>autoTag(c,k)));
