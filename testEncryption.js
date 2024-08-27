// Import the encryption and decryption functions
const helpers = require('./helpers');
const speakeasy = require('speakeasy');
// Example test
const testEncryptionDecryption = () => {
    const testSecret = 'c09a988d130b2da6fe8a6ea8e0034add:e984eb640c8a16ed9bedbe24900755276eea0e990fbbf4f88403621f2576d66033433a4710c9c390565bdf77f4043995ef1f08f527bfefac78eebdc5137e48a6c4a55e026a972c5d726e16371f0917501c299af03761a7e4232aafd9b620208a534192be02e30603327dc6c5475f7a'; // Your test TOTP secret
    console.log('Original Secret:', testSecret);

    // Encrypt the secret
    const encrypted = helpers.encrypt(testSecret);
    console.log('Encrypted Secret:', encrypted);

    // Decrypt the secret
    const decrypted = helpers.decrypt(encrypted);
    console.log('Decrypted Secret:', decrypted);

    // Compare to ensure consistency
    if (testSecret === decrypted) {
        console.log('Encryption and decryption are consistent.');
    } else {
        console.log('There is an inconsistency in the process.');
    }

    // Use the decrypted TOTP secret to generate the current TOTP token
    const token = speakeasy.totp({
    secret: 'EVKDOUCLMV5S6ZTYPARWSZZ2KQUWIYL3',
    encoding: 'base32',
    });

    console.log(`Generated TOTP token: ${token}`);
};

// Run the test
testEncryptionDecryption();
