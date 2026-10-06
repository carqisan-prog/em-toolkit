// ======================================================================
// EM Toolkit – Tintinalli-9e-mapped navigation, search, safety checks, print.
// Section map = topic names only (26 major sections of Tintinalli 9e). All clinical
// text in this app is original summary citing public guidelines, not the book.
// ======================================================================
const SECTIONS = /*@@OUTLINE_JSON@@*/[];
const PANEL_SEC = {}; SECTIONS.forEach(s=>s.panels.forEach(([p])=>PANEL_SEC[p]=s.id));
const SEC = id => SECTIONS.find(s=>s.id===id);
// Embedded tools that are not tied to one Tintinalli section (shown at the top of the drawer/sidebar).
// The ECG reader also belongs to S7 (panel 'ecg'); DDx Assist is cross-sectional, so it gets a pseudo-section.
const TOOL_PANELS = {ddx:{id:'tools', n:'', title:'Tools · DDx Assist', icon:'🩺', status:'built', panels:[['ddx','DDx Assist']], topics:[], tool:true}};
const PSEC = t => TOOL_PANELS[t] || SEC(PANEL_SEC[t]);
const PANEL_RE = {anaph:/Anaph/, resus:/Resus|Crash/, airway:/Airway/, cardio:/Cardio/, pulm:/Pulm/, renal:/Renal/, ob:/Obstet/, peds:/Pediatr/,
  sepsis:/Sepsis/, neuro:/Neuro/, tox:/Tox/, env:/Environ/, endo:/Endocr/, trauma:/Trauma/};
const SAMPLE_PANELS = ['cardio','ob','tox','env','endo'];
let stubSec = store.get(K('stubSec'), 'prehosp');
let secPanel = store.get(K('secPanel'), {});
let NCHK = store.get(K('nchk'), {});
const nc = id => !!NCHK[id];
let PRINTMODE = false, AUTOPRINT = false, TMPPRINT = false;
const BADGE = {built:['built','Built'], merged:['merged','Merged'], v1:['v1','v1 cards'], soon:['soon','Soon']};
const badge = st => `<span class="sbadge ${BADGE[st][0]}">${BADGE[st][1]}</span>`;
const COVL = {v1:'v1', merged:'merged', new:'new', 'v1+new':'v1 + new', 'v1+merged':'v1 + merged'};
const covTag = c => c ? `<span class="cov ${c.includes('new')?'new':c.includes('merged')?'merged':'v1'}">${COVL[c]||c}</span>` : '';
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// ---- review-list relabelling (cards moved out of the old "More" / "Tox" tabs) ----
const RELABEL = {'dka-k':'Endocrine','dka-peds':'Endocrine','apls-ph':'Pediatrics','hyperk-ins':'Renal','hyperk-bicarb':'Renal','hyperk-peds':'Renal',
  'salb-cutoff':'Anaphylaxis / Renal / Pulm','epi-im-peds':'Anaphylaxis / Crash','epi-inf-anaph':'Anaphylaxis','glucagon':'Anaphylaxis / Tox',
  'salb-peds':'Anaphylaxis','mgso4-ecl':'Neuro / Obstetrics','antivenom':'Tox / Environmental','cv-adult':'Resus / Crash / Cardiovascular',
  'procain':'Resus / Cardiovascular','atr-conc':'Resus / Crash / Cardiovascular','atr-min':'Resus / Airway / Crash / Cardiovascular',
  'mag-peds':'Resus / Crash / Cardiovascular','lido-peds-max':'Resus / Crash / Cardiovascular','peds-pressor':'Resus / Sepsis / Cardiovascular',
  'sep-pressor':'Sepsis / Cardiovascular','cn-peds':'Tox / Environmental','octreotide':'Tox / Endocrine','rn-ufh':'Renal / Pulm / Cardiovascular',
  'parkland':'Trauma / Environmental','ca-peds':'Resus / Crash / Tox','hiet':'Tox','digifab':'Tox'};

// ---- pediatric cap at the adult dose: absolute adult caps for peds bolus doses without a max ----
// [drug key, list, index, adult cap in the dose's base unit]
const AMAX = [['proc','p',0,1000],['bicarb','p',0,50],['dex','p',1,25],['nlx','p',1,100],['etom','b',0,30],['ket','p',0,200],['prop','p',0,200],
  ['roc','b',0,120],['sux','p',0,150],['fent','p',0,100],['pheno','b',0,1500],['refr','b',0,20],['refr','b',2,200],['tcaA','b',0,100],
  ['metA','b',0,200],['alcA','b',0,1500],['opA','p',0,2],['icp','p',1,100],['hk','p',3,50]];
