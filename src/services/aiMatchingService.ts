import { semanticMatch } from "./semanticMatchingService";
import "dotenv/config";


export async function runAIMatching(
  candidateProfile: any,
  job: any
) {


  const normalizedCandidate = {

    skills: [
      ...(candidateProfile.technicalSkills || []),
      ...(candidateProfile.softSkills || [])
    ],

    experience:
      candidateProfile.experience || "",

    education:
      candidateProfile.education || ""

  };


  const normalizedJob = {

    skills: [
      ...(job.requiredSkills?.technical || [])
        .map((skill:any) => skill.name),

      ...(job.requiredSkills?.soft || [])
        .map((skill:any) => skill.name)
    ],

    experience:
      job.requiredExperience || 0,

    education:
      job.requiredEducation || ""

  };



  const result = await semanticMatch(
    normalizedCandidate,
    normalizedJob
  );


  return result;

}