import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.67 production render pipeline no longer times diagnostic-only base/overlay phases',()=>{
  const a=source.indexOf('const RenderPipeline=Object.freeze({');
  const b=source.indexOf('const RenderContinuationSnapshot=Object.freeze({',a);
  const block=source.slice(a,b);
  assert.doesNotMatch(block,/baseStartedAt|overlayStartedAt|baseElapsed|overlayElapsed/);
  assert.match(block,/RenderBasePipeline\.draw\(\)/);
  assert.match(block,/RenderOverlayPipeline\.draw\(now\)/);
});

test('v10.8.67 profiler compatibility shell performs no per-frame allocation',()=>{
  const a=source.indexOf('const RenderProfilerLifecycle=Object.freeze({');
  const b=source.indexOf('const RenderMetricsAPI=Object.freeze({',a);
  const block=source.slice(a,b);
  assert.match(block,/recordPipeline\(\)\{return null;\}/);
  assert.match(block,/recordActiveCells\(\)\{return null;\}/);
  assert.match(block,/recordFrame\(\)\{return null;\}/);
  assert.doesNotMatch(block,/Object\.freeze\(\{\.\.\./);
  assert.doesNotMatch(block,/window\.__activeRenderStats/);
});

test('v10.8.67 gameplay frame governor remains active',()=>{
  assert.match(source,/PerformanceGovernor\.recordFrame\(lastFrameMs,performance\.now\(\)\)/);
  assert.match(source,/RenderFrameLifecycle\.requestNextFrame\(frameState\)/);
});
