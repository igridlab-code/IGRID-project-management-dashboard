const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/igrid.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  tables.forEach(t => {
    db.all(`PRAGMA table_info(${t.name})`, (err, cols) => {
      console.log(`Table: ${t.name}`);
      console.log(cols.map(c => c.name).join(', '));
      console.log('---');
    });
  });
});
