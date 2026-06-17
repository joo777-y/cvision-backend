import { semanticMatch } from "./semanticMatchingService";
import "dotenv/config";



export async function runAIMatching(
 cv:any,
 job:any
){


const candidateProfile =
cv.parsedData.aiAnalysis;


const jobProfile = {

 requiredSkills:
 job.requiredSkills,

 requiredExperience:
 job.requiredExperience,

 requiredEducation:
 job.requiredEducation

};



const result =
await semanticMatch(
 candidateProfile,
 jobProfile
);



return result;


}