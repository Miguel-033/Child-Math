require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
const app = express();
const PORT = 3000;

// Замените следующими значениями
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Подключение к базе данных
let db = new sqlite3.Database("./points.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the points database.");
});

// Создание таблицы points, если она не существует
db.run(`CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value INTEGER
)`);

// Инициализация значений, если таблица пустая
db.get("SELECT COUNT(*) AS count FROM points", (err, row) => {
  if (err) {
    console.error(err.message);
  } else if (row && row.count === 0) {
    db.run(`INSERT INTO points (value) VALUES (0)`);
  }
});

app.use(bodyParser.json());
app.use(express.static("public")); // Обслуживание статических файлов из папки 'public'

// Функция для отправки сообщения в Telegram
async function sendMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
    }),
  });

  const data = await response.json();
  console.log(data);
}

// Загрузка текущих баллов
app.get("/points", (req, res) => {
  db.get("SELECT value FROM points WHERE id = 1", (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ points: row ? row.value : 0 });
  });
});

// Сохранение новых баллов
app.post("/points", (req, res) => {
  const { points } = req.body;
  db.run("UPDATE points SET value = ? WHERE id = 1", [points], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    sendMessage(`Баллы обновлены: ${points}`).catch(console.error);
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
