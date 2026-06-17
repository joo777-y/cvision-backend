import "dotenv/config";

import { askGemini } from "./services/geminiService";


async function test(){

const result = await askGemini(`

You are an AI system inside an Applicant Tracking System (ATS).

Analyze this CV and extract structured candidate information.

Return ONLY valid JSON.

Do not add explanations.

Required JSON format:

{
  "technicalSkills": [],
  "softSkills": [],
  "experience": "",
  "education": "",
  "summary": ""
}


CV:

John Smith

Frontend Developer

Skills:
React, JavaScript, HTML, CSS, Node.js

Experience:
2 years working as frontend developer

Education:
Computer Science degree


`);

console.log(result);

}


test();