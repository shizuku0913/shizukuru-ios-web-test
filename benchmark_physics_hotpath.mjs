
const GRID=192,N=GRID*GRID;
const C={
 FORCE_CORE_EXPONENT:2.25,MIN_SOURCE_MASS:.02,MIN_MOVED_MASS:.0001,
 BACK_DISTANCE_SLOW:.24,BACK_DISTANCE_FAST:.54,BACK_CORE_BOOST:.18,
 SIDE_DISTANCE_SLOW:.21,SIDE_DISTANCE_FAST:.09,SIDE_CORE_BOOST:.08,
 CARRIED_MASS_SLOW:1.08,CARRIED_MASS_FAST:1.18,MAX_CELL_MASS:1.65,MASS_BLEND_EPSILON:1e-6,
 VISCOSITY_MIN_MASS:.015,VISCOSITY_SMOOTH_SLOW:.024,VISCOSITY_SMOOTH_FAST:.006,
 VISCOSITY_DRY_REDUCTION:.45,VISCOSITY_WET_BOOST:.088,STRING_SPEED_THRESHOLD:.28,
 STRING_EMPTY_THRESHOLD:.018,STRING_NEIGHBOR_THRESHOLD:.07,STRING_BASE:.12,
 STRING_DRY_REDUCTION:.045,STRING_WET_BOOST:.19
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,idx=(x,y)=>y*GRID+x;
function seed(){
 const mass=new Float32Array(N),r=new Float32Array(N),g=new Float32Array(N),b=new Float32Array(N);
 for(let y=55;y<138;y++)for(let x=50;x<145;x++){
  const i=idx(x,y),dx=x-97,dy=y-96,d=Math.hypot(dx,dy);
  if(d<47){mass[i]=Math.max(.01,1-d/52);r[i]=180+(x%17);g[i]=80+(y%23);b[i]=65;}
 }
 return {mass,r,g,b};
}
const contact={speed01:.67,wetFeel:.31,dryFeel:.58,ux:.77,uy:.638,px:-.638,py:.77,radius:23.5,minX:55,maxX:139,minY:50,maxY:140};
const x1=102.4,y1=97.2,pressure=.081;

function transportOld(S){
 const {mass,r,g,b}=S,{speed01,ux,uy,px,py,radius}=contact;
 const minX=Math.max(1,Math.floor(x1-radius)),maxX=Math.min(GRID-2,Math.ceil(x1+radius));
 const minY=Math.max(1,Math.floor(y1-radius)),maxY=Math.min(GRID-2,Math.ceil(y1+radius));
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const rx=x-x1,ry=y-y1,d=Math.hypot(rx,ry);if(d>=radius)continue;
  const i=idx(x,y);if(mass[i]<C.MIN_SOURCE_MASS)continue;
  const core=Math.pow(1-d/radius,C.FORCE_CORE_EXPONENT),moved=mass[i]*pressure*core;
  if(moved<=C.MIN_MOVED_MASS)continue;
  mass[i]=Math.max(0,mass[i]-moved);
  const side=(rx*px+ry*py)>=0?1:-1;
  const back=radius*(lerp(C.BACK_DISTANCE_SLOW,C.BACK_DISTANCE_FAST,speed01)+C.BACK_CORE_BOOST*core);
  const sideways=radius*(lerp(C.SIDE_DISTANCE_SLOW,C.SIDE_DISTANCE_FAST,speed01)+C.SIDE_CORE_BOOST*core)*side;
  const tx=clamp(Math.round(x-ux*back+px*sideways),1,GRID-2),ty=clamp(Math.round(y-uy*back+py*sideways),1,GRID-2);
  const carried=moved*lerp(C.CARRIED_MASS_SLOW,C.CARRIED_MASS_FAST,speed01);
  const ti=idx(tx,ty),old=mass[ti],nm=clamp(old+carried,0,C.MAX_CELL_MASS),w=carried/(old+carried+C.MASS_BLEND_EPSILON);
  r[ti]=lerp(r[ti],r[i],w);g[ti]=lerp(g[ti],g[i],w);b[ti]=lerp(b[ti],b[i],w);mass[ti]=nm;
 }
}
function transportNew(S){
 const {mass,r,g,b}=S,{speed01,ux,uy,px,py,radius}=contact;
 const minX=Math.max(1,Math.floor(x1-radius)),maxX=Math.min(GRID-2,Math.ceil(x1+radius));
 const minY=Math.max(1,Math.floor(y1-radius)),maxY=Math.min(GRID-2,Math.ceil(y1+radius));
 const radiusSq=radius*radius,backBase=lerp(C.BACK_DISTANCE_SLOW,C.BACK_DISTANCE_FAST,speed01),sideBase=lerp(C.SIDE_DISTANCE_SLOW,C.SIDE_DISTANCE_FAST,speed01),carriedFactor=lerp(C.CARRIED_MASS_SLOW,C.CARRIED_MASS_FAST,speed01);
 for(let y=minY;y<=maxY;y++){const row=y*GRID;for(let x=minX;x<=maxX;x++){
  const rx=x-x1,ry=y-y1,d2=rx*rx+ry*ry;if(d2>=radiusSq)continue;
  const i=row+x;if(mass[i]<C.MIN_SOURCE_MASS)continue;
  const d=Math.sqrt(d2),core=Math.pow(1-d/radius,C.FORCE_CORE_EXPONENT),moved=mass[i]*pressure*core;
  if(moved<=C.MIN_MOVED_MASS)continue;
  mass[i]=Math.max(0,mass[i]-moved);
  const side=(rx*px+ry*py)>=0?1:-1,back=radius*(backBase+C.BACK_CORE_BOOST*core),sideways=radius*(sideBase+C.SIDE_CORE_BOOST*core)*side;
  const tx=clamp(Math.round(x-ux*back+px*sideways),1,GRID-2),ty=clamp(Math.round(y-uy*back+py*sideways),1,GRID-2),carried=moved*carriedFactor;
  const ti=ty*GRID+tx,old=mass[ti],nm=clamp(old+carried,0,C.MAX_CELL_MASS),w=carried/(old+carried+C.MASS_BLEND_EPSILON);
  r[ti]=lerp(r[ti],r[i],w);g[ti]=lerp(g[ti],g[i],w);b[ti]=lerp(b[ti],b[i],w);mass[ti]=nm;
 }}
}
function viscosityOld(S){
 const {mass,r,g,b}=S,{speed01,wetFeel,dryFeel,ux,uy,minX,maxX,minY,maxY}=contact;
 for(let y=minY+1;y<maxY;y++)for(let x=minX+1;x<maxX;x++){
  const i=idx(x,y);if(mass[i]<C.VISCOSITY_MIN_MASS)continue;
  const il=idx(x-1,y),ir=idx(x+1,y),iu=idx(x,y-1),id=idx(x,y+1),avg=(mass[il]+mass[ir]+mass[iu]+mass[id])*.25;
  const smooth=lerp(C.VISCOSITY_SMOOTH_SLOW,C.VISCOSITY_SMOOTH_FAST,speed01)*(1-dryFeel*C.VISCOSITY_DRY_REDUCTION)+wetFeel*C.VISCOSITY_WET_BOOST;
  mass[i]=mass[i]*(1-smooth)+avg*smooth;
 }
 if(speed01>C.STRING_SPEED_THRESHOLD)for(let y=minY+1;y<maxY;y++)for(let x=minX+1;x<maxX;x++){
  const i=idx(x,y);if(mass[i]>C.STRING_EMPTY_THRESHOLD)continue;
  const a=idx(clamp(Math.round(x-ux),1,GRID-2),clamp(Math.round(y-uy),1,GRID-2)),c=idx(clamp(Math.round(x+ux),1,GRID-2),clamp(Math.round(y+uy),1,GRID-2));
  const along1=mass[a],along2=mass[c];
  if(along1>C.STRING_NEIGHBOR_THRESHOLD&&along2>C.STRING_NEIGHBOR_THRESHOLD){
   const bridge=Math.min(along1,along2)*(C.STRING_BASE-dryFeel*C.STRING_DRY_REDUCTION+C.STRING_WET_BOOST*wetFeel)*speed01;mass[i]=bridge;
   r[i]=(r[a]+r[c])*.5;g[i]=(g[a]+g[c])*.5;b[i]=(b[a]+b[c])*.5;
  }
 }
}
function viscosityNew(S){
 const {mass,r,g,b}=S,{speed01,wetFeel,dryFeel,ux,uy,minX,maxX,minY,maxY}=contact;
 const smooth=lerp(C.VISCOSITY_SMOOTH_SLOW,C.VISCOSITY_SMOOTH_FAST,speed01)*(1-dryFeel*C.VISCOSITY_DRY_REDUCTION)+wetFeel*C.VISCOSITY_WET_BOOST;
 for(let y=minY+1;y<maxY;y++){const row=y*GRID;for(let x=minX+1;x<maxX;x++){const i=row+x;if(mass[i]<C.VISCOSITY_MIN_MASS)continue;const avg=(mass[i-1]+mass[i+1]+mass[i-GRID]+mass[i+GRID])*.25;mass[i]=mass[i]*(1-smooth)+avg*smooth;}}
 if(speed01>C.STRING_SPEED_THRESHOLD){const bf=(C.STRING_BASE-dryFeel*C.STRING_DRY_REDUCTION+C.STRING_WET_BOOST*wetFeel)*speed01;for(let y=minY+1;y<maxY;y++){const row=y*GRID;for(let x=minX+1;x<maxX;x++){const i=row+x;if(mass[i]>C.STRING_EMPTY_THRESHOLD)continue;const ax=clamp(Math.round(x-ux),1,GRID-2),ay=clamp(Math.round(y-uy),1,GRID-2),cx=clamp(Math.round(x+ux),1,GRID-2),cy=clamp(Math.round(y+uy),1,GRID-2),a=ay*GRID+ax,c=cy*GRID+cx,along1=mass[a],along2=mass[c];if(along1>C.STRING_NEIGHBOR_THRESHOLD&&along2>C.STRING_NEIGHBOR_THRESHOLD){mass[i]=Math.min(along1,along2)*bf;r[i]=(r[a]+r[c])*.5;g[i]=(g[a]+g[c])*.5;b[i]=(b[a]+b[c])*.5;}}}}
}
function maxDiff(A,B){let m=0;for(const key of ['mass','r','g','b'])for(let i=0;i<N;i++)m=Math.max(m,Math.abs(A[key][i]-B[key][i]));return m;}
const A=seed(),B=seed();transportOld(A);viscosityOld(A);transportNew(B);viscosityNew(B);
function time(fn,n){const t0=performance.now();for(let i=0;i<n;i++){const S=seed();fn(S)}return performance.now()-t0}
const oldMs=time(S=>{transportOld(S);viscosityOld(S)},350),newMs=time(S=>{transportNew(S);viscosityNew(S)},350);
console.log(JSON.stringify({iterations:350,oldMs,newMs,speedup:oldMs/newMs,maxArrayDelta:maxDiff(A,B)},null,2));
