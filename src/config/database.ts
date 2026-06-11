import mongoose from 'mongoose';

const DEFAULT_DB_NAME = 'cv-filtering';

export const connectDatabase = async (): Promise<void> => {
  try {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    
    // إذا الرابط بدون اسم قاعدة بيانات (ينتهي بالمنفذ فقط) نضيف اسم القاعدة
    if (/^mongodb:\/\/[^/]+\/?$/.test(mongoUri)) {
      mongoUri = mongoUri.replace(/\/?$/, `/${DEFAULT_DB_NAME}`);
    }
    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
