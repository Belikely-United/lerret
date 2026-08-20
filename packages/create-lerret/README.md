# create-lerret

> Scaffolder for new [Lerret](https://github.com/belikely-united/lerret) projects — an open-source design canvas where a folder of React component files renders as a visual canvas.

[![npm](https://img.shields.io/npm/v/create-lerret.svg)](https://www.npmjs.com/package/create-lerret)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/belikely-united/lerret/blob/main/LICENSE)

## Usage

```sh
npx create-lerret@latest my-canvas
cd my-canvas
npx @lerret/cli@latest dev
```

Or with other runners:

```sh
pnpm dlx create-lerret@latest my-canvas
yarn dlx create-lerret@latest my-canvas
bunx create-lerret@latest my-canvas
```

## Options

```sh
create-lerret <project-name>                            # 5-page teaching kit + AI-tool files
create-lerret <project-name> --no-samples               # minimal empty project
create-lerret <project-name> --no-ai-rules              # skip every AI-tool file
create-lerret <project-name> --ai-tools=claude,cursor   # scope which AI-tool files ship
create-lerret <project-name> --preset acme              # scaffold a named preset instead
create-lerret <project-name> --demo                     # teaching kit + walkthrough, then launches the studio
create-lerret --help                                    # usage banner (also -h)
```

- `--no-samples` writes only `.lerret/config.json`, with an empty `vars` map — no pages, no assets, no `_fonts/`. The canvas opens on the empty state. AI-tool files still ship unless you also pass `--no-ai-rules` or `--ai-tools=…`.
- `--no-ai-rules` skips all four AI-tool surfaces.
- `--ai-tools=<list>` is a comma-separated list of `claude`, `cursor`, `copilot`, `agents` — only the named surfaces are written. Pass it once; a repeated flag is rejected rather than silently reduced to the last value.
- `--preset <name>` scaffolds a preset in place of the teaching kit: `acme` (brand starter), `appstore` (App Store screenshots), `producthunt` (launch assets), `social-media` (six social sizes), `talks` (conference slides), `personal` (homepage assets), `live` (LiveRefresh demos).
- `--demo` scaffolds the default teaching kit, writes a `.lerret/.state/first-run.json` marker so the studio offers the walkthrough on first mount, then detaches `npx -y @lerret/cli@latest dev --open` in the new project. That is not scaffold-only: it may download `@lerret/cli`, start a dev server that keeps running after the scaffolder exits, and open a browser. Starting the studio is best-effort — if the spawn fails you still have the project and can run `dev` yourself.

Mutually exclusive pairs (the CLI exits 1 and explains): `--no-ai-rules` with `--ai-tools`; `--preset` with `--no-samples`; `--demo` with `--preset`; `--demo` with `--no-samples`.

## What it produces

```
my-canvas/
├── .lerret/
│   ├── config.json
│   ├── README.md
│   ├── _fonts/
│   │   ├── LerretFixtureMono.woff2
│   │   └── NOTICE
│   ├── intro/
│   │   ├── config.json
│   │   └── welcome.md
│   ├── landing/
│   │   ├── landing-hero.jsx
│   │   └── about-vars.md
│   ├── social/
│   │   ├── tw-banner.jsx
│   │   ├── tw-banner.data.json
│   │   ├── og-card.jsx
│   │   ├── og-card.data.json
│   │   └── about-data-files.md
│   ├── brand/
│   │   ├── business-card.jsx
│   │   ├── business-card.data.json
│   │   └── about-validation.md
│   └── live/
│       ├── config.json
│       ├── clock.jsx
│       ├── clock.config.json
│       ├── counter.jsx
│       ├── counter.config.json
│       └── about-live-refresh.md
├── .claude/
│   ├── skills/lerret-author/SKILL.md
│   └── commands/lerret-edit.md
├── .cursor/rules/lerret.mdc
├── .github/copilot-instructions.md
└── AGENTS.md
```

Every top-level folder under `.lerret/` is a page, except reserved underscore-prefixed folders like `_fonts/`. Each `.jsx` in a page is an artboard; each `.md` is one too, rendered as a Markdown card — which is why the teaching notes (`about-vars.md`, `about-data-files.md`, `about-validation.md`, `about-live-refresh.md`) read on the canvas beside the assets they explain. Five pages, five lessons: `intro` welcomes you, `landing` covers config vars, `social` covers `.data.json` sidecars, `brand` covers props validation, and `live` covers LiveRefresh via `.config.json`.

The AI-tool files sit outside `.lerret/` and are rendered at scaffold time rather than copied from the template, so your editor's assistant knows how to author Lerret assets from the first prompt.

## Source & docs

- Source: [github.com/belikely-united/lerret](https://github.com/belikely-united/lerret) (`packages/create-lerret/`)
- Documentation: [docs.lerret.io](https://docs.lerret.io)

## License

[MIT](https://github.com/belikely-united/lerret/blob/main/LICENSE) — free to use, self-host, modify, and share.
