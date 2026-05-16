import { IJob } from '../types';

const EDUCATION_SCORES: { [key: string]: number } = {
  PhD: 100,
  Master: 80,
  Bachelor: 60,
  'High School': 40,
  Other: 30,
};

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
        candidateSkill.toLowerCase() === requiredSkill.name.toLowerCase()
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
        candidateSkill.toLowerCase() === requiredSkill.name.toLowerCase()
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
    return 100; // No experience required
  }

  const ratio = candidateExperience / requiredExperience;
  return Math.min(ratio, 1) * 100;
};

export const calculateEducationScore = (
  candidateEducation: string,
  requiredEducation: string
): number => {
  const candidateScore = EDUCATION_SCORES[candidateEducation] || 0;
  const requiredScore = EDUCATION_SCORES[requiredEducation] || 0;

  if (requiredScore === 0) {
    return 100;
  }

  // If candidate has equal or higher education, give full score
  if (candidateScore >= requiredScore) {
    return 100;
  }

  // Otherwise, give proportional score
  return (candidateScore / requiredScore) * 100;
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
