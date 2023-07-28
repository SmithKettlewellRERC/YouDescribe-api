const CryptoJS = require('crypto-js');

const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, "8c628449c5102aeabd49b5dc3a2a516ea6");
    const userDataString = bytes.toString(CryptoJS.enc.Utf8);
    return userDataString;
};
export default decryptData;