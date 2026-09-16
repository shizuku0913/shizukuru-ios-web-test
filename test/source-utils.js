import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const INDEX_PATH = path.resolve('app/src/main/assets/www/index.html');
export const source = fs.readFileSync(INDEX_PATH, 'utf8');

export function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Function not found: ${name}`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed function: ${name}`);
}

export function extractLiteralBetween(prefix, suffix = ';') {
  const start = source.indexOf(prefix);
  if (start < 0) throw new Error(`Prefix not found: ${prefix}`);
  const from = start + prefix.length;
  const end = source.indexOf(suffix, from);
  if (end < 0) throw new Error(`Suffix not found after: ${prefix}`);
  return source.slice(from, end);
}

export function evaluateExpression(expression, context = {}) {
  return vm.runInNewContext(`(${expression})`, context);
}
