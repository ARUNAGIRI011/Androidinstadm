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
    this.db.exec(`CREATE TABLE IF NOT EXISTS processed_messages (message_id TEXT PRIMARY KEY, processed_at INTEGER NOT NULL, outcome TEXT NOT NULL);`);
  }
  has(messageId: string): boolean {
    return Boolean(this.db.prepare("SELECT 1 FROM processed_messages WHERE message_id = ?").get(messageId));
  }
  record(messageId: string, outcome: string, processedAt = Date.now()): void {
    this.db.prepare("INSERT OR IGNORE INTO processed_messages(message_id, processed_at, outcome) VALUES (?, ?, ?)").run(messageId, processedAt, outcome);
  }
  close(): void { this.db.close(); }
}
