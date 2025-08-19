import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echo';
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('[mongo] connected');
}


