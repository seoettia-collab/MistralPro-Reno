/**
 * Script d'initialisation de la base Turso
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/init-db.js
 */

require('dotenv').config();
const { initSchema, dbAll } = require('../services/db');

async function main() {
  console.log('Initialisation schema Turso...');
  
  try {
    await initSchema();
    
    // Vérifier les tables créées
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('Tables créées:', tables.map(t => t.name));
    
    // Vérifier site pilote
    const sites = await dbAll("SELECT * FROM sites");
    console.log('Sites:', sites);
    
    console.log('✅ Initialisation terminée');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

main();
