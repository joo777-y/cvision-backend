import { askGemini } from "./services/geminiService";



export interface AICandidateProfile {

  technicalSkills: string[];

  softSkills: string[];

  experience: string;

  education: string;

  summary: string;

}



export async function analyzeCVWithAI(
  cvText:string
): Promise<AICandidateProfile>{


const prompt = `

You are an AI system inside an Applicant Tracking System (ATS).

Analyze this CV and extract candidate information.

Return ONLY valid JSON.

No explanations.
No markdown.

Required format:

{
  "technicalSkills": [],
  "softSkills": [],
  "experience": "",
  "education": "",
  "summary": ""
}


CV TEXT:

${cvText}

`;



const response = await askGemini(prompt);



try {


const cleaned = response
.replace("```json","")
.replace("```","")
.trim();



return JSON.parse(cleaned);



} catch(error){


throw new Error(
"Gemini returned invalid JSON"
);


}



}