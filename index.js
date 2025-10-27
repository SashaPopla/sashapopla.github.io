const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const translate = require('google-translate-api-browser'); 
const nlp = require('compromise');

const app = express();
const PORT = 3000; 
const dbPath = path.join(__dirname, 'db.json');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

app.use(express.static(path.join(__dirname, 'public')));

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data); 
  } catch (error) {
    console.error("Помилка читання db.json:", error);
    return { words: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Помилка запису в db.json:", error);
  }
}

app.post("/upload", upload.single("wordFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Файл не завантажено." });
  }

  const filePath = req.file.path;

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split("\n"); 

    const db = readDb();
    let wordsAdded = 0;
    let currentPos = "Unknown"; 

    const wordRegex = /^\* \*\*(.*?)\*\* .*?– (.*)/;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.includes("Іменники (Nouns)")) {
        currentPos = "Noun";
        continue; 
      }
      if (trimmedLine.includes("Дієслова (Verbs)")) {
        currentPos = "Verb";
        continue;
      }
      if (trimmedLine.includes("Прикметники (Adjectives)")) {
        currentPos = "Adjective";
        continue;
      }
      if (trimmedLine.includes("Прислівники (Adverbs)")) {
        currentPos = "Adverb";
        continue;
      }
      if (trimmedLine.startsWith("##")) {
        currentPos = "Phrase/Other";
        continue;
      }

      const match = trimmedLine.match(wordRegex);

      if (match) {
        const english = match[1].trim().toLowerCase();
        const ukrainian = match[2].trim();

        if (!english || !ukrainian) {
          continue;
        }

        const exists = db.words.some((w) => w.english === english);

        if (!exists) {
          db.words.push({
            english: english,
            ukrainian: ukrainian,
            part_of_speech: currentPos, 
          });
          wordsAdded++;
        }
      }
    }

    if (wordsAdded > 0) {
      writeDb(db);
    }

    fs.unlinkSync(filePath);

    console.log(`Успішно додано ${wordsAdded} нових слів з файлу.`);
    res.json({ message: "Обробка завершена", wordsAdded });
  } catch (error) {
    console.error("Помилка під час обробки файлу:", error);
    if (req.file) fs.unlinkSync(filePath); 
    res.status(500).json({ error: "Помилка сервера під час розбору файлу." });
  }
});

app.get('/api/game-words', (req, res) => {
  const count = parseInt(req.query.count || 10, 10);
  
  try {
    const db = readDb();
    const allWords = db.words;

    let shuffled = [...allWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    res.json(shuffled.slice(0, count));
    
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося прочитати слова з бази.' });
  }
});

app.get("/api/all-words", (req, res) => {
  try {
    const db = readDb();

    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const posFilter = req.query.pos || "all"; 

    let filteredWords = db.words;
    if (posFilter !== "all") {
      filteredWords = db.words.filter(
        (word) => word.part_of_speech === posFilter
      );
    }

    const sortedWords = filteredWords.sort((a, b) => {
      return a.english.localeCompare(b.english);
    });

    const totalWords = sortedWords.length;
    const totalPages = Math.ceil(totalWords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedWords = sortedWords.slice(startIndex, endIndex);

    res.json({
      words: paginatedWords,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalWords: totalWords,
        limit: limit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Не вдалося прочитати слова з бази." });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущено! http://localhost:${PORT}`);
});