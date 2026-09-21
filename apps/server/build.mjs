// Bundles the server into a single file. Third-party dependencies stay external (installed from
// node_modules at runtime); workspace packages such as @toolora/shared are inlined because they
// ship as TypeScript source.
import { readFileSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies).filter((name) => !name.startsWith('@toolora/'));

rmSync(new URL('./dist', import.meta.url), { recursive: true, force: true });

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: external.flatMap((name) => [name, `${name}/*`]),
  logLevel: 'info',
});
