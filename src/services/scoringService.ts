import { IJob } from '../types';



export const calculateSkillsScore = (
  candidateSkills: { technical: string[]; soft: string[] },
  requiredSkills: {
    technical: Array<{ name: string; weight: number }>;
    soft: Array<{ name: string; weight: number }>;
  }
): number => {


const allCandidateSkills = [
  ...candidateSkills.technical,
  ...candidateSkills.soft,
].map(s => s.toLowerCase());


const allRequiredSkills = [
  ...requiredSkills.technical,
  ...requiredSkills.soft,
];


if(allRequiredSkills.length === 0)
return 0;


let matched = 0;


allRequiredSkills.forEach(skill => {

 const found = allCandidateSkills.some(
   candidate =>
   candidate.includes(skill.name.toLowerCase()) ||
   skill.name.toLowerCase().includes(candidate)
 );


 if(found)
 matched++;

});


return Math.round(
 (matched / allRequiredSkills.length) * 100
);


};

export const calculateExperienceScore = (
 candidateExperience:number,
 requiredExperience:number
)=>{

 if(requiredExperience === 0){

   return candidateExperience > 0 ? 100 : 0;

 }


 if(candidateExperience >= requiredExperience)
 return 100;


 return Math.round(
 (candidateExperience / requiredExperience) * 100
 );

}

export const calculateEducationScore = (
  candidateEducation: string,
  requiredEducation: string
): number => {


const candidateText = candidateEducation.toLowerCase();
const requiredText = requiredEducation.toLowerCase();


let candidateLevel = 0;
let requiredLevel = 0;



if(candidateText.includes("phd"))
candidateLevel = 100;

else if(
candidateText.includes("master")
)
candidateLevel = 80;

else if(
 candidateText.includes("bachelor") ||
 candidateText.includes("b.sc") ||
 candidateText.includes("b.s") ||
 candidateText.includes("undergraduate") ||
 candidateText.includes("information technology") ||
 candidateText.includes("computer science")
)
candidateLevel = 60;
else if(
 candidateText.includes("undergraduate") ||
 candidateText.includes("student")
)
candidateLevel = 50;



if(requiredText.includes("phd"))
requiredLevel = 100;

else if(requiredText.includes("master"))
requiredLevel = 80;

else if(
requiredText.includes("bachelor")
)
requiredLevel = 60;



if(requiredLevel === 0)
return 50;



if(candidateLevel >= requiredLevel)
return 100;


return Math.round(
(candidateLevel / requiredLevel) * 100
);

};

export const calculateMatchingScore = (
  candidateData: {
    skills: { technical: string[]; soft: string[] };
    experience: number;
    education: string;
  },
  job: IJob
): {
  total: number;
  breakdown: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
  };
} => {
  const skillsScore = calculateSkillsScore(
    candidateData.skills,
    job.requiredSkills
  );

  const experienceScore = calculateExperienceScore(
    candidateData.experience,
    job.requiredExperience
  );

  const educationScore = calculateEducationScore(
    candidateData.education,
    job.requiredEducation
  );

  // Weighted total: Skills 50%, Experience 30%, Education 20%
  const total =
    skillsScore * 0.7 + experienceScore * 0.2 + educationScore * 0.1;

  return {
    total: Math.round(total * 100) / 100, // Round to 2 decimal places
    breakdown: {
      skillsScore: Math.round(skillsScore * 100) / 100,
      experienceScore: Math.round(experienceScore * 100) / 100,
      educationScore: Math.round(educationScore * 100) / 100,
    },
  };
};
