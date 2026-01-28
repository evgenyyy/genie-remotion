import { spawn } from 'node:child_process';

// Minimal MCP server (stdio) without extra deps.
// Implements a tiny subset of the MCP JSON-RPC-ish protocol that mcporter supports.
//
// Tools:
// - render_remotion(projectPath, compositionId, outputPath, props, extraArgs?)

function readStdinLines(onLine) {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    while (true) {
      const idx = buf.indexOf('\n');
      if (idx === -1) break;
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      onLine(line);
    }
  });
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function toolSchema() {
  return {
    tools: [
      {
        name: 'render_remotion',
        description: 'Render a Remotion composition to a media file using `npx remotion render`.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: { type: 'string', description: 'Path to Remotion entry point or project root.' },
            compositionId: { type: 'string', description: 'Composition ID to render.' },
            outputPath: { type: 'string', description: 'Output file path (e.g. /tmp/out.mp4).' },
            props: {
              description: 'Input props: either a JSON object, a JSON string, or a path to a JSON file.',
              anyOf: [
                { type: 'object' },
                { type: 'string' },
                { type: 'null' }
              ],
              default: null
            },
            extraArgs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Additional args to pass to Remotion CLI (e.g. ["--codec=h264"]).',
              default: []
            }
          },
          required: ['projectPath', 'compositionId', 'outputPath']
        }
      }
    ]
  };
}

async function runRemotionRender({ projectPath, compositionId, outputPath, props, extraArgs }) {
  const args = ['-y', 'remotion', 'render', projectPath, compositionId, outputPath];

  // Remotion expects --props as a JSON string or file path.
  if (props != null) {
    if (typeof props === 'string') {
      args.push(`--props=${props}`);
    } else {
      args.push(`--props=${JSON.stringify(props)}`);
    }
  }

  for (const a of (extraArgs || [])) args.push(a);

  return await new Promise((resolve, reject) => {
    const child = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';

    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true, outputPath, stdout: out.slice(-4000) });
      } else {
        reject(new Error(`remotion render failed (code ${code})\n${err.slice(-4000)}`));
      }
    });
  });
}

send({ type: 'ready' });

readStdinLines(async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }

  // mcporter expects a schema response
  if (msg.type === 'list_tools') {
    send({ type: 'list_tools_result', ...toolSchema() });
    return;
  }

  if (msg.type === 'call_tool') {
    const { id, name, args } = msg;
    try {
      if (name === 'render_remotion') {
        const result = await runRemotionRender(args || {});
        send({ type: 'call_tool_result', id, ok: true, result });
        return;
      }
      send({ type: 'call_tool_result', id, ok: false, error: { message: `Unknown tool: ${name}` } });
    } catch (e) {
      send({ type: 'call_tool_result', id, ok: false, error: { message: e?.message || String(e) } });
    }
  }
});
