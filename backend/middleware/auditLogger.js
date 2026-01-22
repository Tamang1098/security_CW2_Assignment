const Activity = require('../models/Activity');


const logActivity = async (req, action, status = 'success', details = {}) => {
    try {
        const activity = new Activity({
            user: req.user ? req.user.id : (details.userId || null),
            action,
            status,
            details: {
                ...details,
                endpoint: req.originalUrl || req.url,
                method: req.method
            },
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        await activity.save();
        console.log(`[ACTIVITY LOG] ${action} - ${status} - ${req.ip}`);
    } catch (error) {
        console.error('[ACTIVITY LOG ERROR]', error.message);
    }
};

module.exports = { logActivity };