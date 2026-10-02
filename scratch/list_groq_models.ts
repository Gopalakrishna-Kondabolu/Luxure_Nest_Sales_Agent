import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...values] = trimmed.split("=");
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
} catch (e) {}

import Groq from "groq-sdk";

async function listModels() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const list = await groq.models.list();
  console.log("Available Groq Models:");
  console.log(list.data.map(m => m.id));
}

listModels().catch(console.error);
