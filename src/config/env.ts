import dotenv from 'dotenv';

// تحميل ملف .env في حالة التطوير المحلي فقط
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  // Railway يحدد البورت تلقائياً عبر متغير PORT
  port: parseInt(process.env.PORT || '5000', 10),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  mongodb: {
    // التعديل هنا: نضع القيمة الفارغة أولاً ليجبرنا التطبيق على استخدام المتغير السحابي
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv-filtering',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expire: process.env.JWT_EXPIRE || '40m',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
};