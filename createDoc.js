const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    const id = uuidv4();
    // Use upsert so it won't fail if the row already exists or similar
    if (db.upsertDocument) await db.upsertDocument(id, '');
    else await db.createDocument(id, '');
    console.log('Created document:', id);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create document (createDoc script):', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();