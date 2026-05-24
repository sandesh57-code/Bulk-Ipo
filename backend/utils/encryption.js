const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'bulkipo_default_key_32chars_here!';

const encrypt = (text) => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text.toString(), ENCRYPTION_KEY).toString();
};

const decrypt = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return '';
  }
};

module.exports = { encrypt, decrypt };
