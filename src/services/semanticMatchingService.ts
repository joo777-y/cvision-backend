import { askGemini } from "./geminiService";
import "dotenv/config";



export interface MatchingResult {

  matchScore:number;

  matchedSkills:string[];

  missingSkills:string[];

  explanation:string;

}



export async function semanticMatch(

 candidateProfile:any,

 jobProfile:any

):Promise<MatchingResult>{



const prompt = `

You are an AI ATS matching system.


Compare this candidate profile with this job profile.


Analyze:

1. Matching technical skills
2. Missing skills
3. Overall match percentage


Important:

Understand synonyms.

Examples:

React Developer = React.js

Frontend = HTML CSS JavaScript React

Backend = Node.js Express MongoDB


Return ONLY JSON.



Format:

{

"matchScore":0,

"matchedSkills":[],

"missingSkills":[],

"explanation":""

}



CANDIDATE PROFILE:

${JSON.stringify(candidateProfile)}



JOB PROFILE:

${JSON.stringify(jobProfile)}



`;



const response =
 await askGemini(prompt);



const cleaned =
response
.replace("```json","")
.replace("```","")
.trim();



return JSON.parse(cleaned);


}