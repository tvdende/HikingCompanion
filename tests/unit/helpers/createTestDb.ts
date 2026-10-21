import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../../apps/api/src/db/schema.js';

export function createTestDb() {
  const sqlite = new DatabaseSync(':memory:');

  // Load and apply all migration SQL files in order
  const migrationsDir = resolve(
    import.meta.dirname,
    '../../../apps/api/drizzle/migrations'
  );
  const sqlFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    const migrationSql = readFileSync(resolve(migrationsDir, file), 'utf8');
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      sqlite.exec(statement);
    }
  }

  const d1 = {
    prepare(query: string) {
      let boundParams: unknown[] = [];
      return {
        bind(...params: unknown[]) {
          boundParams = params.map((p) => {
            if (typeof p === 'boolean') return p ? 1 : 0;
            if (p instanceof Date) return p.getTime();
            return p;
          });
          return this;
        },
        all() {
          const stmt = sqlite.prepare(query);
          const results = stmt.all(...boundParams);
          return Promise.resolve({ results, success: true });
        },
        raw() {
          const stmt = sqlite.prepare(query);
          stmt.setReturnArrays(true);
          const rows = stmt.all(...boundParams);
          return Promise.resolve(rows);
        },
        run() {
          const stmt = sqlite.prepare(query);
          stmt.run(...boundParams);
          return Promise.resolve({ success: true, meta: {} });
        },
        first(col?: string) {
          const stmt = sqlite.prepare(query);
          const row = stmt.get(...boundParams) as any;
          if (!row) return Promise.resolve(null);
          return Promise.resolve(col ? row[col] : row);
        },
      };
    },
    batch(stmts: any[]) {
      return Promise.all(stmts.map((s) => s.run()));
    },
    exec(query: string) {
      sqlite.exec(query);
      return Promise.resolve({ count: 1, duration: 0 });
    },
  } as unknown as D1Database;

  const db = drizzle(d1, { schema });

  return { d1, db, sqlite };
}
