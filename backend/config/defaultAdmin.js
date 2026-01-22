const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'surajtamang1098@gmail.com';
    const adminPassword = '12345678';
    

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Default Admin Created!');
      console.log('📧 Email: surajtamang1098@gmail.com');
      console.log('🔑 Password: 12345678');
      console.log('⚠️  Please change the password after first login!');
    } else {


      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.updateOne(
        { email: adminEmail },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin'
          }
        }
      );
      console.log('ℹ️  Admin user already exists - Password reset to: 12345678');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

module.exports = createDefaultAdmin;