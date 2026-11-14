import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export class EventStore {
  private readonly db: Database.Database;

  constructor(path: string) {
    const absolute = resolve(path);
    mkdirSync(dirname(absolute), { recursive: true });
    this.db = new Database(absolute);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_messages (
        message_id TEXT PRIMARY KEY,
        processed_at INTEGER NOT NULL,
        outcome TEXT NOT NULL
      );
    `);
  }

  // Atomic claim prevents concurrent webhook retries from sending duplicate DMs.
  // A stale "processing" claim can be recovered after a worker crash.
  claim(messageId: string, now = Date.now()): boolean {
    const inserted = this.db.prepare(
      "INSERT OR IGNORE INTO processed_messages(message_id, processed_at, outcome) VALUES (?, ?, 'processing')"
    ).run(messageId, now);
    if (inserted.changes === 1) return true;

    const recovered = this.db.prepare(
      "UPDATE processed_messages SET processed_at = ?, outcome = 'processing' WHERE message_id = ? AND outcome = 'processing' AND processed_at < ?"
    ).run(now, messageId, now - 10 * 60 * 1000);
    return recovered.changes === 1;
  }

  complete(messageId: string, outcome: string, processedAt = Date.now()): void {
    this.db.prepare(
      "UPDATE processed_messages SET processed_at = ?, outcome = ? WHERE message_id = ?"
    ).run(processedAt, outcome, messageId);
  }

  release(messageId: string): void {
    this.db.prepare(
      "DELETE FROM processed_messages WHERE message_id = ? AND outcome = 'processing'"
    ).run(messageId);
  }

  close(): void {
    this.db.close();
  }
}
