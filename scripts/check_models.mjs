import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : "";

console.log("API Key present:", !!apiKey);

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    const res = await ai.models.list();
    const names = [];
    for await (const m of res) {
      if (m.name.includes("flash")) {
        names.push(m.name);
      }
    }
    console.log("FLASH MODELS:", names);
  } catch (e) {
    console.error("List models error:", e);
  }
}

listModels();
