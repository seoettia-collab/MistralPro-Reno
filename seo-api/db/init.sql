-- SEO Dashboard - Schema SQLite
-- Mistral Pro Reno

-- Table sites
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table pages
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  last_crawl DATETIME,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Table queries
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

-- Table audits
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

-- Table opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  target TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending'
);

-- Table contents
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT,
  keyword TEXT,
  status TEXT DEFAULT 'idea',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table competitors
CREATE TABLE IF NOT EXISTS competitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  tracked_since DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table briefs
CREATE TABLE IF NOT EXISTS briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  target TEXT,
  instructions TEXT,
  status TEXT DEFAULT 'draft'
);

-- Table alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table history
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  target TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert site pilote
INSERT OR IGNORE INTO sites (domain) VALUES ('mistralpro-reno.fr');
