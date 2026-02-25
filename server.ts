import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global variables for caching news
let cachedNews: any | null = null;
let lastFetchTime: Date | null = null;

app.use(express.json());

// Function to fetch news from Gemini and update cache
async function fetchAndCacheNews() {
  console.log("🚀 СТАРТ: Започваме извличане от Gemini...");
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Правилният начин за инициализация в новата библиотека:
    const genAI = new GoogleGenerativeAI(apiKey!); 
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      tools: [
    {
      googleSearchRetrieval: {}, // Това активира търсенето в реално време
    },
  ],
    });

    const prompt = `ДНЕС Е 25 ФЕВРУАРИ 2026 ГОДИНА. 
ЗАБРАНЯВАМ ти да споменаваш халвинга от 2024 г. или стари новини!
Трябва да ми дадеш новини, които са се случили ПРЕДИ ЧАСОВЕ, днес в сряда.

Търси за:
1. Нови регулации на Етериум (ETH) от 2026 г.
2. Цената на Биткойн в момента (февруари 2026).
3. Новини за изкуствен интелект и крипто интеграции днес.

Върни резултата в JSON формат. Увери се, че URL адресите съдържат '2026' в тях.
Върни ТОП 5 новини в JSON формат:
[
  {
    "title": "Заглавие на български",
    "url": "ПЪЛЕН И ВАЛИДЕН URL КЪМ СТАТИЯТА",
    "summary": ["точка 1", "точка 2"],
    "category": "crypto/stocks"
  }
]`;

const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();

const cleanJson = text
  .replace(/```json/gi, "")
  .replace(/```/g, "")
  .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Премахва скрити символи, които чупят JSON
  .trim();
const parsed = JSON.parse(cleanJson);

// Проверяваме дали е масив и го записваме
if (Array.isArray(parsed)) {
    cachedNews = parsed; 
} else {
    cachedNews = [parsed]; // Ако е върнал само една, я слагаме в масив
}
    console.log("✅ УСПЕХ: Кешът е обновен!");
  } catch (error: any) {
    console.error("❌ ГРЕШКА ПРИ ИЗВЛИЧАНЕ:", error.message);
    cachedNews = {
        title: "Временно затруднение",
        url: "#",
        summary: ["Проблем при връзката с Gemini.", "Проверете конзолата на VS Code за детайли.", "Опитайте отново след малко."],
        originalText: error.message
    };
  }
}

// Initial fetch and then update every 2 hours
fetchAndCacheNews();
setInterval(fetchAndCacheNews, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

app.use(express.json());

// API Route to fetch and summarize news using Gemini Search
app.get("/api/news/latest", async (req, res) => {
  // Проверяваме дали в адреса има ?force=true
  const force = req.query.force === 'true';

  if (!cachedNews || force) {
    console.log(force ? "🔄 Принудително обновяване..." : "🆕 Първоначално зареждане...");
    await fetchAndCacheNews();
  }
  
  res.json(cachedNews);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
