// =====================================================================
// DDx Assist – UI. No network calls, no storage of patient data
// (only the dark/light preference is stored, shared with the EM Toolkit key).
// =====================================================================
'use strict';
(function(){
const $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vt = s => esc(s).replace(/\[V\]/g,'<span class="vtag" title="Dose must be verified against current references">⚠ VERIFY</span>');
// Toolkit deep links (index.html#o-<cardId>): relative when this app is served from the toolkit's ddx/ folder
// (GitHub Pages, a local server or file://), otherwise the published toolkit.
const TK_BASE = /\/ddx\/[^/]*$/.test(location.pathname) ? '../index.html' : 'https://carqisan-prog.github.io/em-toolkit/index.html';
let CH = {};           // chip states {id: 1 | -1}
let SEX = '';
let PLAN = null, planTouched = false, last = null;
let TR = false, trManualOff = false;   // trauma mode (auto-on when an injury is recorded, unless switched off by the user)

// ---------- theme (same key as EM Toolkit: em_dark) ----------
function getDark(){ try{ const v=localStorage.getItem('em_dark'); return v==null ? true : JSON.parse(v); }catch(e){ return true; } }
function setDark(d){ document.body.classList.toggle('dark', d); $('theme').textContent = d ? '☀️ Light' : '🌙 Dark';
  document.querySelector('meta[name=theme-color]').setAttribute('content', d?'#0d0f12':'#ffffff'); try{ localStorage.setItem('em_dark', JSON.stringify(d)); }catch(e){} }

// ---------- form ----------
const chipHTML = g => `<div class="gl">${esc(FGROUPS[g].t)}</div><div class="chips">${FGROUPS[g].f.map(([id,l])=>`<button type="button" class="chip" data-f="${id}" aria-pressed="false">${esc(l)}</button>`).join('')}</div>`;
const numIn = (id,label,ph,step) => `<div><label for="${id}">${label}</label><input id="${id}" type="number" inputmode="decimal" ${step?`step="${step}"`:''} placeholder="${ph||''}"></div>`;
// linked chips: the same finding shown again in the trauma section (one state, painted everywhere)
const linkHTML = ids => ids.map(id=>`<button type="button" class="chip lk" data-f="${id}" aria-pressed="false" title="Same finding as in ${esc((FGROUPS[FGROUP_OF[id]]||{}).t||'')}">${esc(FLABEL[id])}</button>`).join('');
const chipsOnly = (g, extra) => `<div class="chips">${FGROUPS[g].f.map(([id,l])=>`<button type="button" class="chip" data-f="${id}" aria-pressed="false">${esc(l)}</button>`).join('')}${extra?linkHTML(extra):''}</div>`;
const selIn = (id,label,opts) => `<div><label for="${id}">${label}</label><select id="${id}">${opts.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select></div>`;
const TR_GROUPS = ['tr_mech','tr_x','tr_a','tr_b','tr_c','tr_fast','tr_d','tr_e','tr_head','tr_neck','tr_chest','tr_abd','tr_spine','tr_ext','tr_preg'];
const MIRROR = [['trHr','hr'],['trSbp','sbp'],['trDbp','dbp'],['trRr','rr'],['trSpo2','spo2'],['trT','t']];
function traumaForm(){
  const gcsOpt = (n,lab) => [['','—'],...Array.from({length:n},(_,i)=>[String(n-i), (n-i)+' '+lab[n-i-1]])];
  const E=['none','to pressure','to sound','spontaneous'], V=['none','sounds','words','confused','oriented'], M=['none','extension','abnormal flexion','normal flexion','localises','obeys'];
  const ps = (k,t,body) => `<div class="psb"><div class="psh"><span class="pk">${k}</span>${esc(t)}</div>${body}</div>`;
  return `<div class="note">ATLS xABCDE: treat life threats as you find them. Vital signs entered here are the same fields as in 📈 Vital signs.</div>
  <div class="grid3"><div><label for="injT">Time since injury</label><div style="display:flex;gap:.3rem"><input id="injT" type="number" inputmode="decimal" placeholder="#" style="min-width:0"><select id="injU" style="width:3.9rem;flex:0 0 auto;padding-left:.3rem;padding-right:.1rem"><option value="min">min</option><option value="h" selected>h</option></select></div></div>
    ${numIn('fallM','Fall height (m)','if fall','0.1')}${numIn('wt','Weight (kg)','for fluids','0.1')}</div>
  <div class="gl">Context</div><div class="chips">${linkHTML(['m_anticoag','m_antiplt','m_bb'])}<button type="button" class="chip" id="trPreg" aria-pressed="false">Pregnant</button></div><div class="note" id="trCtx"></div>
  <div class="gl">Mechanism (walang helmet, nabangga, nahulog, sinaksak, binaril…)</div>${chipsOnly('tr_mech')}
  <div class="gl">Primary survey</div>
  ${ps('x','Exsanguinating external hemorrhage', chipsOnly('tr_x'))}
  ${ps('A','Airway + C-spine', `<div class="grid2">${selIn('air','Airway',[['','— not assessed'],['patent','Patent (talking)'],['threat','Threatened'],['obst','Obstructed']])}</div>`+chipsOnly('tr_a',['stridor']))}
  ${ps('B','Breathing', `<div class="grid3">${numIn('trRr','RR','/min')}${numIn('trSpo2','SpO₂ %','')}${selIn('bs','Breath sounds',[['','—'],['equal','Equal'],['L','↓ Left'],['R','↓ Right'],['both','↓ Both']])}</div>`+chipsOnly('tr_b',['hyperres','trach_dev']))}
  ${ps('C','Circulation + hemorrhage control', `<div class="grid3">${numIn('trHr','HR','/min')}${numIn('trSbp','SBP','mmHg')}${numIn('trDbp','DBP','mmHg')}</div><div class="grid3">${numIn('bd','Base deficit','e.g. 8','0.1')}</div>`+chipsOnly('tr_c',['cool_periph','jvd','muffled'])+`<div class="gl sm">eFAST</div>`+chipsOnly('tr_fast'))}
  ${ps('D','Disability', `<div class="grid3">${selIn('gcsE','GCS – Eye',gcsOpt(4,E))}${selIn('gcsV','Verbal',gcsOpt(5,V))}${selIn('gcsM','Motor',gcsOpt(6,M))}</div><div class="grid2">${selIn('pup','Pupils',[['','—'],['equal','Equal & reactive'],['uni','One dilated / unreactive'],['bil','Both fixed & dilated'],['pin','Pinpoint']])}<div><label>GCS total</label><div class="gcst" id="gcsTot">—</div></div></div>`+chipsOnly('tr_d'))}
  ${ps('E','Exposure / environment / burns', `<div class="grid3">${numIn('trT','Temp °C','','0.1')}${numIn('tbsa','Burn % TBSA','2nd + 3rd °','1')}</div>`+chipsOnly('tr_e'))}
  <div class="gl">Secondary survey (head-to-toe)</div>
  ${['tr_head','tr_neck','tr_chest','tr_abd','tr_spine','tr_ext','tr_preg'].map(g=>`<details class="sub" id="trs-${g}"${g==='tr_preg'?' hidden':''}><summary>${esc(FGROUPS[g].t)}<span class="cnt" id="cnt-${g}" hidden></span></summary>${chipsOnly(g, {tr_chest:['cxr_ptx','cxr_mediast'], tr_abd:['rebound','rigid','distended','hematuria'], tr_preg:['vag_bleed']}[g])}</details>`).join('')}`;
}
function sec(id, title, body, open){ return `<details class="card" id="sec-${id}" ${open?'open':''}><summary><span>${title}</span><span class="cnt" id="cnt-${id}" hidden></span></summary>${body}</details>`; }
function buildForm(){
  const ccOpts = ['', ...Object.keys(CC_MAP), 'Other'].map(c=>`<option value="${esc(c)}">${c?esc(c):'— select —'}</option>`).join('');
  const legend = `<div class="legend">Tap a chip once = present (+), twice = absent (−), three times = clear. Unmarked = not assessed.</div>`;
  $('form').innerHTML =
  sec('pt','👤 Patient', `<div class="grid2">${numIn('age','Age (years)','e.g. 45')}<div><label>Sex</label><div class="seg" id="sexseg"><button type="button" data-sex="M">Male</button><button type="button" data-sex="F">Female</button></div></div></div>
    <div class="grid2" id="pregrow" hidden><div><label for="preg">Pregnancy</label><select id="preg"><option value="unk">Unknown / not asked</option><option value="yes">Pregnant (confirmed)</option><option value="possible">Possible (late period)</option><option value="no">Not pregnant (test negative)</option></select></div>${numIn('ga','Gestation (weeks)','if pregnant')}</div>`, true) +
  sec('tr','🩻 Trauma – primary & secondary survey', traumaForm(), true) +
  sec('hpi','🗣 Chief complaint & HPI', `<label for="cc">Chief complaint</label><select id="cc">${ccOpts}</select>
    <div class="grid3 durrow"><div><label for="onset">Onset</label><select id="onset"><option value="">—</option><option value="sudden">Sudden (sec–min)</option><option value="acute">Acute (hours)</option><option value="subacute">Subacute (days)</option><option value="gradual">Gradual / chronic</option></select></div>
    <div><label for="dur">Duration</label><div style="display:flex;gap:.3rem"><input id="dur" type="number" inputmode="decimal" placeholder="#" style="min-width:0"><select id="durU" style="width:3.7rem;flex:0 0 auto;padding-left:.3rem;padding-right:.1rem"><option value="h">h</option><option value="d" selected>d</option><option value="wk">wk</option></select></div></div>
    ${numIn('feverDay','Fever day #','day of illness')}</div>${legend}
    ${['hx_gen','hx_cr','hx_gi','hx_gu','hx_neuro','hx_exp'].map(chipHTML).join('')}`, true) +
  sec('txt','📝 Free-text HPI (English / Tagalog / Taglish)', `<textarea id="text" placeholder="e.g. 3 araw nang nilalagnat, may ubo at hirap huminga, walang pagtatae…"></textarea>
    <div class="note">Keywords are extracted on-device and merged with the form (form chips win). Negations such as “walang”, “hindi”, “no”, “denies” are recognised.</div>
    <div class="xchips" id="xout"></div><div class="btnrow"><button type="button" id="apply">⬇ Apply extracted findings to form</button></div>`, true) +
  sec('pmh','🩹 PMH / risk factors & meds', chipHTML('pmh') + chipHTML('meds') + `<label for="meds">Other medications (free text)</label><input id="meds" type="text" placeholder="e.g. metformin 500 BID, amlodipine 5 OD">`, false) +
  sec('vs','📈 Vital signs', `<div class="grid3">${numIn('hr','HR','/min')}${numIn('sbp','SBP','mmHg')}${numIn('dbp','DBP','mmHg')}${numIn('rr','RR','/min')}${numIn('t','Temp °C','37.0','0.1')}${numIn('spo2','SpO₂ %','98')}${numIn('gcs','GCS','3–15')}
    <div><label for="glu">Glucose</label><input id="glu" type="number" inputmode="decimal" step="0.1" placeholder="CBG"></div><div><label for="gluU">Unit</label><select id="gluU"><option value="mg">mg/dL</option><option value="mmol">mmol/L</option></select></div></div>
    <label class="chk"><input type="checkbox" id="o2"> On supplemental O₂ (for NEWS2)</label>`, true) +
  sec('pe','🩺 Physical exam', ['pe_gen','pe_heent','pe_resp','pe_cvs','pe_abd','pe_neuro','pe_skin'].map(chipHTML).join(''), true) +
  sec('bed','🧪 Bedside results (optional)', `<div class="grid3">${numIn('wbc','WBC ×10⁹/L','','0.1')}${numIn('neut','Neutrophils %','')}${numIn('plt','Platelets ×10⁹/L','')}${numIn('hct','Hct %','')}
    <div><label for="urea">Urea / BUN</label><input id="urea" type="number" inputmode="decimal" step="0.1"></div><div><label for="ureaU">Unit</label><select id="ureaU"><option value="mmol">urea mmol/L</option><option value="bun">BUN mg/dL</option></select></div>${numIn('lactate','Lactate mmol/L','','0.1')}</div>
    ${chipHTML('bed')}<label class="chk"><input type="checkbox" id="peLikely"> Clinician judgment: PE is the most likely diagnosis (Wells +3)</label>`, false);
}
function paintChips(){ document.querySelectorAll('.chip[data-f]').forEach(b=>{ const v=CH[b.dataset.f]; b.classList.toggle('p',v===1); b.classList.toggle('n',v===-1); b.setAttribute('aria-pressed', v===1?'true':v===-1?'mixed':'false'); });
  const secs={hpi:['hx_gen','hx_cr','hx_gi','hx_gu','hx_neuro','hx_exp'],pmh:['pmh','meds'],pe:['pe_gen','pe_heent','pe_resp','pe_cvs','pe_abd','pe_neuro','pe_skin'],bed:['bed'],tr:TR_GROUPS};
  ['tr_head','tr_neck','tr_chest','tr_abd','tr_spine','tr_ext','tr_preg'].forEach(g=>secs[g]=[g]);
  Object.entries(secs).forEach(([s,gs])=>{ const n=gs.reduce((a,g)=>a+FGROUPS[g].f.filter(([id])=>CH[id]).length,0); const e=$('cnt-'+s); if(!e) return; e.hidden=!n; e.textContent=n; }); }
function paintTrauma(){
  $('sec-tr').hidden = !TR; const b=$('trMode'); b.classList.toggle('on',TR); b.setAttribute('aria-pressed',TR?'true':'false');
  $('trs-tr_preg').hidden = SEX!=='F';
  const pr=$('trPreg'), pg = SEX==='F' && $('preg').value==='yes'; pr.classList.toggle('p',pg); pr.setAttribute('aria-pressed',pg?'true':'false');
  const a=num($('age').value); $('trCtx').textContent = [a!=null?(a>=65?'Age ≥ 65 – geriatric trauma thresholds apply':a<16?'Child – weight-based doses, PECARN':'Age '+a):'Age not entered (👤 Patient)', SEX==='F'?(pg?'pregnant'+($('ga').value?' '+$('ga').value+' wk':''):'pregnancy: '+$('preg').selectedOptions[0].text):''].filter(Boolean).join(' · ');
  const E=$('gcsE').value, V=$('gcsV').value, M=$('gcsM').value; $('gcsTot').textContent = (E&&V&&M) ? `E${E} V${V} M${M} = ${+E + +V + +M}` : ($('gcs').value ? $('gcs').value+' (from Vital signs)' : '—'); }
function syncMirror(fromVitals){ MIRROR.forEach(([a,b])=>{ if(fromVitals) $(a).value=$(b).value; else $(b).value=$(a).value; }); }
const num = v => (v===''||v==null||isNaN(+v)) ? null : +v;
function paintSex(){ document.querySelectorAll('#sexseg button').forEach(b=>b.classList.toggle('on', b.dataset.sex===SEX)); $('pregrow').hidden = SEX!=='F'; paintTrauma(); }
const val = id => $(id).value;
function readInput(){
  return { age:val('age'), sex:SEX, preg:SEX==='F'?val('preg'):'', ga:val('ga'), cc:val('cc')==='Other'?'':val('cc'), onset:val('onset'), dur:val('dur'), durU:val('durU'), feverDay:val('feverDay'),
    chips:Object.assign({},CH), text:val('text'), meds:val('meds'), peLikely:$('peLikely').checked,
    v:{hr:val('hr'),sbp:val('sbp'),dbp:val('dbp'),rr:val('rr'),t:val('t'),spo2:val('spo2'),gcs:val('gcs'),glu:val('glu'),gluU:val('gluU'),o2:$('o2').checked},
    lab:{wbc:val('wbc'),neut:val('neut'),plt:val('plt'),hct:val('hct'),urea:val('urea'),ureaU:val('ureaU'),lactate:val('lactate')},
    tr:{on:TR, injT:val('injT'), injU:val('injU'), fallM:val('fallM'), wt:val('wt'), bd:val('bd'), tbsa:val('tbsa'), air:val('air'), bs:val('bs'), pup:val('pup'), gcsE:val('gcsE'), gcsV:val('gcsV'), gcsM:val('gcsM')} };
}
function clearForm(){
  document.querySelectorAll('#form input, #form textarea').forEach(e=>{ if(e.type==='checkbox') e.checked=false; else e.value=''; });
  $('preg').value='unk'; $('cc').value=''; $('onset').value=''; $('durU').value='d'; $('gluU').value='mg'; $('ureaU').value='mmol';
  ['air','bs','pup','gcsE','gcsV','gcsM'].forEach(k=>$(k).value=''); $('injU').value='h';
  CH={}; SEX=''; PLAN=null; planTouched=false; TR=false; trManualOff=false; paintChips(); paintSex();
}
function loadCase(id){
  const c = CASES.find(x=>x.id===id); if(!c) return; clearForm(); const I=c.I;
  const setv=(k,v)=>{ if(v!=null && $(k)) $(k).value=v; };
  ['age','ga','cc','onset','dur','durU','feverDay','text','meds'].forEach(k=>setv(k,I[k])); SEX=I.sex||''; if(I.preg) $('preg').value=I.preg;
  Object.entries(I.v||{}).forEach(([k,v])=>{ if(k==='o2') $('o2').checked=!!v; else setv(k,v); });
  Object.entries(I.lab||{}).forEach(([k,v])=>setv(k,v)); $('peLikely').checked=!!I.peLikely;
  const T=I.tr||{}; ['injT','injU','fallM','wt','bd','tbsa','air','bs','pup','gcsE','gcsV','gcsM'].forEach(k=>setv(k,T[k]));
  if(T.gcsE&&T.gcsV&&T.gcsM&&!(I.v||{}).gcs) $('gcs').value = +T.gcsE + +T.gcsV + +T.gcsM;
  TR=!!T.on; syncMirror(true);
  CH=Object.assign({},I.chips); paintChips(); paintSex(); render();
}

// ---------- results ----------
function srcHTML(s){ const ph=/PH CPG|\(PH\)|PH program|PH\)/.test(s); return `<div class="src">Source: ${ph?'<b>🇵🇭 PH</b> · ':''}${esc(s)}</div>`; }
function tkHTML(c){ const [id,q,title,ts]=c.tk; const sn=ts||c.sec; const where=`${TK_SEC[sn]||'S'+sn} › ${title}`;
  const also = (c.tkx||[]).map(([xid,xt,xs])=>`<a href="${TK_BASE}#o-${esc(xid)}" data-tk="${esc(xid)}" target="_blank" rel="noopener noreferrer" title="${esc(TK_SEC[xs]||'')}">${esc(xt)}</a>`).join(' · ');
  return (id ? `<div class="tk">📘 EM Toolkit: <a href="${TK_BASE}#o-${esc(id)}" data-tk="${esc(id)}" target="_blank" rel="noopener noreferrer">${esc(where)}</a> · search “${esc(q)}”</div>` : `<div class="tk">📘 EM Toolkit: ${esc(where)} · search “${esc(q)}”</div>`)
    + (also ? `<div class="tk">🔗 Related toolkit cards: ${also}</div>` : ''); }
function cardCompact(r, top, rank){
  const c=r.c, pct=Math.max(4,Math.min(100, r.s/top*100)), t=tier(r.s);
  return `<div class="dx mnm cmp" data-id="${c.id}" id="m-${c.id}">
   <div class="hd"><span class="rk">🚩</span><span class="nm">${esc(c.n)}</span><span class="sc ${t}">${r.s} · ${t}</span></div>
   <div class="bar"><i style="width:${pct}%"></i></div>
   ${r.red.length?`<div class="rfl">🚩 Red flags present: ${r.red.map(esc).join(', ')}</div>`:''}
   <div class="ask">To exclude: ${c.dx.slice(0,2).map(esc).join(' · ')}</div>
   <button type="button" class="goto" data-goto="d-${c.id}">Ranked #${rank} in the differential – full reasoning & plan ↓</button>
  </div>`;
}
function card(r, top, opts){
  const c=r.c, pct=Math.max(4,Math.min(100, r.s/top*100)), t=tier(r.s);
  const pro=r.pro.slice(0,6).map(p=>`${esc(p.l)} <span class="w">+${p.w}</span>`).join(', ');
  const con=r.con.slice(0,4).map(p=>`${esc(p.l)} <span class="w">${p.w}</span>`).join(', ');
  const inPlan = PLAN && PLAN.has(c.id);
  return `<div class="dx${c.mnm?' mnm':''}" data-id="${c.id}" id="${opts.pref}-${c.id}">
   <div class="hd"><span class="rk">${opts.rank?'#'+opts.rank:'🚩'}</span><span class="nm">${esc(c.n)}</span><span class="sc ${t}" title="Rule-based score (sum of log2-LR-style weights) – not a probability">${r.s} · ${t}</span></div>
   <div class="bar"><i style="width:${pct}%"></i></div>
   <div><span class="tag">Tintinalli 9e S${c.sec} · ${esc(c.topic)}</span>${c.mnm?'<span class="tag mn">MUST NOT MISS</span>':''}${opts.also?`<span class="tag">ranked #${opts.also} below</span>`:''}</div>
   ${r.red.length?`<div class="rfl">🚩 Red flags present: ${r.red.map(esc).join(', ')}</div>`:''}
   <div class="why"><span class="pro">✔ For:</span> ${pro||'—'}${con?`<br><span class="con">✖ Against:</span> ${con}`:''}</div>
   ${r.ask.length?`<div class="ask">❓ Ask / examine / test next: ${r.ask.map(esc).join(', ')}</div>`:''}
   ${r.notes.map(n=>`<div class="ask">⚡ ${esc(n)}</div>`).join('')}
   <details ${opts.open?'open':''}><summary>Diagnostics · ED treatment · disposition</summary>
     <div class="blk"><h4>🔬 Recommended diagnostics (prioritised)</h4><ol style="margin:.15rem 0 0;padding-left:1.2rem;font-size:.86rem">${c.dx.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${srcHTML(c.dxs)}</div>
     <div class="blk"><h4>💊 Initial ED treatment</h4><ul>${c.tx.map(x=>`<li>${vt(x)}</li>`).join('')}</ul>${srcHTML(c.txs)}</div>
     <div class="blk"><h4>🏥 Disposition</h4><div style="font-size:.86rem">${esc(c.dispo)}</div>${c.dps?srcHTML(c.dps):''}</div>
     ${tkHTML(c)}
   </details>
   <label class="inc"><input type="checkbox" data-plan="${c.id}" ${inPlan?'checked':''}> Include this plan in the chart note</label>
  </div>`;
}
function hasInput(I){ return I.tr.on || Object.keys(I.chips).length || I.text.trim() || I.cc || I.age || Object.values(I.v).some(x=>x&&x!=='mg') || Object.entries(I.lab).some(([k,x])=>x&&k!=='ureaU'); }
function render(){
  let I=readInput(); let D=derive(I);
  if(!TR && !trManualOff && D.F.trauma===1){ TR=true; paintTrauma(); toast('🩻 Trauma mode on – injury recorded'); I=readInput(); D=derive(I); }
  D.peLikely=I.peLikely; const R=scoreAll(D); const S=computeScores(D,R); const A=alerts(D); paintTrauma();
  if(!planTouched) PLAN = new Set(R.ddx.slice(0,2).map(r=>r.id));
  last={I,D,R,S};
  // extracted chips
  $('xout').innerHTML = D.ex.hits.length ? D.ex.hits.map(h=>`<span class="xc${h.neg?' neg':''}" data-f="${h.ids.join(' ')}">${h.neg?'− ':'+ '}${esc(h.term)} <i>→ ${h.ids.map(id=>esc(FLABEL[id])).join(', ')}</i></span>`).join('') + (D.ex.duration?`<span class="xc" data-f="duration">⏱ ${esc(D.ex.duration.term)} <i>→ duration</i></span>`:'') : '<span class="note">No keywords recognised yet.</span>';
  const res=$('results');
  if(!hasInput(I)){ res.innerHTML = `<h2>Results</h2><div class="empty">Enter the history and exam (or load an example case). The differential, must-not-miss list, scores and plan update live.</div>`; return; }
  const top = Math.max(1, ...R.ddx.map(r=>r.s));
  const ddxIds = R.ddx.map(r=>r.id);
  let h = '';
  if(TR) h += psfHTML(D);
  if(A.length) h += `<h2>⛑ Critical</h2>` + A.map(a=>`<div class="alert">${esc(a)}</div>`).join('');
  h += `<div class="disc" style="margin-top:.6rem"><b>Decision support, not a diagnosis.</b> Scores are rule-based weights, not probabilities. Clinical judgment overrides.</div>`;
  h += `<h2>🚩 Must not miss <span class="note">(dangerous, not excluded by the data)</span></h2><div id="mnm">` + (R.mnm.length ? R.mnm.map(r=>{ const k=ddxIds.indexOf(r.id)+1; return k ? cardCompact(r, top, k) : card(r, top, {pref:'m', open:false}); }).join('') : '<div class="empty">No must-not-miss condition reaches threshold with the current data.</div>') + `</div>`;
  h += `<h2>📊 Differential (ranked)</h2><div id="ddx">` + (R.ddx.length ? R.ddx.map(r=>card(r, top, {pref:'d', rank:r.rank, open:r.rank===1})).join('') : '<div class="empty">Not enough findings for a ranked differential – add HPI / exam findings.</div>') + `</div>`;
  if(S.length) h += `<h2>🧮 Scores (auto-calculated)</h2><div class="scg" id="scores">` + S.map(s=>`<div class="scb l${s.lvl||0}" data-score="${s.id}"><div class="t"><span>${esc(s.name)}</span><span class="v">${esc(s.v)}${s.max?' / '+s.max:''}</span></div><div style="font-size:.84rem">${esc(s.interp)}</div>${s.details?`<div class="note">${esc(s.details)}</div>`:''}${s.miss&&s.miss.length?`<div class="note">Missing / assumed: ${s.miss.map(esc).join(', ')}</div>`:''}<div class="src">Source: ${esc(s.src)}</div></div>`).join('') + `</div>`;
  if(R.excluded.length) h += `<details class="card" style="margin-top:.8rem"><summary><span>Excluded by hard rules (${R.excluded.length})</span></summary><ul style="font-size:.85rem;margin:.3rem 0 0;padding-left:1.1rem">${R.excluded.map(e=>`<li>${esc(e.n)} – ${esc(e.why)}</li>`).join('')}</ul></details>`;
  h += `<div class="btnrow"><button type="button" class="primary" id="copy">📋 Copy as chart note</button><button type="button" id="print">🖨 Print</button><button type="button" id="shownote">👁 Show note</button></div><textarea id="notebox" hidden readonly aria-label="Chart note preview"></textarea>`;
  const keepNote = $('notebox') && !$('notebox').hidden;
  res.innerHTML = h;
  if(keepNote){ $('notebox').hidden=false; $('notebox').value=note(); }
}
// "Primary survey first" banner – life threats before any ranked list
function psfHTML(D){
  const rows=primarySurvey(D), nT=rows.filter(r=>r.st==='threat').length, tc=traumaCentre(D);
  const ic={threat:'⚠',ok:'✓',unk:'?'};
  return `<section class="psf" id="psf" aria-label="Primary survey first"><h2>⛑ Primary survey first – xABCDE${nT?` <span class="pn">${nT} life threat${nT>1?'s':''}</span>`:''}</h2>
   <div class="note">Find and treat life threats in order before reading the differential. Re-assess after every intervention.</div>
   ${rows.map(r=>`<div class="psr ${r.st}" data-ps="${r.k}"><span class="pk">${r.k}</span><div><b>${ic[r.st]} ${esc(r.t)}</b> – ${esc(r.msg)} <a class="psl" href="${TK_BASE}#o-${esc(r.tk)}" data-tk="${esc(r.tk)}" target="_blank" rel="noopener noreferrer">card ↗</a></div></div>`).join('')}
   <div class="note"><b>Adjuncts:</b> monitor, eFAST, CXR + pelvic X-ray, VBG/ABG with lactate & base deficit, ECG, glucose, pregnancy test, type & crossmatch; urinary catheter only if no meatal blood; no nasal tube if basal skull / midface fracture. Tetanus status; analgesia.</div>
   ${tc.length?`<div class="psr threat tc"><span class="pk">→</span><div><b>Trauma-centre criteria met:</b> ${esc(tc.join(' · '))}. Stabilise, call ahead, transfer (no deposit may be required – RA 10932).</div></div>`:''}
   <div class="src">Source: ATLS 10th ed (2018) / 11th ed (2025, xABCDE) · ACS COT 2021 field triage (intl) · <b>🇵🇭 PH</b> · PCS BEST/BETTER trauma courses · DOH AO 2014-0002 / AO 2014-0007 · DO 2021-0001 · RA 10932 (PH)</div></section>`;
}
function note(){ const {I,D,R,S}=last; return chartNote(I,D,R,S,[...(PLAN||[])]); }
function toast(m){ const t=$('toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toast.h); toast.h=setTimeout(()=>t.classList.remove('on'),1800); }
async function copyNote(){
  const txt=note(); let ok=false;
  try{ if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(txt); ok=true; } }catch(e){}
  if(!ok){ const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ ok=document.execCommand('copy'); }catch(e){} ta.remove(); }
  const nb=$('notebox'); nb.hidden=false; nb.value=txt;
  toast(ok?'Chart note copied':'Copy blocked – select the text below');
}
let tmr=null; const schedule=()=>{ clearTimeout(tmr); tmr=setTimeout(render,150); };

// ---------- init ----------
function init(){
  buildForm(); setDark(getDark());
  $('kbcount').textContent = KB.length;
  $('example').innerHTML += CASES.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('theme').addEventListener('click',()=>setDark(!document.body.classList.contains('dark')));
  $('example').addEventListener('change',e=>{ if(e.target.value){ loadCase(e.target.value); toast('Example loaded – fictional patient'); } });
  $('clear').addEventListener('click',()=>{ clearForm(); $('example').value=''; render(); toast('Cleared'); });
  $('jump').addEventListener('click',()=>$('results').scrollIntoView({behavior:'smooth'}));
  $('trMode').addEventListener('click',()=>{ TR=!TR; trManualOff=!TR; paintTrauma(); if(TR){ syncMirror(true); $('sec-tr').open=true; } render(); toast(TR?'🩻 Trauma mode on – primary survey first':'Trauma mode off'); });
  $('form').addEventListener('input',e=>{ const id=e.target.id; const m=MIRROR.find(x=>x[0]===id||x[1]===id); if(m){ if(id===m[0]) $(m[1]).value=$(m[0]).value; else $(m[0]).value=$(m[1]).value; }
    if(id==='gcs' && $('gcsE').value && $('gcsV').value && $('gcsM').value && +$('gcs').value !== +$('gcsE').value + +$('gcsV').value + +$('gcsM').value){ ['gcsE','gcsV','gcsM'].forEach(k=>$(k).value=''); } });
  $('form').addEventListener('change',e=>{ if(['gcsE','gcsV','gcsM'].includes(e.target.id)){ const E=$('gcsE').value,V=$('gcsV').value,M=$('gcsM').value; if(E&&V&&M) $('gcs').value= +E + +V + +M; } if(['preg','ga','age','gcsE','gcsV','gcsM'].includes(e.target.id)) paintTrauma(); });
  $('form').addEventListener('click',e=>{
    const b=e.target.closest('.chip[data-f]'); if(b){ const id=b.dataset.f; const v=CH[id]; if(v===1) CH[id]=-1; else if(v===-1) delete CH[id]; else CH[id]=1; paintChips(); render(); return; }
    const s=e.target.closest('[data-sex]'); if(s){ SEX = SEX===s.dataset.sex ? '' : s.dataset.sex; paintSex(); render(); return; }
    if(e.target.id==='trPreg'){ const on = SEX==='F' && $('preg').value==='yes'; if(on){ $('preg').value='unk'; } else { SEX='F'; $('preg').value='yes'; } paintSex(); render(); if(!on) $('ga').focus(); return; }
    if(e.target.id==='apply' && last){ let n=0; Object.entries(last.D.ex.f).forEach(([id,v])=>{ if(CH[id]==null && FGROUP_OF[id]){ CH[id]=v; n++; } });
      if(last.D.ex.duration && !$('dur').value){ $('dur').value=last.D.ex.duration.n; $('durU').value=last.D.ex.duration.u; n++; }
      paintChips(); render(); toast(n?`Applied ${n} finding(s)`:'Nothing new to apply'); }
  });
  $('form').addEventListener('input',schedule); $('form').addEventListener('change',schedule);
  $('results').addEventListener('click',e=>{
    const g=e.target.dataset&&e.target.dataset.goto; if(g){ const el=$(g); if(el){ el.scrollIntoView({behavior:'smooth',block:'start'}); const d=el.querySelector('details'); if(d) d.open=true; } return; }
    if(e.target.id==='copy') copyNote();
    else if(e.target.id==='print'){ $('printnote').textContent=note(); window.print(); }
    else if(e.target.id==='shownote'){ const nb=$('notebox'); nb.hidden=!nb.hidden; if(!nb.hidden) nb.value=note(); }
  });
  $('results').addEventListener('change',e=>{ const p=e.target.dataset&&e.target.dataset.plan; if(p){ planTouched=true; if(e.target.checked) PLAN.add(p); else PLAN.delete(p);
    document.querySelectorAll(`[data-plan="${p}"]`).forEach(x=>x.checked=e.target.checked); if(!$('notebox').hidden) $('notebox').value=note(); } });
  window.addEventListener('beforeprint',()=>{ if(last) $('printnote').textContent=note(); });
  // Embedded in the EM Toolkit (ddx/ iframe): open toolkit cards in the parent page instead of a new tab.
  // Full screen, or if the parent is not the toolkit / not reachable: the link's normal new-tab behaviour.
  document.addEventListener('click',e=>{
    const a=e.target.closest&&e.target.closest('a[data-tk]'); if(!a || window.self===window.top || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    try{ const P=window.parent, T=P.EMTK; if(T && typeof T.openCard==='function' && T.openCard(a.dataset.tk, 'ddx')) e.preventDefault(); }catch(err){ /* cross-origin parent: default behaviour */ }
  });
  render();
  window.DDX = {loadCase, render, clearForm, last:()=>last, note, cases:CASES, kb:KB, extract, trauma:()=>TR};
}
document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',init) : init();
})();
