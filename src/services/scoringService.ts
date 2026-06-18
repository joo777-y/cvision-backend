import { IJob } from '../types';



export const calculateSkillsScore = (
  candidateSkills: { technical: string[]; soft: string[] },
  requiredSkills: {
    technical: Array<{ name: string; weight: number }>;
    soft: Array<{ name: string; weight: number }>;
  }
): number => {
  if (
    requiredSkills.technical.length === 0 &&
    requiredSkills.soft.length === 0
  ) {
    return 0;
  }

  let totalWeight = 0;
  let matchedWeight = 0;

  // Calculate technical skills score with weights
  requiredSkills.technical.forEach((requiredSkill) => {
    totalWeight += requiredSkill.weight;

    const hasSkill = candidateSkills.technical.some(
  (candidateSkill) =>
    candidateSkill
      .toLowerCase()
      .includes(requiredSkill.name.toLowerCase()) ||
    requiredSkill.name
      .toLowerCase()
      .includes(candidateSkill.toLowerCase())
);

    if (hasSkill) {
      matchedWeight += requiredSkill.weight;
    }
  });

  // Calculate soft skills score with weights
  requiredSkills.soft.forEach((requiredSkill) => {
    totalWeight += requiredSkill.weight;

    const hasSkill = candidateSkills.soft.some(
  (candidateSkill) =>
    candidateSkill
      .toLowerCase()
      .includes(requiredSkill.name.toLowerCase()) ||
    requiredSkill.name
      .toLowerCase()
      .includes(candidateSkill.toLowerCase())
);

    if (hasSkill) {
      matchedWeight += requiredSkill.weight;
    }
  });

  if (totalWeight === 0) return 0;

  return (matchedWeight / totalWeight) * 100;
};

export const calculateExperienceScore = (
  candidateExperience: number,
  requiredExperience: number
): number => {

  if (requiredExperience === 0) {

    return candidateExperience > 0 ? 100 : 50;

  }


  const ratio = candidateExperience / requiredExperience;

  return Math.round(Math.min(ratio,1)*100);
};

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
candidateText.includes("b.s")
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
    skillsScore * 0.5 + experienceScore * 0.3 + educationScore * 0.2;

  return {
    total: Math.round(total * 100) / 100, // Round to 2 decimal places
    breakdown: {
      skillsScore: Math.round(skillsScore * 100) / 100,
      experienceScore: Math.round(experienceScore * 100) / 100,
      educationScore: Math.round(educationScore * 100) / 100,
    },
  };
};
