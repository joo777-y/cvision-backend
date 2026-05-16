import fs from 'fs';
import path from 'path';
import { SkillsDictionary } from '../models';

export const seedSkillsDictionary = async (adminUserId: string) => {
  try {
    // Check if skills dictionary already exists
    const existingTechnical = await SkillsDictionary.findOne({
      category: 'technical',
    });
    const existingSoft = await SkillsDictionary.findOne({ category: 'soft' });

    if (existingTechnical && existingSoft) {
      console.log('⚠️  Skills dictionary already seeded');
      return;
    }

    // Load skills from JSON file
    const skillsPath = path.join(__dirname, '../../skills-dictionary/skills.json');
    const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));

    // Prepare technical skills
    const technicalSkills: string[] = [];
    Object.values(skillsData.technical).forEach((category: any) => {
      technicalSkills.push(...category);
    });

    // Prepare soft skills
    const softSkills: string[] = [];
    Object.values(skillsData.soft).forEach((category: any) => {
      softSkills.push(...category);
    });

    // Create or update technical skills
    if (!existingTechnical) {
      await SkillsDictionary.create({
        category: 'technical',
        skills: technicalSkills,
        synonyms: skillsData.synonyms,
        updatedBy: adminUserId,
      });
      console.log('✅ Technical skills seeded');
    }

    // Create or update soft skills
    if (!existingSoft) {
      await SkillsDictionary.create({
        category: 'soft',
        skills: softSkills,
        synonyms: {},
        updatedBy: adminUserId,
      });
      console.log('✅ Soft skills seeded');
    }

    console.log('✅ Skills dictionary seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding skills dictionary:', error);
  }
};
