const fs = require('fs');
const path = require('path');

console.log('--- SYSTEM SECURITY AUDIT ---');

const checkFile = (filePath, searchItems) => {
    if (!fs.existsSync(filePath)) {
        console.log(`[!] Missing file: ${filePath}`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    searchItems.forEach(item => {
        if (content.includes(item.target)) {
            console.log(`[PASS] ${item.name}`);
        } else {
            console.log(`[FAIL] ${item.name}: ${item.remediation}`);
        }
    });
};


console.log('\nBackend Audit:');
checkFile(path.join(__dirname, '../server.js'), [
    { name: 'Rate Limiting', target: 'rateLimit(', remediation: 'Implement express-rate-limit' },
    { name: 'Cookie Parser', target: 'cookieParser(', remediation: 'Implement cookie-parser' },
    { name: 'Secure CORS', target: 'credentials: true', remediation: 'Enable credentials in CORS' },
    { name: 'HTTPS Server', target: 'https.createServer(', remediation: 'Use HTTPS for production' }
]);

checkFile(path.join(__dirname, '../routes/auth.js'), [
    { name: 'Secure Cookies', target: "res.cookie('token'", remediation: 'Use HttpOnly cookies for JWTs' },
    { name: 'Activity Logging', target: 'logActivity(', remediation: 'Implement user action logging' },
    { name: 'Password Complexity', target: 'passwordRegex', remediation: 'Enforce strong password policies' }
]);

checkFile(path.join(__dirname, '../middleware/auth.js'), [
    { name: 'Cookie-based Auth', target: 'req.cookies?.token', remediation: 'Extract JWT from cookies' }
]);


console.log('\nFrontend Audit:');
checkFile(path.join(__dirname, '../../frontend/src/context/AuthContext.js'), [
    { name: 'With Credentials', target: 'withCredentials: true', remediation: 'Enable withCredentials in Axios for cookies' }
]);

console.log('\n--- AUDIT COMPLETE ---');