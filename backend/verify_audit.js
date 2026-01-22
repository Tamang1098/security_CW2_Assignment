const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Activity = require('./models/Activity');

dotenv.config();

const verifyLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/footballsuppliesnepal');
        console.log('Connected to MongoDB');

        const logs = await Activity.find().sort({ createdAt: -1 }).limit(5);

        if (logs.length === 0) {
            console.log('No logs found yet. Try performing some actions in the app.');
        } else {
            console.log('\nLatest 5 Audit Logs:');
            logs.forEach((log, index) => {
                console.log(`${index + 1}. [${log.createdAt.toISOString()}] ${log.action} - Status: ${log.status}`);
                console.log(`   Details: ${JSON.stringify(log.details)}`);
                console.log(`   IP: ${log.ipAddress}`);
                console.log('---');
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error verifying logs:', error.message);
        process.exit(1);
    }
};

verifyLogs();
