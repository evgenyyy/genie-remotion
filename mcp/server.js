import { spawn } from 'node:child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

function runRemotionRender({ projectPath, compositionId, outputPath, props, extraArgs }) {
  const args = ['-y', 'remotion', 'render', projectPath, compositionId, outputPath];

  if (props != null) {
    if (typeof props === 'string') {
      args.push(`--props=${props}`);
    } else {
      args.push(`--props=${JSON.stringify(props)}`);
    }
  }
  for (const a of (extraArgs || [])) args.push(a);

  return new Promise((resolve, reject) => {
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

const tools = [
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
          anyOf: [{ type: 'object' }, { type: 'string' }, { type: 'null' }],
          default: null,
          description: 'Input props: JSON object, JSON string, or path to JSON file. Passed to --props.',
        },
        extraArgs: {
          type: 'array',
          items: { type: 'string' },
          default: [],
          description: 'Extra CLI args to pass through (e.g. ["--codec=h264"]).',
        },
      },
      required: ['projectPath', 'compositionId', 'outputPath'],
      additionalProperties: false,
    },
  },
];

const server = new Server(
  { name: 'genie-remotion', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name !== 'render_remotion') {
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: false, error: `Unknown tool: ${name}` }) }],
      isError: true,
    };
  }

  const result = await runRemotionRender(args || {});
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
