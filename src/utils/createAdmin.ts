import mongoose from 'mongoose';
import { User } from '../models';
import { connectDatabase } from '../config/database';
import { seedSkillsDictionary } from './seedSkills';

const runSetup = async () => {
  try {
    await connectDatabase();

    // Create or get HR user first (used for seeding skills)
    let hrUser = await User.findOne({ email: 'hr@cvfiltering.com' });
    if (!hrUser) {
      hrUser = await User.create({
        email: 'hr@cvfiltering.com',
        password: 'Hr@123',
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
      });
      console.log('✅ HR user created (hr@cvfiltering.com / Hr@123)');
    }

    // Seed skills dictionary using HR user id
    await seedSkillsDictionary(hrUser._id.toString());

    // Create sample Candidate user if not exists
    const candidateExists = await User.findOne({ email: 'candidate@cvfiltering.com' });
    if (!candidateExists) {
      await User.create({
        email: 'candidate@cvfiltering.com',
        password: 'Candidate@123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate',
      });
      console.log('✅ Candidate user created (candidate@cvfiltering.com / Candidate@123)');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nDefault users:');
    console.log('1. HR: hr@cvfiltering.com / Hr@123');
    console.log('2. Candidate: candidate@cvfiltering.com / Candidate@123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running setup:', error);
    process.exit(1);
  }
};

runSetup();
