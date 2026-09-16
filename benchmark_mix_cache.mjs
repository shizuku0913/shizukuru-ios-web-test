import {mixingEngine} from './test/production-mixing-utils.js';
const sources=new Map([['#ff0000',1],['#ffff00',1],['#00ff00',1],['#00ffff',1],['#0000ff',1],['#ff00ff',1]]);
function run(n){const t=performance.now();for(let i=0;i<n;i++)mixingEngine.mixAggregate({total:6,sources,waterLevel:.2,mixLevel:1});return performance.now()-t}
run(1000);
const ms=run(25000);
console.log(JSON.stringify({iterations:25000,ms,perMixUs:ms*1000/25000}));
