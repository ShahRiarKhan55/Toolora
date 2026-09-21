import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

export interface Database {
  readonly prisma: PrismaClient;
  /** Rejects if the database cannot be queried. */
  ping(): Promise<void>;
  close(): Promise<void>;
}

/** `url` is a Prisma-style SQLite URL such as `file:./prisma/dev.db`, or `:memory:` for tests. */
export function createDatabase(url: string): Database {
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  return {
    prisma,
    async ping() {
      await prisma.$queryRaw`SELECT 1`;
    },
    close: () => prisma.$disconnect(),
  };
}
