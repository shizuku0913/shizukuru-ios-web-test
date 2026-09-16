import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { source, extractLiteralBetween, evaluateExpression } from './source-utils.js';

const canonical=evaluateExpression(extractLiteralBetween('const CANONICAL_COLORS=', ';'));
const names=evaluateExpression(extractLiteralBetween('const OFFICIAL_ENCYCLOPEDIA_NAMES=Object.freeze(', ');'));
const official=names.map(name=>canonical.find(c=>c.name===name)).filter(Boolean);
const radii=evaluateExpression(extractLiteralBetween('const OFFICIAL_REAL_UI_RADIUS_V1080=Object.freeze(', ');'));
const rgb=hex=>{const n=parseInt(String(hex).slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const perceptionExpr=extractLiteralBetween('const OfficialDiscoveryPerception=Object.freeze(', ');\n\n// v10.6.9');
const perception=vm.runInNewContext(`(${perceptionExpr})`,{clamp,rgb,DISCOVER_DISTANCE:7.5,Math,Number});

function hue([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(d<1e-9)return null;let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;return h;}
function sat(c){const mx=Math.max(...c),mn=Math.min(...c);return mx===0?0:(mx-mn)/mx;}
function hueDiff(a,b){if(a==null||b==null)return null;const d=Math.abs(a-b);return Math.min(d,360-d);}
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
const effectiveRadius=entry=>Math.min(perception.rgbMax,Number(radii[entry.name]));
function pass(sample,entry){const p=perception.evaluate(...sample,entry);return p.pass&&p.rgbDistance<=Number(radii[entry.name]);}

function audit(){
 const rows=official.map(entry=>{const c=rgb(entry.hex);let nearest=null,nearestD=Infinity;for(const other of official){if(other.name===entry.name)continue;const d=dist(c,rgb(other.hex));if(d<nearestD){nearestD=d;nearest=other;}}return {name:entry.name,hex:entry.hex,radius:+radii[entry.name],effectiveRadius:+effectiveRadius(entry).toFixed(3),nearest:nearest?.name,nearestHex:nearest?.hex,centerDistance:+nearestD.toFixed(3),sphereGap:+(nearestD-effectiveRadius(entry)-effectiveRadius(nearest)).toFixed(3),hue:hue(c),saturation:sat(c)};});
 const pairs=[];for(let i=0;i<official.length;i++)for(let j=i+1;j<official.length;j++){const A=official[i],B=official[j],a=rgb(A.hex),b=rgb(B.hex),d=dist(a,b),gap=d-effectiveRadius(A)-effectiveRadius(B);if(gap<0)pairs.push({a:A.name,b:B.name,distance:+d.toFixed(3),overlap:+(-gap).toFixed(3),hueDifference:hueDiff(hue(a),hue(b)),satA:sat(a),satB:sat(b)});}pairs.sort((x,y)=>y.overlap-x.overlap);
 const midpointDoublePass=pairs.filter(p=>{const A=official.find(x=>x.name===p.a),B=official.find(x=>x.name===p.b);const a=rgb(A.hex),b=rgb(B.hex),m=a.map((v,k)=>(v+b[k])/2);return pass(m,A)&&pass(m,B);});
 const suspiciousHue=pairs.filter(p=>p.hueDifference!=null&&p.hueDifference>=35&&p.satA>=.18&&p.satB>=.18);
 const report={version:'10.8.36-audit',officialCount:official.length,overlappingPairs:pairs.length,suspiciousHueOverlapPairs:suspiciousHue.length,midpointDoublePassPairs:midpointDoublePass.length,smallestRadii:[...rows].sort((a,b)=>a.radius-b.radius).slice(0,30),closestCenters:[...rows].sort((a,b)=>a.centerDistance-b.centerDistance).slice(0,40),largestOverlaps:pairs.slice(0,50),midpointDoublePasses:midpointDoublePass.slice(0,50),suspiciousHueOverlaps:suspiciousHue.slice(0,50)};
 fs.writeFileSync('OFFICIAL-COLOR-350-AUDIT.json',JSON.stringify(report,null,2));
 const lines=['# Shizukuru Official 350 Color Audit — v10.8.36','',`- Official colors: ${official.length}`,`- Effective formal-radius overlaps (RGB cap included): ${pairs.length}`,`- Midpoint samples accepted by both colors: ${midpointDoublePass.length}`,`- Hue-suspicious overlaps (>=35°; both saturation >=18%): ${suspiciousHue.length}`,'','## Highest-risk overlaps','',...pairs.slice(0,25).map((p,i)=>`${i+1}. ${p.a} ↔ ${p.b} — overlap ${p.overlap}, center distance ${p.distance}${p.hueDifference==null?'':`, hue Δ ${p.hueDifference.toFixed(1)}°`}`),'','## Midpoint double-pass overlaps','',...(midpointDoublePass.length?midpointDoublePass.slice(0,25).map((p,i)=>`${i+1}. ${p.a} ↔ ${p.b} — overlap ${p.overlap}`):['None detected.']),'','## Hue-suspicious overlaps','',...(suspiciousHue.length?suspiciousHue.slice(0,25).map((p,i)=>`${i+1}. ${p.a} ↔ ${p.b} — overlap ${p.overlap}, hue Δ ${p.hueDifference.toFixed(1)}°`):['None detected.']),'','This audit is diagnostic only. It does not change the mixing engine or official-color thresholds.'];
 fs.writeFileSync('OFFICIAL-COLOR-350-AUDIT.md',lines.join('\n'));
 return report;
}

test('audit: all 350 official centers, radii and perceptual gates are internally valid',()=>{assert.equal(official.length,350);assert.equal(new Set(names).size,350);assert.equal(Object.keys(radii).length,350);for(const e of official){const c=rgb(e.hex);assert.ok(Number.isFinite(+radii[e.name])&&+radii[e.name]>0,`${e.name}: invalid radius`);assert.equal(pass(c,e),true,`${e.name}: own center rejected`);}});

test('audit: generate machine-readable 350-color collision/radius report',()=>{const report=audit();assert.equal(report.officialCount,350);assert.ok(fs.existsSync('OFFICIAL-COLOR-350-AUDIT.json'));assert.ok(fs.existsSync('OFFICIAL-COLOR-350-AUDIT.md'));});