Object.assign(REVIEW, {
  'peds-amax': {t:'Pediatric doses are capped at an adult dose (engine-wide). Caps added where v1 had none: procainamide 1 g, bicarbonate 50 mEq, ketamine/propofol 200 mg, etomidate 30 mg, rocuronium 120 mg, succinylcholine 150 mg, fentanyl 100 mcg, phenobarbital 1.5 g, mannitol 100 g, fomepizole 1.5 g, methylene blue 200 mg, atropine (OP) 2 mg', r:'For drugs dosed per kg in adults too, the cap is the adult dose at a ~100 kg reference weight – a policy choice for owner sign-off, not a guideline value.', tab:'Resus / Airway / Neuro / Tox / Renal / Crash'},
  'tx-flags': {t:'Antidote doses carried over from v1 that had no review flag (bicarbonate for Na-channel blockade, flumazenil, methylene blue, adult hydroxocobalamin, protamine, lipid emulsion, charcoal, naloxone adult)', r:'Flagged for completeness in the Toxicology sample section; values unchanged from v1.', tab:'Tox'},
  'cv-acls-drugs': {t:'ACLS arrhythmia drug doses reused from v1 in the Cardiovascular section (adenosine, amiodarone, lidocaine, magnesium, bradycardia infusions)', r:'AHA 2020/2025 values; unchanged from v1 but now flagged wherever shown.', tab:'Resus / Cardiovascular'}
});
['tcaA','bzdA','metA','cnA','hepA','lastA','charA','nlx'].forEach(k=>{ if(D[k] && !D[k].flag) D[k].flag='tx-flags'; });
['adeno','amio','lido','mag','bradyInf'].forEach(k=>{ if(D[k] && !D[k].flag) D[k].flag='cv-acls-drugs'; });

