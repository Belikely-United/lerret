// Design-token parser (AC-3 primary authority) — PURE: no fs, no DOM, no
// markdown library, no YAML library, no `node:*`. Reads the brand tokens out of
// `_DESIGN.md`'s YAML front matter.
//
// ── Canonical `_DESIGN.md` format ────────────────────────────────────────────
//
// `.lerret/_DESIGN.md` follows Google Labs' open DESIGN.md format
// (https://github.com/google-labs-code/design.md, Apache-2.0): YAML front
// matter carrying machine-readable tokens, then `##` sections of human/agent
// guidance. Lerret's file is a SUPERSET — it adds a `## Voice` section and
// `<!-- scope: <folder>/ -->` per-folder overrides, both of which the upstream
// spec permits (unknown sections are preserved, not errors).
//
//     ---
//     name: Acme
//     description: Calm, technical, builder-to-builder.
//     colors:
//       brand: "#B85B33"
//       on-brand: "#FFFFFF"
//     typography:
//       display:
//         fontFamily: Geist
//         fontSize: 72px
//         fontWeight: "700"
//         lineHeight: 76px
//         letterSpacing: -0.03em
//     spacing:
//       unit: 8px
//     rounded:
//       DEFAULT: 12px
//     ---
//
//     ## Overview
//     …prose the Memory agent feeds to the model…
//
// Rules the parser honors:
//   - Front matter ONLY: the file must OPEN with `---` on line 1, and the block
//     ends at the next line that is exactly `---`. No front matter → empty
//     tokens + one warning (the prose still reaches the model via Memory).
//   - Recognized top-level groups: `colors`, `typography`, `spacing`, `rounded`.
//     `name` / `description` are captured as `meta`. Any OTHER top-level key
//     closes the open group and collects no values; `version` and `components`
//     are spec-known so they pass silently, anything else raises a warning
//     (including `fonts:` — font families live at `typography.<level>.fontFamily`
//     and nowhere else).
//   - `colors` / `spacing` / `rounded` are FLAT maps (one indent level).
//     `typography` is COMPOSITE: each level opens with a valueless key, and its
//     properties sit one level deeper. A `typography` entry written flat
//     (`display: Geist`) is a warning, not a token.
//   - Indent is measured RELATIVELY (deeper than the parent line), so a
//     hand-authored file with 2- or 4-space indents both work. A tab counts as
//     one character.
//   - Values may be quoted ("…" or '…') or bare. A quoted value is the quoted
//     content — anything after the closing quote (a trailing `# comment`) is
//     ignored. An unquoted value strips a trailing ` # comment` (whitespace
//     before the `#` required, so a bare hex like `#B85B33` is untouched).
//   - Malformed / absent input fails SOFT: empty maps + warnings, never a throw
//     (AC-3 graceful absence).

/** Top-level groups whose entries are flat `name: value` tokens. */
const FLAT_GROUPS = new Set(['colors', 'spacing', 'rounded']);

/** Top-level scalar keys captured into `meta`. */
const META_KEYS = new Set(['name', 'description']);

/**
 * Upstream-spec top-level keys Lerret does not read but must not complain
 * about — a spec-valid `_DESIGN.md` may carry them (`components` is web-UI
 * chrome, deliberately not adopted).
 */
const SPEC_KNOWN_UNREAD = new Set(['version', 'components']);

/**
 * Resolve a raw value to its token value:
 *   - a QUOTED value ("…" or '…') yields the quoted content; anything after
 *     the closing quote (a trailing YAML-style ` # comment`) is ignored;
 *   - an UNQUOTED value strips a trailing ` # comment` — the strip pattern
 *     requires at least one non-space value character followed by whitespace
 *     before the `#`, so a bare hex value like `#B85B33` is never eaten.
 * Trims whitespace.
 *
 * @param {string} raw
 * @returns {string}
 */
function unquote(raw) {
  const v = String(raw ?? '').trim();
  const dq = /^"([^"]*)"/.exec(v);
  if (dq) return dq[1];
  const sq = /^'([^']*)'/.exec(v);
  if (sq) return sq[1];
  return v.replace(/(\S)\s+#.*$/, '$1');
}

/**
 * Extract the YAML front-matter body from a `_DESIGN.md`. The file must OPEN
 * with `---` (line 1, no leading blank lines or BOM — strict, matching the
 * upstream spec); the block ends at the next line that is exactly `---`.
 *
 * @param {string} markdown
 * @returns {string | null}  The block body, or `null` when there is no front matter.
 */
function extractFrontMatter(markdown) {
  if (typeof markdown !== 'string' || markdown.length === 0) return null;
  const lines = markdown.split('\n');
  if (lines[0].replace(/\r$/, '').trim() !== '---') return null;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].replace(/\r$/, '').trim() === '---') {
      return lines.slice(1, i).join('\n');
    }
  }
  return null;
}

/**
 * @typedef {{
 *   meta: Record<string, string>,
 *   colors: Record<string, string>,
 *   typography: Record<string, Record<string, string>>,
 *   spacing: Record<string, string>,
 *   rounded: Record<string, string>,
 *   warnings: string[],
 * }} ParsedDesign
 */

