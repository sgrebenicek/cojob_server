const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

const db = new sqlite3.Database("./database.db");

router.get("/users", (req, res) => {
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(rows);
    }
  });
});

router.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(rows);
    }
  });
});

router.post("/tasks/add", async (req, res) => {
  const { name, description, isDone, timestamp } = req.body;

  db.run(
    `INSERT INTO tasks (name, description, isDone, timestamp) VALUES (?, ?, ?, ?)`,
    [name, description, isDone, timestamp],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to add task" });
      }
      res
        .status(201)
        .json({ id: this.lastID, message: "Task added successfully" });
    }
  );
});

router.patch("/tasks/update/:taskId", (req, res) => {
  const { taskId } = req.params;
  const { isDone } = req.body;

  const isDoneInt = isDone ? 1 : 0;

  db.run(
    `UPDATE tasks SET isDone = ? WHERE id = ?`,
    [isDoneInt, taskId],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to update task status" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ message: "Task updated successfully" });
    }
  );
});

router.post("/messages/send", async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const timestamp = new Date().toISOString();

  db.run(
    `INSERT INTO messages (senderId, receiverId, message, timestamp) VALUES (?, ?, ?, ?)`,
    [senderId, receiverId, message, timestamp],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to send message" });
      }
      res
        .status(201)
        .json({ id: this.lastID, message: "Message sent successfully" });
    }
  );
});

router.get("/messages", (req, res) => {
  const { userId1, userId2 } = req.query;

  db.all(
    `SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY timestamp ASC`,
    [userId1, userId2, userId2, userId1],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to retrieve messages" });
      }
      res.json(rows);
    }
  );
});

router.get("/tokens", (req, res) => {
  db.all("SELECT * FROM tokens", (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(rows);
    }
  });
});

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`,
    [firstName, lastName, email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.get("/messages/last", (req, res) => {
  const { userId1, userId2 } = req.query;

  const query = `
    SELECT * FROM messages
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
    ORDER BY timestamp DESC
    LIMIT 1
  `;

  db.get(query, [userId1, userId2, userId2, userId1], (err, row) => {
    if (err) {
      console.error(err.message);
      return res
        .status(500)
        .json({ error: "Failed to retrieve the last message" });
    }
    res.json(row);
  });
});

router.delete("/logout", (req, res) => {
  const { token } = req.body;

  db.run(`DELETE FROM tokens WHERE token = ?`, [token], function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete token" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign({ id: user.id }, "secret_key", { expiresIn: "1h" });

    db.run(
      `INSERT INTO tokens (token, userId) VALUES (?, ?)`,
      [token, user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Failed to save token" });
        }
        res.json({ token, userId: user.id });
      }
    );
  });
});

module.exports = router;
