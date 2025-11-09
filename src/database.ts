import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(__dirname, '..', 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at INTEGER NOT NULL,
    closed_at INTEGER,
    claimed_by TEXT,
    claimed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS vouches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    voucher_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS autoroles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    expires_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount INTEGER NOT NULL,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS tracked_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    product TEXT NOT NULL,
    status TEXT NOT NULL,
    tracking_info TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export default db;