// Prints the trauma scores for every trauma case (for hand verification) and asserts the hand-calculated values.
const fs=require('fs'), path=require('path'); const R=f=>fs.readFileSync(path.join(__dirname,'..','js',f),'utf8');
eval(R('findings.js')+R('kb.js')+R('engine.js')+R('cases.js')+';global.X={CASES,derive,scoreAll,computeScores,primarySurvey,traumaCentre};');
const get=(c)=>{ const D=X.derive(Object.assign({},c.I)); const Rr=X.scoreAll(D); return {D, S:X.computeScores(D,Rr)}; };
const out={}; let fail=0;
for(const c of X.CASES.filter(c=>c.id.startsWith('tr_'))){ const {D,S}=get(c); out[c.id]={}; S.forEach(s=>out[c.id][s.id]=s.v);
  console.log('\n== '+c.id+'  GCS='+D.n.gcs+' HR='+D.n.hr+' SBP='+D.n.sbp+' RR='+D.n.rr+' injH='+(D.n.injH!=null?D.n.injH.toFixed(2):'-'));
  S.filter(s=>['tbi','atls','abc','rts','ccr','nexus','cchr','pecarn','burnfluid','txa','tcentre','si'].includes(s.id)).forEach(s=>console.log('  '+s.name+': '+s.v+' | '+s.interp+(s.details?' | '+s.details:'')));
  console.log('  PS: '+X.primarySurvey(D).map(r=>r.k+':'+r.st).join(' '));
}
// hand-calculated expectations
const E = {
  tr_moto_edh:  {tbi:9, abc:0, rts:6.904, si:0.34, atls:undefined, txa:'Give TXA', cchr:'CT'},
  tr_stab_tamp: {tbi:14, abc:3, rts:7.108, si:1.69, atls:'Class III', txa:'Give TXA'},
  tr_fall_pelvis:{tbi:14, abc:2, rts:7.108, si:1.63, atls:'Class III', txa:'Give TXA'},
  tr_mvc_spleen:{tbi:15, abc:1, rts:7.841, si:1.2, atls:'Class II', txa:'Give TXA'},
  tr_geri_sdh:  {tbi:13, abc:0, rts:7.841, si:0.5, cchr:'CT', ccr:'N/A', txa:'Do not start'},
  tr_burn30:    {tbi:15, abc:1, rts:7.841, burnfluid:'3900 mL / 24 h', atls:'Class III'},
  tr_tension:   {tbi:14, abc:2, rts:6.817, si:1.74, atls:'Class III', txa:'Give TXA'},
  tr_preg:      {tbi:15, abc:0, rts:7.841, si:1.12, atls:'Class II'},
  tr_peds_head: {tbi:15, abc:undefined, rts:7.841, pecarn:'Observe vs CT', cchr:undefined, txa:undefined, atls:'Child', ccr:'N/A'},
  tr_mvc_spleen2:null,
};
console.log('\n== assertions');
for(const [id,exp] of Object.entries(E)) if(exp) for(const [k,v] of Object.entries(exp)){ const got=out[id][k]; const ok = (typeof v==='number') ? Math.abs(got-v)<0.006 : got===v; if(!ok) fail++; console.log((ok?'PASS':'FAIL')+' '+id+' '+k+' expected '+v+' got '+got); }
// synthetic edge cases for each rule branch (hand-calculated)
const P=1, N=-1;
const syn = (I)=>{ const D=X.derive(Object.assign({cc:'Trauma / injury'},I)); const S=X.computeScores(D,X.scoreAll(D)); const o={}; S.forEach(s=>o[s.id]=s); return o; };
const T = [
  ['CCR no imaging (low-risk + rotates)', syn({age:30,sex:'F',tr:{on:true},chips:{mech_mvc:P,neck_pain:P,cs_simple:P,cs_rotate:P,paresthesia:N},v:{gcs:15,sbp:120,rr:16,hr:80}}).ccr.v, 'No imaging'],
  ['CCR image (age 70)', syn({age:70,sex:'F',tr:{on:true},chips:{mech_fall_low:P,neck_pain:P,cs_amb:P,cs_rotate:P},v:{gcs:15,sbp:130,rr:16,hr:80}}).ccr.v, 'Image'],
  ['CCR image (fall 1.2 m)', syn({age:40,sex:'M',tr:{on:true,fallM:1.2},chips:{neck_pain:P,cs_amb:P,cs_rotate:P},v:{gcs:15,sbp:130,rr:16,hr:80}}).ccr.v, 'Image'],
  ['NEXUS low risk (all 5 absent)', syn({age:30,sex:'M',tr:{on:true},chips:{mech_mvc:P,neck_midline:N,lateralizing:N,intox:N,distract:N},v:{gcs:15,sbp:120,rr:16,hr:80}}).nexus.v, 'Low risk'],
  ['CCHR medium risk (amnesia ≥ 30 min)', syn({age:30,sex:'M',tr:{on:true},chips:{head_inj:P,loc:P,amnesia:P,vomit2:N,skull_fx:N,basilar:N},v:{gcs:15,sbp:120,rr:16,hr:80}}).cchr.v, 'CT – medium risk'],
  ['CCHR no CT', syn({age:30,sex:'M',tr:{on:true},chips:{head_inj:P,loc:P},v:{gcs:15,sbp:120,rr:16,hr:80}}).cchr.v, 'No CT by rule'],
  ['PECARN < 2 y high (palpable skull fx)', syn({age:1,sex:'F',tr:{on:true},chips:{head_inj:P,skull_fx:P},v:{gcs:15,sbp:90,rr:30,hr:130}}).pecarn.v, 'CT'],
  ['PECARN < 2 y very low', syn({age:1,sex:'F',tr:{on:true,fallM:0.5},chips:{head_inj:P,scalp_hematoma:N,loc:N,not_normal:N},v:{gcs:15}}).pecarn.v, 'No CT'],
  ['ABC = 4', syn({age:30,sex:'M',tr:{on:true},chips:{mech_gsw:P,fast_abd:P},v:{sbp:88,hr:125,rr:24,gcs:15}}).abc.v, 4],
  ['RTS GCS 3 / SBP 0 / RR 0 = 0', syn({age:30,sex:'M',tr:{on:true},chips:{mech_mvc:P},v:{gcs:3,sbp:0,rr:0,hr:0}}).rts.v, 0],
  ['RTS GCS 7 / SBP 60 / RR 8', syn({age:30,sex:'M',tr:{on:true},chips:{mech_mvc:P},v:{gcs:7,sbp:60,rr:8,hr:120}}).rts.v, 3.921],
  ['ATLS class IV (HR 150, SBP 65)', syn({age:30,sex:'M',tr:{on:true},chips:{mech_mvc:P},v:{gcs:12,sbp:65,rr:36,hr:150}}).atls.v, 'Class IV'],
  ['Burn child 20 kg 15 % → 3 mL × 20 × 15 = 900', syn({age:6,sex:'M',tr:{on:true,tbsa:15,wt:20,injT:0,injU:'h'},chips:{mech_burn:P},v:{}}).burnfluid.v, '900 mL / 24 h'],
  ['Burn electrical 70 kg 10 % → 4 × 70 × 10 = 2800', syn({age:40,sex:'M',tr:{on:true,tbsa:10,wt:70},chips:{burn_elec:P},v:{}}).burnfluid.v, '2800 mL / 24 h'],
  ['TXA > 3 h', syn({age:30,sex:'M',tr:{on:true,injT:4,injU:'h'},chips:{mech_stab:P},v:{sbp:80,hr:130}}).txa.v, 'Do not start'],
  ['GCS from E/V/M (3+4+5=12) → moderate', syn({age:30,sex:'M',tr:{on:true,gcsE:3,gcsV:4,gcsM:5},chips:{head_inj:P},v:{}}).tbi.v, 12],
];
T.forEach(([name,got,exp])=>{ const ok = typeof exp==='number' ? Math.abs(got-exp)<0.006 : got===exp; if(!ok) fail++; console.log((ok?'PASS':'FAIL')+' '+name+' expected '+exp+' got '+got); });
console.log('fail',fail); process.exitCode = fail?1:0;