// ======================= NAVIGATION =======================
function curSecId(){ return tab==='stub' ? stubSec : TOOL_PANELS[tab] ? null : PANEL_SEC[tab]; }
function navList(filter){
  const f=(filter||'').trim().toLowerCase(), cs=curSecId();
  const h = SECTIONS.filter(s=>!f || (s.title+' '+s.topics.map(t=>t[0]).join(' ')).toLowerCase().includes(f)).map(s=>{
    const on = s.id===cs;
    let x=`<button class="sitem${on?' on':''}" data-nsec="${s.id}"${on?' aria-current="page"':''}><span class="snum">S${s.n}</span><span class="sname">${s.icon} ${esc(s.title)}</span>${badge(s.status)}</button>`;
    if(s.panels.length>1 && on) x+=`<div class="ppanel">${s.panels.map(([p,l])=>`<button data-npanel="${p}" class="${tab===p?'on':''}">${esc(l)}</button>`).join('')}</div>`;
    return x; }).join('');
  const TOOLS = [['ecg','📈 ECG reader','ecg reader ekg electrocardiogram rhythm strip tracing tools'],
                 ['ddx','🩺 DDx Assist','ddx assist differential diagnosis undifferentiated must not miss tools']];
  const tm = kw => !f || kw.includes(f) || f.split(/\s+/).every(w=>kw.includes(w));
  const tb = TOOLS.filter(([,,kw])=>tm(kw)).map(([p,l])=>`<button class="sitem${tab===p?' on':''}" data-npanel="${p}"${tab===p?' aria-current="page"':''}><span class="snum">🛠</span><span class="sname">${l}</span><span class="sbadge built">Tool</span></button>`).join('');
  const tl = tb ? `<div class="stools">${tb}</div>` : '';
  return (tl + h) || '<div class="note" style="padding:.4rem">No section matches.</div>';
}
const LEGEND = () => `<div class="legend">${badge('built')} built in this slice<br>${badge('merged')} merged from the Renal/Pulmonary build<br>${badge('v1')} cards from the original site<br>${badge('soon')} coming soon (planned topic list)<br>Map: 26 major sections of Tintinalli 9e – topic names only.</div>`;
function refreshNav(){
  $('slist').innerHTML = navList($('sfilter').value);
  $('dlist').innerHTML = navList($('dfilter').value);
  const tp=TOOL_PANELS[tab];
  if(tp){ $('curSec').textContent = `${tp.icon} ${tp.panels[0][1]}`; $('subnav').innerHTML=''; if(!PRINTMODE) document.title = `${tp.panels[0][1]} – EM Toolkit (Tintinalli-mapped)`; return; }
  const s=SEC(curSecId());
  if(s){ $('curSec').textContent = `S${s.n} · ${s.title}`;
    $('subnav').innerHTML = s.panels.length>1 ? s.panels.map(([p,l])=>`<button data-npanel="${p}" class="${tab===p?'on':''}" aria-pressed="${tab===p}">${esc(l)}</button>`).join('') : '';
    if(!PRINTMODE) document.title = `${s.title} – EM Toolkit (Tintinalli-mapped)`; }
}
function navSetTab(t, sid){
  if(t==='stub'){ stubSec = sid || stubSec || 'prehosp'; store.set(K('stubSec'), stubSec); }
  if(!TABS.includes(t)) t='resus';
  tab=t; store.set(K('tab'),t);
  if(t!=='stub' && PANEL_SEC[t]){ secPanel[PANEL_SEC[t]]=t; store.set(K('secPanel'),secPanel); }
  TABS.forEach(x=>{ const el=$('tab-'+x); if(el) el.hidden = x!==t; });
  if(t==='stub') renderStub();
  ecgShow(t==='ecg' && !PRINTMODE);
  ddxShow(t==='ddx' && !PRINTMODE);
  refreshNav();
}
function navSec(id){
  const s=SEC(id); if(!s) return;
  if(s.panels.length){ const p = secPanel[id] && s.panels.some(([q])=>q===secPanel[id]) ? secPanel[id] : s.panels[0][0]; setTab(p); }
  else setTab('stub', id);
  closeDrawer(); window.scrollTo({top:0});
}
function openDrawer(){ $('drawer').hidden=false; $('navBtn').setAttribute('aria-expanded','true'); refreshNav(); setTimeout(()=>{ const on=$('dlist').querySelector('.sitem.on'); if(on) on.scrollIntoView({block:'center'}); },0); }
function closeDrawer(){ if($('drawer').hidden) return; $('drawer').hidden=true; $('navBtn').setAttribute('aria-expanded','false'); }
function renderStub(){
  const s=SEC(stubSec)||SECTIONS[0];
  const rel = s.topics.filter(t=>t[1]);
  $('o-stub').innerHTML = `<div class="sechead"><h2>S${s.n} · ${s.icon} ${esc(s.title)} ${badge(s.status)}</h2></div>
   <div class="soonbox"><div class="big">🚧 Coming soon</div>
   <div class="note">This section is planned but not built yet. Planned topics (${s.topics.length}) follow the Tintinalli 9e topic map; content will be original summaries of current public guidelines with ⚠ VERIFY on every dose.</div>
   <ul class="topics">${s.topics.map(([t,c])=>`<li>${esc(t)}${covTag(c)}</li>`).join('')}</ul>
   ${rel.length?`<div class="note" style="margin-top:.5rem">Tagged topics already have related cards elsewhere in the app – use search.</div>`:''}
   ${s.note?`<div class="note">${esc(s.note)}</div>`:''}</div>`;
}
function addSecHeads(){
  TABS.filter(t=>t!=='stub').forEach(t=>{
    const el=$('tab-'+t), s=SEC(PANEL_SEC[t]); if(!el||!s) return;
    const lbl = s.panels.length>1 ? ` – ${s.panels.find(p=>p[0]===t)[1]}` : '';
    const d=document.createElement('div'); d.className='sechead';
    d.innerHTML=`<h2>S${s.n} · ${s.icon} ${esc(s.title)}${esc(lbl)} ${badge(s.status)}</h2><button class="noprint" data-printp="${t}" title="Print this section">🖨 Print</button>`;
    el.prepend(d);
    const r=document.createElement('div'); r.className='printrev'; r.id='prev-'+t; el.append(r);
  });
}
function renderPrintRev(){
  TABS.forEach(t=>{ const el=$('prev-'+t), re=PANEL_RE[t]; if(!el||!re) return;
    const keys=Object.keys(REVIEW).filter(k=>re.test(REVIEW[k].tab));
    el.innerHTML = keys.length ? `<h3>⚠ Items pending owner review in this section (${keys.length})</h3>`+keys.map((k,i)=>`<div class="rev"><b>${i+1}. ${esc(REVIEW[k].t)}</b><div class="note">${esc(REVIEW[k].r)}</div></div>`).join('') : '';
  });
}

