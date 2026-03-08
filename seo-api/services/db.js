/**
 * SEO Dashboard - Database Service
 * Turso / LibSQL Cloud
 */

const { createClient } = require('@libsql/client');

// Client Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Wrapper compatible avec code existant
const dbAll = async (sql, params = []) => {
  try {
    const result = await db.execute({ sql, args: params });
    return result.rows;
  } catch (err) {
    console.error('dbAll error:', err.message);
    throw err;
  }
};

const dbGet = async (sql, params = []) => {
  try {
    const result = await db.execute({ sql, args: params });
    return result.rows[0] || null;
  } catch (err) {
    console.error('dbGet error:', err.message);
    throw err;
  }
};

const dbRun = async (sql, params = []) => {
  try {
    const result = await db.execute({ sql, args: params });
    return { lastID: Number(result.lastInsertRowid), changes: result.rowsAffected };
  } catch (err) {
    console.error('dbRun error:', err.message);
    throw err;
  }
};

// Initialisation schema
const initSchema = async () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      last_crawl DATETIME,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
    
    CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      ctr REAL DEFAULT 0,
      position REAL DEFAULT 0,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
    
    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      has_title INTEGER DEFAULT 0,
      has_meta INTEGER DEFAULT 0,
      has_h1 INTEGER DEFAULT 0,
      alt_missing INTEGER DEFAULT 0,
      internal_links INTEGER DEFAULT 0,
      FOREIGN KEY (page_id) REFERENCES pages(id)
    );
    
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending'
    );
    
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT,
      keyword TEXT,
      status TEXT DEFAULT 'idea',
      title_suggested TEXT,
      slug_suggested TEXT,
      meta_suggested TEXT,
      structure_suggested TEXT,
      internal_links_suggested TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL,
      tracked_since DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS briefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target TEXT,
      instructions TEXT,
      status TEXT DEFAULT 'draft'
    );
    
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT,
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Exécuter chaque statement séparément
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      await db.execute(stmt.trim());
    }
  }
  
  // Insérer site pilote
  await db.execute({
    sql: "INSERT OR IGNORE INTO sites (domain) VALUES (?)",
    args: ['mistralpro-reno.fr']
  });
  
  console.log('Schema initialized');
};

module.exports = {
  db,
  dbAll,
  dbGet,
  dbRun,
  initSchema
};
