const mongoose = require('mongoose');
require('dotenv').config();

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/happycart');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    console.log('Dropping entire database...');
    await db.dropDatabase();
    console.log('✅ Database dropped successfully');

    console.log('Creating fresh collections with proper indexes...');
    
    // Users collection will be created automatically when first user is inserted
    // Products collection will be created automatically when first product is inserted
    
    console.log('✅ Database reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();