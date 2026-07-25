// @vitest-environment node
//
// Lockstep guarantee: every `_DESIGN.md` that `create-lerret` SHIPS must parse
// cleanly with the parser that READS it, and must not disagree with the same
// project's `config.json` vars.
//
// This is the test that would have caught the original defect: the brand file
// was never scaffolded at all, so nothing ever checked that the format the
// templates teach is the format the parser accepts. The two live in different
// packages, so only an integration test can pin them together — it is placed
// here (next to the parser) rather than in `create-lerret`, which deliberately
// has zero dependencies.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseDesignTokens, flattenTokens } from '../src/memory/design-tokens.js';
import { createDsCuratorNode } from '../src/orchestrator/agents/ds-curator.js';
import { DESIGN_SYSTEM_PATH } from '../src/memory/paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREATE_LERRET = join(__dirname, '..', '..', 'create-lerret');
const PRESETS_DIR = join(CREATE_LERRET, 'template-presets');

/** Every scaffolded project dir that ships a `.lerret/` — base template + presets. */
const PROJECTS = [
  ['template', join(CREATE_LERRET, 'template', '.lerret')],
  ...readdirSync(PRESETS_DIR).map((p) => [p, join(PRESETS_DIR, p, '.lerret')]),
];

describe('scaffolded _DESIGN.md — parser lockstep', () => {
  it('ships a _DESIGN.md in the base template and every preset', () => {
    expect(PROJECTS.length).toBeGreaterThan(1);
    for (const [name, dir] of PROJECTS) {
      expect(existsSync(join(dir, '_DESIGN.md')), `${name} is missing _DESIGN.md`).toBe(true);
    }
  });

  it.each(PROJECTS)('%s parses with zero warnings and real tokens', (name, dir) => {
    const parsed = parseDesignTokens(readFileSync(join(dir, '_DESIGN.md'), 'utf-8'));
    expect(parsed.warnings, `${name} raised parser warnings`).toEqual([]);
    expect(parsed.meta.name, `${name} has no front-matter name`).toBeTruthy();
    // A scale the model can actually anchor to — not just a lone brand color.
    expect(Object.keys(parsed.colors).length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(parsed.typography).length).toBeGreaterThanOrEqual(2);
    expect(parsed.spacing.unit).toBeTruthy();
    for (const [level, props] of Object.entries(parsed.typography)) {
      expect(props.fontFamily, `${name}: typography.${level} has no fontFamily`).toBeTruthy();
      expect(props.fontSize, `${name}: typography.${level} has no fontSize`).toBeTruthy();
    }
  });

  it.each(PROJECTS)('%s pairs every background color with an on-<name> text color', (name, dir) => {
    const { colors } = parseDesignTokens(readFileSync(join(dir, '_DESIGN.md'), 'utf-8'));
    const names = Object.keys(colors);
    const paired = names.filter((n) => n.startsWith('on-'));
    expect(paired.length, `${name} declares no on-<color> pairing`).toBeGreaterThan(0);
    for (const on of paired) {
      expect(names, `${name}: ${on} has no matching background token`).toContain(on.slice(3));
    }
  });

  it.each(PROJECTS)('%s exposes dot-path references for its tokens', (name, dir) => {
    const flat = flattenTokens(parseDesignTokens(readFileSync(join(dir, '_DESIGN.md'), 'utf-8')));
    expect([...flat.keys()].some((k) => k.startsWith('colors.'))).toBe(true);
    expect(flat.get('spacing.unit')).toBeTruthy();
  });

  // The trap this catches: a preset whose `config.json` vars carry a NAME under
  // a colour-ish key (acme's `vars.brand` is the string "Acme"). Declaring a
  // `brand` colour token there would canonically collide and fire a brand-token
  // conflict note on EVERY turn of a freshly scaffolded project.
  it.each(PROJECTS)('%s produces no brand-token conflict against its own config.json', async (name, dir) => {
    const files = {
      [DESIGN_SYSTEM_PATH]: readFileSync(join(dir, '_DESIGN.md'), 'utf-8'),
      '.lerret/config.json': readFileSync(join(dir, 'config.json'), 'utf-8'),
    };
    const notes = [];
    const sandbox = {
      exists: async (p) => Object.prototype.hasOwnProperty.call(files, p),
      readFile: async (p) => files[p],
    };
    const out = await createDsCuratorNode({
      sandbox,
      emit: (e) => e?.type === 'clarifying-note' && notes.push(e.note),
    })({});
    expect(notes, `${name} scaffolds into a conflicting brand state`).toEqual([]);
    expect(Object.keys(out.brandTokens).length).toBeGreaterThan(0);
  });
});