/**
 * Parse `_DESIGN.md`'s front matter into brand tokens. Fail-soft: bad input
 * yields empty groups plus warnings, never a throw.
 *
 * @param {string} designMarkdown  The full `_DESIGN.md` body.
 * @returns {ParsedDesign}
 */
export function parseDesignTokens(designMarkdown) {
  /** @type {ParsedDesign} */
  const out = {
    meta: Object.create(null),
    colors: Object.create(null),
    typography: Object.create(null),
    spacing: Object.create(null),
    rounded: Object.create(null),
    warnings: [],
  };

  const block = extractFrontMatter(designMarkdown);
  if (block === null) {
    out.warnings.push('_DESIGN.md has no YAML front matter — no brand tokens were read.');
    return out;
  }

  /** The open top-level group name, or null. */
  let group = null;
  /** The open typography level name, or null. */
  let level = null;
  /** Indent of the line that opened `group` (its entries sit deeper than this). */
  let groupIndent = 0;
  /** Indent of the line that opened `level` (its props sit deeper than this). */
  let levelIndent = 0;

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.trim().length === 0) continue;
    if (/^[ \t]*#/.test(line)) continue; // whole-line comment

    const m = /^([ \t]*)([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const indent = m[1].length;
    const key = m[2];
    const value = m[3];
    const hasValue = value.trim().length > 0;

    // ── Top level ──────────────────────────────────────────────────────────
    if (indent === 0) {
      group = null;
      level = null;
      groupIndent = 0;
      const lower = key.toLowerCase();

      if (META_KEYS.has(lower)) {
        if (hasValue) out.meta[lower] = unquote(value);
        continue;
      }
      if (!hasValue && (FLAT_GROUPS.has(lower) || lower === 'typography')) {
        group = lower;
        groupIndent = indent;
        continue;
      }
      if (!SPEC_KNOWN_UNREAD.has(lower)) {
        out.warnings.push(
          `_DESIGN.md: ignored unrecognized top-level key '${key}'${
            hasValue ? '' : ' — its entries were not read'
          }.`,
        );
      }
      continue;
    }

    // ── Inside a group ─────────────────────────────────────────────────────
    if (group === null) continue;

    // Level-2: a property of the open typography level.
    if (level !== null && indent > levelIndent) {
      if (hasValue) out.typography[level][key] = unquote(value);
      continue;
    }

    // Level-1: an entry of the open group.
    if (indent > groupIndent) {
      level = null;
      if (group === 'typography') {
        if (hasValue) {
          out.warnings.push(
            `_DESIGN.md: typography.${key} must be a block of properties ` +
              `(fontFamily, fontSize, …), not a single value — ignored.`,
          );
          continue;
        }
        level = key;
        levelIndent = indent;
        out.typography[key] = Object.create(null);
        continue;
      }
      if (hasValue) out[group][key] = unquote(value);
    }
  }

  return out;
}

/**
 * Flatten parsed tokens into ONE `name → value` lookup map for the DS Curator
 * and the agent prompt. Two key styles live in the same map:
 *
 *   - BARE names, for the prompt keyword scan ("our brand orange"): every
 *     `colors.<k>` as `<k>`, and every typography level as `<level>` → its
 *     `fontFamily` (so "the display font" resolves). Colors win a collision.
 *   - DOT PATHS, for `{colors.brand}` references in prose: `colors.<k>`,
 *     `spacing.<k>`, `rounded.<k>`, `typography.<level>.<prop>`. These can
 *     never collide with bare names — they contain a `.`.
 *
 * @param {ParsedDesign} parsed
 * @returns {Map<string, string>}
 */
export function flattenTokens(parsed) {
  const flat = new Map();
  if (!parsed) return flat;

  // Bare typography names go in first so a same-named color wins the collision.
  for (const [level, props] of Object.entries(parsed.typography ?? {})) {
    if (props && typeof props.fontFamily === 'string') flat.set(level, props.fontFamily);
    for (const [prop, value] of Object.entries(props ?? {})) {
      flat.set(`typography.${level}.${prop}`, value);
    }
  }
  for (const [k, v] of Object.entries(parsed.colors ?? {})) {
    flat.set(k, v);
    flat.set(`colors.${k}`, v);
  }
  for (const groupName of ['spacing', 'rounded']) {
    for (const [k, v] of Object.entries(parsed[groupName] ?? {})) {
      flat.set(`${groupName}.${k}`, v);
    }
  }
  return flat;
}

/**
 * Case-insensitive token lookup. A verbatim hit wins; otherwise the query is
 * lowercased and probed against a lowercase scan of the map, so `Brand`,
 * `BRAND`, and `neutraldark` all resolve their stored spellings without the
 * map having to carry mirrored keys.
 *
 * @param {Map<string, string>} map  A map from {@link flattenTokens}.
 * @param {string} name  The token reference, any casing.
 * @returns {string | undefined}
 */
export function lookupToken(map, name) {
  if (!(map instanceof Map)) return undefined;
  const key = String(name ?? '');
  if (map.has(key)) return map.get(key);
  const lower = key.toLowerCase();
  if (map.has(lower)) return map.get(lower);
  for (const [k, v] of map) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}
