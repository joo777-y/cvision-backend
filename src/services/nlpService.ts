import natural from 'natural';
import { SkillsDictionary } from '../models';

const tokenizer = new natural.WordTokenizer();
const stopwords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'that',
  'the',
  'to',
  'was',
  'will',
  'with',
]);

// Cache for skills dictionary
let skillsCache: {
  technical: string[];
  soft: string[];
  synonyms: Map<string, string>;
} | null = null;

export const loadSkillsDictionary = async (): Promise<void> => {
  try {
    const [technicalSkills, softSkills] = await Promise.all([
      SkillsDictionary.findOne({ category: 'technical' }),
      SkillsDictionary.findOne({ category: 'soft' }),
    ]);

    const synonymsMap = new Map<string, string>();

    // Process technical skills
    const technical = technicalSkills?.skills || [];
    if (technicalSkills?.synonyms) {
      const synonymsObj = Object(technicalSkills.synonyms);
      for (const key in synonymsObj) {
        const values = synonymsObj[key] as string[];
        if (Array.isArray(values)) {
          values.forEach((synonym) => {
            synonymsMap.set(synonym.toLowerCase(), key.toLowerCase());
          });
        }
      }
    }

    // Process soft skills
    const soft = softSkills?.skills || [];
    if (softSkills?.synonyms) {
      const synonymsObj = Object(softSkills.synonyms);
      for (const key in synonymsObj) {
        const values = synonymsObj[key] as string[];
        if (Array.isArray(values)) {
          values.forEach((synonym) => {
            synonymsMap.set(synonym.toLowerCase(), key.toLowerCase());
          });
        }
      }
    }

    skillsCache = {
      technical: technical.map((s) => s.toLowerCase()),
      soft: soft.map((s) => s.toLowerCase()),
      synonyms: synonymsMap,
    };

    console.log('✅ Skills dictionary loaded into cache');
  } catch (error) {
    console.error('❌ Failed to load skills dictionary:', error);
    // Initialize with empty cache if loading fails
    skillsCache = {
      technical: [],
      soft: [],
      synonyms: new Map(),
    };
  }
};

export const getSkillsCache = () => {
  return skillsCache;
};

export const tokenizeText = (text: string): string[] => {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens ? tokens.filter((token) => !stopwords.has(token)) : [];
};

export const extractSkills = async (
  text: string
): Promise<{ technical: string[]; soft: string[] }> => {
  // Load skills dictionary if not cached
  if (!skillsCache) {
    await loadSkillsDictionary();
  }

  if (!skillsCache) {
    return { technical: [], soft: [] };
  }

  const lowerText = text.toLowerCase();
  const extractedTechnical = new Set<string>();
  const extractedSoft = new Set<string>();

  // Extract technical skills
  skillsCache.technical.forEach((skill) => {
    // Check for exact skill match
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(lowerText)) {
      extractedTechnical.add(skill);
    }
  });

  // Extract soft skills
  skillsCache.soft.forEach((skill) => {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(lowerText)) {
      extractedSoft.add(skill);
    }
  });

  // Check synonyms
  skillsCache.synonyms.forEach((mainSkill, synonym) => {
    const regex = new RegExp(`\\b${synonym}\\b`, 'i');
    if (regex.test(lowerText)) {
      // Check if it's a technical or soft skill
      if (skillsCache!.technical.includes(mainSkill)) {
        extractedTechnical.add(mainSkill);
      } else if (skillsCache!.soft.includes(mainSkill)) {
        extractedSoft.add(mainSkill);
      }
    }
  });

  return {
    technical: Array.from(extractedTechnical),
    soft: Array.from(extractedSoft),
  };
};

export const extractKeywords = (text: string, topN: number = 10): string[] => {
  const tokens = tokenizeText(text);
  const frequency: { [key: string]: number } = {};

  tokens.forEach((token) => {
    if (token.length > 2) {
      // Ignore very short words
      frequency[token] = (frequency[token] || 0) + 1;
    }
  });

  // Sort by frequency and get top N
  const sorted = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);

  return sorted;
};
