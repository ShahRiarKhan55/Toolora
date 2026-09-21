import { SITE_NAME } from '@toolora/shared';

// Phase 1 skeleton: proves the toolchain end to end. Replaced by the real shell in Phase 2.
export function App() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">{SITE_NAME}</h1>
      <p className="mt-2 text-slate-600">
        Toolora is under construction. No tools are available yet.
      </p>
    </main>
  );
}
