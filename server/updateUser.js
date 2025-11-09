const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const updateUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    
    // Find the existing user
    const user = await User.findOne({ 
      $or: [
        { email: "satish.kumar@gmail.com" },
        { phone: "146802789" }
      ] 
    });

    if (user) {
      console.log('Found existing user:', user.email);
      
      // Update the user details
      user.name = "satish";
      user.password = "7013888595"; // This will be hashed automatically
      user.role = "supplier";
      user.logisticsName = "HariHara Associations";
      user.address = {
        street: "50-5-2, harihara street,alphagung",
        city: "alphagung",
        state: "ap",
        zipCode: "582922",
        country: "india"
      };

      await user.save();
      console.log('User updated successfully!');
    } else {
      console.log('No user found with that email/phone');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateUser();