import { spawn } from 'node:child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const RenderArgs = z.object({
  projectPath: z.string().describe('Path to Remotion entry point or project root.'),
  compositionId: z.string().describe('Composition ID to render.'),
  outputPath: z.string().describe('Output file path (e.g. /tmp/out.mp4).'),
  props: z.any().optional().nullable().describe('Input props: JSON object or JSON string or path to JSON file.'),
  extraArgs: z.array(z.string()).optional().default([]).describe('Extra args to pass to Remotion CLI (e.g. ["--codec=h264"]).'),
});

async function runRemotionRender({ projectPath, compositionId, outputPath, props, extraArgs }) {
  const args = ['-y', 'remotion', 'render', projectPath, compositionId, outputPath];

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
        resolve({ ok: true, outputPath, tail: out.slice(-4000) });
      } else {
        reject(new Error(`remotion render failed (code ${code})\n${err.slice(-4000)}`));
      }
    });
  });
}

const server = new Server(
  { name: 'genie-remotion', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.tool(
  'render_remotion',
  'Render a Remotion composition to a media file using `npx remotion render`.',
  RenderArgs,
  async (args) => {
    const result = await runRemotionRender(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
