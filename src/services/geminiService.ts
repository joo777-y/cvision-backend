import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

console.log(
  "Gemini API:",
  !!process.env.GEMINI_API_KEY
);

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export async function askGemini(
  prompt: string
) {

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error("Gemini timeout")
      );
    }, 10000);
  });

  const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise,
  ]) as any;

  return result.response.text();
}