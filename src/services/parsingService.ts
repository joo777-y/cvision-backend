import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const parsePDF = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error}`);
  }
};

export const parseDOCX = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error}`);
  }
};

export const parseCV = async (
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    rawText = await parsePDF(buffer);
  } else if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    rawText = await parseDOCX(buffer);
  } else {
    throw new Error('Unsupported file type');
  }

  // Clean the text
  rawText = cleanText(rawText);

  return rawText;
};

export const cleanText = (text: string): string => {
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ');

  // Remove special characters but keep useful ones
  text = text.replace(/[^\w\s\.\,\-\+\#\@\(\)]/g, ' ');

  // Trim
  text = text.trim();

  return text;
};

export const extractExperience = (text: string): number => {
  // Look for patterns like "X years", "X+ years", "X-Y years"
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience)?/gi,
    /experience[:\s]*(\d+)\+?\s*years?/gi,
    /(\d+)\s*(?:to|-)\s*(\d+)\s*years?/gi,
  ];

  const years: number[] = [];

  experiencePatterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        years.push(parseInt(match[1]));
      }
      if (match[2]) {
        years.push(parseInt(match[2]));
      }
    }
  });

  // Return the maximum years found
  return years.length > 0 ? Math.max(...years) : 0;
};

export const extractEducation = (text: string): string => {
  const educationLevels = [
    { level: 'PhD', keywords: ['phd', 'ph.d', 'doctorate', 'doctoral'] },
    {
      level: 'Master',
      keywords: ['master', 'msc', 'm.sc', 'ma', 'm.a', "master's"],
    },
    {
      level: 'Bachelor',
      keywords: ['bachelor', 'bsc', 'b.sc', 'ba', 'b.a', "bachelor's"],
    },
    { level: 'High School', keywords: ['high school', 'secondary'] },
  ];

  const lowerText = text.toLowerCase();

  for (const edu of educationLevels) {
    for (const keyword of edu.keywords) {
      if (lowerText.includes(keyword)) {
        return edu.level;
      }
    }
  }

  return 'Other';
};
