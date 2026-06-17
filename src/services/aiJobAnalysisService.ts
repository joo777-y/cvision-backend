import "dotenv/config";
import { askGemini } from "./geminiService";


export interface AIJobProfile {

  technicalSkills:{
    name:string;
    weight:number;
  }[];

  softSkills:{
    name:string;
    weight:number;
  }[];

  requiredExperience:number;

  requiredEducation:
  "High School" |
  "Bachelor" |
  "Master" |
  "PhD" |
  "Other";

}



export async function analyzeJobWithAI(
 description:string,
 requirements:string,
 responsibilities:string,
):Promise<AIJobProfile>{


const prompt = `

You are an AI system inside an ATS.

Analyze this job description.

Extract:

- Technical skills
- Soft skills
- Required years of experience
- Required education level


Return ONLY JSON.

Format:

{
 "technicalSkills":[
   {
    "name":"",
    "weight":0
   }
 ],

 "softSkills":[
   {
    "name":"",
    "weight":0
   }
 ],

 "requiredExperience":0,

 "requiredEducation":"Bachelor"
}



JOB DESCRIPTION:

${description}


REQUIREMENTS:

${requirements}


RESPONSIBILITIES:

${responsibilities}

`;



const response = await askGemini(prompt);


const cleaned =
response
.replace("```json","")
.replace("```","")
.trim();


return JSON.parse(cleaned);

}