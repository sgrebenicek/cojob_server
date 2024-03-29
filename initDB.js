const sqlite3 = require("sqlite3").verbose();

function initDatabase() {
  const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
      console.error("Error opening database", err.message);
    } else {
      console.log("Connected to the SQLite database.");
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          senderId INTEGER NOT NULL,
          receiverId INTEGER NOT NULL,
          message TEXT NOT NULL,
          timestamp TEXT NOT NULL
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS tokens ( 
          token TEXT NOT NULL,
          userId INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id)
        ); 
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks ( 
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          isDone BOOLEAN NOT NULL,
          timestamp TEXT NOT NULL
        ); 
      `);
    }
  });

  db.close();
}

module.exports = { initDatabase };
