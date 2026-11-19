const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoUri);

    const dbName = conn.connection.name;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / DB: ${dbName}`);

    if (dbName === 'test') {
      console.warn('⚠️ WARNING: Connected to "test" database instead of "hostelease". Ensure MONGO_URI ends with /hostelease');
    }

    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
