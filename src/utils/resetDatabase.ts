import mongoose from 'mongoose';
import { User, Job, CV, SkillsDictionary } from '../models';
import { connectDatabase } from '../config/database';

const resetDatabase = async () => {
  try {
    await connectDatabase();

    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Waiting 3 seconds... Press Ctrl+C to cancel');

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Drop all collections
    await User.deleteMany({});
    console.log('✅ Users collection cleared');

    await Job.deleteMany({});
    console.log('✅ Jobs collection cleared');

    await CV.deleteMany({});
    console.log('✅ CVs collection cleared');

    await SkillsDictionary.deleteMany({});
    console.log('✅ Skills Dictionary collection cleared');

    // Drop GridFS collections
    const db = mongoose.connection.db;
    if (db) {
      await db.collection('cvs.files').deleteMany({});
      await db.collection('cvs.chunks').deleteMany({});
      console.log('✅ GridFS collections cleared');
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('Run "npm run setup" to create sample users and seed data');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
