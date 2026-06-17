import { semanticMatch } from "./semanticMatchingService";
import "dotenv/config";


export async function runAIMatching(
 candidateProfile:any,
 job:any
){


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