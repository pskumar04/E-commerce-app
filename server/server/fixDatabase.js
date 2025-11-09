const mongoose = require('mongoose');
require('dotenv').config();

const fixDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/happycart');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    console.log('Checking current indexes...');
    const indexes = await db.collection('users').getIndexes();
    console.log('Current indexes on users collection:');
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the problematic username index if it exists
    if (indexes.username_1) {
      console.log('Dropping username_1 index...');
      await db.collection('users').dropIndex('username_1');
      console.log('✅ username_1 index dropped successfully');
    }

    // Drop any other problematic indexes
    for (const indexName in indexes) {
      if (indexName !== '_id_' && indexes[indexName].key.username) {
        console.log(`Dropping problematic index: ${indexName}`);
        await db.collection('users').dropIndex(indexName);
      }
    }

    // Create proper indexes
    console.log('Creating proper indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    console.log('✅ Proper indexes created');

    // Verify the fix
    const finalIndexes = await db.collection('users').getIndexes();
    console.log('Final indexes:');
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('✅ Database fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
};

fixDatabase();