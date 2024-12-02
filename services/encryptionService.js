const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32); // Use a secure key derivation function
const IV_LENGTH = 16; // AES block size is 16 bytes

/**
 * Encrypts a given text using AES-256-CBC encryption algorithm.
 * 
 * @param {string} text - The text to encrypt.
 * @returns {string} - The encrypted text in Base64 format, prefixed with the IV.
 */
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random 16-byte IV
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64'); // Encode the encrypted data as Base64
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted; // Combine IV (Base64) and encrypted text (Base64)
}

/**
 * Decrypts a given encrypted text using AES-256-CBC encryption algorithm.
 * 
 * @param {string} encryptedText - The encrypted text in Base64 format, prefixed with the IV.
 * @returns {string} - The decrypted text.
 * @throws {Error} - Throws an error if the initialization vector (IV) is invalid.
 */
function decrypt(encryptedText) {
    const [ivBase64, encrypted] = encryptedText.split(':'); // Split IV and encrypted text
    const iv = Buffer.from(ivBase64, 'base64'); // Decode the IV from Base64
    if (iv.length !== IV_LENGTH) {
        throw new Error('Invalid initialization vector'); // Ensure the IV is exactly 16 bytes
    }
    const encryptedBuffer = Buffer.from(encrypted, 'base64'); // Decode the encrypted text from Base64
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedBuffer, 'base64', 'utf8'); // Decode during decryption
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
};