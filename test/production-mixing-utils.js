import vm from 'node:vm';
import { source, extractLiteralBetween, evaluateExpression } from './source-utils.js';

export const rgb = hex => {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
export const lerp = (a,b,t) => a + (b-a)*t;
export const smoothstep = (a,b,v) => {
  const t = clamp((v-a)/(b-a), 0, 1);
  return t*t*(3-2*t);
};

function extractBalancedObjectAfter(prefix) {
  const start = source.indexOf(prefix);
  if (start < 0) throw new Error(`Prefix not found: ${prefix}`);
  const brace = source.indexOf('{', start + prefix.length);
  if (brace < 0) throw new Error(`Object start not found after: ${prefix}`);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(brace, i + 1);
    }
  }
  throw new Error(`Unclosed object after: ${prefix}`);
}

// Build the production RYB engine from the exact object literals shipped in index.html.
const engineContext = { Math, Number, Object, Map, Set, Array, String, parseInt, rgb, clamp, lerp, smoothstep };
vm.createContext(engineContext);
for (const name of [
  'PaintRYBColorSpace','RYBPaintMixProfile','RYBPaintAppearanceProfile',
  'RYBBlackPaintDepthProfile','RYBWhitePaintPastelProfile','RYBWarmPigmentRetentionProfile',
  'RYBWarmGamutEdgeProfile','RYBComplementaryEarthProfile','RYBWaterAppearanceProfile',
  'RYBOverwaterDullingProfile','RYBOvermixDullingProfile','RYBPaintMixingEngine',
  // v10.8.50 audit alignment: these are part of the ACTUAL production engine.
  'RYBPigmentStrengthProfile','RYBHueSpreadDullingProfile','RYBCMYSubtractiveBridgeProfile',
  'RYBComplementUndertoneProfile','RYBMultiPigmentNeutralProfile','RYBPigmentTouchTestEngine'
]) {
  const expr = extractBalancedObjectAfter(`const ${name}=Object.freeze(`);
  vm.runInContext(`globalThis.${name}=Object.freeze(${expr})`, engineContext);
}
export const mixingEngine = engineContext.RYBPigmentTouchTestEngine;
export const baseMixingEngine = engineContext.RYBPaintMixingEngine;

export const reproductionRecipes = evaluateExpression(
  extractLiteralBetween('const OFFICIAL_REPRODUCTION_RECIPES_V1075=Object.freeze(', ');')
);
export const canonical = evaluateExpression(extractLiteralBetween('const CANONICAL_COLORS=', ';'));
export const officialNames = evaluateExpression(
  extractLiteralBetween('const OFFICIAL_ENCYCLOPEDIA_NAMES=Object.freeze(', ');')
);
export const official = officialNames.map(name => canonical.find(c => c.name === name)).filter(Boolean);
const radiusMap = evaluateExpression(
  extractLiteralBetween('const OFFICIAL_REAL_UI_RADIUS_V1080=Object.freeze(', ');')
);

const perceptionExpr = extractLiteralBetween(
  'const OfficialDiscoveryPerception=Object.freeze(', ');\n\n// v10.6.9'
);
const perception = vm.runInNewContext(`(${perceptionExpr})`, {
  clamp, rgb, DISCOVER_DISTANCE:7.5, Math, Number
});
const adaptiveExpr = extractLiteralBetween(
  'const AdaptiveOfficialDiscovery=Object.freeze(', ');\n\n// v10.8.0'
);
const adaptive = vm.runInNewContext(`(${adaptiveExpr})`, {
  DISCOVER_DISTANCE:7.5,
  OFFICIAL_REAL_UI_RADIUS_V1080:radiusMap,
  OFFICIAL_ENCYCLOPEDIA_COLORS:official,
  OfficialDiscoveryPerception:perception,
  rgb, Math, Number, Object
});
const officialRGB = official.map(entry => {
  const [r,g,b] = rgb(entry.hex);
  return {entry,r,g,b};
});
const canonicalRGB = canonical.map(entry => {
  const [r,g,b] = rgb(entry.hex);
  return {entry,r,g,b};
});
const classificationExpr = extractBalancedObjectAfter('const ColorClassification=');
export const classification = vm.runInNewContext(`(${classificationExpr})`, {
  rgb, Math,
  CANONICAL_COLOR_RGB:canonicalRGB,
  OFFICIAL_ENCYCLOPEDIA_COLOR_RGB:officialRGB,
  OfficialDiscoveryPerception:perception,
  AdaptiveOfficialDiscovery:adaptive,
  myDiscoveries:[]
});

export function mixOfficialRecipe(name, mixLevel=1) {
  const record = reproductionRecipes[name];
  if (!record) throw new Error(`Missing reproduction recipe: ${name}`);
  const sources = new Map(record.recipe.map(row => [row.hex, row.ratio]));
  const mixed = mixingEngine.mixAggregate({
    total:1,
    sources,
    waterLevel:record.waterLevel,
    mixLevel
  });
  return mixed.map(Math.round);
}

export function classifyOfficialRecipe(name, mixLevel=1) {
  const color = mixOfficialRecipe(name, mixLevel);
  const result = classification.nearestStrictOfficialRGB(...color);
  return { name, color, result, actualName: result.entry?.name ?? null };
}
