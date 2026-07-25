// @vitest-environment node
//
// Unit tests for the design-token parser (design-tokens.js, PURE).

import { describe, it, expect } from 'vitest';

import { parseDesignTokens, flattenTokens, lookupToken } from './design-tokens.js';

const CANONICAL = [
  '---',
  'name: Acme',
  'description: Calm, technical, builder-to-builder.',
  'colors:',
  '  brand: "#B85B33"',
  '  on-brand: "#FFFFFF"',
  '  neutralDark: "#1A1714"',
  'typography:',
  '  display:',
  '    fontFamily: Geist',
  '    fontSize: 72px',
  '    fontWeight: "700"',
  '    lineHeight: 76px',
  '    letterSpacing: -0.03em',
  '  body:',
  '    fontFamily: Geist',
  '    fontSize: 18px',
  'spacing:',
  '  unit: 8px',
  '  gutter: 48px',
  'rounded:',
  '  DEFAULT: 12px',
  '  full: 9999px',
  '---',
  '',
  '## Overview',
  'Calm and factual.',
  '',
  '## Voice',
  '- calm',
].join('\n');

describe('parseDesignTokens — canonical front matter', () => {
  it('captures meta', () => {
    const { meta } = parseDesignTokens(CANONICAL);
    expect(meta.name).toBe('Acme');
    expect(meta.description).toBe('Calm, technical, builder-to-builder.');
  });

  it('extracts the color palette', () => {
    const { colors } = parseDesignTokens(CANONICAL);
    expect(colors.brand).toBe('#B85B33');
    expect(colors['on-brand']).toBe('#FFFFFF');
    expect(colors.neutralDark).toBe('#1A1714');
  });

  it('extracts composite typography levels with every property', () => {
    const { typography } = parseDesignTokens(CANONICAL);
    expect(typography.display).toEqual({
      fontFamily: 'Geist',
      fontSize: '72px',
      fontWeight: '700',
      lineHeight: '76px',
      letterSpacing: '-0.03em',
    });
    expect(typography.body.fontSize).toBe('18px');
  });

  it('extracts the spacing and rounded scales', () => {
    const { spacing, rounded } = parseDesignTokens(CANONICAL);
    expect(spacing.unit).toBe('8px');
    expect(spacing.gutter).toBe('48px');
    expect(rounded.DEFAULT).toBe('12px');
    expect(rounded.full).toBe('9999px');
  });

  it('parses cleanly — no warnings on a canonical file', () => {
    expect(parseDesignTokens(CANONICAL).warnings).toEqual([]);
  });

  it('ignores prose after the front matter', () => {
    const { colors } = parseDesignTokens(CANONICAL);
    expect(Object.keys(colors)).not.toContain('calm');
  });

  it('accepts 4-space indentation (indent is relative, not fixed)', () => {
    const md = [
      '---',
      'colors:',
      '    brand: "#B85B33"',
      'typography:',
      '    display:',
      '        fontFamily: Geist',
      '---',
    ].join('\n');
    const { colors, typography, warnings } = parseDesignTokens(md);
    expect(colors.brand).toBe('#B85B33');
    expect(typography.display.fontFamily).toBe('Geist');
    expect(warnings).toEqual([]);
  });
});

describe('parseDesignTokens — unknown keys (no more silent drops)', () => {
  it('warns on an unrecognized top-level group and reads none of its entries', () => {
    const md = [
      '---',
      'shadows:',
      '  soft: 0 2px 4px',
      'colors:',
      '  brand: "#000"',
      '---',
    ].join('\n');
    const { colors, warnings } = parseDesignTokens(md);
    expect(colors.brand).toBe('#000');
    expect(colors.soft).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("'shadows'");
  });

  it('warns on `fonts:` — families live under typography only', () => {
    const md = ['---', 'fonts:', '  display: Geist', '---'].join('\n');
    const { warnings } = parseDesignTokens(md);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("'fonts'");
  });

  it('stays silent on spec-known keys Lerret does not read', () => {
    const md = [
      '---',
      'version: alpha',
      'components:',
      '  button-primary:',
      '    backgroundColor: "#000"',
      'colors:',
      '  brand: "#B85B33"',
      '---',
    ].join('\n');
    const { colors, warnings } = parseDesignTokens(md);
    expect(colors.brand).toBe('#B85B33');
    expect(warnings).toEqual([]);
  });

  it('warns when a typography level is written flat instead of as a block', () => {
    const md = ['---', 'typography:', '  display: Geist', '---'].join('\n');
    const { typography, warnings } = parseDesignTokens(md);
    expect(typography.display).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('typography.display');
  });
});

