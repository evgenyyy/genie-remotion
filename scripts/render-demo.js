// Example direct invocation (no MCP)
import { spawnSync } from 'node:child_process';

const projectPath = process.argv[2];
const compositionId = process.argv[3];
const outputPath = process.argv[4] || '/tmp/remotion-demo.mp4';

if (!projectPath || !compositionId) {
  console.error('Usage: node scripts/render-demo.js <projectPath|entrypoint> <compositionId> [outputPath]');
  process.exit(2);
}

const args = ['-y', 'remotion', 'render', projectPath, compositionId, outputPath, '--props={"title":"Hello"}'];
const r = spawnSync('npx', args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
