const crypto = require('crypto');
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = 'ecommerce_secret_key_32_chars_long!'; 
const IV_LENGTH = 16;

try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY);
    console.log('Key length:', key.length);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    console.log('Cipher created');
} catch (e) {
    console.error('Error:', e.message);
    console.error('Error name:', e.name);
}