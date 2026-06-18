import { askGemini } from './geminiService';
import 'dotenv/config';

export interface MatchingResult {
  matchScore: number;

  matchedSkills: string[];

  missingSkills: string[];

  explanation: string;

  skillsScore: number;
  experienceScore: number;
  educationScore: number;
}

export async function semanticMatch(
  candidateProfile: any,

  jobProfile: any
): Promise<MatchingResult> {
  const prompt = `

You are an AI ATS matching system.


Compare this candidate profile with this job profile.


Analyze this like a professional ATS system.

Rules:

- Skill similarity is the most important factor.
- Related technologies should match.
- Do not require exact names.
- Frontend technologies are related.

Examples:

React.js matches React

MERN stack matches MongoDB Express React Node

Frontend Developer matches:
HTML CSS JavaScript React

Calculate:

skillsScore = 60%
experienceScore = 25%
educationScore = 15%

Experience:
- Compare years of experience, internships, and relevant projects.
- Do not give 100% unless candidate experience fully matches the job requirement.

Education:
- Compare the degree level with the required education.
- Bachelor should not automatically equal Master.


The final matchScore must be between 0 and 100.
Do not return decimal values like 0.9.

Return JSON only.




Format:

{
"matchScore":0,

"skillsScore":0,

"experienceScore":0,

"educationScore":0,

"matchedSkills":[],

"missingSkills":[],

"explanation":""
}



CANDIDATE PROFILE:

${JSON.stringify(candidateProfile)}



JOB PROFILE:

${JSON.stringify(jobProfile)}



`;

  const response = await askGemini(prompt);

  const cleaned = response.replace('```json', '').replace('```', '').trim();

  return JSON.parse(cleaned);
}
