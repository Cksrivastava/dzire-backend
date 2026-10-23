import mongoose from "mongoose";

let isDbConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("⚠️  MONGODB_URI is not defined in .env. Server will run in in-memory fallback mode.");
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isDbConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    console.warn("⚠️  Running with in-memory mock store fallback. Update MONGODB_URI in server/.env with your Mongo Atlas credentials to persist data to Atlas.");
    isDbConnected = false;
    return false;
  }
};

export const getDbStatus = () => isDbConnected;
