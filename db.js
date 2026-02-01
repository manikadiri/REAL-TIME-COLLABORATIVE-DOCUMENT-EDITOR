const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'documents.db');
const db = new sqlite3.Database(dbPath);

// Ensure table exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, content TEXT)`);
});

function createDocument(id, content = '') {
  return new Promise((resolve, reject) => {
    const stmt = `INSERT INTO documents (id, content) VALUES (?, ?)`;
    db.run(stmt, [id, content], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function getDocument(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, content FROM documents WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function updateDocument(id, content) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE documents SET content = ? WHERE id = ?`, [content, id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function upsertDocument(id, content = '') {
  return new Promise((resolve, reject) => {
    // Insert or replace will create the row if it doesn't exist, or replace existing
    db.run(`INSERT OR REPLACE INTO documents (id, content) VALUES (?, ?)`, [id, content], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  createDocument,
  getDocument,
  updateDocument,
  upsertDocument,
};