// ======================= SEARCH-AS-YOU-TYPE =======================
let SR=[], srAct=-1;
function searchIndex(){
  const items=[];
  Object.entries(CARDS).forEach(([id,c])=>{ const s=PSEC(c.tab); if(!s) return;
    items.push({kind:'card', id, title:c.title.replace(/&amp;/g,'&'), kw:c.el.dataset.kw||'', text:c.el.textContent, sec:s}); });
  SECTIONS.forEach(s=>{ items.push({kind:'sec', id:s.id, title:`S${s.n} ${s.title}`, kw:'section', text:s.topics.map(t=>t[0]).join(' '), sec:s});
    s.topics.forEach(([t,c])=>{ if(!c) items.push({kind:'topic', id:s.id, title:t, kw:'', text:'', sec:s}); }); });
  return items;
}
function doSearch(q){
  const toks=q.toLowerCase().split(/\s+/).filter(Boolean); if(!toks.length) return [];
  const out=[];
  searchIndex().forEach(it=>{
    const T=(it.title+' '+it.kw).toLowerCase(), X=it.text.toLowerCase(); let sc=0, all=true, hitText=null;
    toks.forEach(t=>{ if(T.startsWith(t)) sc+=12; else if(new RegExp('(^|[^a-z0-9])'+escRe(t)).test(T)) sc+=8; else if(T.includes(t)) sc+=5;
      else if(X.includes(t)){ sc+=1; if(hitText==null) hitText=t; } else all=false; });
    if(all && sc>0 && toks.length>1 && T.includes(toks.join(' '))) sc+=6;
    if(all && sc>0 && it.title.toLowerCase().includes(toks.join(' '))) sc+=2;
    if(all && sc>0){ if(it.kind==='topic') sc-=2; if(it.kind==='sec') sc+=1; out.push(Object.assign({sc, hitText}, it)); }
  });
  return out.sort((a,b)=>b.sc-a.sc).slice(0,10);
}
function hl(s,toks){ let h=esc(s); toks.forEach(t=>{ if(t.length>1) h=h.replace(new RegExp('('+escRe(esc(t))+')','ig'),'<mark>$1</mark>'); }); return h; }
function snippet(text,t){ const X=text.replace(/\s+/g,' '), i=X.toLowerCase().indexOf(t); if(i<0) return ''; const a=Math.max(0,i-30); return (a?'…':'')+X.slice(a,i+50)+'…'; }
function renderSR(){
  const q=$('search').value.trim(), box=$('sres');
  if(q.length<2){ box.hidden=true; $('search').setAttribute('aria-expanded','false'); return; }
  SR=doSearch(q); if(srAct>=SR.length) srAct=SR.length?0:-1; const toks=q.toLowerCase().split(/\s+/);
  box.innerHTML = SR.length ? SR.map((r,i)=>{
    const where = r.sec.tool ? 'Tool · opens in the toolkit (or full screen)' : r.kind==='topic' ? `S${r.sec.n} ${r.sec.title} · coming soon` : r.kind==='sec' ? `Section · ${r.sec.status==='soon'?'coming soon':BADGE[r.sec.status][1]}` : `S${r.sec.n} ${r.sec.title}`;
    const sn = r.hitText && r.kind==='card' ? ` · ${hl(snippet(r.text,r.hitText),toks)}` : '';
    return `<button class="sr${i===srAct?' act':''}" role="option" id="sr${i}" aria-selected="${i===srAct}" data-sri="${i}"><div>${r.kind==='topic'?'🚧 ':r.kind==='sec'?'📂 ':''}${hl(r.title,toks)}</div><div class="note">${esc(where)}${sn}</div></button>`; }).join('')
    : `<div class="none">No match for “${esc(q)}”</div>`;
  box.hidden=false; $('search').setAttribute('aria-expanded','true');
}
function pickSR(i){
  const r=SR[i]; if(!r) return;
  $('search').value=''; $('sres').hidden=true; srAct=-1; $('search').blur();
  if(r.kind==='card') goCard(r.id); else if(r.kind==='sec') navSec(r.id); else { setTab('stub', r.id); window.scrollTo({top:0}); }
}
function initSearch(){
  const s=$('search');
  s.addEventListener('input',()=>{ srAct=0; renderSR(); });
  s.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ if(!SR.length) return; e.preventDefault(); srAct=(srAct+(e.key==='ArrowDown'?1:-1)+SR.length)%SR.length; renderSR(); const a=$('sr'+srAct); if(a) a.scrollIntoView({block:'nearest'}); }
    else if(e.key==='Enter'){ e.preventDefault(); if(SR.length) pickSR(srAct>=0?srAct:0); else toast('No match'); }
    else if(e.key==='Escape'){ $('sres').hidden=true; }
  });
  s.addEventListener('focus',()=>{ if(s.value.trim().length>=2) renderSR(); });
  $('sres').addEventListener('mousedown',e=>{ const b=e.target.closest('[data-sri]'); if(b){ e.preventDefault(); pickSR(+b.dataset.sri); } });
  document.addEventListener('click',e=>{ if(!e.target.closest('.sbox')) $('sres').hidden=true; });
}

