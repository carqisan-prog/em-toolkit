// ======================= SECTION REGISTRY (batch-built sections) =======================
// Each section file calls defCards(panel, reviewTabLabel, cards). Cards are created in the DOM at load
// (before CARDS/FIELDS are indexed), rendered by renderX(w). All clinical text is original summary of public guidelines.
const XSEC = {}; const NEWFIELDS = []; const POSTRENDER = [];
const vt = k => vtag(k);
const ck = (id,html) => `<label class="chk"><input type="checkbox" data-nc="${id}"> <span>${html}</span></label>`;
const nsum = ids => ids.filter(nc).length;
const sel = (id,label,opts) => `<label for="${id}">${label}</label><select id="${id}" class="sm">${opts.map(o=>Array.isArray(o)?`<option value="${o[0]}">${o[1]}</option>`:`<option value="${o}">${o}</option>`).join('')}</select>`;
const num = (id,label,ph,step) => `<label for="${id}">${label}</label><input id="${id}" type="number" inputmode="decimal" ${step?`step="${step}"`:''} placeholder="${ph||''}">`;
const fv = id => { const e=$(id); if(!e) return null; const v=parseFloat(e.value); return isNaN(v)?null:v; };
const sv = id => { const e=$(id); return e ? e.value : ''; };
const ul = items => `<ul class="tight">${items.filter(Boolean).map(i=>`<li>${i}</li>`).join('')}</ul>`;
const ol = items => `<ol class="steps">${items.filter(Boolean).map(i=>Array.isArray(i)?`<li class="${i[0]}">${i[1]}</li>`:`<li>${i}</li>`).join('')}</ol>`;
const h3 = t => `<h3>${t}</h3>`;
const nt = t => `<div class="note">${t}</div>`;
const tbl = (head,rows) => `<table class="wide">${head?`<thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`:''}<tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const gto = (id,txt) => `<a href="#" data-goto="${id}">${txt}</a>`;
const score = (n,max,label) => `<div><span class="total">${n}</span> <span class="note">${label}${max!=null?` (0–${max})`:''}</span></div>`;
function defCards(panel, tabLabel, cards){
  let sec=$('tab-'+panel);
  if(!sec){ sec=document.createElement('section'); sec.id='tab-'+panel; sec.hidden=true; $('review').before(sec); }
  if(tabLabel && !PANEL_RE[panel]) PANEL_RE[panel]=new RegExp(tabLabel);
  const anchor = sec.querySelector(':scope > .printonly');
  cards.forEach(c=>{
    const d=document.createElement('div'); d.className='card'; d.dataset.card=c.id; d.dataset.title=c.title; d.dataset.kw=c.kw||'';
    d.innerHTML=`<h2>${c.h}</h2>${c.inputs||''}<div id="o-${c.id}"></div>`;
    if(anchor) sec.insertBefore(d,anchor); else sec.append(d);
    d.querySelectorAll('input[id],select[id]').forEach(e=>NEWFIELDS.push(e.id));
  });
  (XSEC[panel]=XSEC[panel]||[]).push(...cards);
}
function renderX(w){ Object.values(XSEC).forEach(cs=>cs.forEach(c=>{ if(!c.render) return; const el=$('o-'+c.id); if(!el) return;
  try{ el.innerHTML=c.render(w); }catch(e){ console.error('render '+c.id, e); } })); POSTRENDER.forEach(f=>f(w)); }
function orderSections(){ // DOM order = outline order (print order of the full toolkit)
  const rv=$('review'); SECTIONS.forEach(s=>s.panels.forEach(([p])=>{ const el=$('tab-'+p); if(el) rv.before(el); })); const st=$('tab-stub'); if(st) rv.before(st); }
