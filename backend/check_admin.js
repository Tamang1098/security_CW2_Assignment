const mongoose = require('mongoose');
const User = require('./models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/footballsuppliesnepal');
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: /admin/i });
        if (admin) {
            console.log('Admin found:');
            console.log('Name:', admin.name);
            console.log('Email:', admin.email);
            console.log('Role:', `"${admin.role}"`);
        } else {
            console.log('No admin found');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkAdmin();
