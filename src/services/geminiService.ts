import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";


console.log("KEY:", process.env.GEMINI_API_KEY);


const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);


const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});


export async function askGemini(prompt:string){

  const result = await model.generateContent(prompt);

  return result.response.text();

}