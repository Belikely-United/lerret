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
create-lerret <project-name>                  # 5-page teaching kit + AI-tool files
create-lerret <project-name> --no-samples     # minimal empty project (.lerret/config.json only)
create-lerret <project-name> --no-ai-rules    # skip all AI-tool files
create-lerret <project-name> --ai-tools=claude,cursor   # scope AI surfaces
create-lerret <project-name> --preset acme    # named preset from presets.json
create-lerret <project-name> --demo           # teaching preset + first-run walkthrough marker
```

- `--no-samples` still ships the AI-tool files unless `--no-ai-rules` is also set.
- `--ai-tools=<list>` accepts `claude`, `cursor`, `copilot`, `agents`. Mutually exclusive with `--no-ai-rules`.
- `--preset <name>` accepts `acme`, `appstore`, `producthunt`, `social-media`, `talks`, `personal`, `live`.

## What it produces

```
my-canvas/
├── .lerret/
│   ├── config.json
│   ├── README.md
│   ├── _fonts/
│   │   └── LerretFixtureMono.woff2
│   ├── intro/
│   │   ├── welcome.md
│   │   └── config.json
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

Each `.jsx` under `.lerret/` is an asset that renders as an artboard in the studio; each top-level folder is a page. The `.md` files are the teaching notes for that page, and the AI-tool files are rendered at scaffold time so your editor's assistant knows how to author Lerret assets.

## Source & docs

- Source: [github.com/belikely-united/lerret](https://github.com/belikely-united/lerret) (`packages/create-lerret/`)
- Documentation: [docs.lerret.belikely.com](https://docs.lerret.belikely.com)

## License

[MIT](https://github.com/belikely-united/lerret/blob/main/LICENSE) — free to use, self-host, modify, and share.
