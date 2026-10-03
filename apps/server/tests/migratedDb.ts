import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDatabase } from '../src/db';
import type { Database } from '../src/db';

const MIGRATIONS = join(import.meta.dirname, '..', '..', '..', 'prisma', 'migrations');

/** An in-memory database with the real migrations applied, so tests run against the shipped schema. */
export async function createMigratedDatabase(): Promise<Database> {
  const db = createDatabase(':memory:');
  for (const dir of readdirSync(MIGRATIONS, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  )) {
    const sql = readFileSync(join(MIGRATIONS, dir.name, 'migration.sql'), 'utf8');
    for (const statement of sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      await db.prisma.$executeRawUnsafe(statement);
    }
  }
  return db;
}