// ======================= WEIGHT PLAUSIBILITY =======================
function expectedWt(y){            // rough median weight for age (APLS 0–12 y; adolescents approximate)
  if(y==null) return null;
  if(y<1/12) return 3.3;
  if(y<1) return 0.5*Math.round(y*12)+4;
  if(y<=5) return 2*Math.floor(y)+8;
  if(y<=12) return 3*Math.floor(y)+7;
  return [45,50,54,57,60][Math.min(4,Math.floor(y)-13)] || 60;
}
function plausMsgs(){
  const w=W(), y=ageYears(), P=peds(), raw=$('wt').value.trim(), m=[];
  if(raw!=='' && !ok(w)) m.push(['due','Weight outside 0–300 kg – no doses calculated. Re-enter weight.']);
  else if(ok(w)){
    if(!P){ if(w<30) m.push(['due',`${fmt(w)} kg is implausible for an adult (< 30 kg) – check the weight, or switch to Pediatric mode.`, 'peds']);
            else if(w>250) m.push(['soon',`${fmt(w)} kg – confirm; for many drugs use ideal or adjusted body weight.`]); }
    else {
      if(w>120) m.push(['due',`${fmt(w)} kg in Pediatric mode – check the weight, or switch to Adult mode.`, 'adult']);
      else if(w<0.4) m.push(['due',`${fmt(w)} kg is below the viable range – check the weight.`]);
      const e=expectedWt(y);
      if(e && w<=120){ const r=w/e;
        if(r<0.5||r>2) m.push(['due',`${fmt(w)} kg is ${r<1?'under half':'over double'} the expected ≈ ${fmt(e,0)} kg for ${fmt(y,1)} y – re-check weight and age (units: kg, ${$('ageUnit').value==='mo'?'months':'years'}).`]);
        else if(r<0.67||r>1.5) m.push(['soon',`${fmt(w)} kg differs from the expected ≈ ${fmt(e,0)} kg for ${fmt(y,1)} y – confirm (measured or length-based weight preferred).`]); }
      if(w>=40) m.push(['soon','≥ 40 kg: many pediatric doses reach the adult cap – compare with Adult mode.']);
    }
  }
  if(y!=null){ if(!P && y<14) m.push(['soon',`Age ${fmt(y,1)} y in Adult mode – switch to Pediatric?`, 'peds']); if(P && y>=18) m.push(['soon',`Age ${fmt(y,1)} y in Pediatric mode – switch to Adult?`, 'adult']); if(y>120) m.push(['due','Age > 120 – check the age unit.']); }
  return m;
}
const plausHTML = () => plausMsgs().map(([c,t,sw])=>`<div class="${c}">⚠ ${esc(t)}${sw?`<button data-swmode="${sw}">Switch to ${sw==='peds'?'Pediatric':'Adult'}</button>`:''}</div>`).join('');
function renderPlaus(){ $('plaus').innerHTML = plausHTML(); }

