import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const DEFAULT_TEMPLATE = path.resolve(new URL('.', import.meta.url).pathname, '../remotion-template/src/index.ts');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout: out, stderr: err });
      else reject(new Error(`${cmd} ${args.join(' ')} failed (code ${code})\n${err.slice(-4000)}`));
    });
  });
}

async function listCompositions({ projectPath, props }) {
  const entry = projectPath || DEFAULT_TEMPLATE;
  const args = ['-y', 'remotion', 'compositions', entry];
  if (props != null) {
    if (typeof props === 'string') args.push(`--props=${props}`);
    else args.push(`--props=${JSON.stringify(props)}`);
  }
  const { stdout } = await run('npx', args);
  return { ok: true, entry, stdout };
}

async function renderRemotion({ projectPath, compositionId, outputPath, props, extraArgs }) {
  const entry = projectPath || DEFAULT_TEMPLATE;
  const args = ['-y', 'remotion', 'render', entry, compositionId, outputPath];
  if (props != null) {
    if (typeof props === 'string') args.push(`--props=${props}`);
    else args.push(`--props=${JSON.stringify(props)}`);
  }
  for (const a of (extraArgs || [])) args.push(a);
  const { stdout } = await run('npx', args);
  return { ok: true, entry, outputPath, tail: stdout.slice(-2000) };
}

const tools = [
  {
    name: 'list_compositions',
    description: 'List compositions for a Remotion entry point using `npx remotion compositions`. If projectPath is omitted, uses the bundled template.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', nullable: true },
        props: { anyOf: [{ type: 'object' }, { type: 'string' }, { type: 'null' }], default: null },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'render_remotion',
    description: 'Render a Remotion composition using `npx remotion render`. If projectPath is omitted, uses the bundled template.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', nullable: true },
        compositionId: { type: 'string' },
        outputPath: { type: 'string' },
        props: { anyOf: [{ type: 'object' }, { type: 'string' }, { type: 'null' }], default: null },
        extraArgs: { type: 'array', items: { type: 'string' }, default: [] },
      },
      required: ['compositionId', 'outputPath'],
      additionalProperties: false,
    },
  },
];

const server = new Server(
  { name: 'genie-remotion', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'list_compositions') {
      const result = await listCompositions(args || {});
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
    if (name === 'render_remotion') {
      const result = await renderRemotion(args || {});
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: false, error: `Unknown tool: ${name}` }) }],
      isError: true,
    };
  } catch (e) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: false, error: e?.message || String(e) }) }],
      isError: true,
    };
  }
});

await server.connect(new StdioServerTransport());
