const fs=require('fs'), path=require('path'); const R=f=>fs.readFileSync(path.join(__dirname,'..','js',f),'utf8');
eval(R('findings.js')+R('kb.js')+R('engine.js')+R('cases.js')+';global.X={CASES,derive,scoreAll,computeScores,KB};');
let fail=0;
for(const c of X.CASES){ const I=Object.assign({},c.I); const D=X.derive(I); D.peLikely=I.peLikely; const R=X.scoreAll(D);
  const top=R.ddx.slice(0,3).map(r=>r.id+'('+r.s+')'); const ok=R.ddx.slice(0,3).some(r=>r.id===c.expect); const mn=R.mnm.map(r=>r.id); const mok=c.mnm.every(id=>mn.includes(id));
  if(!ok||!mok) fail++;
  console.log((ok&&mok?'PASS':'FAIL'), c.id.padEnd(11), top.join(' '), '| mnm:', mn.join(','), mok?'':'MISSING '+c.mnm.filter(i=>!mn.includes(i)));
}
console.log('fail',fail);
