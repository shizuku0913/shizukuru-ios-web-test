
import {mixingEngine,classification} from './test/production-mixing-utils.js';
const pigments=['#000000','#ff0000','#00ff00','#0000ff','#00ffff','#ff00ff','#ffff00','#ffffff'];

function state(n){
 const sources=new Map();
 for(let i=0;i<n;i++)sources.set(pigments[i],1+(i%3)*.3);
 return sources;
}
function time(fn,n=20000){
 for(let i=0;i<1000;i++)fn();
 const t0=performance.now();
 for(let i=0;i<n;i++)fn();
 const ms=performance.now()-t0;
 return {ms,us:ms*1000/n};
}
const rows=[];
for(const n of [1,2,3,6,8]){
 const sources=state(n);
 rows.push({kind:`mix-${n}pigments`,...time(()=>mixingEngine.mixAggregate({total:n,sources,waterLevel:.25,mixLevel:.65}),25000)});
}
for(const rgb of [[250,95,32],[122,155,62],[32,42,64],[205,234,240]]){
 rows.push({kind:`strict-${rgb.join('-')}`,...time(()=>classification.nearestStrictOfficialRGB(...rgb),12000)});
 rows.push({kind:`rescue-${rgb.join('-')}`,...time(()=>classification.conditionalOfficialRescueRGB(...rgb),12000)});
}
console.log(JSON.stringify(rows,null,2));
