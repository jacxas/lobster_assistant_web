import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production use /app/data (Docker volume), in dev use local .data/
const dataDir =
  process.env.NODE_ENV === "production"
    ? "/app/data"
    : path.resolve(__dirname, "../../.data");

fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "lobster.db");

const db = new Database(dbPath);

// Performance: WAL mode for concurrent reads + writes
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

console.log(`[db] SQLite ready at ${dbPath}`);

export default db;