// ======================= NEW PATIENT =======================
function newPatient(){
  const running = CT.start && !CT.end;
  if(!confirm(`Start a NEW PATIENT?\n\nClears weight, age, sex, height, every calculator input, checklists, scores${running?', and the RUNNING code timer/log':' and the code log'}.\nTheme, Adult/Pediatric mode and favorites are kept.`)) return;
  FIELDS.forEach(id=>{ const el=$(id); if(!el) return; if(el.tagName==='SELECT') el.selectedIndex=0; else el.value=''; });
  FV={}; store.set(K('f'),FV);
  gcs={}; store.set(K('gcs'),gcs); nih={}; store.set(K('nihss'),nih); bundle={t0:null,done:{}}; store.set(K('bundle'),bundle);
  qs={}; store.set(K('qsofa'),qs); rsiChk={}; store.set(K('rsichk'),rsiChk); PCHK={}; store.set(K('pchk'),PCHK);
  NCHK={}; store.set(K('nchk'),NCHK); WBCT=null; store.set(K('wbct'),null);
  ['preverbal','naRisk'].forEach(id=>{ if($(id)) $(id).checked=false; store.set(K(id),false); });
  document.querySelectorAll('[data-nc]').forEach(c=>c.checked=false);
  resetCode(true);
  renderRsiChk(); buildNIH(); renderBundle(); buildPulm(); renderAll();
  window.scrollTo({top:0}); $('wt').focus({preventScroll:true});
  toast('New patient – all patient data cleared');
}

// ======================= CHECKLIST HELPER (new sections) =======================
function ncList(el, items){ $(el).innerHTML = items.map(([id,t,pts])=>`<label class="chk"><input type="checkbox" data-nc="${id}"${nc(id)?' checked':''}> <span>${t}${pts!=null?` <b>(+${pts})</b>`:''}</span></label>`).join(''); }
document.addEventListener('change',e=>{ const c=e.target.closest('[data-nc]'); if(c){ NCHK[c.dataset.nc]=c.checked; store.set(K('nchk'),NCHK); renderAll(); } });

// ======================= PRINT =======================
function fillPrintHead(list){
  const names = list.map(p=>{ const s=PSEC(p); return s?(s.tool?s.title:`S${s.n} ${s.title}`):p; }).filter((n,i,a)=>a.indexOf(n)===i);
  $('printhead').innerHTML = `<h1>EM Toolkit (Tintinalli-mapped) – ${list.length>=TABS.length-1?'full toolkit':list.join()===SAMPLE_PANELS.join()?'sample sections':list.length>1?'selected sections':esc(names[0])}</h1>
   <div class="note">${esc(names.join(' · '))} · printed ${new Date().toLocaleString('en-GB')} · ${ok(W())?`doses computed for ${peds()?'PEDIATRIC':'ADULT'} ${fmt(W())} kg`:'generic per-kg doses (no patient weight entered)'}.
   Reference aid only – verify clinically. Every ⚠ VERIFY item is pending owner review (listed at the end of each section). Original summaries citing public guidelines (AHA, ERC, ESC, ACOG, WHO, ADA/JBDS, ATA, Endocrine Society, WMS, ILCOR, AACT/EAPCCT, DOH/RITM/NPMCC); Tintinalli 9e used only as a topic map.</div>`;
}
function printPanels(list, auto){
  PRINTMODE=true; AUTOPRINT=!!auto; document.body.classList.add('printing');
  TABS.forEach(x=>{ const el=$('tab-'+x); if(el){ el.hidden=!list.includes(x); el.classList.toggle('pbreak', list.indexOf(x)>0); } });
  fillPrintHead(list); renderAll();
  if(!auto) window.print();
}
function endPrint(){
  PRINTMODE=false; TMPPRINT=false; document.body.classList.remove('printing');
  document.querySelectorAll('section.pbreak').forEach(e=>e.classList.remove('pbreak'));
  setTab(tab, tab==='stub'?stubSec:undefined); renderAll();
}
window.addEventListener('beforeprint',()=>{ if(!PRINTMODE){ PRINTMODE=true; TMPPRINT=true; fillPrintHead([tab]); renderAll(); } });
window.addEventListener('afterprint',()=>{ if(AUTOPRINT) return; if(PRINTMODE) endPrint(); });

