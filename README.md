# genie-remotion

A proposal + reference implementation for a **Genie/Clawdbot video rendering tool** using **Remotion**.

## Why this exists

Remotion provides an MCP server, but it’s **documentation search only** (helps answer questions about Remotion). It does **not** render videos.

This repo implements a small **MCP server** that can **render Remotion compositions** on demand (locally), so Genie can call it as a tool.

## Scope (MVP)

- Provide a tool: `render_remotion`
- Inputs:
  - `projectPath` (path to a Remotion project)
  - `compositionId`
  - `outputPath`
  - `props` (JSON object or path)
  - optional render flags (codec, fps, etc.)
- Action:
  - run `npx remotion render ... --props ...` non-interactively
- Output:
  - return `{ ok: true, outputPath }`

## Architecture

```
Genie (Clawdbot)
  └─ mcporter → MCP stdio server (this repo)
       └─ spawns: npx remotion render ... (Remotion CLI)
             └─ ffmpeg renders MP4
```

Why CLI first:
- Lowest-risk, easiest to harden.
- Uses Remotion’s supported interface.
- We can switch to `@remotion/renderer` later if we need tighter control.

## Requirements

- Node.js (already)
- Remotion includes a bundled FFmpeg on most platforms; if you hit an FFmpeg error, install ffmpeg via your OS package manager.

## What’s included

- `mcp/server.js` — MCP stdio server exposing a `render_remotion` tool
- `scripts/render-demo.js` — quick local demo call (no MCP)
- `remotion-project/` — placeholder for a Remotion project (you can plug in your own)

## Install (local)

```bash
cd /home/evgeny/clawd/work/genie-remotion
npm i
```

## Run MCP server

```bash
npm run dev
```

## Add to mcporter (so Genie can call it)

```bash
mcporter config add genie-remotion \
  --command node \
  --arg /home/evgeny/clawd/work/genie-remotion/mcp/server.js \
  --scope home \
  --description "Render Remotion videos (local)"

mcporter list | grep genie-remotion
mcporter list genie-remotion --schema
```

## Example tool call

```bash
mcporter call genie-remotion.render_remotion \
  projectPath=/path/to/remotion-project \
  compositionId=Main \
  outputPath=/tmp/out.mp4 \
  props='{"title":"Hello"}'
```

## Next steps (after MVP)

- Add a template Remotion project with:
  - captioned video composition
  - “website promo” composition
  - simple “dashboard demo” composition
- Add optional pipeline steps:
  - whisper transcript → word timestamps → captions
  - audio enhance (Auphonic) step
- Add caching + deterministic outputs

---

Notes:
- Remotion CLI docs: https://www.remotion.dev/docs/cli/render
- `--props` supports JSON string or file.
