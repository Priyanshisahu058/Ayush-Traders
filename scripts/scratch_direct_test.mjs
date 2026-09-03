import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : "";

const ai = new GoogleGenAI({ apiKey });

async function testDirectCall() {
  console.log("=== DIRECT GEMINI API TEST WITH gemini-2.5-flash ===");
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Extract shopping intent for: Show me a silver bracelet under 2000 INR",
      config: {
        systemInstruction: "You are the AI shopping assistant for AT Ornaments.",
      },
    });
    console.log("GEMINI API RESPONSE SUCCESS:");
    console.log(res.text);
  } catch (e) {
    console.error("GEMINI API ERROR:", e.message);
  }
}

testDirectCall();