// ======================= INIT (called from main INIT) =======================
function initNew(){
  Object.entries(RELABEL).forEach(([k,v])=>{ if(REVIEW[k]) REVIEW[k].tab=v; });
  AMAX.forEach(([k,l,i,v])=>{ const e=D[k]&&D[k][l]&&D[k][l][i]; if(e&&e.type==='bolus') e.amax=v; else console.warn('amax target missing',k,l,i); });
  $('side').innerHTML = `<div class="dhead" style="padding:0 .5rem"><b>Sections</b></div><input class="dfilter" id="sfilter" type="search" placeholder="Filter sections…" aria-label="Filter sections"><div class="slist" id="slist"></div>${LEGEND()}`;
  $('dlegend').innerHTML = LEGEND();
  $('sfilter').addEventListener('input',refreshNav); $('dfilter').addEventListener('input',refreshNav);
  $('navBtn').addEventListener('click',openDrawer); $('drawerX').addEventListener('click',closeDrawer);
  $('drawer').addEventListener('click',e=>{ if(e.target===$('drawer')) closeDrawer(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDrawer(); });
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-nsec]'); if(a){ navSec(a.dataset.nsec); return; }
    const p=e.target.closest('[data-npanel]'); if(p){ e.preventDefault(); setTab(p.dataset.npanel); closeDrawer(); return; }
    const sw=e.target.closest('[data-swmode]'); if(sw){ mode=sw.dataset.swmode; store.set(K('mode'),mode); applyMode(); renderAll(); toast(`Switched to ${mode==='peds'?'Pediatric':'Adult'} mode`); return; }
    const pr=e.target.closest('[data-printp]'); if(pr){ printPanels([pr.dataset.printp]); return; }
    const al=e.target.closest('[data-algo]'); if(al){ algo=al.dataset.algo; store.set(K('algo'),algo); renderAlgo(W()); goCard('algo'); return; }
    const cd=e.target.closest('[data-startcode]'); if(cd){ setTab('resus'); if(!(CT.start&&!CT.end)) startCode(); goCard('code'); return; }
  });
  $('newPt').addEventListener('click',newPatient);
  $('printSample').addEventListener('click',()=>printPanels(SAMPLE_PANELS));
  if($('printAll')) $('printAll').addEventListener('click',()=>printPanels(TABS.filter(t=>t!=='stub')));
  addSecHeads(); initSearch();
  $('theme').addEventListener('click',()=>setTimeout(()=>{ ecgSyncTheme(); ddxSyncTheme(); },0));
  if($('ecgFrame')) $('ecgFrame').addEventListener('load',ecgSyncTheme);
  if($('ddxFrame')) $('ddxFrame').addEventListener('load',ddxSyncTheme);
  window.addEventListener('storage',e=>{ if(e.key===K('dark') && e.newValue!=null){ const d=JSON.parse(e.newValue); if(d!==document.body.classList.contains('dark')){ applyTheme(d); ecgSyncTheme(); } } });  // theme toggled inside DDx (shared em_dark key)
  const bk=document.createElement('div'); bk.id='ddxBack'; bk.hidden=true; bk.setAttribute('role','navigation'); bk.setAttribute('aria-label','Return to DDx Assist');
  bk.innerHTML='<button type="button" data-npanel="ddx">← Back to 🩺 DDx Assist</button><button type="button" class="x" aria-label="Dismiss">✕</button>';
  document.body.append(bk); bk.querySelector('.x').addEventListener('click',()=>{ bk.hidden=true; });
  window.addEventListener('hashchange',()=>deepLink(false));
  initTox(); initOB(); initEndo(); initCardio(); initEnv();
}
function renderNew(w){
  renderPlaus(); renderPrintRev();
  renderTox(w); renderOB(w); renderEndo(w); renderCardio(w); renderEnv(w);
  renderX(w);
}
// ======================= ECG READER PANEL (ecg/ in an iframe, loaded on first open) =======================
function ecgShow(on){
  document.body.classList.toggle('ecgwide', on);
  const f=$('ecgFrame'); if(!on || !f) return;
  ecgSize();
  if(document.readyState!=='loading') setTimeout(ecgScroll,0);   // user navigation (not the startup restore)
  if(!f.getAttribute('src')){
    try{ localStorage.setItem('ecg-theme', document.body.classList.contains('dark')?'dark':'light'); }catch(e){}
    f.src=f.dataset.src;
  } else ecgSyncTheme();
}
function ecgSize(){   // fill the viewport below the sticky emergency/nav bar once scrolled to the panel
  const f=$('ecgFrame'), st=document.querySelector('.sticky'); if(!f || tab!=='ecg') return;
  f.style.height = Math.max(420, window.innerHeight - (st?st.offsetHeight:0) - 10) + 'px';
}
function ecgScroll(){  // bring the ECG card (title + 'Open full screen') to just below the sticky bar
  const c=document.querySelector('.ecgcard'), st=document.querySelector('.sticky'); if(!c || tab!=='ecg') return;
  window.scrollTo({top: Math.max(0, c.getBoundingClientRect().top + window.scrollY - (st?st.offsetHeight:0) - 6)});
}
window.addEventListener('resize',()=>ecgSize());
function ecgSyncTheme(){
  const f=$('ecgFrame'); if(!f || !f.getAttribute('src')) return;
  const dark=document.body.classList.contains('dark');
  try{ localStorage.setItem('ecg-theme', dark?'dark':'light');
    const d=f.contentDocument, b=d&&d.getElementById('themeBtn');
    if(b && d.body.classList.contains('dark')!==dark) b.click(); }catch(e){}
}
// ======================= DDX ASSIST PANEL (ddx/ in an iframe, loaded on first open) =======================
function ddxShow(on){
  document.body.classList.toggle('ddxwide', on);
  if(on && $('ddxBack')) $('ddxBack').hidden=true;
  const f=$('ddxFrame'); if(!on || !f) return;
  ddxSize();
  if(document.readyState!=='loading') setTimeout(ddxScroll,0);
  if(!f.getAttribute('src')) f.src=f.dataset.src; else ddxSyncTheme();
}
function ddxSize(){
  const f=$('ddxFrame'), st=document.querySelector('.sticky'); if(!f || tab!=='ddx') return;
  f.style.height = Math.max(420, window.innerHeight - (st?st.offsetHeight:0) - 10) + 'px';
}
function ddxScroll(){
  const c=document.querySelector('.ddxcard'), st=document.querySelector('.sticky'); if(!c || tab!=='ddx') return;
  window.scrollTo({top: Math.max(0, c.getBoundingClientRect().top + window.scrollY - (st?st.offsetHeight:0) - 6)});
}
window.addEventListener('resize',()=>ddxSize());
function ddxSyncTheme(){
  const f=$('ddxFrame'); if(!f || !f.getAttribute('src')) return;
  const dark=document.body.classList.contains('dark');
  try{ const d=f.contentDocument, b=d&&d.getElementById('theme'); if(b && d.body.classList.contains('dark')!==dark) b.click(); }catch(e){}
}

