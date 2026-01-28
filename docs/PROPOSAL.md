# Proposal: Remotion rendering tool for Genie (MCP)

## Goal
Give Genie a reliable, scriptable way to **render videos** using Remotion, callable as a tool.

Remotion’s official MCP server (`@remotion/mcp`) is **docs search only**. We keep that for answering API questions, but we need a second MCP server for rendering.

## MVP tool

### `render_remotion`

Render a Remotion composition to a media file using the Remotion CLI.

Inputs:
- `projectPath` — path to Remotion entry point or project directory (what you’d pass to `npx remotion render`)
- `compositionId` — composition ID
- `outputPath` — output file path (e.g. `/tmp/out.mp4`)
- `props` — optional: JSON object / JSON string / JSON file path (forwarded to `--props`)
- `extraArgs` — optional: array of extra CLI flags (codec, fps, etc.)

Output:
- `{ ok: true, outputPath }` (+ tail logs)

## Why CLI first
- Stable, documented interface: `npx remotion render` + `--props`
- Lower engineering surface area than `@remotion/renderer`.
- Easy to harden: timeouts, logging, sandboxing.

## What’s next (V2)
- Add tools for:
  - `list_compositions` (via `npx remotion compositions`)
  - `bundle_project` (produce `serveUrl` for faster repeated renders)
  - `render_still`
- Add a **template project** for common tasks:
  - captioned talking-head
  - product demo from screenshots
  - dashboard animation
- Optional pipeline modules:
  - Whisper transcript → word timestamps → captions
  - Auphonic audio cleanup

## Security & ops
- This runs local processes that invoke ffmpeg. Keep it LAN/local only.
- Enforce output directory allowlist.
- Add max render duration.
