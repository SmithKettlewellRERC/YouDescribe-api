const CryptoJS = require('crypto-js');

const decryptData = (encryptedData) => {
    console.log("encryptedData", encryptedData)
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, "050cf42ee14d597188b0695a94df5e866d7eda5d06af32ff3ac329ddbcf7ca8a").toString(CryptoJS.enc.Utf8);
    console.log("userDataString", decryptedData);
    return decryptedData;
};
module.exports = decryptData;