// ======================= DEEP LINKS: index.html#o-<cardId> (from DDx Assist) and ?q=<search> =======================
function cardFor(id){
  if(CARDS[id]) return id;
  const el=document.getElementById('o-'+id), c=el&&el.closest('[data-card]');   // output div id inside a card
  return c && CARDS[c.dataset.card] ? c.dataset.card : null;
}
function scrollToCard(id){   // like goCard(), but lands the card just below the sticky bar
  const c=CARDS[id]; if(!c) return false;
  closeDrawer(); setTab(c.tab);
  const go=()=>{ const st=document.querySelector('.sticky'); window.scrollTo({top: Math.max(0, c.el.getBoundingClientRect().top + window.scrollY - (st?st.offsetHeight:0) - 8)}); };
  go(); requestAnimationFrame(go); setTimeout(go,300);
  c.el.classList.add('hl'); setTimeout(()=>c.el.classList.remove('hl'),2200);
  return true;
}
function deepLink(startup){
  let id=null; try{ const m=decodeURIComponent(location.hash||'').match(/^#o-([\w-]+)$/); if(m) id=cardFor(m[1]); }catch(e){}
  if(id){ scrollToCard(id); return true; }
  if(startup){ const q=location.search.match(/[?&]q=([^&#]*)/);
    if(q){ let t=''; try{ t=decodeURIComponent(q[1].replace(/\+/g,' ')).trim(); }catch(e){}
      if(t){ $('search').value=t; srAct=0; renderSR(); $('search').focus({preventScroll:true}); return true; } } }
  return false;
}
function startupDeepLink(){ if(!/[?&]print=/.test(location.search)) deepLink(true); }
// API for same-origin embedded tools (ddx/ iframe): open a toolkit card in this page.
window.EMTK = { openCard(id, from){ const c=cardFor(String(id||'')); if(!c) return false;
  scrollToCard(c);
  if(from==='ddx' && $('ddxBack')) $('ddxBack').hidden=false;   // floating '← Back to DDx Assist' (DDx state is kept in the hidden iframe)
  return true; } };
function startupPrintParam(){
  const m=location.search.match(/[?&]print=([a-z,]+)/); if(!m) return;
  const list = m[1]==='sample' ? SAMPLE_PANELS : m[1]==='all' ? TABS.filter(t=>t!=='stub') : m[1].split(',').filter(p=>TABS.includes(p));
  if(list.length) printPanels(list, true);
}