describe('parseDesignTokens — values with trailing YAML-style comments', () => {
  it('a quoted value takes the quoted content, ignoring a trailing comment', () => {
    const md = ['---', 'colors:', '  brand: "#B85B33" # primary', '---'].join('\n');
    expect(parseDesignTokens(md).colors.brand).toBe('#B85B33');
  });

  it('an unquoted value strips a trailing ` # comment` without eating a bare hex', () => {
    const md = ['---', 'colors:', '  brand: #B85B33', '  size: 12px # note', '---'].join(
      '\n',
    );
    const { colors } = parseDesignTokens(md);
    expect(colors.brand).toBe('#B85B33'); // bare hex untouched
    expect(colors.size).toBe('12px'); // comment stripped
  });
});

describe('parseDesignTokens — fail-soft', () => {
  it('warns and returns empty groups when there is no front matter', () => {
    const { colors, typography, warnings } = parseDesignTokens('# just prose, no tokens');
    expect(Object.keys(colors)).toHaveLength(0);
    expect(Object.keys(typography)).toHaveLength(0);
    expect(warnings[0]).toContain('no YAML front matter');
  });

  it('ignores a stray lerret-tokens fence — it is prose, not a token format', () => {
    const md = [
      '# Design',
      '',
      '```lerret-tokens',
      'colors:',
      '  brand: "#B85B33"',
      '```',
    ].join('\n');
    const { colors, warnings } = parseDesignTokens(md);
    expect(Object.keys(colors)).toHaveLength(0);
    expect(warnings[0]).toContain('no YAML front matter');
  });

  it('front matter must open the file — a later `---` does not count', () => {
    const md = ['# Title', '---', 'colors:', '  brand: "#000"', '---'].join('\n');
    expect(Object.keys(parseDesignTokens(md).colors)).toHaveLength(0);
  });

  it('returns empty groups for non-string / empty input (never throws)', () => {
    expect(Object.keys(parseDesignTokens('').colors)).toHaveLength(0);
    expect(Object.keys(parseDesignTokens(null).typography)).toHaveLength(0);
    expect(Object.keys(parseDesignTokens(undefined).colors)).toHaveLength(0);
  });

  it('an unterminated front-matter block is not read', () => {
    const md = ['---', 'colors:', '  brand: "#000"'].join('\n');
    expect(Object.keys(parseDesignTokens(md).colors)).toHaveLength(0);
  });
});

describe('flattenTokens', () => {
  const flat = flattenTokens(parseDesignTokens(CANONICAL));

  it('exposes bare color names for the prompt keyword scan', () => {
    expect(flat.get('brand')).toBe('#B85B33');
    expect(flat.get('on-brand')).toBe('#FFFFFF');
  });

  it('exposes each typography level bare, resolving to its font family', () => {
    expect(flat.get('display')).toBe('Geist');
    expect(flat.get('body')).toBe('Geist');
  });

  it('exposes dot-path keys for {group.token} references', () => {
    expect(flat.get('colors.brand')).toBe('#B85B33');
    expect(flat.get('spacing.unit')).toBe('8px');
    expect(flat.get('rounded.full')).toBe('9999px');
    expect(flat.get('typography.display.fontSize')).toBe('72px');
    expect(flat.get('typography.display.letterSpacing')).toBe('-0.03em');
  });

  it('a color wins a bare-name collision with a typography level', () => {
    const md = [
      '---',
      'colors:',
      '  display: "#B85B33"',
      'typography:',
      '  display:',
      '    fontFamily: Geist',
      '---',
    ].join('\n');
    const f = flattenTokens(parseDesignTokens(md));
    expect(f.get('display')).toBe('#B85B33');
    // The typography value is still reachable by its dot path.
    expect(f.get('typography.display.fontFamily')).toBe('Geist');
  });

  it('returns an empty map for missing input', () => {
    expect(flattenTokens(null).size).toBe(0);
  });
});

describe('lookupToken — case-insensitive BOTH directions', () => {
  const flat = flattenTokens(parseDesignTokens(CANONICAL));

  it('a lowercase query resolves a mixed-case stored key', () => {
    expect(lookupToken(flat, 'neutraldark')).toBe('#1A1714');
    expect(lookupToken(flat, 'neutralDark')).toBe('#1A1714'); // verbatim still wins
  });

  it('a mixed-case query resolves a lowercase stored key', () => {
    expect(lookupToken(flat, 'Brand')).toBe('#B85B33');
    expect(lookupToken(flat, 'BRAND')).toBe('#B85B33');
  });

  it('resolves dot paths case-insensitively too', () => {
    expect(lookupToken(flat, 'COLORS.BRAND')).toBe('#B85B33');
    expect(lookupToken(flat, 'typography.display.fontsize')).toBe('72px');
  });

  it('misses and bad inputs return undefined (never throw)', () => {
    expect(lookupToken(flat, 'nope')).toBeUndefined();
    expect(lookupToken(null, 'brand')).toBeUndefined();
    expect(lookupToken(flat, undefined)).toBeUndefined();
  });
});
