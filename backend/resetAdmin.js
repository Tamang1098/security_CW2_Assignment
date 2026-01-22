const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/footballsuppliesnepal');
    console.log('Connected to MongoDB');
    
    const adminEmail = 'surajtamang1098@gmail.com';
    const adminPassword = '12345678';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const result = await User.updateOne(
      { email: adminEmail },
      { 
        $set: { 
          password: hashedPassword,
          role: 'admin'
        }
      }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log('📧 Email: surajtamang1098@gmail.com');
      console.log('🔑 Password: 12345678');
    } else {

      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created!');
      console.log('📧 Email: surajtamang1098@gmail.com');
      console.log('🔑 Password: 12345678');
    }
    

    const admin = await User.findOne({ email: adminEmail });
    const match = await admin.comparePassword(adminPassword);
    console.log('Password verification:', match ? '✅ PASS' : '❌ FAIL');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdmin();