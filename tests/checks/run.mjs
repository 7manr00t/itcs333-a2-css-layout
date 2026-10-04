// ITCS333 A2 autograder — checks 1–7 (rubric in README).
// DO NOT MODIFY: official grading uses the instructor's pristine copy.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import * as csstree from 'css-tree';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const results = [];
function check(id, points, fn) {
  try {
    const r = fn();
    const passed = r === true;
    results.push({ id, status: passed ? 'PASS' : 'FAIL', got: passed ? points : 0, max: points, detail: passed ? '' : String(r ?? '') });
  } catch (e) {
    results.push({ id, status: 'FAIL', got: 0, max: points, detail: String(e.message || e) });
  }
}
const read = (f) => {
  const p = join(ROOT, f);
  if (!existsSync(p)) throw new Error(`missing file: ${f}`);
  return readFileSync(p, 'utf8');
};

const html = read('index.html');
const { document } = parseHTML(html);

let css = '';
let ast = null;
try {
  css = read('css/style.css');
  ast = csstree.parse(css, { positions: false, onParseError: () => {} });
} catch (e) { /* reported per-check */ }

// Helpers over the CSS AST
function rulesMatching(pred) {
  const out = [];
  if (!ast) return out;
  csstree.walk(ast, (node) => {
    if (node.type === 'Rule') {
      const sel = csstree.generate(node.prelude);
      if (pred(sel)) out.push({ sel, block: node.block });
    }
  });
  return out;
}
function decls(block) {
  const d = {};
  csstree.walk(block, (node) => {
    if (node.type === 'Declaration') d[node.property.toLowerCase()] = csstree.generate(node.value).trim();
  });
  return d;
}
function px(v) { const m = /^([\d.]+)px$/.exec(v || ''); return m ? parseFloat(m[1]) : null; }
function anyDecl(rules, prop, test) {
  return rules.some((r) => { const d = decls(r.block); return d[prop] !== undefined && test(d[prop], d); });
}

// ---------- Check 1 (5 pts): linked external stylesheet, no inline styles ----------
check('external_stylesheet', 5, () => {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href') || '');
  if (!links.some((h) => /css\/style\.css$/.test(h))) return 'FAIL: link css/style.css in index.html <head>';
  const inline = [...document.querySelectorAll('[style]')];
  if (inline.length > 0) return `FAIL: ${inline.length} element(s) have inline style= attributes`;
  return true;
});

// ---------- Check 2 (10 pts): >=3 selector kinds ----------
check('selector_kinds', 10, () => {
  if (!ast) return 'FAIL: css/style.css missing or unparseable';
  const sels = rulesMatching(() => true).map((r) => r.sel);
  const hasClass = sels.some((s) => /\.[A-Za-z]/.test(s));
  const hasId = sels.some((s) => /#[A-Za-z]/.test(s));
  const hasPseudo = sels.some((s) => /:{1,2}(hover|focus|active|visited|first-child|last-child|nth-child|not|before|after|checked|disabled|required|valid|invalid|link|target)\b/i.test(s));
  const hasDescendant = sels.some((s) => /[ >+~]/.test(s));
  const count = [hasClass, hasId, hasPseudo, hasDescendant].filter(Boolean).length;
  if (count < 3) return `FAIL: found ${count}/4 selector kinds (need 3: class, id, pseudo or descendant)`;
  return true;
});

// ---------- Check 3 (10 pts): box model per spec ----------
check('box_model', 10, () => {
  if (!ast) return 'FAIL: css/style.css missing or unparseable';
  const header = rulesMatching((s) => /#site-header/.test(s));
  const card = rulesMatching((s) => /\.card\b/.test(s) && !/card-grid/.test(s));
  if (header.length === 0) return 'FAIL: no rule targeting #site-header';
  if (!anyDecl(header, 'padding', (v, d) => (px(v) ?? (parseFloat(v) || 0)) >= 16 || (d['padding-top'] && px(d['padding-top']) >= 16)))
    return 'FAIL: #site-header needs padding >= 16px';
  if (!anyDecl(header, 'border-bottom', () => true) && !anyDecl(header, 'border', () => true))
    return 'FAIL: #site-header needs a border-bottom (or border)';
  if (card.length === 0) return 'FAIL: no rule targeting .card';
  if (!anyDecl(card, 'padding', (v) => (px(v) ?? 0) >= 12)) return 'FAIL: .card needs padding >= 12px';
  if (!anyDecl(card, 'border', () => true)) return 'FAIL: .card needs a visible border';
  return true;
});

// ---------- Check 4 (15 pts): card grid layout ----------
check('card_grid_layout', 15, () => {
  if (!ast) return 'FAIL: css/style.css missing or unparseable';
  const grid = rulesMatching((s) => /\.card-grid/.test(s));
  if (grid.length === 0) return 'FAIL: no rule targeting .card-grid';
  const usesLayout = anyDecl(grid, 'display', (v) => v === 'grid' || v === 'flex');
  if (!usesLayout) return 'FAIL: .card-grid needs display: grid or display: flex';
  const hasGap = anyDecl(grid, 'gap', (v) => (px(v) ?? 0) >= 16);
  if (!hasGap) return 'FAIL: .card-grid needs gap >= 16px';
  const threeCols = anyDecl(grid, 'grid-template-columns', (v) => {
    const fr = (v.match(/1fr/g) || []).length;
    return fr >= 3 || /repeat\(\s*3/.test(v);
  }) || anyDecl(grid, 'display', (v) => v === 'flex');
  if (!threeCols) return 'FAIL: desktop layout should be 3 columns (grid-template-columns or flex)';
  return true;
});

// ---------- Check 5 (10 pts): form styling + focus state ----------
check('form_focus', 10, () => {
  if (!ast) return 'FAIL: css/style.css missing or unparseable';
  const inputs = rulesMatching((s) => /input|textarea|select|\.register-form/.test(s));
  if (inputs.length === 0) return 'FAIL: no rules styling form controls';
  if (!anyDecl(inputs, 'padding', (v) => (px(v) ?? (parseFloat(v) || 0)) >= 6)) return 'FAIL: form inputs need padding >= 6px';
  const focus = rulesMatching((s) => /:focus\b/.test(s));
  if (focus.length === 0) return 'FAIL: add a :focus style for form controls';
  return true;
});

// ---------- Check 6 (15 pts): media query collapses grid ----------
check('media_query', 15, () => {
  if (!ast) return 'FAIL: css/style.css missing or unparseable';
  let found = false;
  csstree.walk(ast, (node) => {
    if (node.type === 'Atrule' && node.name === 'media') {
      const prelude = csstree.generate(node.prelude);
      if (/max-width\s*:\s*(700|699|701)px/.test(prelude)) {
        csstree.walk(node.block, (inner) => {
          if (inner.type === 'Rule') {
            const sel = csstree.generate(inner.prelude);
            if (/\.card-grid/.test(sel)) {
              const d = decls(inner.block);
              if (/1fr$/.test(d['grid-template-columns'] || '') || d.display === 'block' || d.display === 'flex' && /column/.test(d['flex-direction'] || '')) found = true;
            }
          }
        });
      }
    }
  });
  if (!found) return 'FAIL: @media (max-width: 700px) must collapse .card-grid to a single column';
  return true;
});

// ---------- Check 7 (5 pts): no !important, parses clean ----------
check('css_hygiene', 5, () => {
  if (!ast) return 'FAIL: css/style.css missing or unparseable';
  if (/!important/.test(css)) return 'FAIL: remove !important';
  let errors = 0;
  csstree.parse(css, { onParseError: () => errors++ });
  if (errors > 0) return `FAIL: ${errors} CSS parse error(s)`;
  return true;
});

// ---------- report ----------
let got = 0, max = 0;
for (const r of results) {
  got += r.got; max += r.max;
  console.log(`CHECK ${r.id} ${r.status} ${r.got}/${r.max}${r.detail ? ' -- ' + r.detail : ''}`);
}
console.log(`TOTAL ${got}/${max}`);
process.exit(got === max ? 0 : 1);
