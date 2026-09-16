
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function smoothstep(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)}
const pts=[];
for(let y=0;y<192;y++)for(let x=0;x<192;x++)pts.push([x,y]);
const px=96.3,py=90.7,outer=34.2,outerSq=outer*outer;
function oldRun(){
 let sum=0;
 for(const [x,y] of pts){
  const d=Math.hypot(x-px,y-py);
  sum+=smoothstep(outer,5,d);
 }
 return sum;
}
function newRun(){
 let sum=0;
 for(const [x,y] of pts){
  const dx=x-px,dy=y-py,d2=dx*dx+dy*dy;
  if(d2<outerSq)sum+=smoothstep(outer,5,Math.sqrt(d2));
 }
 return sum;
}
function time(fn,n){
 for(let i=0;i<30;i++)fn();
 const t0=performance.now();let v=0;
 for(let i=0;i<n;i++)v+=fn();
 return {ms:performance.now()-t0,value:v};
}
const a=time(oldRun,300),b=time(newRun,300);
console.log(JSON.stringify({
 cells:pts.length,iterations:300,
 oldMs:a.ms,newMs:b.ms,speedup:a.ms/b.ms,
 exactSumDelta:Math.abs(a.value-b.value)
},null,2));
